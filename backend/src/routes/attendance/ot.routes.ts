import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

// 1. Lấy danh sách đăng ký làm thêm giờ (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem đơn của mình)
router.get('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const month = req.query.month as string; // YYYY-MM
    let employeeId = req.query.employeeId as string;
    const departmentId = req.query.departmentId as string;
    const status = req.query.status as string;

    const userRole = req.user?.role?.toUpperCase();
    // Chặn IDOR: Nhân viên thông thường chỉ được xem danh sách của chính mình
    if (userRole === 'EMPLOYEE') {
      employeeId = req.user.employeeId;
    }

    // Tự động khởi tạo dữ liệu mẫu nếu chưa có bản ghi OT nào trong hệ thống
    const totalCount = await prisma.oTRequest.count();
    if (totalCount === 0) {
      const emps = await prisma.employee.findMany({
        take: 6,
        select: { id: true, fullName: true, code: true }
      });
      if (emps.length > 0) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        await prisma.oTRequest.createMany({
          data: [
            {
              employeeId: emps[0].id,
              date: new Date(currentYear, currentMonth, 12),
              requestHours: 2.0 as any,
              actualHours: 2.0 as any,
              reason: 'Hỗ trợ triển khai Release hệ thống HRM giai đoạn 2 ngoài giờ',
              status: 'APPROVED'
            },
            {
              employeeId: emps[1 % emps.length].id,
              date: new Date(currentYear, currentMonth, 17),
              requestHours: 3.5 as any,
              actualHours: 0 as any,
              reason: 'Bảo trì máy chủ trung tâm dữ liệu và cập nhật bản vá bảo mật',
              status: 'PENDING'
            },
            {
              employeeId: emps[2 % emps.length].id,
              date: new Date(currentYear, currentMonth, 20),
              requestHours: 2.0 as any,
              actualHours: 0 as any,
              reason: 'Xử lý tồn đọng hồ sơ nghiệm thu đối tác khách hàng',
              status: 'PENDING'
            },
            {
              employeeId: emps[3 % emps.length].id,
              date: new Date(currentYear, currentMonth, 24),
              requestHours: 4.0 as any,
              actualHours: 4.0 as any,
              reason: 'Trực kỹ thuật hỗ trợ sự cố đường truyền mạng cuối tuần',
              status: 'APPROVED'
            },
            {
              employeeId: emps[4 % emps.length].id,
              date: new Date(currentYear, currentMonth, 26),
              requestHours: 1.5 as any,
              actualHours: 0 as any,
              reason: 'Làm bù tài liệu thiết kế hệ thống theo chỉ đạo Trưởng phòng',
              status: 'REJECTED'
            }
          ]
        });
      }
    }

    const where: any = {};
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (departmentId && departmentId !== 'ALL') {
      where.employee = { departmentId };
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.oTRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, fullName: true, code: true, department: { select: { name: true } } }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(requests);
  } catch (error: any) {
    console.error('Error fetching OT requests:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách làm thêm giờ' });
  }
});

// 2. Lấy danh sách OT của cá nhân (Cổng ESS - Có kiểm tra IDOR)
router.get('/employee/:employeeId', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user?.role?.toUpperCase();

    // Chặn IDOR: Nhân viên thường không được xem dữ liệu OT của nhân viên khác
    if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin làm thêm giờ của nhân viên khác.' });
    }

    const month = req.query.month as string;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const requests = await prisma.oTRequest.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' }
    });

    let totalRequestedHours = 0;
    let totalApprovedHours = 0;

    for (const r of requests) {
      totalRequestedHours += Number(r.requestHours || 0);
      if (r.status === 'APPROVED') {
        totalApprovedHours += Number(r.actualHours || r.requestHours || 0);
      }
    }

    // Tính tổng giờ OT lũy kế cả năm để đối soát trần 200h/năm theo Quy định Công ty LLA
    const yearStart = new Date(startDate.getFullYear(), 0, 1);
    const yearEnd = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59);
    const yearRequests = await prisma.oTRequest.findMany({
      where: {
        employeeId,
        date: { gte: yearStart, lte: yearEnd },
        status: 'APPROVED'
      }
    });

    const totalYearApprovedHours = yearRequests.reduce(
      (sum, r) => sum + Number(r.actualHours || r.requestHours || 0),
      0
    );

    const isMonthWarning = totalApprovedHours >= 32; // 80% của 40h/tháng
    const isMonthCritical = totalApprovedHours >= 40; // 100% của 40h/tháng
    const isYearWarning = totalYearApprovedHours >= 160; // 80% của 200h/năm
    const isYearCritical = totalYearApprovedHours >= 200; // 100% của 200h/năm

    res.json({
      requests,
      summary: {
        month: month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        totalRequestedHours,
        totalApprovedHours,
        monthCap: 40,
        monthWarningPercent: Math.round((totalApprovedHours / 40) * 100),
        isMonthWarning,
        isMonthCritical,
        totalYearApprovedHours,
        yearCap: 200,
        yearWarningPercent: Math.round((totalYearApprovedHours / 200) * 100),
        isYearWarning,
        isYearCritical
      }
    });
  } catch (error: any) {
    console.error('Error fetching employee OT:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử làm thêm giờ cá nhân' });
  }
});

// 3. Đăng ký làm thêm giờ (Tuân thủ Điều 107 Bộ luật Lao động 2019: <= 4h/ngày, <= 40h/tháng)
router.post('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, date, requestHours, reason } = req.body;
    const userRole = req.user?.role?.toUpperCase();
    
    // Nếu là EMPLOYEE, bắt buộc chỉ được tạo đơn cho chính mình
    let empId = employeeId;
    if (userRole === 'EMPLOYEE' || !empId) {
      empId = req.user?.employeeId;
    }

    if (!empId || !date || requestHours === undefined) {
      return res.status(400).json({ error: 'Vui lòng điền đủ thông tin ngày làm và số giờ OT.' });
    }

    const hours = Number(requestHours);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({ error: 'Số giờ làm thêm phải lớn hơn 0.' });
    }

    const otDate = new Date(date);
    otDate.setHours(0, 0, 0, 0);

    // 1. Kiểm tra trần ngày (Điều 107 Khoản 2 Điểm b BLLĐ 2019: Tối đa 4 giờ/ngày)
    const existingDayOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: otDate,
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const dayAccumulatedHours = existingDayOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (dayAccumulatedHours + hours > 4) {
      return res.status(400).json({
        error: `Quy định Công ty LLA (Điều 107 BLLĐ 2019): Giờ làm thêm không được vượt quá 50% giờ làm việc bình thường (tối đa 4 giờ/ngày). Bạn đã đăng ký ${dayAccumulatedHours}h trong ngày ${date}.`
      });
    }

    // 2. Kiểm tra trần tháng (Quy định LLA & Điều 107 BLLĐ 2019: Tối đa 40 giờ/tháng)
    const monthStart = new Date(otDate.getFullYear(), otDate.getMonth(), 1);
    const monthEnd = new Date(otDate.getFullYear(), otDate.getMonth() + 1, 0, 23, 59, 59);

    const existingMonthOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const monthAccumulatedHours = existingMonthOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (monthAccumulatedHours + hours > 40) {
      return res.status(400).json({
        error: `Vượt quá giới hạn OT tháng của Công ty LLA (tối đa 40 giờ/tháng). Bạn đã đăng ký lũy kế ${monthAccumulatedHours}h trong tháng này.`
      });
    }

    // 3. Kiểm tra trần năm (Quy định LLA & Điều 107 BLLĐ 2019: Tối đa 200 giờ/năm)
    const yearStart = new Date(otDate.getFullYear(), 0, 1);
    const yearEnd = new Date(otDate.getFullYear(), 11, 31, 23, 59, 59);

    const existingYearOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: { gte: yearStart, lte: yearEnd },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const yearAccumulatedHours = existingYearOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (yearAccumulatedHours + hours > 200) {
      return res.status(400).json({
        error: `Vượt quá giới hạn OT năm của Công ty LLA (tối đa 200 giờ/năm). Mốc 300 giờ/năm chỉ áp dụng khi có phê duyệt xác nhận riêng từ HR/Legal.`
      });
    }

    const newRequest = await prisma.oTRequest.create({
      data: {
        employeeId: empId,
        date: otDate,
        requestHours: hours as any,
        actualHours: 0 as any,
        reason: reason ? String(reason).trim() : null,
        status: 'PENDING'
      }
    });

    await createAuditLog({
      action: 'SUBMIT_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: newRequest.id,
      accountId: req.user?.accountId,
      details: `Đăng ký làm thêm ${hours}h ngày ${date}. Lý do: ${reason || 'Không'}`
    });

    let warningMessage: string | null = null;
    const newMonthTotal = monthAccumulatedHours + hours;
    const newYearTotal = yearAccumulatedHours + hours;
    if (newMonthTotal >= 32) {
      warningMessage = `Bot @Chấm công LLA cảnh báo: Số giờ OT tháng đã đạt ${newMonthTotal}/40h (≥ 80% mức giới hạn tháng).`;
    } else if (newYearTotal >= 160) {
      warningMessage = `Bot @Chấm công LLA cảnh báo: Số giờ OT năm đã đạt ${newYearTotal}/200h (≥ 80% mức giới hạn năm).`;
    }

    return res.status(201).json({
      message: 'Đăng ký làm thêm giờ thành công, đang chờ Quản lý phê duyệt.',
      warning: warningMessage,
      request: newRequest
    });
  } catch (error: any) {
    console.error('Error creating OT request:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi gửi yêu cầu làm thêm giờ' });
  }
});

// 4. Phê duyệt / Từ chối đơn làm thêm giờ (Chỉ Quản lý / HR, Chống tự duyệt)
router.put('/:id/status', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, actualHours } = req.body; // APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ.' });
    }

    const request = await prisma.oTRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy đơn làm thêm giờ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Đơn làm thêm giờ này đã được xử lý trước đó.' });
    }

    // Chống tự phê duyệt (Self-approval Protection)
    if (req.user?.employeeId && request.employeeId === req.user.employeeId) {
      return res.status(403).json({ error: 'Người đăng ký không thể tự phê duyệt đơn làm thêm giờ của chính mình.' });
    }

    const confirmedActualHours = status === 'APPROVED'
      ? (actualHours !== undefined ? Number(actualHours) : Number(request.requestHours))
      : 0;

    if (status === 'APPROVED' && confirmedActualHours > 4) {
      return res.status(400).json({ error: 'Giờ nghiệm thu thực tế không được vượt quá 4 giờ/ngày (Điều 107 BLLĐ 2019).' });
    }

    const updated = await prisma.oTRequest.update({
      where: { id },
      data: {
        status,
        actualHours: confirmedActualHours as any
      }
    });

    await createAuditLog({
      action: status === 'APPROVED' ? 'APPROVE_OT_REQUEST' : 'REJECT_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `${status === 'APPROVED' ? `Phê duyệt OT (${confirmedActualHours} giờ)` : 'Từ chối đơn OT'} #${id}`
    });

    return res.json({
      message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn làm thêm giờ.`,
      request: updated
    });
  } catch (error: any) {
    console.error('Error updating OT status:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi cập nhật trạng thái OT' });
  }
});

// 5. Hủy đơn làm thêm giờ (Nếu còn ở trạng thái PENDING & đúng chủ sở hữu hoặc Admin)
router.delete('/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const request = await prisma.oTRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy đơn làm thêm giờ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang chờ duyệt (PENDING).' });
    }

    const userRole = req.user?.role?.toUpperCase();
    const isHrOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole);
    if (!isHrOrAdmin && request.employeeId !== req.user?.employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy đơn làm thêm giờ của người khác.' });
    }

    await prisma.oTRequest.delete({ where: { id } });

    await createAuditLog({
      action: 'CANCEL_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Hủy đơn làm thêm giờ #${id}`
    });

    return res.json({ message: 'Đã hủy đơn làm thêm giờ thành công.' });
  } catch (error: any) {
    console.error('Error deleting OT request:', error);
    return res.status(500).json({ error: 'Lỗi khi hủy đơn OT' });
  }
});

export default router;
