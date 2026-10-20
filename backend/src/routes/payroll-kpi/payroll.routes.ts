import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { getSettingValue } from '../system/setting.routes';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

/**
 * Biểu thuế lũy tiến từng phần 7 bậc theo Luật Thuế Thu Nhập Cá Nhân Việt Nam hiện hành
 */
export const calculatePIT = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 5000000) {
    return taxableIncome * 0.05;
  } else if (taxableIncome <= 10000000) {
    return taxableIncome * 0.10 - 250000;
  } else if (taxableIncome <= 18000000) {
    return taxableIncome * 0.15 - 750000;
  } else if (taxableIncome <= 32000000) {
    return taxableIncome * 0.20 - 1650000;
  } else if (taxableIncome <= 52000000) {
    return taxableIncome * 0.25 - 3250000;
  } else if (taxableIncome <= 80000000) {
    return taxableIncome * 0.30 - 5850000;
  } else {
    return taxableIncome * 0.35 - 9850000;
  }
};

// 1. GET: Danh sách tất cả các Kỳ lương (Payroll Periods)
router.get('/periods', authenticateToken, async (req: Request, res: Response): Promise<any> => {
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
    console.error('Error fetching payroll periods:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách kỳ lương' });
  }
});

// 2. POST: Khởi tạo Kỳ lương mới
router.post('/periods', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { month, year, standardWorkingDays } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Vui lòng chọn Tháng và Năm cho kỳ lương' });
    const monthYear = `${month}-${year}`;

    const existing = await prisma.payrollPeriod.findUnique({ where: { monthYear } });
    if (existing) {
      return res.status(400).json({ error: `Kỳ lương tháng ${month}/${year} đã tồn tại trong hệ thống!` });
    }

    const defaultStandardDays = await getSettingValue('STANDARD_WORKING_DAYS', 22);

    const newPeriod = await prisma.payrollPeriod.create({
      data: {
        monthYear,
        standardWorkingDays: standardWorkingDays ? parseInt(standardWorkingDays) : Number(defaultStandardDays),
        status: 'DRAFT'
      }
    });

    await createAuditLog({
      action: 'CREATE_PAYROLL_PERIOD',
      tableName: 'PayrollPeriod',
      recordId: newPeriod.id,
      accountId: req.user?.accountId,
      details: `Khởi tạo kỳ lương mới: ${monthYear} (${newPeriod.standardWorkingDays} ngày công chuẩn)`
    });

    return res.status(201).json(newPeriod);
  } catch (error) {
    console.error('Error creating payroll period:', error);
    return res.status(500).json({ error: 'Lỗi khi tạo kỳ lương' });
  }
});

// 3. DELETE: Xóa Kỳ lương (chỉ khi đang ở trạng thái DRAFT)
router.delete('/periods/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const period = await prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) return res.status(404).json({ error: 'Không tìm thấy kỳ lương' });
    if (period.status === 'LOCKED') {
      return res.status(400).json({ error: 'Kỳ lương đã khóa sổ, không thể xóa!' });
    }

    // Xóa chi tiết và phiếu lương trong transaction
    await prisma.$transaction(async (tx) => {
      const payslips = await tx.payslip.findMany({ where: { payrollPeriodId: id }, select: { id: true } });
      const payslipIds = payslips.map(p => p.id);
      if (payslipIds.length > 0) {
        await tx.payslipDetail.deleteMany({ where: { payslipId: { in: payslipIds } } });
      }
      await tx.payslip.deleteMany({ where: { payrollPeriodId: id } });
      await tx.payrollPeriod.delete({ where: { id } });
    });

    await createAuditLog({
      action: 'DELETE_PAYROLL_PERIOD',
      tableName: 'PayrollPeriod',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Đã xóa kỳ lương nháp: ${period.monthYear}`
    });

    return res.json({ message: 'Xóa kỳ lương thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa kỳ lương' });
  }
});

// 4. GET: Lấy danh sách phiếu lương theo tháng/năm
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<any> => {
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
        payrollPeriod: true,
        details: true
      },
      orderBy: { employee: { code: 'asc' } }
    });
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu bảng lương' });
  }
});

// 5. GET: Lấy danh sách phiếu lương của 1 nhân viên (Cổng ESS)
router.get('/employee/:employeeId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
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
router.get('/payslip/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
            relatives: { where: { isDependent: true } }
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

// 6. POST: Động cơ chạy bảng lương (Enterprise Payroll Engine)
// Tuân thủ 100% Luật BHXH, Luật Thuế TNCN (7 bậc) và Luật Lao Động 2019
router.post('/generate', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Thiếu thông tin tháng hoặc năm' });

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
    const dependentDeductionRate = await getSettingValue('DEPENDENT_DEDUCTION', 4400000);
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

    const standardDays = period.standardWorkingDays || Number(dynamicStandardDays) || 22;

    // Lấy tất cả nhân viên đang làm việc (kèm Hợp đồng ACTIVE & Người phụ thuộc)
    const employees = await prisma.employee.findMany({
      where: { status: { not: 'RESIGNED' } },
      include: {
        contracts: { where: { status: 'ACTIVE' }, orderBy: { startDate: 'desc' } },
        relatives: { where: { isDependent: true } }
      }
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let generatedCount = 0;

    for (const emp of employees) {
      // 1. Mức lương cơ bản theo hợp đồng
      const baseSalary = emp.contracts.length > 0 ? Number(emp.contracts[0].baseSalary) : 10000000;

      // 2. Chấm công thực tế trong tháng
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      // Tính tổng ngày công thực tế (làm việc + nghỉ phép có lương PAID)
      const totalWorkingDays = attendances.reduce((sum, att) => sum + Number(att.workingDay || 0), 0);

      // Lương theo ngày công làm việc thực tế
      const baseEarned = (baseSalary / standardDays) * totalWorkingDays;

      // 3. Tính tiền làm thêm giờ (Overtime - Điều 98 BLLĐ 2019)
      const approvedOT = await prisma.oTRequest.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate },
          status: 'APPROVED'
        }
      });

      const totalOTHours = approvedOT.reduce((sum, ot) => sum + Number(ot.actualHours || ot.requestHours || 0), 0);
      const hourlyRate = baseSalary / standardDays / 8;
      const otMultiplier = 1.5; // Hệ số tối thiểu 150%
      const otPay = totalOTHours * hourlyRate * otMultiplier;
      
      // Theo Luật Thuế TNCN: phần lương trả thêm (50% phụ trội) được MIỄN THUẾ
      const taxExemptOT = totalOTHours * hourlyRate * (otMultiplier - 1.0);

      // Tổng thu nhập trước thuế (Gross)
      const grossSalary = baseEarned + otPay;

      // 4. Trích đóng BHXH, BHYT, BHTN (Tối đa 20 lần lương cơ sở: maxInsuranceSalary)
      const salaryForInsurance = Math.min(baseSalary, Number(maxInsuranceSalary) || 46800000);
      const insuranceDeduction = salaryForInsurance * ((Number(insuranceRatePercent) || 10.5) / 100);

      // 5. Giảm trừ gia cảnh: Bản thân + Người phụ thuộc (4.4M / người)
      const numDependents = emp.relatives.length;
      const dependentDeductionTotal = numDependents * (Number(dependentDeductionRate) || 4400000);
      const totalRelief = Number(personalDeduction || 11000000) + dependentDeductionTotal;

      // 6. Thu nhập tính thuế TNCN (Taxable Income)
      // Thu nhập chịu thuế = Gross - Khoản miễn thuế (taxExemptOT)
      // Thu nhập tính thuế = Thu nhập chịu thuế - Các khoản giảm trừ (Bảo hiểm + Gia cảnh)
      const taxableIncome = Math.max(0, (grossSalary - taxExemptOT) - insuranceDeduction - totalRelief);

      // 7. Tính thuế TNCN theo biểu thuế lũy tiến từng phần 7 bậc
      const taxDeduction = calculatePIT(taxableIncome);

      // 8. Lương thực nhận (Net Salary)
      const netSalary = Math.round(grossSalary - insuranceDeduction - taxDeduction);

      // 9. Lưu bản ghi Payslip và PayslipDetails
      const existing = await prisma.payslip.findFirst({
        where: { employeeId: emp.id, payrollPeriodId: period.id }
      });

      let payslipRecord;
      if (existing) {
        // Xóa details cũ để ghi mới
        await prisma.payslipDetail.deleteMany({ where: { payslipId: existing.id } });
        payslipRecord = await prisma.payslip.update({
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
        payslipRecord = await prisma.payslip.create({
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

      // Tạo các dòng PayslipDetail để nhân viên xem minh bạch từng khoản
      const detailsToCreate = [
        { type: 'EARNING', amount: Math.round(baseEarned), description: `Lương theo công thực tế (${totalWorkingDays.toFixed(1)} / ${standardDays} ngày)` },
        ...(totalOTHours > 0 ? [{ type: 'EARNING', amount: Math.round(otPay), description: `Làm thêm giờ (${totalOTHours.toFixed(1)} giờ x 150%)` }] : []),
        { type: 'DEDUCTION', amount: Math.round(insuranceDeduction), description: `Bảo hiểm bắt buộc (BHXH 8%, BHYT 1.5%, BHTN 1%)` },
        { type: 'DEDUCTION', amount: Math.round(taxDeduction), description: `Thuế TNCN lũy tiến (${numDependents} người phụ thuộc)` }
      ];

      for (const d of detailsToCreate) {
        await prisma.payslipDetail.create({
          data: {
            payslipId: payslipRecord.id,
            type: d.type,
            amount: d.amount,
            description: d.description
          }
        });
      }

      generatedCount++;
    }

    await createAuditLog({
      action: 'GENERATE_PAYROLL',
      tableName: 'PayrollPeriod',
      recordId: period.id,
      accountId: req.user?.accountId,
      details: `Chạy động cơ tính lương Tháng ${month}/${year} cho ${generatedCount} nhân sự.`
    });

    return res.json({ 
      message: `Đã tính toán xong bảng lương tháng ${month}/${year} cho ${generatedCount} nhân sự theo luật thuế và BHXH hiện hành!`,
      period
    });
  } catch (error: any) {
    console.error('Error generating payroll:', error);
    return res.status(500).json({ error: error.message || 'Lỗi server khi tính lương' });
  }
});

// 7. GET: Lấy thông tin trạng thái kỳ lương
router.get('/period/info', authenticateToken, async (req: Request, res: Response): Promise<any> => {
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
router.post('/period/toggle-lock', authenticateToken, async (req: any, res: Response): Promise<any> => {
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

    await createAuditLog({
      action: targetStatus === 'LOCKED' ? 'LOCK_PAYROLL' : 'UNLOCK_PAYROLL',
      tableName: 'PayrollPeriod',
      recordId: period.id,
      accountId: req.user?.accountId,
      details: `${targetStatus === 'LOCKED' ? 'Khóa sổ' : 'Mở khóa sổ'} kỳ lương ${monthYearStr}`
    });

    return res.json({
      message: `Đã ${targetStatus === 'LOCKED' ? 'KHÓA SỔ' : 'MỞ KHÓA'} kỳ lương ${month}/${year} thành công`,
      period
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái khóa kỳ lương' });
  }
});

export default router;
