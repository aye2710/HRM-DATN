import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Lấy danh sách phiếu lương
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = {};
    if (month && year) {
      whereClause = {
        payrollPeriod: {
          monthYear: `${month}-${year}`
        }
      };
    }

    const records = await prisma.payslip.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { fullName: true, code: true, department: true, position: true }
        },
        payrollPeriod: true
      }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu bảng lương' });
  }
});

// Lấy danh sách phiếu lương của 1 nhân viên
router.get('/employee/:employeeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.employeeId as string;
    const records = await prisma.payslip.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        },
        payrollPeriod: true
      }
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

    const monthYearStr = `${month}-${year}`;

    // Lấy hoặc tạo PayrollPeriod
    let period = await prisma.payrollPeriod.findUnique({
      where: { monthYear: monthYearStr }
    });

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          monthYear: monthYearStr,
          standardWorkingDays: 22,
          status: 'DRAFT'
        }
      });
    }

    // Lấy tất cả nhân viên đang ACTIVE
    const employees = await prisma.employee.findMany({
      where: { status: { not: 'RESIGNED' } },
      include: { contracts: { where: { status: 'ACTIVE' } } }
    });

    let generatedCount = 0;

    for (const emp of employees) {
      if (emp.contracts.length === 0) continue;

      const baseSalary = emp.contracts[0].baseSalary;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      const totalWorkingDays = attendances.reduce((sum, att) => sum + Number(att.workingDay), 0);
      
      const netSalary = (Number(baseSalary) / 22) * totalWorkingDays;

      const existing = await prisma.payslip.findFirst({
        where: { employeeId: emp.id, payrollPeriodId: period.id }
      });

      if (existing) {
        await prisma.payslip.update({
          where: { id: existing.id },
          data: {
            baseSalary,
            actualWorkingDays: totalWorkingDays,
            grossSalary: netSalary, // simplified
            netSalary: netSalary
          }
        });
      } else {
        await prisma.payslip.create({
          data: {
            employeeId: emp.id,
            payrollPeriodId: period.id,
            baseSalary,
            actualWorkingDays: totalWorkingDays,
            grossSalary: netSalary, // simplified
            netSalary: netSalary
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
    const id = req.params.id as string;
    const { status } = req.body;
    const updated = await prisma.payrollPeriod.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái bảng lương' });
  }
});

export default router;
