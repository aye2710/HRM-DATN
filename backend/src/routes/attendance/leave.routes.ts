import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

/**
 * Helper tính số ngày làm việc thực tế giữa 2 mốc thời gian:
 * Loại trừ Thứ 7, Chủ Nhật và các ngày nghỉ Lễ/Tết từ bảng Holiday.
 */
export const calculateWorkingDays = async (startDate: Date, endDate: Date): Promise<number> => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // Lấy danh sách ngày lễ trong khoảng
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

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0: Sunday, 6: Saturday
    const dateStr = current.toISOString().split('T')[0];

    // Chỉ tính ngày trong tuần (T2 - T6) và không trùng ngày Lễ
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      workingDays++;
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
          select: { id: true, fullName: true, code: true, department: { select: { name: true } } }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(leaves);
  } catch (error) {
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

    const [requests, balance] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { startDate: 'desc' }
      }),
      prisma.leaveBalance.findFirst({
        where: { employeeId, year: currentYear }
      })
    ]);

    return res.json({
      requests,
      balance: balance || { totalDays: 12, usedDays: 0, year: currentYear }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin phép cá nhân' });
  }
});

// 3. Nhân viên nộp đơn xin nghỉ phép (Anti-negative Balance & Soft Locking trong Transaction)
router.post('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const userRole = req.user?.role?.toUpperCase();
    
    let empId = employeeId;
    if (userRole === 'EMPLOYEE' || !empId) {
      empId = req.user?.employeeId;
    }
    
    if (!empId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin loại nghỉ, ngày bắt đầu và kết thúc.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ error: 'Ngày bắt đầu nghỉ không thể sau ngày kết thúc.' });
    }
    
    // Tính toán số ngày làm việc thực tế
    const workingDaysCount = await calculateWorkingDays(start, end);

    if (workingDaysCount <= 0) {
      return res.status(400).json({ 
        error: 'Khoảng thời gian bạn chọn chỉ rơi vào Thứ 7, Chủ Nhật hoặc ngày Lễ. Không cần nộp đơn nghỉ phép!' 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Nếu là nghỉ CÓ LƯƠNG (PAID), kiểm tra Quỹ phép năm với cơ chế Soft Lock
      if (leaveType === 'PAID') {
        const currentYear = start.getFullYear();
        let balance = await tx.leaveBalance.findFirst({
          where: { employeeId: empId, year: currentYear }
        });

        if (!balance) {
          balance = await tx.leaveBalance.create({
            data: { employeeId: empId, year: currentYear, totalDays: 12, usedDays: 0 }
          });
        }

        const availableDays = Number(balance.totalDays) - Number(balance.usedDays);
        
        if (workingDaysCount > availableDays) {
          throw new Error(
            `Không đủ số dư ngày phép! Quỹ phép năm ${currentYear} còn ${availableDays} ngày làm việc, nhưng đơn của bạn yêu cầu ${workingDaysCount} ngày công. Vui lòng chọn loại nghỉ Không lương (UNPAID).`
          );
        }

        // Khóa số dư phép tạm thời (Soft-lock ngay ở trạng thái PENDING)
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: Number(balance.usedDays) + workingDaysCount }
        });
      }

      // Tạo đơn ở trạng thái PENDING
      const newRequest = await tx.leaveRequest.create({
        data: {
          employeeId: empId,
          leaveType,
          startDate: start,
          endDate: end,
          reason: reason ? String(reason).trim() : null,
          status: 'PENDING'
        }
      });

      return newRequest;
    });

    await createAuditLog({
      action: 'SUBMIT_LEAVE_REQUEST',
      tableName: 'LeaveRequest',
      recordId: result.id,
      accountId: req.user?.accountId,
      details: `Đăng ký nghỉ phép (${leaveType}): ${workingDaysCount} ngày công từ ${startDate} đến ${endDate}.`
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

// 4. Phê duyệt / Từ chối đơn phép (Chỉ Quản lý / HR, Chống tự duyệt, Hoàn trả phép chuẩn)
router.put('/:id/status', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED
    const approverId = req.user?.employeeId || null;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ.' });
    }

    const leaveReqCheck = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveReqCheck) {
      return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép.' });
    }

    if (leaveReqCheck.status !== 'PENDING') {
      return res.status(400).json({ error: 'Đơn nghỉ phép này đã được xử lý trước đó.' });
    }

    // Chống tự phê duyệt
    if (req.user?.employeeId && leaveReqCheck.employeeId === req.user.employeeId) {
      return res.status(403).json({ error: 'Người nộp đơn không thể tự phê duyệt đơn nghỉ phép của chính mình.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const leaveReq = await tx.leaveRequest.findUnique({ where: { id } });
      if (!leaveReq) throw new Error('Không tìm thấy đơn phép');

      const workingDaysCount = await calculateWorkingDays(leaveReq.startDate, leaveReq.endDate);

      // Nếu TỪ CHỐI đơn PAID -> HOÀN LẠI số ngày phép đã trừ tạm thời
      if (status === 'REJECTED' && leaveReq.leaveType === 'PAID') {
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

      // Cập nhật trạng thái đơn
      const updatedReq = await tx.leaveRequest.update({
        where: { id },
        data: { status, approverId }
      });

      // Nếu duyệt -> Đồng bộ vào bảng Attendance một cách an toàn (tránh Duplicate)
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

        while (curr <= end) {
          const day = curr.getDay();
          const dateStr = curr.toISOString().split('T')[0];

          // Chỉ tạo/cập nhật bản ghi công cho các ngày làm việc thực tế
          if (day !== 0 && day !== 6 && !holidayDates.has(dateStr)) {
            const attDate = new Date(curr);

            const existingAtt = await tx.attendance.findFirst({
              where: {
                employeeId: leaveReq.employeeId,
                date: attDate
              }
            });

            const workingDayValue = leaveReq.leaveType === 'PAID' ? 1.0 : 0.0;

            if (existingAtt) {
              await tx.attendance.update({
                where: { id: existingAtt.id },
                data: {
                  status: 'ABSENT',
                  workingDay: workingDayValue,
                  checkIn: null,
                  checkOut: null
                }
              });
            } else {
              await tx.attendance.create({
                data: {
                  employeeId: leaveReq.employeeId,
                  date: attDate,
                  status: 'ABSENT',
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

    await createAuditLog({
      action: status === 'APPROVED' ? 'APPROVE_LEAVE_REQUEST' : 'REJECT_LEAVE_REQUEST',
      tableName: 'LeaveRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `${status === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'} đơn nghỉ phép #${id}.`
    });

    return res.json({ message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn nghỉ phép.`, request: result });
  } catch (error: any) {
    console.error('Error reviewing leave:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi cập nhật trạng thái đơn' });
  }
});

// 5. Hủy đơn xin nghỉ phép (Nếu còn ở trạng thái PENDING)
router.delete('/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const leaveReq = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveReq) {
      return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép.' });
    }

    if (leaveReq.status !== 'PENDING') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn nghỉ phép đang ở trạng thái chờ duyệt (PENDING).' });
    }

    const userRole = req.user?.role?.toUpperCase();
    const isHrOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole);
    if (!isHrOrAdmin && leaveReq.employeeId !== req.user?.employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền hủy đơn nghỉ phép của nhân viên khác.' });
    }

    await prisma.$transaction(async (tx) => {
      // Nếu là đơn PAID, hoàn trả lại số ngày phép đã soft-lock
      if (leaveReq.leaveType === 'PAID') {
        const workingDaysCount = await calculateWorkingDays(leaveReq.startDate, leaveReq.endDate);
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
