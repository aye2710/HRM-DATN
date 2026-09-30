import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET: Lấy danh sách ứng viên đang chờ chốt Offer
router.get('/', async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { status: 'OFFERING' },
      include: {
        jobPosting: {
          include: { department: true, position: true }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách Offer' });
  }
});

// POST: Chấp nhận Offer & Chuyển thành Nhân viên (Onboarding)
  router.post('/accept', async (req: Request, res: Response) => {
    try {
      const { candidateId, employeeCode, cccd, baseSalary, joinDate } = req.body;
      
      if (!candidateId || !employeeCode || !baseSalary || !joinDate) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc để khởi tạo hồ sơ nhân viên.' });
      }
  
      // Thực hiện Transaction để đảm bảo tính toàn vẹn dữ liệu
      const result = await prisma.$transaction(async (tx) => {
        // 1. Lấy thông tin ứng viên
        const candidate = await tx.candidate.findUnique({
          where: { id: candidateId },
          include: { jobPosting: true }
        });
        if (!candidate) throw new Error("Không tìm thấy ứng viên");
  
        // 2. Tạo bản ghi Nhân viên (Employee)
        const newEmployee = await tx.employee.create({
          data: {
            code: employeeCode as string,
            fullName: candidate.name,
            cccd: cccd ? (cccd as string) : null,
            status: 'ONBOARDING', // Trạng thái ban đầu của NV mới
            joinDate: new Date(joinDate),
            departmentId: candidate.jobPosting?.departmentId,
            positionId: candidate.jobPosting?.positionId
          }
        });

      // 3. Tạo bản ghi Hợp đồng (Contract) tạm thời/thử việc
      await tx.contract.create({
        data: {
          employeeId: newEmployee.id,
          contractType: 'PROBATION',
          baseSalary: Number(baseSalary),
          startDate: new Date(joinDate),
          status: 'ACTIVE'
        }
      });

      // 4. Đổi trạng thái Ứng viên thành HIRED
      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: 'HIRED' }
      });

      return newEmployee;
    });

    res.status(201).json({ message: 'Tiếp nhận ứng viên thành công!', employee: result });
  } catch (error: any) {
    console.error("Lỗi khi tiếp nhận ứng viên:", error);
    // Xử lý lỗi trùng lặp (ví dụ: Mã NV hoặc CCCD đã tồn tại)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Mã nhân viên hoặc CCCD đã tồn tại trong hệ thống.' });
    }
    res.status(500).json({ error: error.message || 'Lỗi hệ thống khi khởi tạo hồ sơ nhân viên.' });
  }
});

// POST: Từ chối Offer (Trả về trạng thái REJECTED)
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const candidateId = req.params.id as string;
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { status: 'REJECTED' }
    });
    res.json({ message: 'Đã từ chối Offer' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi từ chối Offer' });
  }
});

export default router;
