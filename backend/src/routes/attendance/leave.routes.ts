import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

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

// 1. Lấy danh sách tất cả đơn xin nghỉ phép (Dành cho HR / Quản lý)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
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

// 2. Lấy dữ liệu nghỉ phép của một nhân viên (Cổng ESS cá nhân)
router.get('/employee/:employeeId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
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

// 3. Nhân viên nộp đơn xin nghỉ phép (Tính chuẩn ngày công thực tế, trừ T7, CN & Lễ)
router.post('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const empId = employeeId || req.user?.employeeId;
    
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

    // Nếu là nghỉ CÓ LƯƠNG (PAID), kiểm tra Quỹ phép năm
    if (leaveType === 'PAID') {
      const currentYear = start.getFullYear();
      let balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: empId, year: currentYear }
      });

      if (!balance) {
        balance = await prisma.leaveBalance.create({
          data: { employeeId: empId, year: currentYear, totalDays: 12, usedDays: 0 }
        });
      }

      const availableDays = Number(balance.totalDays) - Number(balance.usedDays);
      
      if (workingDaysCount > availableDays) {
        return res.status(400).json({ 
          error: `Không đủ số dư ngày phép! Quỹ phép năm ${currentYear} còn ${availableDays} ngày làm việc, nhưng đơn của bạn yêu cầu ${workingDaysCount} ngày công. Vui lòng chọn loại nghỉ Không lương (UNPAID).`
        });
      }

      // Khóa số dư phép tạm thời (Lock số dư)
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: Number(balance.usedDays) + workingDaysCount }
      });
    }

    // Tạo đơn ở trạng thái PENDING
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: empId,
        leaveType,
        startDate: start,
        endDate: end,
        reason: reason || null,
        status: 'PENDING'
      }
    });

    await createAuditLog({
      action: 'SUBMIT_LEAVE_REQUEST',
      tableName: 'LeaveRequest',
      recordId: newRequest.id,
      accountId: req.user?.accountId,
      details: `Đăng ký nghỉ phép (${leaveType}): ${workingDaysCount} ngày công từ ${startDate} đến ${endDate}.`
    });

    return res.status(201).json({
      message: `Nộp đơn xin nghỉ phép thành công (${workingDaysCount} ngày làm việc).`,
      request: newRequest,
      workingDays: workingDaysCount
    });
  } catch (error: any) {
    console.error('Error submitting leave:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nộp đơn xin nghỉ' });
  }
});

// 4. Phê duyệt / Từ chối đơn phép (Sửa lỗi trùng lặp Attendance & Hoàn trả phép chuẩn)
router.put('/:id/status', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED
    const approverId = req.user?.employeeId || null;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const leaveReq = await tx.leaveRequest.findUnique({ where: { id } });
      if (!leaveReq) throw new Error('Không tìm thấy đơn phép');
      if (leaveReq.status !== 'PENDING') throw new Error('Đơn này đã được xử lý trước đó');

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
        // Lấy danh sách ngày lễ trong khoảng
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

export default router;
