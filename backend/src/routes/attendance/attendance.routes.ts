import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

// 1. Lấy danh sách chấm công toàn công ty (kèm bộ lọc tháng/năm và phòng ban)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string; // YYYY-MM
    const departmentId = req.query.departmentId as string;

    const where: any = {};
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }
    if (departmentId) {
      where.employee = { departmentId };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, fullName: true, code: true, department: { select: { id: true, name: true } } }
        }
      },
      orderBy: { date: 'desc' },
      take: 500
    });
    res.json(records);
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu chấm công' });
  }
});

// 2. Lấy dữ liệu chấm công của 1 nhân viên cụ thể (Cổng ESS & Chi tiết nhân viên)
router.get('/employee/:employeeId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const month = req.query.month as string; // YYYY-MM (mặc định tháng hiện tại)

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

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' }
    });

    // Thống kê nhanh trong tháng
    let totalWorkingDays = 0;
    let normalDays = 0;
    let lateDays = 0;
    let absentDays = 0;

    for (const r of records) {
      totalWorkingDays += Number(r.workingDay || 0);
      if (r.status === 'NORMAL') normalDays++;
      else if (r.status === 'LATE') lateDays++;
      else if (r.status === 'ABSENT') absentDays++;
    }

    res.json({
      records,
      summary: {
        month: month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        totalWorkingDays,
        normalDays,
        lateDays,
        absentDays
      }
    });
  } catch (error: any) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử chấm công cá nhân' });
  }
});

// 3. Check-in (Hỗ trợ cả alias /check-in và /checkin)
const handleCheckIn = async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'Thiếu thông tin employeeId' });

    // Đặt date là lúc 00:00:00 của ngày hôm nay theo giờ địa phương
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Kiểm tra đã check-in hay chưa
    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: today }
    });

    if (existing) {
      if (existing.status === 'ABSENT') {
        return res.status(400).json({ error: 'Bạn đã đăng ký nghỉ phép hôm nay!' });
      }
      if (existing.checkIn) {
        return res.status(400).json({ error: 'Hôm nay bạn đã Check-in rồi!' });
      }
    }

    const checkInTime = new Date();
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    
    // Nếu check-in sau 8h45 sáng -> LATE (Ân hạn 15 phút từ 8h30)
    const status = hours > 8 || (hours === 8 && minutes > 45) ? 'LATE' : 'NORMAL';

    let record;
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: checkInTime,
          status
        }
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: checkInTime,
          status,
          workingDay: 0
        }
      });
    }

    return res.status(201).json({ message: 'Check-in thành công', record });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Lỗi server khi Check-in' });
  }
};

router.post('/check-in', authenticateToken, handleCheckIn);
router.post('/checkin', authenticateToken, handleCheckIn);

// 4. Check-out (Hỗ trợ cả alias /check-out và /checkout)
const handleCheckOut = async (req: any, res: Response): Promise<any> => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'Thiếu thông tin employeeId' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await prisma.attendance.findFirst({
      where: { employeeId, date: today }
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({ error: 'Chưa Check-in, không thể Check-out!' });
    }

    if (record.checkOut) {
      return res.status(400).json({ error: 'Bạn đã Check-out hôm nay rồi!' });
    }

    const checkOutTime = new Date();
    
    // Tính toán công (1 ngày = 8 tiếng chuẩn)
    const diffHours = (checkOutTime.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
    
    let workingDay = 0;
    if (diffHours >= 7.5) {
      workingDay = 1.0;
    } else if (diffHours >= 3.5) {
      workingDay = 0.5;
    }

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: checkOutTime,
        workingDay: workingDay
      }
    });

    return res.json({ message: 'Check-out thành công', updated });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return res.status(500).json({ error: 'Lỗi server khi Check-out' });
  }
};

router.post('/check-out', authenticateToken, handleCheckOut);
router.post('/checkout', authenticateToken, handleCheckOut);

// 5. Quản lý Ca làm việc (Shifts)
router.get('/shifts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { startTime: 'asc' }
    });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách ca làm' });
  }
});

router.post('/shifts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, breakTime, workHours, isActive } = req.body;
    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        breakTime: breakTime || null,
        workHours: workHours || 8,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });
    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi thêm ca làm việc' });
  }
});

router.delete('/shifts/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shift.delete({ where: { id } });
    res.json({ message: 'Đã xóa ca làm việc' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa ca làm' });
  }
});

// 6. Yêu cầu Giải trình & Điều chỉnh Chấm công (Attendance Adjustments)
router.get('/adjustments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const records = await prisma.attendanceAdjustment.findMany({
      include: {
        employee: {
          select: { id: true, fullName: true, code: true, department: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy yêu cầu điều chỉnh' });
  }
});

// Nhân viên nộp đơn giải trình điều chỉnh công
router.post('/adjustments', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, date, type, oldTime, newTime, reason } = req.body;
    const empId = employeeId || req.user?.employeeId;

    if (!empId || !date || !type || !newTime || !reason) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin giải trình điều chỉnh công' });
    }

    const adjustmentDate = new Date(date);
    adjustmentDate.setHours(0, 0, 0, 0);

    const adjustment = await prisma.attendanceAdjustment.create({
      data: {
        employeeId: empId,
        date: adjustmentDate,
        type,
        oldTime: oldTime || null,
        newTime,
        reason,
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Gửi yêu cầu điều chỉnh thành công', adjustment });
  } catch (error: any) {
    console.error('Error creating adjustment:', error);
    res.status(500).json({ error: 'Lỗi khi gửi yêu cầu điều chỉnh công' });
  }
});

// 7. Duyệt / Từ chối điều chỉnh chấm công (CẬP NHẬT TRỰC TIẾP BẢNG ATTENDANCE TRONG TRANSACTION)
router.put('/adjustments/:id/status', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ (chỉ chấp nhận APPROVED hoặc REJECTED)' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const adjustment = await tx.attendanceAdjustment.findUnique({
        where: { id }
      });

      if (!adjustment) {
        throw new Error('Không tìm thấy yêu cầu điều chỉnh công');
      }

      if (adjustment.status !== 'PENDING') {
        throw new Error('Yêu cầu này đã được xử lý trước đó');
      }

      // 1. Cập nhật trạng thái đơn điều chỉnh
      const updatedAdj = await tx.attendanceAdjustment.update({
        where: { id },
        data: { status }
      });

      // 2. Nếu APPROVED -> Đồng bộ và cập nhật thực tế vào bảng Attendance
      if (status === 'APPROVED') {
        const attDate = new Date(adjustment.date);
        attDate.setHours(0, 0, 0, 0);

        // Tìm bản ghi Attendance tương ứng trong ngày
        let att = await tx.attendance.findFirst({
          where: { employeeId: adjustment.employeeId, date: attDate }
        });

        // Phân tích thời gian mới được duyệt
        // Giả sử newTime có dạng "HH:mm" hoặc ISO string
        let adjustedDateTime = new Date(attDate);
        if (adjustment.newTime.includes(':')) {
          const [h, m] = adjustment.newTime.split(':').map(Number);
          adjustedDateTime.setHours(h || 8, m || 30, 0, 0);
        } else {
          adjustedDateTime = new Date(adjustment.newTime);
        }

        if (adjustment.type === 'Thiếu Check-in') {
          if (att) {
            // Tính lại workingDay nếu đã có checkout
            let workingDay = att.workingDay;
            if (att.checkOut) {
              const diffHours = (att.checkOut.getTime() - adjustedDateTime.getTime()) / (1000 * 60 * 60);
              workingDay = diffHours >= 7.5 ? (1.0 as any) : (diffHours >= 3.5 ? (0.5 as any) : (0 as any));
            } else {
              workingDay = 1.0 as any; // Mặc định 1 công khi được sếp duyệt
            }

            await tx.attendance.update({
              where: { id: att.id },
              data: {
                checkIn: adjustedDateTime,
                status: 'NORMAL',
                workingDay: workingDay
              }
            });
          } else {
            await tx.attendance.create({
              data: {
                employeeId: adjustment.employeeId,
                date: attDate,
                checkIn: adjustedDateTime,
                status: 'NORMAL',
                workingDay: 1.0
              }
            });
          }
        } else if (adjustment.type === 'Thiếu Check-out') {
          if (att) {
            await tx.attendance.update({
              where: { id: att.id },
              data: {
                checkOut: adjustedDateTime,
                workingDay: 1.0,
                status: att.status === 'ABSENT' ? 'NORMAL' : att.status
              }
            });
          } else {
            const defaultCheckIn = new Date(attDate);
            defaultCheckIn.setHours(8, 30, 0, 0);
            await tx.attendance.create({
              data: {
                employeeId: adjustment.employeeId,
                date: attDate,
                checkIn: defaultCheckIn,
                checkOut: adjustedDateTime,
                status: 'NORMAL',
                workingDay: 1.0
              }
            });
          }
        } else {
          // 'Sai giờ làm' hoặc các loại khác: Khôi phục đủ 1.0 ngày công chuẩn
          if (att) {
            await tx.attendance.update({
              where: { id: att.id },
              data: {
                workingDay: 1.0,
                status: 'NORMAL'
              }
            });
          } else {
            await tx.attendance.create({
              data: {
                employeeId: adjustment.employeeId,
                date: attDate,
                workingDay: 1.0,
                status: 'NORMAL'
              }
            });
          }
        }
      }

      return updatedAdj;
    });

    await createAuditLog({
      action: status === 'APPROVED' ? 'APPROVE_ATTENDANCE_ADJUSTMENT' : 'REJECT_ATTENDANCE_ADJUSTMENT',
      tableName: 'AttendanceAdjustment',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Đã ${status === 'APPROVED' ? 'Duyệt và cập nhật công thực tế' : 'Từ chối'} yêu cầu điều chỉnh công #${id}`
    });

    res.json({ message: `Đã ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'} yêu cầu điều chỉnh công`, record: result });
  } catch (error: any) {
    console.error('Error approving adjustment:', error);
    res.status(400).json({ error: error.message || 'Lỗi xử lý duyệt điều chỉnh' });
  }
});

export default router;
