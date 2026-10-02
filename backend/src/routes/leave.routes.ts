import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Lấy danh sách tất cả đơn xin nghỉ phép
router.get('/', async (req: Request, res: Response) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: { fullName: true, code: true, department: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn nghỉ phép' });
  }
});

// Lấy dữ liệu nghỉ phép của một nhân viên (Cổng Employee)
router.get('/employee/:employeeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.employeeId as string;
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
      balance: balance || { totalDays: 12, usedDays: 0 } // Mặc định nếu chưa có record
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin phép cá nhân' });
  }
});

// Nhân viên nộp đơn xin nghỉ phép (Có validate Anti-negative Balance)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    
    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Tính số ngày nghỉ (giả lập đơn giản, thực tế cần trừ T7, CN)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const requestDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Nếu là nghỉ CÓ LƯƠNG (PAID), phải kiểm tra Quỹ phép
    if (leaveType === 'PAID') {
      const currentYear = start.getFullYear();
      let balance = await prisma.leaveBalance.findFirst({
        where: { employeeId, year: currentYear }
      });

      // Nếu nhân viên chưa có quỹ phép năm nay, tự động cấp 12 ngày mặc định
      if (!balance) {
        balance = await prisma.leaveBalance.create({
          data: { employeeId, year: currentYear, totalDays: 12, usedDays: 0 }
        });
      }

      const availableDays = Number(balance.totalDays) - Number(balance.usedDays);
      
      if (requestDays > availableDays) {
        return res.status(400).json({ 
          error: `Anti-negative Balance: Không đủ ngày phép! Quỹ phép năm ${currentYear} của bạn chỉ còn ${availableDays} ngày, nhưng bạn xin nghỉ ${requestDays} ngày. Vui lòng chọn loại nghỉ Không lương (UNPAID).`
        });
      }

      // Trừ tạm thời quỹ phép ngay khi Submit đơn (Lock số dư) theo đúng BA
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: Number(balance.usedDays) + requestDays }
      });
    }

    // Tạo đơn ở trạng thái PENDING
    const newRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING'
      }
    });

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi khi nộp đơn xin nghỉ' });
  }
});

// Sếp Duyệt / Từ chối đơn phép
router.put('/:id/status', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { status, approverId } = req.body; // status: APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const leaveReq = await tx.leaveRequest.findUnique({ where: { id } });
      if (!leaveReq) throw new Error('Không tìm thấy đơn phép');
      if (leaveReq.status !== 'PENDING') throw new Error('Đơn này đã được xử lý rồi');

      // Nếu TỪ CHỐI đơn PAID, tiến hành HOÀN LẠI quỹ phép (Refund)
      if (status === 'REJECTED' && leaveReq.leaveType === 'PAID') {
        const diffTime = Math.abs(leaveReq.endDate.getTime() - leaveReq.startDate.getTime());
        const requestDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const currentYear = leaveReq.startDate.getFullYear();

        const balance = await tx.leaveBalance.findFirst({
          where: { employeeId: leaveReq.employeeId, year: currentYear }
        });

        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: { usedDays: Number(balance.usedDays) - requestDays }
          });
        }
      }

      // Cập nhật trạng thái đơn
      const updatedReq = await tx.leaveRequest.update({
        where: { id },
        data: { status, approverId }
      });

      // Nếu duyệt, tự động sinh bản ghi vắng mặt (Attendance) cho các ngày nghỉ
      if (status === 'APPROVED') {
        const start = leaveReq.startDate;
        const end = leaveReq.endDate;
        const current = new Date(start);
        
        while (current <= end) {
          // Bỏ qua T7, CN (0 = Sunday, 6 = Saturday)
          if (current.getDay() !== 0 && current.getDay() !== 6) {
             await tx.attendance.create({
               data: {
                 employeeId: leaveReq.employeeId,
                 date: new Date(current),
                 status: 'ABSENT',
                 workingDay: leaveReq.leaveType === 'PAID' ? 1.0 : 0.0 // Nghỉ có lương thì tính là 1 ngày công
               }
             });
          }
          current.setDate(current.getDate() + 1);
        }
      }

      return updatedReq;
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ error: error.message || 'Lỗi khi cập nhật trạng thái đơn' });
  }
});

export default router;
