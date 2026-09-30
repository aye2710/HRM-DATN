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
    
    // Nếu check-in sau 8h30 sáng -> LATE
    const status = hours >= 9 || (hours === 8 && checkInTime.getMinutes() > 30) ? 'LATE' : 'NORMAL';

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

export default router;
