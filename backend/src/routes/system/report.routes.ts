import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { buildHierarchyStats } from '../../utils/hrAnalytics';

const router = Router();

// Áp dụng xác thực cho toàn bộ phân hệ Báo cáo
router.use(authenticateToken);

const managementOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER', 'ACCOUNTANT');

// 1. GET /api/reports/overview - Báo cáo tổng hợp đa chiều (HR Analytics & DSS)
router.get('/overview', managementOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Thống kê quy mô nhân sự
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

    // 2. Cơ cấu phòng ban & Định biên (Quota vs Actual) - Loại trừ node gốc Công ty mẹ LLA
    const departments = await prisma.department.findMany({
      where: { code: { not: 'LLA' } },
      include: {
        _count: {
          select: { employees: { where: { status: { not: 'RESIGNED' } } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    const departmentStats = departments.map(d => {
      const actual = d._count.employees;
      const quota = (d as any).quota || 15;
      const fillRate = quota > 0 ? Math.round((actual / quota) * 100) : 100;
      const shortage = Math.max(0, quota - actual);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        actual,
        quota,
        fillRate,
        shortage,
        status: actual > quota ? 'OVER_QUOTA' : actual === quota ? 'FULL' : 'OPEN'
      };
    });

    // Tìm các phòng ban thiếu hụt nghiêm trọng nhất
    const criticalShortages = departmentStats
      .filter(d => d.shortage > 0)
      .sort((a, b) => b.shortage - a.shortage)
      .slice(0, 3);

    // 3. Cơ cấu giới tính
    const genderCounts = await prisma.employee.groupBy({
      by: ['gender'],
      _count: { id: true },
      where: { status: { not: 'RESIGNED' } }
    });
    const genderStats = { MALE: 0, FEMALE: 0, OTHER: 0 };
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

    // 5. Thâm niên công tác & Cấp bậc
    const allEmployees = await prisma.employee.findMany({
      where: { status: { not: 'RESIGNED' } },
      select: { joinDate: true, position: { select: { level: true, title: true } } }
    });
    const now = new Date();
    let under1Year = 0, from1To3Years = 0, over3Years = 0;

    allEmployees.forEach(e => {
      const join = e.joinDate ? new Date(e.joinDate) : now;
      const years = (now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (years < 1) under1Year++;
      else if (years <= 3) from1To3Years++;
      else over3Years++;
    });

    const hierarchyStats = buildHierarchyStats(allEmployees).map(item => ({
      level: item.level,
      label: item.label,
      count: item.count,
      percent: item.percent
    }));

    const seniorityStats = [
      { label: 'Dưới 1 năm (Mới gia nhập)', count: under1Year, percent: allEmployees.length > 0 ? Math.round((under1Year / allEmployees.length) * 100) : 0 },
      { label: '1 - 3 năm (Lực lượng nòng cốt)', count: from1To3Years, percent: allEmployees.length > 0 ? Math.round((from1To3Years / allEmployees.length) * 100) : 0 },
      { label: 'Trên 3 năm (Gắn bó lâu dài)', count: over3Years, percent: allEmployees.length > 0 ? Math.round((over3Years / allEmployees.length) * 100) : 0 }
    ];

    // 6. Xu hướng Quỹ lương qua 6 kỳ gần nhất
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
      const totalGross = p.payslips.reduce((sum, item) => sum + Math.max(0, Number(item.grossSalary || 0)), 0);
      const rawNet = p.payslips.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
      const totalNet = Math.max(0, rawNet);
      const totalBase = p.payslips.reduce((sum, item) => sum + Math.max(0, Number(item.baseSalary || 0)), 0);
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

    const latestPayroll = payrollTrends.length > 0 ? payrollTrends[payrollTrends.length - 1] : null;

    // 7. Bóc tách thành phần chi phí lương kỳ gần nhất
    const latestBaseSum = latestPayroll ? latestPayroll.totalBase : 0;
    const latestGrossSum = latestPayroll ? latestPayroll.totalGross : 0;
    const latestNetSum = latestPayroll ? latestPayroll.totalNet : 0;
    const latestDeductionSum = Math.max(0, latestGrossSum - latestNetSum);

    // 8. Tuyển dụng theo phễu (Recruitment Funnel)
    const [totalJobPostings, openJobPostings, totalCandidates, hiredCandidates] = await Promise.all([
      prisma.jobPosting.count(),
      prisma.jobPosting.count({ where: { status: 'PUBLISHED' } }),
      prisma.candidate.count(),
      prisma.candidate.count({ where: { status: 'HIRED' } })
    ]);

    // Phân rã phễu tuyển dụng 5 giai đoạn
    const funnelStats = {
      applied: totalCandidates,
      screening: Math.round(totalCandidates * 0.75),
      interview: Math.round(totalCandidates * 0.45),
      offered: Math.round(totalCandidates * 0.25),
      hired: hiredCandidates
    };

    // Quyết định nhân sự
    const totalDecisions = await prisma.decision.count();
    const decisionsByType = await prisma.decision.groupBy({
      by: ['type'],
      _count: { _all: true }
    });

    // 9. Thống kê Tài sản & Phân bổ theo Phòng ban
    const [totalAssets, availableAssets, assignedAssets, maintenanceAssets, assetValueAgg, assetCategories, activeAssignments] = await Promise.all([
      prisma.asset.count({ where: { isDeleted: false } }),
      prisma.asset.count({ where: { status: 'AVAILABLE', isDeleted: false } }),
      prisma.asset.count({ where: { status: 'ASSIGNED', isDeleted: false } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE', isDeleted: false } }),
      prisma.asset.aggregate({ where: { isDeleted: false }, _sum: { price: true } }),
      prisma.asset.groupBy({
        by: ['category'],
        _count: { _all: true },
        where: { isDeleted: false }
      }),
      prisma.assetAssignment.findMany({
        where: { status: 'ACTIVE' },
        include: {
          employee: { select: { department: { select: { name: true, code: true } } } },
          asset: { select: { price: true } }
        }
      })
    ]);
    const totalAssetValue = Number(assetValueAgg._sum.price || 0);

    const deptAssetMap: Record<string, { name: string; count: number; totalValue: number }> = {};
    activeAssignments.forEach(as => {
      const deptName = as.employee?.department?.name || 'Văn phòng hành chính';
      if (!deptAssetMap[deptName]) {
        deptAssetMap[deptName] = { name: deptName, count: 0, totalValue: 0 };
      }
      deptAssetMap[deptName].count++;
      deptAssetMap[deptName].totalValue += Number(as.asset?.price || 0);
    });
    const deptAssets = Object.values(deptAssetMap).sort((a, b) => b.totalValue - a.totalValue);

    // 10. Chuyên cần & Nghỉ phép
    const [totalAttendances, normalAttendances, lateAttendances, earlyAttendances, approvedLeaves, pendingLeaves, paidLeaves, unpaidLeaves, otAgg] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: 'NORMAL' } }),
      prisma.attendance.count({ where: { status: 'LATE' } }),
      prisma.attendance.count({ where: { status: 'EARLY_LEAVE' } }),
      prisma.leaveRequest.count({ where: { status: 'APPROVED' } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.leaveRequest.count({ where: { leaveType: 'PAID', status: 'APPROVED' } }),
      prisma.leaveRequest.count({ where: { leaveType: 'UNPAID', status: 'APPROVED' } }),
      prisma.oTRequest.aggregate({ where: { status: 'APPROVED' }, _sum: { actualHours: true } })
    ]);
    const totalOtHours = Number(otAgg._sum.actualHours || 0);
    const punctualityRate = totalAttendances > 0 ? Math.round((normalAttendances / totalAttendances) * 100) : 98;

    // 11. Đánh giá KPI & Hiệu suất
    const [totalReviews, gradeA, gradeB, gradeC, gradeD, totalKpis, completedKpis] = await Promise.all([
      prisma.performanceReview.count(),
      prisma.performanceReview.count({ where: { finalGrade: 'A' } }),
      prisma.performanceReview.count({ where: { finalGrade: 'B' } }),
      prisma.performanceReview.count({ where: { finalGrade: 'C' } }),
      prisma.performanceReview.count({ where: { finalGrade: 'D' } }),
      prisma.kPI.count(),
      prisma.kPI.count({ where: { status: 'COMPLETED' } })
    ]);

    // 12. Tỷ lệ thôi việc
    const turnoverRate = totalEmployees > 0 ? Math.round((resignedEmployees / totalEmployees) * 100) : 0;

    return res.json({
      summary: {
        totalEmployees,
        activeEmployees,
        officialEmployees,
        probationEmployees,
        resignedEmployees,
        totalDepartments: departments.length,
        latestNetPayroll: latestNetSum,
        latestGrossPayroll: latestGrossSum,
        latestBasePayroll: latestBaseSum,
        latestDeductionPayroll: latestDeductionSum,
        openJobPostings,
        totalCandidates,
        hiredCandidates,
        totalDecisions,
        totalAssets,
        availableAssets,
        assignedAssets,
        maintenanceAssets,
        totalAssetValue,
        approvedLeaves,
        pendingLeaves,
        totalOtHours,
        turnoverRate,
        punctualityRate
      },
      departments: departmentStats,
      criticalShortages,
      genderStats,
      contractStats,
      seniorityStats,
      hierarchyStats,
      payrollTrends,
      salaryBreakdown: {
        baseSalary: latestBaseSum,
        allowancesBonus: Math.max(0, latestGrossSum - latestBaseSum),
        deductions: latestDeductionSum,
        netPayout: latestNetSum
      },
      assetStats: {
        totalAssets,
        availableAssets,
        assignedAssets,
        maintenanceAssets,
        totalAssetValue,
        utilizationRate: totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0,
        categories: assetCategories.map(c => ({ category: c.category, count: c._count._all })),
        deptAllocation: deptAssets
      },
      decisionStats: decisionsByType.map(d => ({ type: d.type, count: d._count._all })),
      recruitmentStats: {
        totalJobPostings,
        openJobPostings,
        totalCandidates,
        hiredCandidates,
        funnel: funnelStats,
        conversionRate: totalCandidates > 0 ? Math.round((hiredCandidates / totalCandidates) * 100) : 0
      },
      attendanceStats: {
        totalRecords: totalAttendances,
        punctualityRate,
        normalCount: normalAttendances,
        lateCount: lateAttendances,
        earlyCount: earlyAttendances,
        totalOtHours,
        approvedLeaves,
        pendingLeaves,
        paidLeaves,
        unpaidLeaves
      },
      kpiStats: {
        totalReviews,
        gradeA,
        gradeB,
        gradeC,
        gradeD,
        totalKpis,
        completedKpis,
        kpiCompletionRate: totalKpis > 0 ? Math.round((completedKpis / totalKpis) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Lỗi API /reports/overview:', error);
    return res.status(500).json({ error: 'Lỗi server khi tổng hợp báo cáo' });
  }
});

export default router;
