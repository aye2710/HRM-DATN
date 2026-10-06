import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// 1. GET /api/reports/overview - Báo cáo tổng hợp toàn diện
router.get('/overview', async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Nhân sự
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({
      where: { status: { not: 'RESIGNED' } }
    });
    const officialEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' }
    });
    const probationEmployees = await prisma.employee.count({
      where: { status: 'PROBATION' }
    });
    const internshipEmployees = await prisma.employee.count({
      where: { status: 'INTERNSHIP' }
    });
    const resignedEmployees = await prisma.employee.count({
      where: { status: 'RESIGNED' }
    });

    // 2. Cơ cấu phòng ban & Định biên (Quota vs Actual)
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: { where: { status: { not: 'RESIGNED' } } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    const departmentStats = departments.map(d => {
      const actual = d._count.employees;
      const quota = (d as any).quota || 20; // Default quota 20 nếu chưa set
      const fillRate = quota > 0 ? Math.round((actual / quota) * 100) : 100;
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        actual,
        quota,
        fillRate,
        status: actual > quota ? 'OVER_QUOTA' : actual === quota ? 'FULL' : 'OPEN'
      };
    });

    // 3. Cơ cấu giới tính
    const genderCounts = await prisma.employee.groupBy({
      by: ['gender'],
      _count: { id: true },
      where: { status: { not: 'RESIGNED' } }
    });
    const genderStats = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0
    };
    genderCounts.forEach(g => {
      if (g.gender === 'MALE') genderStats.MALE = g._count.id;
      else if (g.gender === 'FEMALE') genderStats.FEMALE = g._count.id;
      else genderStats.OTHER += g._count.id;
    });

    // 4. Cơ cấu Hợp đồng Lao động
    const contractTypes = await prisma.contract.groupBy({
      by: ['contractType'],
      _count: { id: true },
      where: { status: 'ACTIVE' }
    });
    const contractStats = contractTypes.map(c => ({
      type: c.contractType,
      count: c._count.id
    }));

    // 5. Xu hướng Quỹ lương qua các kỳ gần nhất
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      include: {
        payslips: {
          select: { grossSalary: true, netSalary: true, baseSalary: true }
        }
      },
      orderBy: { monthYear: 'desc' },
      take: 6
    });

    const payrollTrends = payrollPeriods.reverse().map(p => {
      const totalGross = p.payslips.reduce((sum, item) => sum + Number(item.grossSalary || 0), 0);
      const totalNet = p.payslips.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
      const totalBase = p.payslips.reduce((sum, item) => sum + Number(item.baseSalary || 0), 0);
      return {
        id: p.id,
        monthYear: p.monthYear,
        name: `Tháng ${p.monthYear}`,
        employees: p.payslips.length,
        totalGross,
        totalNet,
        totalBase,
        status: p.status
      };
    });

    // 6. Tuyển dụng & Quyết định nhân sự
    const totalJobPostings = await prisma.jobPosting.count();
    const openJobPostings = await prisma.jobPosting.count({ where: { status: 'OPEN' } });
    const totalCandidates = await prisma.candidate.count();
    const hiredCandidates = await prisma.candidate.count({ where: { status: 'HIRED' } });
    const totalDecisions = await prisma.decision.count();

    // 7. Kỳ lương mới nhất
    const latestPayroll = payrollTrends.length > 0 ? payrollTrends[payrollTrends.length - 1] : null;

    return res.json({
      summary: {
        totalEmployees,
        activeEmployees,
        officialEmployees,
        probationEmployees,
        resignedEmployees,
        totalDepartments: departments.length,
        latestNetPayroll: latestPayroll ? latestPayroll.totalNet : 0,
        latestGrossPayroll: latestPayroll ? latestPayroll.totalGross : 0,
        openJobPostings,
        totalCandidates,
        hiredCandidates,
        totalDecisions
      },
      departments: departmentStats,
      genderStats,
      contractStats,
      payrollTrends
    });
  } catch (error) {
    console.error('Lỗi API /reports/overview:', error);
    return res.status(500).json({ error: 'Lỗi server khi tổng hợp báo cáo' });
  }
});

export default router;
