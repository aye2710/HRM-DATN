import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { getSettingValue } from './setting.routes';

const router = Router();

// 1. GET: Danh sách tất cả các Kỳ lương (Payroll Periods)
router.get('/periods', async (req: Request, res: Response): Promise<any> => {
  try {
    const periods = await prisma.payrollPeriod.findMany({
      include: {
        _count: { select: { payslips: true } },
        payslips: {
          select: { baseSalary: true, grossSalary: true, netSalary: true, insuranceDeduction: true, taxDeduction: true }
        }
      },
      orderBy: { monthYear: 'desc' }
    });

    const formatted = periods.map(p => {
      const totalBase = p.payslips.reduce((sum, item) => sum + Number(item.baseSalary || 0), 0);
      const totalGross = p.payslips.reduce((sum, item) => sum + Number(item.grossSalary || 0), 0);
      const totalNet = p.payslips.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
      const [m, y] = p.monthYear.split('-');
      return {
        id: p.id,
        monthYear: p.monthYear,
        month: Number(m),
        year: Number(y),
        name: `Kỳ lương Tháng ${m}/${y}`,
        standardWorkingDays: p.standardWorkingDays,
        employees: p._count.payslips,
        totalBase,
        totalGross,
        totalNet,
        status: p.status
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách kỳ lương' });
  }
});

// 2. POST: Khởi tạo Kỳ lương mới
router.post('/periods', async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year, standardWorkingDays } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Vui lòng chọn Tháng và Năm cho kỳ lương' });
    const monthYear = `${month}-${year}`;

    const existing = await prisma.payrollPeriod.findUnique({ where: { monthYear } });
    if (existing) {
      return res.status(400).json({ error: `Kỳ lương tháng ${month}/${year} đã tồn tại trong hệ thống!` });
    }

    const newPeriod = await prisma.payrollPeriod.create({
      data: {
        monthYear,
        standardWorkingDays: standardWorkingDays ? parseInt(standardWorkingDays) : 22,
        status: 'DRAFT'
      }
    });

    return res.status(201).json(newPeriod);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi khi tạo kỳ lương' });
  }
});

// 3. DELETE: Xóa Kỳ lương (chỉ khi đang ở trạng thái DRAFT)
router.delete('/periods/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const period = await prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) return res.status(404).json({ error: 'Không tìm thấy kỳ lương' });
    if (period.status === 'LOCKED') {
      return res.status(400).json({ error: 'Kỳ lương đã khóa sổ, không thể xóa!' });
    }

    // Xóa các payslips liên quan trước
    await prisma.payslip.deleteMany({ where: { payrollPeriodId: id } });
    await prisma.payrollPeriod.delete({ where: { id } });

    return res.json({ message: 'Xóa kỳ lương thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa kỳ lương' });
  }
});

// 4. GET: Lấy danh sách phiếu lương theo tháng/năm
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year } = req.query;
    
    let whereClause: any = {};
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
          select: { id: true, fullName: true, code: true, department: true, position: true }
        },
        payrollPeriod: true
      },
      orderBy: { employee: { code: 'asc' } }
    });
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu bảng lương' });
  }
});

// 5. GET: Lấy danh sách phiếu lương của 1 nhân viên
router.get('/employee/:employeeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.employeeId as string;
    const records = await prisma.payslip.findMany({
      where: { employeeId },
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        },
        payrollPeriod: true,
        details: true
      },
      orderBy: { payrollPeriod: { monthYear: 'desc' } }
    });
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy phiếu lương cá nhân' });
  }
});

// 5b. GET: Chi tiết 1 phiếu lương theo ID
router.get('/payslip/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            position: true
          }
        },
        payrollPeriod: true,
        details: true
      }
    });
    if (!payslip) return res.status(404).json({ error: 'Không tìm thấy phiếu lương' });
    return res.json(payslip);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy chi tiết phiếu lương' });
  }
});

// 6. POST: Chạy bảng lương (Generate Payroll)
router.post('/generate', async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Thiếu tháng hoặc năm' });

    const monthYearStr = `${month}-${year}`;

    // Lấy hoặc tạo PayrollPeriod
    let period = await prisma.payrollPeriod.findUnique({
      where: { monthYear: monthYearStr }
    });

    if (period && period.status === 'LOCKED') {
      return res.status(400).json({
        error: `Kỳ lương tháng ${month}/${year} đã bị KHÓA SỔ (LOCKED). Không thể tính lại trừ khi Ban Giám Đốc mở khóa!`
      });
    }

    // Lấy các tham số nghiệp vụ động từ Database (SystemSetting)
    const dynamicStandardDays = await getSettingValue('STANDARD_WORKING_DAYS', 22);
    const insuranceRatePercent = await getSettingValue('INSURANCE_RATE', 10.5);
    const personalDeduction = await getSettingValue('PERSONAL_DEDUCTION', 11000000);
    const maxInsuranceSalary = await getSettingValue('MAX_INSURANCE_SALARY', 46800000);

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          monthYear: monthYearStr,
          standardWorkingDays: Number(dynamicStandardDays) || 22,
          status: 'DRAFT'
        }
      });
    }

    // Lấy tất cả nhân viên đang ACTIVE (kèm hợp đồng có hiệu lực)
    const employees = await prisma.employee.findMany({
      where: { status: { not: 'RESIGNED' } },
      include: { contracts: { where: { status: 'ACTIVE' } } }
    });

    let generatedCount = 0;

    for (const emp of employees) {
      // Nếu nhân viên chưa có hợp đồng chính thức, lấy mức lương mặc định 10.000.000 VNĐ
      const baseSalary = emp.contracts.length > 0 ? Number(emp.contracts[0].baseSalary) : 10000000;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      // Nếu có chấm công thì tính theo ngày công thực tế, nếu chưa chấm thì mặc định theo ngày công chuẩn của kỳ lương
      const standardDays = period.standardWorkingDays || Number(dynamicStandardDays) || 22;
      let totalWorkingDays = attendances.reduce((sum, att) => sum + Number(att.workingDay), 0);
      if (attendances.length === 0) {
        totalWorkingDays = standardDays;
      }

      const grossSalary = (baseSalary / standardDays) * totalWorkingDays;
      
      // Khấu trừ BHXH, BHYT, BHTN theo tỷ lệ động (mặc định 10.5%, có áp mức trần đóng BH)
      const salaryForInsurance = Math.min(grossSalary, Number(maxInsuranceSalary) || 46800000);
      const insuranceDeduction = salaryForInsurance * ((Number(insuranceRatePercent) || 10.5) / 100);

      // Giảm trừ gia cảnh bản thân nạp động (mặc định 11 triệu/tháng)
      const taxableIncome = Math.max(0, grossSalary - insuranceDeduction - Number(personalDeduction));
      let taxDeduction = 0;
      if (taxableIncome > 0) {
        if (taxableIncome <= 5000000) taxDeduction = taxableIncome * 0.05;
        else if (taxableIncome <= 10000000) taxDeduction = taxableIncome * 0.1 - 250000;
        else taxDeduction = taxableIncome * 0.15 - 750000;
      }

      const netSalary = Math.round(grossSalary - insuranceDeduction - taxDeduction);

      const existing = await prisma.payslip.findFirst({
        where: { employeeId: emp.id, payrollPeriodId: period.id }
      });

      if (existing) {
        await prisma.payslip.update({
          where: { id: existing.id },
          data: {
            baseSalary,
            actualWorkingDays: totalWorkingDays,
            grossSalary: Math.round(grossSalary),
            insuranceDeduction: Math.round(insuranceDeduction),
            taxDeduction: Math.round(taxDeduction),
            netSalary
          }
        });
      } else {
        await prisma.payslip.create({
          data: {
            employeeId: emp.id,
            payrollPeriodId: period.id,
            baseSalary,
            actualWorkingDays: totalWorkingDays,
            grossSalary: Math.round(grossSalary),
            insuranceDeduction: Math.round(insuranceDeduction),
            taxDeduction: Math.round(taxDeduction),
            netSalary
          }
        });
      }
      generatedCount++;
    }

    return res.json({ 
      message: `Đã tính toán xong bảng lương tháng ${month}/${year} cho ${generatedCount} nhân sự!`,
      period
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server khi tính lương' });
  }
});

// 7. GET: Lấy thông tin trạng thái kỳ lương
router.get('/period/info', async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'Thiếu tháng hoặc năm' });
    const monthYearStr = `${month}-${year}`;
    const period = await prisma.payrollPeriod.findUnique({
      where: { monthYear: monthYearStr }
    });
    return res.json(period || { monthYear: monthYearStr, status: 'DRAFT', standardWorkingDays: 22 });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin kỳ lương' });
  }
});

// 8. POST: Khóa hoặc mở khóa kỳ lương
router.post('/period/toggle-lock', async (req: Request, res: Response): Promise<any> => {
  try {
    const { month, year, status } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Thiếu tháng hoặc năm' });
    const monthYearStr = `${month}-${year}`;
    const targetStatus = status || 'LOCKED';

    let period = await prisma.payrollPeriod.findUnique({
      where: { monthYear: monthYearStr }
    });

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          monthYear: monthYearStr,
          standardWorkingDays: 22,
          status: targetStatus
        }
      });
    } else {
      period = await prisma.payrollPeriod.update({
        where: { id: period.id },
        data: { status: targetStatus }
      });
    }

    return res.json({
      message: `Đã ${targetStatus === 'LOCKED' ? 'KHÓA SỔ' : 'MỞ KHÓA'} kỳ lương ${month}/${year} thành công`,
      period
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái khóa kỳ lương' });
  }
});

export default router;
