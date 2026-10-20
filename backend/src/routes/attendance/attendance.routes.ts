import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const hrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF');
const managerOrHr = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER');

// 1. Lấy danh sách chấm công (HR / Quản lý xem toàn bộ; Nhân viên chỉ xem bảng công của mình)
router.get('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const month = req.query.month as string; // YYYY-MM
    const departmentId = req.query.departmentId as string;
    const userRole = req.user?.role?.toUpperCase();

    const where: any = {};
    if (userRole === 'EMPLOYEE') {
      where.employeeId = req.user.employeeId;
    }

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }
    if (departmentId && userRole !== 'EMPLOYEE') {
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

// 2. Lấy dữ liệu chấm công của 1 nhân viên cụ thể (Cổng ESS - Chặn IDOR)
router.get('/employee/:employeeId', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const userRole = req.user?.role?.toUpperCase();

    // Chặn IDOR
    if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin chấm công của nhân viên khác.' });
    }

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

    return res.json({
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
    return res.status(500).json({ error: 'Lỗi khi lấy lịch sử chấm công cá nhân' });
  }
});

// 3. Check-in (Ân hạn 15 phút từ 08:30 -> 08:45)
const handleCheckIn = async (req: any, res: Response): Promise<any> => {
  try {
    const userRole = req.user?.role?.toUpperCase();
    const isHrOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole);
    
    // Nếu là nhân viên, chỉ được check-in cho chính mình
    let employeeId = req.body.employeeId;
    if (!isHrOrAdmin || !employeeId) {
      employeeId = req.user?.employeeId;
    }

    if (!employeeId) return res.status(400).json({ error: 'Thiếu thông tin employeeId' });

    // Đặt date là lúc 00:00:00 của ngày hôm nay
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

// 4. Check-out (Tự động tính ngày công: >=7.5h -> 1.0, >=3.5h -> 0.5, <3.5h -> 0)
const handleCheckOut = async (req: any, res: Response): Promise<any> => {
  try {
    const userRole = req.user?.role?.toUpperCase();
    const isHrOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(userRole);
    
    let employeeId = req.body.employeeId;
    if (!isHrOrAdmin || !employeeId) {
      employeeId = req.user?.employeeId;
    }

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
    
    // Tính toán công theo số giờ thực tế
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

    return res.json({ message: 'Check-out thành công', updated, workingDay, hoursWorked: Number(diffHours.toFixed(2)) });
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

router.post('/shifts', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { name, startTime, endTime, breakTime, workHours, isActive } = req.body;
    if (!name?.trim() || !startTime || !endTime) {
      return res.status(400).json({ error: 'Tên ca, giờ bắt đầu và giờ kết thúc không được để trống.' });
    }

    const shift = await prisma.shift.create({
      data: {
        name: String(name).trim(),
        startTime: String(startTime).trim(),
        endTime: String(endTime).trim(),
        breakTime: breakTime || null,
        workHours: workHours !== undefined ? Number(workHours) : 8,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    await createAuditLog({
      action: 'CREATE_SHIFT',
      tableName: 'Shift',
      recordId: shift.id,
      accountId: req.user?.accountId,
      details: `Thiết lập ca làm việc "${shift.name}" (${shift.startTime} - ${shift.endTime})`
    });

    return res.status(201).json(shift);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi thêm ca làm việc' });
  }
});

router.delete('/shifts/:id', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      return res.status(404).json({ error: 'Không tìm thấy ca làm việc.' });
    }

    await prisma.shift.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_SHIFT',
      tableName: 'Shift',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa ca làm việc "${shift.name}"`
    });

    return res.json({ message: 'Đã xóa ca làm việc thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi xóa ca làm' });
  }
});

// 6. Yêu cầu Giải trình & Điều chỉnh Chấm công (Attendance Adjustments)
router.get('/adjustments', authenticateToken, async (req: any, res: Response) => {
  try {
    const userRole = req.user?.role?.toUpperCase();
    const where: any = {};

    if (userRole === 'EMPLOYEE') {
      where.employeeId = req.user.employeeId;
    }

    const records = await prisma.attendanceAdjustment.findMany({
      where,
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
    const userRole = req.user?.role?.toUpperCase();

    let empId = employeeId;
    if (userRole === 'EMPLOYEE' || !empId) {
      empId = req.user?.employeeId;
    }

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
        reason: String(reason).trim(),
        status: 'PENDING'
      }
    });

    await createAuditLog({
      action: 'SUBMIT_ATTENDANCE_ADJUSTMENT',
      tableName: 'AttendanceAdjustment',
      recordId: adjustment.id,
      accountId: req.user?.accountId,
      details: `Nộp đơn giải trình chấm công loại "${type}" cho ngày ${date}. Lý do: ${reason}`
    });

    return res.status(201).json({ message: 'Gửi yêu cầu điều chỉnh thành công', adjustment });
  } catch (error: any) {
    console.error('Error creating adjustment:', error);
    return res.status(500).json({ error: 'Lỗi khi gửi yêu cầu điều chỉnh công' });
  }
});

// 7. Duyệt / Từ chối điều chỉnh chấm công (Chỉ Quản lý / HR, Chống tự duyệt, Cập nhật công)
router.put('/adjustments/:id/status', authenticateToken, managerOrHr, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ (chỉ chấp nhận APPROVED hoặc REJECTED)' });
    }

    const adjCheck = await prisma.attendanceAdjustment.findUnique({ where: { id } });
    if (!adjCheck) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu điều chỉnh công' });
    }

    if (adjCheck.status !== 'PENDING') {
      return res.status(400).json({ error: 'Yêu cầu này đã được xử lý trước đó' });
    }

    // Chống tự phê duyệt
    if (req.user?.employeeId && adjCheck.employeeId === req.user.employeeId) {
      return res.status(403).json({ error: 'Người nộp đơn không thể tự phê duyệt giải trình chấm công của chính mình.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const adjustment = await tx.attendanceAdjustment.findUnique({
        where: { id }
      });

      if (!adjustment) throw new Error('Không tìm thấy yêu cầu điều chỉnh công');

      // 1. Cập nhật trạng thái đơn điều chỉnh
      const updatedAdj = await tx.attendanceAdjustment.update({
        where: { id },
        data: { status }
      });

      // 2. Nếu APPROVED -> Đồng bộ và cập nhật thực tế vào bảng Attendance
      if (status === 'APPROVED') {
        const attDate = new Date(adjustment.date);
        attDate.setHours(0, 0, 0, 0);

        let att = await tx.attendance.findFirst({
          where: { employeeId: adjustment.employeeId, date: attDate }
        });

        let adjustedDateTime = new Date(attDate);
        if (adjustment.newTime.includes(':')) {
          const [h, m] = adjustment.newTime.split(':').map(Number);
          adjustedDateTime.setHours(h || 8, m || 30, 0, 0);
        } else {
          adjustedDateTime = new Date(adjustment.newTime);
        }

        if (adjustment.type === 'Thiếu Check-in') {
          if (att) {
            let workingDay = att.workingDay;
            if (att.checkOut) {
              const diffHours = (att.checkOut.getTime() - adjustedDateTime.getTime()) / (1000 * 60 * 60);
              workingDay = diffHours >= 7.5 ? (1.0 as any) : (diffHours >= 3.5 ? (0.5 as any) : (0 as any));
            } else {
              workingDay = 1.0 as any;
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

    return res.json({ message: `Đã ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'} yêu cầu điều chỉnh công`, record: result });
  } catch (error: any) {
    console.error('Error approving adjustment:', error);
    return res.status(400).json({ error: error.message || 'Lỗi xử lý duyệt điều chỉnh' });
  }
});

// 8. Điểm danh Bổ sung / Admin Ghi nhận Thay (UC-ATT-01-05: HR / Admin Only)
router.post('/manual', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, date, checkIn, checkOut, status, workingDay, note } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'Nhân viên và Ngày chấm công không được để trống.' });
    }

    const attDate = new Date(date);
    attDate.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: attDate }
    });

    const parsedWorkingDay = workingDay !== undefined ? Number(workingDay) : 1.0;
    const parsedStatus = status || 'NORMAL';
    const parsedCheckIn = checkIn ? new Date(checkIn) : null;
    const parsedCheckOut = checkOut ? new Date(checkOut) : null;

    let result;
    if (existing) {
      result = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: parsedCheckIn || existing.checkIn,
          checkOut: parsedCheckOut || existing.checkOut,
          status: parsedStatus,
          workingDay: parsedWorkingDay
        }
      });
    } else {
      result = await prisma.attendance.create({
        data: {
          employeeId,
          date: attDate,
          checkIn: parsedCheckIn,
          checkOut: parsedCheckOut,
          status: parsedStatus,
          workingDay: parsedWorkingDay
        }
      });
    }

    await createAuditLog({
      action: 'MANUAL_ATTENDANCE_RECORD',
      tableName: 'Attendance',
      recordId: result.id,
      accountId: req.user?.accountId,
      details: `HR/Admin ghi nhận công thủ công cho nhân viên ${employeeId} ngày ${date}: ${parsedWorkingDay} công. Ghi chú: ${note || 'Không'}`
    });

    return res.status(200).json({ message: 'Ghi nhận chấm công thủ công thành công', record: result });
  } catch (error: any) {
    console.error('Error manual attendance:', error);
    return res.status(500).json({ error: 'Lỗi ghi nhận chấm công thủ công' });
  }
});

// 9. Tự động Chốt công Cuối ngày (UC-ATT-01-04: Daily Midnight Sweep)
router.post('/daily-sweep', authenticateToken, hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const targetDateStr = req.body.date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    const dayOfWeek = targetDate.getDay();
    // Bỏ qua Thứ 7, Chủ Nhật
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.json({ message: 'Ngày cuối tuần (Thứ 7 / Chủ Nhật), không chạy chốt công.', affected: 0 });
    }

    // Kiểm tra Ngày Lễ (Điều 112 BLLĐ 2019: Hưởng 1.0 ngày công)
    const holiday = await prisma.holiday.findFirst({ where: { date: targetDate } });

    const activeEmployees = await prisma.employee.findMany({
      where: { status: { in: ['ACTIVE', 'PROBATION', 'INTERNSHIP'] } },
      select: { id: true, fullName: true }
    });

    let processedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const emp of activeEmployees) {
        const att = await tx.attendance.findFirst({
          where: { employeeId: emp.id, date: targetDate }
        });

        if (holiday) {
          // Ngày Lễ: Đảm bảo toàn bộ nhân sự được tính 1.0 công
          if (!att) {
            await tx.attendance.create({
              data: {
                employeeId: emp.id,
                date: targetDate,
                status: 'NORMAL',
                workingDay: 1.0
              }
            });
            processedCount++;
          }
        } else {
          if (!att) {
            // Không có check-in và không có đơn phép -> ABSENT (Vắng mặt không phép)
            await tx.attendance.create({
              data: {
                employeeId: emp.id,
                date: targetDate,
                status: 'ABSENT',
                workingDay: 0.0
              }
            });
            processedCount++;
          } else if (att.checkIn && !att.checkOut && att.status !== 'ABSENT') {
            // Có Check-in nhưng quên Check-out -> workingDay = 0 (Chờ giải trình)
            await tx.attendance.update({
              where: { id: att.id },
              data: {
                workingDay: 0.0
              }
            });
            processedCount++;
          }
        }
      }
    });

    await createAuditLog({
      action: 'ATTENDANCE_DAILY_SWEEP',
      tableName: 'Attendance',
      recordId: targetDateStr,
      accountId: req.user?.accountId,
      details: `Chạy chốt công ngày ${targetDateStr}. Số hồ sơ xử lý: ${processedCount}`
    });

    return res.json({
      message: `Đã hoàn thành chốt công ngày ${targetDateStr}.`,
      isHoliday: !!holiday,
      holidayName: holiday?.name || null,
      processedEmployees: processedCount
    });
  } catch (error: any) {
    console.error('Daily sweep error:', error);
    return res.status(500).json({ error: 'Lỗi khi thực hiện quét chốt công cuối ngày' });
  }
});

export default router;
