import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// 1. Lấy danh sách chấm công theo tháng (hoặc ngày hiện tại)
router.get('/', async (req: Request, res: Response) => {
  try {
    const records = await prisma.attendance.findMany({
      include: {
        employee: {
          select: { fullName: true, code: true, department: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 200 // Giới hạn hiển thị 200 bản ghi gần nhất
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu chấm công' });
  }
});

// 2. Check-in
router.post('/check-in', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });

    // Đặt date là lúc 00:00:00 của ngày hôm nay để tra cứu dễ dàng
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kiểm tra đã check-in hay chưa (nếu đã tạo rồi hoặc đang nghỉ phép)
    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: today }
    });

    if (existing) {
      if (existing.status === 'ABSENT') {
        return res.status(400).json({ error: 'Bạn đã đăng ký nghỉ phép hôm nay!' });
      }
      return res.status(400).json({ error: 'Hôm nay bạn đã Check-in rồi!' });
    }

    const checkInTime = new Date();
    const hours = checkInTime.getHours();
    
    // Nếu check-in sau 8h45 sáng -> LATE (Ân hạn 15 phút từ 8h30)
    const status = hours >= 9 || (hours === 8 && checkInTime.getMinutes() > 45) ? 'LATE' : 'NORMAL';

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: checkInTime,
        status
      }
    });

    return res.status(201).json({ message: 'Check-in thành công', record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server khi Check-in' });
  }
});

// 3. Check-out
router.post('/check-out', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
    
    // Tính toán công (1 ngày = 8 tiếng)
    const diffHours = (checkOutTime.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
    
    let workingDay = 0;
    if (diffHours >= 7.5) {
      workingDay = 1.0;
    } else if (diffHours >= 3.5) {
      workingDay = 0.5;
    }
    // Nếu quá ít thời gian thì tính 0 công

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: checkOutTime,
        workingDay: workingDay
      }
    });

    return res.json({ message: 'Check-out thành công', updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server khi Check-out' });
  }
});

// 4. Lấy danh sách ca làm việc
router.get('/shifts', async (req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany();
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách ca làm' });
  }
});

// 5. Thêm / sửa ca làm việc
router.post('/shifts', async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, breakTime, workHours, isActive } = req.body;
    const shift = await prisma.shift.create({
      data: { name, startTime, endTime, breakTime, workHours, isActive }
    });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi thêm ca làm' });
  }
});

router.delete('/shifts/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.shift.delete({ where: { id } });
    res.json({ message: 'Đã xóa ca làm việc' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa ca làm' });
  }
});

// 6. Lấy danh sách điều chỉnh chấm công
router.get('/adjustments', async (req: Request, res: Response) => {
  try {
    const records = await prisma.attendanceAdjustment.findMany({
      include: { employee: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy yêu cầu điều chỉnh' });
  }
});

// 7. Duyệt / Từ chối điều chỉnh chấm công
router.put('/adjustments/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const record = await prisma.attendanceAdjustment.update({
      where: { id },
      data: { status }
    });
    // Nếu duyệt, ta có thể tự động cập nhật lại bảng Attendance, nhưng để đơn giản ta chỉ cập nhật status ở đây
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xử lý duyệt' });
  }
});

export default router;
