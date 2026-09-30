import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Lấy danh sách Payroll
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = {};
    if (month && year) {
      whereClause = {
        periodMonth: parseInt(month as string),
        periodYear: parseInt(year as string)
      };
    }

    const records = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { fullName: true, code: true, department: true, position: true }
        }
      },
      orderBy: [
        { periodYear: 'desc' },
        { periodMonth: 'desc' }
      ]
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu bảng lương' });
  }
});

// Lấy danh sách phiếu lương của 1 nhân viên
router.get('/employee/:employeeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const records = await prisma.payroll.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        }
      },
      orderBy: [
        { periodYear: 'desc' },
        { periodMonth: 'desc' }
      ]
    });
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy phiếu lương cá nhân' });
  }
});

// Chạy bảng lương (Generate Payroll)
router.post('/generate', async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Missing month or year' });

    // Lấy tất cả nhân viên đang ACTIVE hoặc có contract ACTIVE
    const employees = await prisma.employee.findMany({
      where: { status: { not: 'RESIGNED' } },
      include: { contracts: { where: { status: 'ACTIVE' } } }
    });

    let generatedCount = 0;

    for (const emp of employees) {
      // Chỉ tính lương cho người có hợp đồng
      if (emp.contracts.length === 0) continue;

      const baseSalary = emp.contracts[0].baseSalary;

      // Lấy số ngày công trong tháng
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      const totalWorkingDays = attendances.reduce((sum, att) => sum + Number(att.workingDay), 0);
      
      // Tính lương (Công chuẩn = 22 ngày)
      const netSalary = (Number(baseSalary) / 22) * totalWorkingDays;

      // Kiểm tra xem đã có bản ghi payroll cho tháng này chưa
      const existing = await prisma.payroll.findFirst({
        where: { employeeId: emp.id, periodMonth: month, periodYear: year }
      });

      if (existing) {
        // Cập nhật
        await prisma.payroll.update({
          where: { id: existing.id },
          data: {
            baseSalary,
            workingDays: totalWorkingDays,
            netSalary
          }
        });
      } else {
        // Tạo mới
        await prisma.payroll.create({
          data: {
            employeeId: emp.id,
            periodMonth: month,
            periodYear: year,
            baseSalary,
            workingDays: totalWorkingDays,
            netSalary,
            status: 'DRAFT'
          }
        });
      }
      generatedCount++;
    }

    return res.json({ message: `Đã tính toán xong bảng lương cho ${generatedCount} nhân sự` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server khi tính lương' });
  }
});

// Cập nhật trạng thái
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái bảng lương' });
  }
});

export default router;
