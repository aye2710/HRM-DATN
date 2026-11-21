import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';
import { getSettingValue } from '../system/setting.routes';
import { ensureDefaultLeaveTypes } from './leave-config.routes';

const router = Router();

const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

/**
 * Helper tính quỹ phép năm động theo Điều 113 & Điều 114 Bộ luật Lao động 2019:
 * Quỹ phép = Phép tiêu chuẩn (ANNUAL_LEAVE_BASE) + Thâm niên (Cứ đủ SENIORITY_LEAVE_STEP năm cộng 1 ngày)
 */
export const calculateDynamicLeaveQuota = async (
  joinDate: Date | null | undefined, 
  targetYear: number,
  officialJoinDate?: Date | null
) => {
  const baseDays = Number(await getSettingValue('ANNUAL_LEAVE_BASE', 12)) || 12;
  const seniorityStep = Number(await getSettingValue('SENIORITY_LEAVE_STEP', 5)) || 5;
  const approvalThreshold = Number(await getSettingValue('LEAVE_APPROVAL_THRESHOLD', 2)) || 2;
  const baseDateSetting = String(await getSettingValue('LEAVE_CALC_BASE_DATE', 'JOIN_DATE')) || 'JOIN_DATE';
  const cutoffDay = Number(await getSettingValue('LEAVE_MONTH_CUTOFF_DAY', 15)) || 15;
  const maxCarryDays = Number(await getSettingValue('MAX_CARRY_FORWARD_DAYS', 5)) || 5;
  const carryExpirySetting = String(await getSettingValue('CARRY_FORWARD_EXPIRY_DATE', '03-31')) || '03-31';
  const minOfficialMonths = Number(await getSettingValue('MIN_OFFICIAL_MONTHS_FOR_LEAVE', 0)) || 0;
  const accrualMode = String(await getSettingValue('LEAVE_ACCRUAL_MODE', 'FULL_ACCUMULATED')) || 'FULL_ACCUMULATED';

  // Xác định mốc ngày tính: JOIN_DATE (ngày vào làm) hoặc OFFICIAL_DATE (ngày chính thức)
  const effectiveBaseDate = baseDateSetting === 'OFFICIAL_DATE' 
    ? (officialJoinDate || joinDate) 
    : (joinDate || officialJoinDate);

  let yearsOfService = 0;
  if (effectiveBaseDate) {
    const refDate = new Date(targetYear, 11, 31);
    const diffMs = refDate.getTime() - new Date(effectiveBaseDate).getTime();
    yearsOfService = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
  }

  const seniorityBonusDays = seniorityStep > 0 ? Math.floor(yearsOfService / seniorityStep) : 0;

  // Kiểm tra điều kiện làm chính thức (nếu có cấu hình minOfficialMonths > 0)
  let isEligible = true;
  let monthsWorked = 12;
  let eligibilityMessage = '';

  if (minOfficialMonths > 0) {
    const officialDate = officialJoinDate || joinDate;
    if (!officialDate) {
      isEligible = false;
      eligibilityMessage = `Nhân sự chưa có ngày làm việc chính thức. Cần làm việc tối thiểu ${minOfficialMonths} tháng để được cấp Quỹ phép năm.`;
    } else {
      const joinObj = new Date(officialDate);
      const now = new Date();
      monthsWorked = (now.getFullYear() - joinObj.getFullYear()) * 12 + (now.getMonth() - joinObj.getMonth());
      if (now.getDate() >= joinObj.getDate()) {
        monthsWorked += 1;
      }
      if (monthsWorked < minOfficialMonths) {
        isEligible = false;
        eligibilityMessage = `Theo quy chế công ty, nhân sự cần làm việc chính thức tối thiểu ${minOfficialMonths} tháng (hiện tại: ${Math.max(0, monthsWorked)} tháng) để được kích hoạt Quỹ phép năm.`;
      }
    }
  }

  let totalDays = 0;
  let workedMonthsInYear = 12;

  if (!isEligible) {
    totalDays = 0;
  } else if (yearsOfService >= 1 || !effectiveBaseDate) {
    // Làm từ các năm trước: hưởng trọn vẹn phép tiêu chuẩn + thâm niên
    totalDays = baseDays + seniorityBonusDays;
  } else {
    // Năm đầu tiên vào làm: áp dụng quy tắc mốc ngày 15 theo SOP LLA
    const joinObj = new Date(effectiveBaseDate);
    if (joinObj.getFullYear() === targetYear) {
      const joinDay = joinObj.getDate();
      // Nếu vào làm từ ngày 1 đến cutoffDay (15): tháng đó được tính trọn
      // Nếu vào sau ngày cutoffDay: tháng đó chưa tính
      const startMonthIndex = joinDay <= cutoffDay ? joinObj.getMonth() : joinObj.getMonth() + 1;
      workedMonthsInYear = Math.max(0, 12 - startMonthIndex);

      if (accrualMode === 'PRORATED_REMAINING' && minOfficialMonths > 0) {
        const eligibleMonth = joinObj.getMonth() + minOfficialMonths;
        const remainingMonths = Math.max(1, 12 - eligibleMonth);
        totalDays = Math.max(1, Math.round((baseDays / 12) * remainingMonths)) + seniorityBonusDays;
      } else {
        totalDays = Math.max(0, Math.round((baseDays / 12) * workedMonthsInYear)) + seniorityBonusDays;
      }
    } else {
      totalDays = baseDays + seniorityBonusDays;
    }
  }

  return {
    baseDays,
    seniorityStep,
    yearsOfService,
    seniorityBonusDays,
    workedMonthsInYear,
    cutoffDay,
    maxCarryDays,
    carryExpirySetting,
    totalDays,
    approvalThreshold,
    minOfficialMonths,
    accrualMode,
    baseDateSetting,
    isEligible,
    monthsWorked,
    eligibilityMessage
  };
};

/**
 * Helper kiểm tra xem khoảng ngày nghỉ có chạm vào Kỳ Lương (PayrollPeriod) đã KHÓA hay không:
 * Nếu kỳ lương của tháng đó đã LOCKED -> Chặn tuyệt đối mọi thao tác thêm/sửa/duyệt/thu hồi đơn
 */
export async function isPayrollPeriodLocked(startDate: Date, endDate: Date): Promise<boolean> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
  
  const months = Array.from(new Set([startMonth, endMonth]));
  const lockedPeriod = await prisma.payrollPeriod.findFirst({
    where: {
      monthYear: { in: months },
      status: 'LOCKED'
    }
  });
  return !!lockedPeriod;
}

/**
 * Helper kiểm tra trùng lặp khoảng ngày nghỉ với các đơn PENDING hoặc APPROVED khác của nhân viên
 */
export async function checkLeaveOverlap(employeeId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<any> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const where: any = {
    employeeId,
    status: { in: ['PENDING', 'APPROVED'] },
    startDate: { lte: end },
    endDate: { gte: start }
  };
  if (excludeId) {
    where.id = { not: excludeId };
  }

  return await prisma.leaveRequest.findFirst({
    where,
    include: {
      leaveTypeConfig: { select: { name: true, code: true } }
    }
  });
}

/**
 * Helper tính số ngày làm việc thực tế giữa 2 mốc thời gian:
 * - Hỗ trợ nghỉ nửa ngày liên ngày (startSession và endSession)
 * - Loại trừ Thứ 7, Chủ Nhật và các ngày nghỉ Lễ/Tết từ bảng Holiday
 */
export const calculateWorkingDays = async (
  startDate: Date, 
  endDate: Date,
  startSession: string = 'MORNING',
  endSession: string = 'AFTERNOON'
): Promise<number> => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: start,
        lte: end
      }
    }
  });

  const holidaySet = new Set(
    holidays.map(h => h.date.toISOString().split('T')[0])
  );

  // Nếu cùng 1 ngày
  if (start.getTime() === end.getTime()) {
    const dayOfWeek = start.getDay();
    const dateStr = start.toISOString().split('T')[0];
    if (dayOfWeek === 0 || dayOfWeek === 6 || holidaySet.has(dateStr)) {
      return 0;
    }
    if (startSession === 'MORNING' && endSession === 'MORNING') return 0.5;
    if (startSession === 'AFTERNOON' && endSession === 'AFTERNOON') return 0.5;
    return 1.0;
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      if (current.getTime() === start.getTime() && startSession === 'AFTERNOON') {
        workingDays += 0.5;
      } else if (current.getTime() === end.getTime() && endSession === 'MORNING') {
        workingDays += 0.5;
      } else {
        workingDays += 1.0;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
};

// 1. Lấy danh sách đơn xin nghỉ phép (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem đơn của mình)
router.get('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const userRole = req.user?.role?.toUpperCase();
    const where: any = {};

    if (userRole === 'EMPLOYEE') {
      where.employeeId = req.user.employeeId;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { 
            id: true, 
            fullName: true, 
            code: true, 
            departmentId: true,
            department: { select: { id: true, name: true } } 
          }
        },
        leaveTypeConfig: {
          select: { 
            id: true, 
            name: true, 
            code: true, 
            deductAnnualLeave: true, 
            paidBy: true, 
            maxDaysPerOccasion: true,
            requiresAttachment: true 
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn nghỉ phép' });
  }
});

// 2. Lấy dữ liệu nghỉ phép của một nhân viên (Cổng ESS cá nhân - Chặn IDOR)
router.get('/employee/:employeeId', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user?.role?.toUpperCase();

    if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin phép của nhân viên khác.' });
    }

    const currentYear = new Date().getFullYear();

    const [emp, requests, existingBalance] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, joinDate: true, officialJoinDate: true }
      }),
      prisma.leaveRequest.findMany({
        where: { employeeId },
        include: {
          leaveTypeConfig: {
            select: { id: true, name: true, code: true, deductAnnualLeave: true, paidBy: true }
          }
        },
        orderBy: { startDate: 'desc' }
      }),
      prisma.leaveBalance.findFirst({
        where: { employeeId, year: currentYear }
      })
    ]);

    const quota = await calculateDynamicLeaveQuota(emp?.joinDate, currentYear, emp?.officialJoinDate);

    let balance = existingBalance;
    if (!balance && emp) {
      balance = await prisma.leaveBalance.create({
        data: { employeeId, year: currentYear, totalDays: quota.totalDays, usedDays: 0 }
      });
    } else if (balance && Number(balance.totalDays) !== quota.totalDays) {
      balance = await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { totalDays: quota.totalDays }
      });
    }

    return res.json({
      requests,
      balance: balance || { totalDays: quota.totalDays, usedDays: 0, year: currentYear },
      quotaInfo: quota
    });
  } catch (error) {
    console.error('Error fetching employee leave:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin phép cá nhân' });
  }
});

// 3. Nhân viên nộp đơn xin nghỉ phép (Chống trùng lịch, Khóa kỳ lương, Tách rõ trừ phép năm)
router.post('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { 
      employeeId, 
      leaveType, 
      leaveTypeId, 
      leaveTypeCode,
      startDate, 
      endDate, 
      reason, 
      session, 
      startSession: rawStartSession, 
      endSession: rawEndSession, 
      handoverPerson 
    } = req.body;
    const userRole = req.user?.role?.toUpperCase();
    
    let empId = employeeId;
    if (userRole === 'EMPLOYEE' || !empId) {
      empId = req.user?.employeeId;
    }
    
    if (!empId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin nhân viên, ngày bắt đầu và kết thúc.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ error: 'Ngày bắt đầu nghỉ không thể sau ngày kết thúc.' });
    }

    // 1. Kiểm tra Khóa kỳ lương (Payroll Lock)
    if (await isPayrollPeriodLocked(start, end)) {
      return res.status(403).json({
        error: 'Kỳ công/lương của khoảng thời gian này đã được KHÓA và quyết toán chi trả (Payroll Locked). Không thể nộp đơn xin nghỉ vào khoảng thời gian này!'
      });
    }

    // 2. Kiểm tra Trùng lặp khoảng ngày (Overlap Validation)
    const overlap = await checkLeaveOverlap(empId, start, end);
    if (overlap) {
      const typeName = overlap.leaveTypeConfig?.name || (overlap.leaveType === 'PAID' ? 'Nghỉ phép năm' : 'Nghỉ không lương');
      const sStr = new Date(overlap.startDate).toLocaleDateString('vi-VN');
      const eStr = new Date(overlap.endDate).toLocaleDateString('vi-VN');
      return res.status(400).json({
        error: `Khoảng ngày nghỉ này bị TRÙNG với đơn "${typeName}" (${sStr} - ${eStr}) đang ở trạng thái ${overlap.status === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}!`
      });
    }

    // Xác định phiên bắt đầu và phiên kết thúc (Hỗ trợ nghỉ nửa ngày liên ngày)
    let startSession = rawStartSession || 'MORNING';
    let endSession = rawEndSession || 'AFTERNOON';
    if (session === 'MORNING') {
      startSession = 'MORNING';
      endSession = 'MORNING';
    } else if (session === 'AFTERNOON') {
      startSession = 'AFTERNOON';
      endSession = 'AFTERNOON';
    }

    const isSingleHalfDay = start.toDateString() === end.toDateString() && (startSession === endSession);
    const workingDaysCount = await calculateWorkingDays(start, end, startSession, endSession);

    if (workingDaysCount <= 0) {
      return res.status(400).json({ 
        error: 'Khoảng thời gian bạn chọn chỉ rơi vào Thứ 7, Chủ Nhật hoặc ngày Lễ Tết. Không cần nộp đơn nghỉ phép!' 
      });
    }

    // 3. Tìm cấu hình loại phép (LeaveTypeConfig)
    await ensureDefaultLeaveTypes();
    let config = null;
    if (leaveTypeId) {
      config = await prisma.leaveTypeConfig.findUnique({ where: { id: leaveTypeId } });
    } else if (leaveTypeCode) {
      config = await prisma.leaveTypeConfig.findUnique({ where: { code: leaveTypeCode } });
    }
    if (!config) {
      const fallbackCode = leaveType === 'UNPAID' ? 'UNPAID' : 'ANNUAL';
      config = await prisma.leaveTypeConfig.findUnique({ where: { code: fallbackCode } });
    }

    // 4. Kiểm tra giới hạn số ngày tối đa cho mỗi lần (Điều 115 BLLĐ: Kết hôn max 3 ngày, Tang max 3 ngày, Con kết hôn max 1 ngày)
    if (config?.maxDaysPerOccasion && workingDaysCount > config.maxDaysPerOccasion) {
      return res.status(400).json({
        error: `Theo quy định công ty & Điều 115 BLLĐ 2019, loại phép "${config.name}" chỉ được nghỉ tối đa ${config.maxDaysPerOccasion} ngày/lần. Đơn của bạn xin nghỉ ${workingDaysCount} ngày công.`
      });
    }

    const empRecord = await prisma.employee.findUnique({
      where: { id: empId },
      select: { id: true, joinDate: true, officialJoinDate: true }
    });
    const quota = await calculateDynamicLeaveQuota(empRecord?.joinDate, start.getFullYear(), empRecord?.officialJoinDate);

    // Xác định cờ có trừ phép năm hay không
    const deductAnnual = config ? config.deductAnnualLeave : (leaveType === 'PAID');

    // Nếu là loại phép TRỪ PHÉP NĂM nhưng chưa đủ điều kiện làm việc chính thức
    if (deductAnnual && !quota.isEligible) {
      return res.status(400).json({ error: quota.eligibilityMessage });
    }

    // Kiểm tra ngưỡng duyệt cấp Giám đốc & Bàn giao công việc
    const requiresDirectorApproval = workingDaysCount > quota.approvalThreshold;
    if (requiresDirectorApproval && !handoverPerson?.trim() && (!reason || !String(reason).includes('Bàn giao'))) {
      return res.status(400).json({
        error: `Theo quy định công ty, đơn xin nghỉ trên ${quota.approvalThreshold} ngày làm việc (${workingDaysCount} ngày) bắt buộc phải chỉ định Người nhận bàn giao công việc và trình cấp Giám đốc phê duyệt.`
      });
    }

    let formattedReason = reason ? String(reason).trim() : '';
    if (handoverPerson?.trim() && !formattedReason.includes('Bàn giao:')) {
      formattedReason = `[Bàn giao: ${String(handoverPerson).trim()}] ${formattedReason}`.trim();
    }
    if (requiresDirectorApproval && !formattedReason.includes('Cấp duyệt: BGĐ')) {
      formattedReason = `${formattedReason} [Cấp duyệt: BGĐ (> ${quota.approvalThreshold} ngày)]`.trim();
    }

    const result = await prisma.$transaction(async (tx) => {
      // Chỉ kiểm tra và Soft-lock Quỹ phép năm NẾU loại phép có cờ deductAnnualLeave = true
      if (deductAnnual) {
        const currentYear = start.getFullYear();
        let balance = await tx.leaveBalance.findFirst({
          where: { employeeId: empId, year: currentYear }
        });

        if (!balance) {
          balance = await tx.leaveBalance.create({
            data: { employeeId: empId, year: currentYear, totalDays: quota.totalDays, usedDays: 0 }
          });
        } else if (Number(balance.totalDays) < quota.totalDays) {
          balance = await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { totalDays: quota.totalDays }
          });
        }

        const availableDays = Number(balance.totalDays) - Number(balance.usedDays);
        if (workingDaysCount > availableDays) {
          throw new Error(
            `Không đủ số dư ngày phép năm! Quỹ phép năm ${currentYear} còn ${availableDays} ngày làm việc, nhưng đơn của bạn yêu cầu ${workingDaysCount} ngày công. Vui lòng chọn loại nghỉ Không lương (UNPAID) hoặc điều chỉnh số ngày.`
          );
        }

        // Soft-lock số ngày phép
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: Number(balance.usedDays) + workingDaysCount }
        });
      }

      // Tạo đơn xin nghỉ
      const newRequest = await tx.leaveRequest.create({
        data: {
          employeeId: empId,
          leaveType: config?.paid ? 'PAID' : 'UNPAID',
          leaveTypeId: config?.id || null,
          session: isSingleHalfDay ? (startSession === 'MORNING' ? 'MORNING' : 'AFTERNOON') : 'ALL_DAY',
          startSession,
          endSession,
          startDate: start,
          endDate: end,
          reason: formattedReason || null,
          status: 'PENDING'
        },
        include: {
          leaveTypeConfig: true
        }
      });

      return newRequest;
    });

    await createAuditLog({
      action: 'SUBMIT_LEAVE_REQUEST',
      tableName: 'LeaveRequest',
      recordId: result.id,
      accountId: req.user?.accountId,
      details: `Đăng ký nghỉ phép [${config?.name || leaveType}]: ${workingDaysCount} ngày công từ ${startDate} đến ${endDate}. ${deductAnnual ? '(Trừ phép năm)' : '(Không trừ phép năm)'}`
    });

    return res.status(201).json({
      message: `Nộp đơn xin nghỉ phép thành công (${workingDaysCount} ngày làm việc).`,
      request: result,
      workingDays: workingDaysCount
    });
  } catch (error: any) {
    console.error('Error submitting leave:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi nộp đơn xin nghỉ' });
  }
});

// 4. Phê duyệt / Từ chối đơn phép (Khóa kỳ lương, Đồng bộ đúng bản chất công, Hoàn trả phép chuẩn)
router.put('/:id/status', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED
    const approverId = req.user?.employeeId || null;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ.' });
    }

    const leaveReqCheck = await prisma.leaveRequest.findUnique({ 
      where: { id },
      include: { leaveTypeConfig: true }
    });
    if (!leaveReqCheck) {
      return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép.' });
    }

    // 1. Kiểm tra Khóa kỳ lương (Payroll Lock)
    if (await isPayrollPeriodLocked(leaveReqCheck.startDate, leaveReqCheck.endDate)) {
      return res.status(403).json({
        error: 'Kỳ công/lương của khoảng thời gian này đã được KHÓA và quyết toán chi trả (Payroll Locked). Không thể phê duyệt hoặc thu hồi đơn này!'
      });
    }

    const isRevokeApproved = leaveReqCheck.status === 'APPROVED' && status === 'REJECTED';
    if (leaveReqCheck.status !== 'PENDING' && !isRevokeApproved) {
      return res.status(400).json({ error: 'Đơn nghỉ phép này đã được xử lý trước đó.' });
    }

    // Chống tự phê duyệt
    if (req.user?.employeeId && leaveReqCheck.employeeId === req.user.employeeId) {
      return res.status(403).json({ error: 'Người nộp đơn không thể tự phê duyệt hoặc thu hồi đơn nghỉ phép của chính mình.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const leaveReq = await tx.leaveRequest.findUnique({ 
        where: { id },
        include: { leaveTypeConfig: true }
      });
      if (!leaveReq) throw new Error('Không tìm thấy đơn phép');

      const workingDaysCount = await calculateWorkingDays(
        leaveReq.startDate, 
        leaveReq.endDate, 
        leaveReq.startSession || 'MORNING', 
        leaveReq.endSession || 'AFTERNOON'
      );

      const deductAnnual = leaveReq.leaveTypeConfig ? leaveReq.leaveTypeConfig.deductAnnualLeave : (leaveReq.leaveType === 'PAID');

      // Nếu TỪ CHỐI hoặc THU HỒI đơn có trừ phép năm -> HOÀN LẠI số ngày phép đã trừ tạm thời
      if (status === 'REJECTED' && deductAnnual) {
        const currentYear = leaveReq.startDate.getFullYear();
        const balance = await tx.leaveBalance.findFirst({
          where: { employeeId: leaveReq.employeeId, year: currentYear }
        });

        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { usedDays: Math.max(0, Number(balance.usedDays) - workingDaysCount) }
          });
        }
      }

      // Nếu THU HỒI đơn đã duyệt -> Rollback trạng thái ON_LEAVE trên Bảng Chấm Công
      if (isRevokeApproved) {
        const curr = new Date(leaveReq.startDate);
        curr.setHours(0, 0, 0, 0);
        const end = new Date(leaveReq.endDate);
        end.setHours(0, 0, 0, 0);

        while (curr <= end) {
          const attDate = new Date(curr);
          const existingAtt = await tx.attendance.findFirst({
            where: {
              employeeId: leaveReq.employeeId,
              date: attDate
            }
          });

          if (existingAtt && existingAtt.status === 'ON_LEAVE') {
            const isFullDay = leaveReq.session === 'ALL_DAY';
            const workingDayValue = leaveReq.leaveTypeConfig?.paidBy === 'COMPANY' ? (isFullDay ? 1.0 : 0.5) : 0.0;
            if (existingAtt.checkIn || existingAtt.checkOut) {
              await tx.attendance.update({
                where: { id: existingAtt.id },
                data: {
                  status: 'NORMAL',
                  workingDay: Math.max(0, Number(existingAtt.workingDay) - workingDayValue)
                }
              });
            } else {
              await tx.attendance.delete({ where: { id: existingAtt.id } });
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
      }

      // Cập nhật trạng thái đơn
      const updatedReq = await tx.leaveRequest.update({
        where: { id },
        data: { status, approverId },
        include: { leaveTypeConfig: true }
      });

      // Nếu DUYỆT -> Đồng bộ vào bảng Attendance theo chế độ paidBy
      if (status === 'APPROVED') {
        const holidays = await tx.holiday.findMany({
          where: {
            date: {
              gte: leaveReq.startDate,
              lte: leaveReq.endDate
            }
          }
        });
        const holidayDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

        const curr = new Date(leaveReq.startDate);
        curr.setHours(0, 0, 0, 0);
        const end = new Date(leaveReq.endDate);
        end.setHours(0, 0, 0, 0);

        const paidBy = leaveReq.leaveTypeConfig?.paidBy || (leaveReq.leaveType === 'PAID' ? 'COMPANY' : 'NONE');

        while (curr <= end) {
          const day = curr.getDay();
          const dateStr = curr.toISOString().split('T')[0];

          if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
            const attDate = new Date(curr);
            const isFirstDay = curr.getTime() === leaveReq.startDate.getTime();
            const isLastDay = curr.getTime() === leaveReq.endDate.getTime();

            let dayFraction = 1.0;
            if (isFirstDay && leaveReq.startSession === 'AFTERNOON') dayFraction = 0.5;
            if (isLastDay && leaveReq.endSession === 'MORNING') dayFraction = 0.5;
            if (leaveReq.session === 'MORNING' || leaveReq.session === 'AFTERNOON') dayFraction = 0.5;

            // Nếu công ty trả -> ngày công tính hưởng lương; nếu BHXH hoặc NONE -> workingDay = 0
            const workingDayValue = paidBy === 'COMPANY' ? dayFraction : 0.0;

            const existingAtt = await tx.attendance.findFirst({
              where: {
                employeeId: leaveReq.employeeId,
                date: attDate
              }
            });

            if (existingAtt) {
              let finalWorkingDay = workingDayValue;
              if (dayFraction < 1.0 && Number(existingAtt.workingDay) > 0 && Number(existingAtt.workingDay) < 1.0) {
                finalWorkingDay = Math.min(1.0, Number(existingAtt.workingDay) + workingDayValue);
              }

              await tx.attendance.update({
                where: { id: existingAtt.id },
                data: {
                  status: 'ON_LEAVE',
                  workingDay: finalWorkingDay
                }
              });
            } else {
              await tx.attendance.create({
                data: {
                  employeeId: leaveReq.employeeId,
                  date: attDate,
                  status: 'ON_LEAVE',
                  workingDay: workingDayValue
                }
              });
            }
          }
          curr.setDate(curr.getDate() + 1);
        }
      }

      return updatedReq;
    });

    const actionName = isRevokeApproved ? 'REVOKE_LEAVE_REQUEST' : (status === 'APPROVED' ? 'APPROVE_LEAVE_REQUEST' : 'REJECT_LEAVE_REQUEST');
    const actionDetails = isRevokeApproved 
      ? `Thu hồi đơn nghỉ phép #${id}, hoàn lại ngày phép và rollback bảng chấm công.`
      : `${status === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'} đơn nghỉ phép #${id} [${leaveReqCheck.leaveTypeConfig?.name || leaveReqCheck.leaveType}].`;

    await createAuditLog({
      action: actionName,
      tableName: 'LeaveRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: actionDetails
    });

    const successMsg = isRevokeApproved 
      ? 'Đã thu hồi đơn nghỉ phép, hoàn trả số dư phép và rollback bảng công thành công.'
      : `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn nghỉ phép.`;

    return res.json({ message: successMsg, request: result });
  } catch (error: any) {
    console.error('Error reviewing leave:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi cập nhật trạng thái đơn' });
  }
});

// 5. Hủy đơn xin nghỉ phép (Nếu còn ở trạng thái PENDING & kiểm tra Khóa kỳ lương)
router.delete('/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const leaveReq = await prisma.leaveRequest.findUnique({ 
      where: { id },
      include: { leaveTypeConfig: true }
    });
    if (!leaveReq) {
      return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép.' });
    }

    if (leaveReq.status !== 'PENDING') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn nghỉ phép đang ở trạng thái chờ duyệt (PENDING).' });
    }

    // Kiểm tra Khóa kỳ lương
    if (await isPayrollPeriodLocked(leaveReq.startDate, leaveReq.endDate)) {
      return res.status(403).json({
        error: 'Kỳ công/lương của khoảng thời gian này đã được KHÓA (Payroll Locked). Không thể hủy đơn này!'
      });
    }

    const userRole = req.user?.role?.toUpperCase();
    const isHrOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole);
    if (!isHrOrAdmin && leaveReq.employeeId !== req.user?.employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy đơn nghỉ phép của nhân viên khác.' });
    }

    await prisma.$transaction(async (tx) => {
      const deductAnnual = leaveReq.leaveTypeConfig ? leaveReq.leaveTypeConfig.deductAnnualLeave : (leaveReq.leaveType === 'PAID');
      if (deductAnnual) {
        const workingDaysCount = await calculateWorkingDays(
          leaveReq.startDate, 
          leaveReq.endDate,
          leaveReq.startSession || 'MORNING',
          leaveReq.endSession || 'AFTERNOON'
        );
        const currentYear = leaveReq.startDate.getFullYear();
        const balance = await tx.leaveBalance.findFirst({
          where: { employeeId: leaveReq.employeeId, year: currentYear }
        });

        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { usedDays: Math.max(0, Number(balance.usedDays) - workingDaysCount) }
          });
        }
      }

      await tx.leaveRequest.delete({ where: { id } });
    });

    await createAuditLog({
      action: 'CANCEL_LEAVE_REQUEST',
      tableName: 'LeaveRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Hủy đơn nghỉ phép #${id}`
    });

    return res.json({ message: 'Hủy đơn nghỉ phép thành công.' });
  } catch (error: any) {
    console.error('Error canceling leave:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi hủy đơn nghỉ phép' });
  }
});

export default router;
