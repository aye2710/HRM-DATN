import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { getSettingValue } from './setting.routes';
import {
  buildHierarchyStats,
  buildMonthlyEmployeeSeries,
  getPeriodBounds
} from '../../utils/hrAnalytics';

const router = Router();

// Áp dụng xác thực cho bảng điều khiển
router.use(authenticateToken);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function formatShortDate(date: Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function daysBetween(fromDate: Date, toDate: Date): number {
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY);
}

function buildContractBuckets(
  contracts: Array<{
    id: string;
    contractNumber: string | null;
    status: string;
    endDate: Date | null;
    employee: { fullName: string; status: string; department: { name: string } | null } | null;
  }>,
  warnDays: number,
  now: Date
) {
  let overdueCount = 0;
  let le15Count = 0;
  let d16to45Count = 0;
  let d46to90Count = 0;
  let expiringWithinWarnCount = 0;
  const expiringAlerts: Array<{
    daysLeft: number;
    title: string;
    subtitle: string;
    badgeText: string;
    severity: 'CRITICAL' | 'WARNING';
    ageDays: number;
    route: string;
  }> = [];

  for (const c of contracts) {
    if (c.status === 'TERMINATED' || c.employee?.status === 'RESIGNED') continue;
    if (c.status === 'EXPIRED') {
      overdueCount++;
      continue;
    }
    if (c.status !== 'ACTIVE' || !c.endDate) continue;

    const daysLeft = daysBetween(now, new Date(c.endDate));
    if (daysLeft < 0) {
      overdueCount++;
      expiringAlerts.push({
        daysLeft,
        title: `HĐLĐ quá hạn (${c.contractNumber || 'Chưa rõ số'})`,
        subtitle: `${c.employee?.fullName || 'Nhân sự'} • ${c.employee?.department?.name || 'Chưa gán phòng ban'}`,
        badgeText: `Quá ${Math.abs(daysLeft)} ngày`,
        severity: 'CRITICAL',
        ageDays: Math.abs(daysLeft),
        route: `/internal/contracts/${c.id}`
      });
      continue;
    }

    if (daysLeft <= warnDays) expiringWithinWarnCount++;
    if (daysLeft <= 15) {
      le15Count++;
      expiringAlerts.push({
        daysLeft,
        title: 'HĐLĐ hết hạn trong 15 ngày',
        subtitle: `${c.employee?.fullName || 'Nhân sự'} • ${c.employee?.department?.name || 'Chưa gán phòng ban'}`,
        badgeText: daysLeft === 0 ? 'Hết hạn hôm nay' : `Còn ${daysLeft} ngày`,
        severity: 'CRITICAL',
        ageDays: Math.max(0, 15 - daysLeft),
        route: `/internal/contracts/${c.id}`
      });
    } else if (daysLeft <= 45) {
      d16to45Count++;
      if (daysLeft <= warnDays) {
        expiringAlerts.push({
          daysLeft,
          title: `HĐLĐ sắp hết hạn (${daysLeft} ngày)`,
          subtitle: `${c.employee?.fullName || 'Nhân sự'} • ${c.employee?.department?.name || 'Chưa gán phòng ban'}`,
          badgeText: `Còn ${daysLeft} ngày`,
          severity: 'WARNING',
          ageDays: Math.max(0, warnDays - daysLeft),
          route: `/internal/contracts/${c.id}`
        });
      }
    } else if (daysLeft <= 90) {
      d46to90Count++;
    }
  }

  expiringAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    overdueCount,
    le15Count,
    d16to45Count,
    d46to90Count,
    expiringWithinWarnCount,
    expiringAlerts
  };
}

function buildDataQualityStats(
  activeEmployees: Array<{
    cccd: string | null;
    bankAccount: string | null;
    taxCode: string | null;
    socialInsurance: string | null;
  }>
) {
  const total = activeEmployees.length;
  const missingCccd = activeEmployees.filter(e => !e.cccd || !e.cccd.trim()).length;
  const missingBank = activeEmployees.filter(e => !e.bankAccount || !e.bankAccount.trim()).length;
  const missingTaxOrBhxh = activeEmployees.filter(e => !e.taxCode || !e.socialInsurance).length;
  const completeProfiles = activeEmployees.filter(
    e => Boolean(e.cccd && e.cccd.trim() && e.bankAccount && e.bankAccount.trim() && e.taxCode && e.socialInsurance)
  ).length;
  const completenessPercent = total > 0 ? Math.round((completeProfiles / total) * 100) : 0;

  return {
    total,
    missingCccd,
    missingBank,
    missingTaxOrBhxh,
    completeProfiles,
    completenessPercent
  };
}

function computePayrollCutoffDays(cutoffDay: number, now: Date): number {
  const today = now.getDate();
  if (today <= cutoffDay) return cutoffDay - today;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (daysInMonth - today) + cutoffDay;
}

function computeExpiringLeaveDays(
  balances: Array<{ year: number; totalDays: unknown; usedDays: unknown }>,
  carryExpiryMmDd: string,
  maxCarryForward: number,
  now: Date
): number {
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1;

  // Trước mốc hết hạn bảo lưu (VD: 31/03): kiểm tra phép tồn năm cũ chưa dùng hết
  const [expMonth, expDay] = String(carryExpiryMmDd || '03-31').split('-').map(Number);
  if (expMonth && expDay) {
    const carryExpiryDate = new Date(currentYear, expMonth - 1, expDay, 23, 59, 59);
    const daysToCarryExpiry = daysBetween(now, carryExpiryDate);
    if (daysToCarryExpiry >= 0 && daysToCarryExpiry <= 30) {
      return Number(
        balances
          .filter(b => b.year === currentYear - 1)
          .reduce((sum, b) => sum + Math.max(0, Number(b.totalDays) - Number(b.usedDays)), 0)
          .toFixed(1)
      );
    }
  }

  // Tháng 12: tính số ngày phép năm nay vượt quá hạn mức chuyển tiếp tối đa sẽ hết hạn cuối năm
  if (month === 12) {
    return Number(
      balances
        .filter(b => b.year === currentYear)
        .reduce((sum, b) => {
          const remaining = Math.max(0, Number(b.totalDays) - Number(b.usedDays));
          return sum + Math.max(0, remaining - maxCarryForward);
        }, 0)
        .toFixed(1)
    );
  }

  return 0;
}

// GET /api/dashboard/stats - Thống kê nhanh bảng điều khiển thời gian thực
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      pendingOT,
      openJobPostings,
      todayAttendances,
      contracts
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: { not: 'RESIGNED' } } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.oTRequest.count({ where: { status: 'PENDING' } }),
      prisma.jobPosting.count({ where: { status: 'PUBLISHED' } }),
      prisma.attendance.count({ where: { date: today, checkIn: { not: null } } }),
      prisma.contract.findMany({
        where: { status: 'ACTIVE' },
        select: { baseSalary: true }
      })
    ]);

    const totalPayroll = contracts.reduce((sum, c) => sum + Number(c.baseSalary || 0), 0);
    const estimatedPayroll =
      totalPayroll > 0 ? `${(totalPayroll / 1000000).toFixed(1)}M` : `${activeEmployees * 10}M`;

    res.status(200).json({
      totalEmployees: activeEmployees || totalEmployees,
      pendingLeaves,
      pendingOT,
      openJobPostings,
      todayAttendances,
      estimatedPayroll,
      totalPayrollVND: totalPayroll
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/dashboard/overview - Dữ liệu thời gian thực đầy đủ cho trang Tổng quan nội bộ
router.get('/overview', async (req: any, res: Response): Promise<any> => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    if (userRole === 'EMPLOYEE' || userRole === 'CANDIDATE') {
      return res.status(403).json({ error: 'Không có quyền truy cập bảng điều khiển quản trị.' });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const bounds = getPeriodBounds(req.query.period, req.query.year, req.query.month, now);

    const [cutoffSetting, warnDaysSetting, carryExpirySetting, maxCarrySetting, internDurationSetting] = await Promise.all([
      getSettingValue('PAYROLL_CUTOFF_DAY', 25),
      getSettingValue('CONTRACT_EXPIRY_WARN_DAYS', 30),
      getSettingValue('CARRY_FORWARD_EXPIRY_DATE', '03-31'),
      getSettingValue('MAX_LEAVE_CARRY_FORWARD', 5),
      getSettingValue('INTERN_DURATION_MONTHS', 3)
    ]);

    const cutoffDay = Number(cutoffSetting) || 25;
    const warnDays = Number(warnDaysSetting) || 30;
    const maxCarryForward = Number(maxCarrySetting) || 5;
    const internDurationMonths = Math.max(1, Number(internDurationSetting) || 3);

    const [
      allEmployees,
      allContracts,
      pendingLeavesList,
      pendingAdjustmentsList,
      pendingOTList,
      pendingDecisionsList,
      pendingProfileReqs,
      approvedLeavesInPeriod,
      approvedOTInPeriod,
      approvedAdjustmentsInPeriod,
      lateAttendancesInPeriod,
      publishedJobs,
      candidatesInPeriod,
      totalCandidatesAll,
      onboardingTasks,
      offboardingTasks,
      activeResigningAssets,
      leaveBalances,
      payrollPeriods
    ] = await Promise.all([
      prisma.employee.findMany({
        select: {
          id: true,
          code: true,
          fullName: true,
          status: true,
          joinDate: true,
          probationEndDate: true,
          resignationDate: true,
          cccd: true,
          bankAccount: true,
          taxCode: true,
          socialInsurance: true,
          department: { select: { name: true, code: true } },
          position: { select: { level: true, title: true } }
        }
      }),
      prisma.contract.findMany({
        select: {
          id: true,
          contractNumber: true,
          status: true,
          baseSalary: true,
          allowance: true,
          endDate: true,
          employee: {
            select: {
              fullName: true,
              status: true,
              department: { select: { name: true } }
            }
          }
        }
      }),
      prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: { select: { fullName: true, code: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.attendanceAdjustment.findMany({
        where: { status: 'PENDING' },
        include: { employee: { select: { fullName: true, code: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oTRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: { select: { fullName: true, code: true } } },
        orderBy: { date: 'desc' }
      }),
      prisma.decision.findMany({
        where: { status: 'PENDING' },
        include: { employee: { select: { fullName: true, code: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.profileChangeRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: { select: { fullName: true, code: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leaveRequest.count({
        where: { status: 'APPROVED', startDate: { gte: bounds.start, lte: bounds.end } }
      }),
      prisma.oTRequest.count({
        where: { status: 'APPROVED', date: { gte: bounds.start, lte: bounds.end } }
      }),
      prisma.attendanceAdjustment.count({
        where: { status: 'APPROVED', date: { gte: bounds.start, lte: bounds.end } }
      }),
      prisma.attendance.count({
        where: { status: 'LATE', date: { gte: bounds.start, lte: bounds.end } }
      }),
      prisma.jobPosting.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          department: { select: { name: true } },
          _count: { select: { candidates: true } }
        },
        orderBy: { publishDate: 'desc' }
      }),
      prisma.candidate.count({
        where: { createdAt: { gte: bounds.start, lte: bounds.end } }
      }),
      prisma.candidate.count(),
      prisma.onboardingTask.findMany({
        where: {
          NOT: { category: { startsWith: 'OFFBOARDING_' } },
          employee: { status: { not: 'RESIGNED' } }
        },
        select: {
          employeeId: true,
          isCompleted: true,
          employee: {
            select: {
              fullName: true,
              code: true,
              joinDate: true,
              probationEndDate: true,
              department: { select: { code: true } }
            }
          }
        }
      }),
      prisma.onboardingTask.findMany({
        where: {
          category: { startsWith: 'OFFBOARDING_' },
          isCompleted: false,
          employee: { status: { not: 'RESIGNED' } }
        },
        select: {
          employeeId: true,
          employee: {
            select: {
              fullName: true,
              code: true,
              resignationDate: true,
              department: { select: { name: true } }
            }
          }
        }
      }),
      prisma.assetAssignment.findMany({
        where: {
          status: 'ACTIVE',
          employee: {
            OR: [{ status: 'RESIGNED' }, { resignationDate: { not: null } }]
          }
        },
        include: {
          employee: { select: { fullName: true, department: { select: { name: true } }, resignationDate: true } },
          asset: { select: { name: true } }
        }
      }),
      prisma.leaveBalance.findMany({
        where: { year: { in: [now.getFullYear() - 1, now.getFullYear()] } },
        select: { year: true, totalDays: true, usedDays: true }
      }),
      prisma.payrollPeriod.findMany({
        include: {
          payslips: {
            select: { grossSalary: true, netSalary: true, baseSalary: true }
          }
        }
      })
    ]);

    // 1. Headcount & Turnover
    const activeEmps = allEmployees.filter(e => e.status !== 'RESIGNED');
    const officialCount = activeEmps.filter(e => e.status === 'ACTIVE').length;
    const probationCount = activeEmps.filter(e => e.status === 'PROBATION').length;
    const otherActiveCount = activeEmps.length - officialCount - probationCount;
    const resignedTotal = allEmployees.length - activeEmps.length;

    const joinedInPeriod = allEmployees.filter(
      e => e.joinDate && e.joinDate >= bounds.start && e.joinDate <= bounds.end
    ).length;
    const resignedInPeriod = allEmployees.filter(
      e => e.status === 'RESIGNED' && e.resignationDate && e.resignationDate >= bounds.start && e.resignationDate <= bounds.end
    ).length;

    const turnoverCumulativeRate =
      allEmployees.length > 0 ? Math.round((resignedTotal / allEmployees.length) * 100) : 0;
    const turnoverPeriodRate =
      activeEmps.length + resignedInPeriod > 0
        ? Math.round((resignedInPeriod / (activeEmps.length + resignedInPeriod)) * 100)
        : 0;
    const retentionRate =
      allEmployees.length > 0
        ? Number((((allEmployees.length - resignedTotal) / allEmployees.length) * 100).toFixed(1))
        : 100;

    // 2. Charts (12m growth, hierarchy donut, 6m in/out movement)
    const { series12Months, series6Months, growthPercent } = buildMonthlyEmployeeSeries(allEmployees, bounds.seriesRefDate, 12);
    const hierarchyStats = buildHierarchyStats(activeEmps);

    // 3. Contracts, Payroll & Data quality
    const contractSummary = buildContractBuckets(allContracts, warnDays, now);
    const dataQuality = buildDataQualityStats(activeEmps);

    const activeSalaryContracts = allContracts.filter(
      c => c.status === 'ACTIVE' && c.employee?.status !== 'RESIGNED'
    );
    const contractMonthlyTotal = activeSalaryContracts.reduce(
      (sum, c) => sum + Number(c.baseSalary || 0) + Number(c.allowance || 0),
      0
    );

    const matchingPayrollPeriods = payrollPeriods.filter(p => {
      const [mStr, yStr] = String(p.monthYear || '').split('-');
      if (Number(yStr) !== bounds.year) return false;
      if (bounds.period === 'YEAR') return true;
      return Number(mStr) === bounds.month;
    });

    const periodGross = matchingPayrollPeriods.reduce(
      (sum, p) => sum + p.payslips.reduce((s, item) => s + Math.max(0, Number(item.grossSalary || 0)), 0),
      0
    );
    const periodNet = matchingPayrollPeriods.reduce(
      (sum, p) => sum + p.payslips.reduce((s, item) => s + Math.max(0, Number(item.netSalary || 0)), 0),
      0
    );
    const payslipCount = matchingPayrollPeriods.reduce((sum, p) => sum + p.payslips.length, 0);
    const hasPayslips = payslipCount > 0 && periodGross > 0;

    const payrollSummary = {
      source: hasPayslips ? 'PAYROLL' : 'CONTRACTS',
      displayAmount: hasPayslips ? periodGross : contractMonthlyTotal,
      subAmount: hasPayslips ? periodNet : contractMonthlyTotal,
      payslipCount,
      activeContractCount: activeSalaryContracts.length
    };

    // 4. Onboarding summary
    const onbMap = new Map<
      string,
      {
        employeeId: string;
        fullName: string;
        code: string;
        deptCode: string;
        total: number;
        completed: number;
        joinDate: Date;
        probationEndDate: Date | null;
      }
    >();
    for (const t of onboardingTasks) {
      const existing = onbMap.get(t.employeeId) || {
        employeeId: t.employeeId,
        fullName: t.employee.fullName,
        code: t.employee.code,
        deptCode: t.employee.department?.code || 'N/A',
        total: 0,
        completed: 0,
        joinDate: t.employee.joinDate,
        probationEndDate: t.employee.probationEndDate
      };
      existing.total += 1;
      if (t.isCompleted) existing.completed += 1;
      onbMap.set(t.employeeId, existing);
    }
    for (const emp of activeEmps.filter(e => e.status === 'ONBOARDING')) {
      if (!onbMap.has(emp.id)) {
        onbMap.set(emp.id, {
          employeeId: emp.id,
          fullName: emp.fullName,
          code: emp.code,
          deptCode: emp.department?.code || 'N/A',
          total: 0,
          completed: 0,
          joinDate: emp.joinDate,
          probationEndDate: emp.probationEndDate
        });
      }
    }
    const onboardingItems = Array.from(onbMap.values())
      .map(item => ({
        ...item,
        percent: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
        dueDateLabel: formatShortDate(item.probationEndDate)
      }))
      .sort((a, b) => {
        const aDone = a.percent >= 100 ? 1 : 0;
        const bDone = b.percent >= 100 ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      });
    const activeOnboardingCount = onboardingItems.filter(i => i.percent < 100 || i.total === 0).length;
    const overdueOnboardingCount = onboardingItems.filter(
      i => (i.percent < 100 || i.total === 0) && i.probationEndDate && new Date(i.probationEndDate) < todayStart
    ).length;

    // 5. Real Urgent Alerts
    const urgentAlerts: Array<{
      title: string;
      subtitle: string;
      badgeText: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      ageDays: number;
      route: string;
    }> = [...contractSummary.expiringAlerts];

    for (const emp of activeEmps.filter(e => e.status === 'PROBATION')) {
      const daysLeft = emp.probationEndDate ? daysBetween(now, new Date(emp.probationEndDate)) : null;
      if (daysLeft === null || daysLeft <= 15) {
        urgentAlerts.push({
          title: daysLeft !== null && daysLeft < 0 ? 'Thử việc đã quá hạn đánh giá' : 'Đánh giá thử việc sắp đến hạn',
          subtitle: `${emp.fullName} • ${emp.department?.name || 'Chưa gán phòng ban'}`,
          badgeText:
            daysLeft === null
              ? 'Chưa đặt hạn'
              : daysLeft < 0
                ? `Trễ ${Math.abs(daysLeft)} ngày`
                : `Còn ${daysLeft} ngày`,
          severity: daysLeft !== null && daysLeft < 0 ? 'CRITICAL' : 'WARNING',
          ageDays: daysLeft !== null && daysLeft < 0 ? Math.abs(daysLeft) : 1,
          route: `/internal/contracts/${emp.id}?action=sign`
        });
      }
    }

    for (const emp of activeEmps.filter(e => e.status === 'INTERNSHIP')) {
      if (!emp.joinDate) continue;
      const expectedInternEnd = new Date(emp.joinDate);
      expectedInternEnd.setMonth(expectedInternEnd.getMonth() + internDurationMonths);
      const daysLeft = daysBetween(now, expectedInternEnd);
      if (daysLeft <= 15) {
        urgentAlerts.push({
          title: daysLeft < 0 ? `Thực tập quá ${internDurationMonths} tháng (Xét lên Thử việc)` : `Sắp hết ${internDurationMonths} tháng Thực tập`,
          subtitle: `${emp.fullName} • ${emp.department?.name || 'Chưa gán phòng ban'}`,
          badgeText: daysLeft < 0 ? `Quá ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`,
          severity: daysLeft < 0 ? 'CRITICAL' : 'WARNING',
          ageDays: daysLeft < 0 ? Math.abs(daysLeft) : 1,
          route: `/internal/contracts/${emp.id}?action=sign`
        });
      }
    }

    for (const asg of activeResigningAssets) {
      urgentAlerts.push({
        title: `Chưa thu hồi tài sản nghỉ việc (${asg.asset?.name || 'Thiết bị'})`,
        subtitle: `${asg.employee?.fullName || 'Nhân sự'} • ${asg.employee?.department?.name || 'Công ty'}`,
        badgeText: 'Cần thu hồi',
        severity: 'CRITICAL',
        ageDays: asg.employee?.resignationDate ? Math.max(1, daysBetween(new Date(asg.employee.resignationDate), now)) : 1,
        route: '/internal/offboarding/checklist'
      });
    }

    const offboardingEmpMap = new Map<string, { fullName: string; dept: string; count: number; resignDate: Date | null }>();
    for (const ot of offboardingTasks) {
      const cur = offboardingEmpMap.get(ot.employeeId) || {
        fullName: ot.employee.fullName,
        dept: ot.employee.department?.name || 'Chưa rõ phòng ban',
        count: 0,
        resignDate: ot.employee.resignationDate
      };
      cur.count += 1;
      offboardingEmpMap.set(ot.employeeId, cur);
    }
    for (const ob of offboardingEmpMap.values()) {
      const overdueDays = ob.resignDate ? Math.max(0, daysBetween(new Date(ob.resignDate), now)) : 0;
      urgentAlerts.push({
        title: `Bàn giao thôi việc chưa hoàn tất (${ob.count} mục)`,
        subtitle: `${ob.fullName} • ${ob.dept}`,
        badgeText: overdueDays > 0 ? `Quá ${overdueDays} ngày` : 'Đang bàn giao',
        severity: overdueDays > 0 ? 'CRITICAL' : 'WARNING',
        ageDays: overdueDays || 1,
        route: '/internal/offboarding/checklist'
      });
    }

    const incompleteMissingCount = Math.max(dataQuality.missingBank, dataQuality.missingCccd, dataQuality.missingTaxOrBhxh);
    if (incompleteMissingCount > 0) {
      urgentAlerts.push({
        title: 'Bổ sung thông tin định danh / STK / BHXH',
        subtitle: `${dataQuality.total - dataQuality.completeProfiles} nhân sự chưa hoàn thiện hồ sơ`,
        badgeText: `${dataQuality.missingBank} thiếu STK`,
        severity: 'INFO',
        ageDays: 1,
        route: '/internal/employees'
      });
    }

    const severityRank = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    urgentAlerts.sort((a, b) => {
      if (severityRank[a.severity] !== severityRank[b.severity]) {
        return severityRank[a.severity] - severityRank[b.severity];
      }
      return b.ageDays - a.ageDays;
    });

    const avgAlertAgeDays =
      urgentAlerts.length > 0
        ? Number((urgentAlerts.reduce((sum, a) => sum + a.ageDays, 0) / urgentAlerts.length).toFixed(1))
        : 0;

    // 6. Real Pending Approval Queue (round-robin across categories so all pending workflows stay visible)
    type PendingPreviewItem = {
      id: string;
      title: string;
      subtitle: string;
      badgeText: string;
      badgeTone: 'WARNING' | 'CRITICAL' | 'INFO';
      route: string;
    };

    const leaveItems: PendingPreviewItem[] = pendingLeavesList.map(lr => {
      const days = Math.max(1, Math.ceil((new Date(lr.endDate).getTime() - new Date(lr.startDate).getTime()) / MS_PER_DAY) + 1);
      const waitDays = Math.max(0, daysBetween(new Date(lr.createdAt), now));
      return {
        id: `leave-${lr.id}`,
        title: lr.leaveType === 'PAID' ? 'Đơn xin nghỉ phép có lương' : 'Đơn xin nghỉ không lương',
        subtitle: `${lr.employee.fullName} • ${days} ngày • ${formatShortDate(lr.startDate)}`,
        badgeText: waitDays >= 2 ? `Chờ ${waitDays}n` : 'Chờ duyệt',
        badgeTone: waitDays >= 2 ? 'CRITICAL' : 'WARNING',
        route: '/internal/leave/requests'
      };
    });

    const adjItems: PendingPreviewItem[] = pendingAdjustmentsList.map(adj => {
      const waitDays = Math.max(0, daysBetween(new Date(adj.createdAt), now));
      return {
        id: `adj-${adj.id}`,
        title: `Giải trình: ${adj.type}`,
        subtitle: `${adj.employee.fullName} • ${formatShortDate(adj.date)}`,
        badgeText: waitDays >= 2 ? `Chờ ${waitDays}n` : 'Chờ duyệt',
        badgeTone: waitDays >= 2 ? 'CRITICAL' : 'WARNING',
        route: '/internal/attendance/adjustments'
      };
    });

    const otItems: PendingPreviewItem[] = pendingOTList.map(ot => ({
      id: `ot-${ot.id}`,
      title: `Đơn tăng ca ngoài giờ (${Number(ot.requestHours)}h)`,
      subtitle: `${ot.employee.fullName} • ${formatShortDate(ot.date)}`,
      badgeText: 'Chờ xem',
      badgeTone: 'INFO',
      route: '/internal/attendance/ot'
    }));

    const profileItems: PendingPreviewItem[] = pendingProfileReqs.map(pr => ({
      id: `prof-${pr.id}`,
      title: 'Yêu cầu cập nhật hồ sơ cá nhân',
      subtitle: `${pr.employee.fullName} • ${formatShortDate(pr.createdAt)}`,
      badgeText: 'Chờ duyệt',
      badgeTone: 'INFO',
      route: '/internal/employees'
    }));

    const decisionItems: PendingPreviewItem[] = pendingDecisionsList.map(dec => ({
      id: `dec-${dec.id}`,
      title: `QĐ: ${dec.decisionNumber}`,
      subtitle: `${dec.employee.fullName} • Hiệu lực ${formatShortDate(dec.effectiveDate)}`,
      badgeText: 'Chờ duyệt',
      badgeTone: 'WARNING',
      route: '/internal/decisions/all'
    }));

    const buckets = [leaveItems, adjItems, otItems, profileItems, decisionItems];
    const totalPendingQueueCount = buckets.reduce((sum, b) => sum + b.length, 0);
    const pendingPreviewItems: PendingPreviewItem[] = [];
    const maxBucketLen = Math.max(0, ...buckets.map(b => b.length));
    for (let i = 0; i < maxBucketLen && pendingPreviewItems.length < 5; i++) {
      for (const bucket of buckets) {
        if (i < bucket.length && pendingPreviewItems.length < 5) {
          pendingPreviewItems.push(bucket[i]);
        }
      }
    }

    const totalPendingApprovals = pendingLeavesList.length + pendingAdjustmentsList.length + pendingOTList.length;

    // 7. Attendance & Leave breakdown (period-scoped)
    const expLeaveDays = computeExpiringLeaveDays(leaveBalances, String(carryExpirySetting || '03-31'), maxCarryForward, now);
    const totalActivityItems = approvedLeavesInPeriod + approvedOTInPeriod + approvedAdjustmentsInPeriod;

    // 8. Running workflows matrix
    const overdueLeaves = pendingLeavesList.filter(l => new Date(l.startDate) < todayStart).length;
    const overdueOT = pendingOTList.filter(o => new Date(o.date) < todayStart).length;
    const overdueDecisions = pendingDecisionsList.filter(d => new Date(d.effectiveDate) < todayStart).length;
    const twoDaysAgo = new Date(now.getTime() - 2 * MS_PER_DAY);
    const overdueAdjs = pendingAdjustmentsList.filter(a => new Date(a.createdAt) < twoDaysAgo).length;
    const overdueProfReqs = pendingProfileReqs.filter(p => new Date(p.createdAt) < twoDaysAgo).length;

    const processes = [
      {
        label: 'Quyết định nhân sự chờ duyệt',
        openCount: pendingDecisionsList.length,
        lateCount: overdueDecisions,
        route: '/internal/decisions/all'
      },
      {
        label: 'Đơn nghỉ phép & OT chờ duyệt',
        openCount: pendingLeavesList.length + pendingOTList.length,
        lateCount: overdueLeaves + overdueOT,
        route: '/internal/leave/requests'
      },
      {
        label: 'Giải trình công & Đổi hồ sơ',
        openCount: pendingAdjustmentsList.length + pendingProfileReqs.length,
        lateCount: overdueAdjs + overdueProfReqs,
        route: '/internal/attendance/adjustments'
      },
      {
        label: 'Onboarding tân binh',
        openCount: activeOnboardingCount,
        lateCount: overdueOnboardingCount,
        route: '/internal/onboarding/checklist'
      }
    ];

    return res.json({
      period: bounds.period,
      year: bounds.year,
      month: bounds.month,
      periodLabel: bounds.label,
      periodShortLabel: bounds.shortLabel,
      headcount: {
        activeTotal: activeEmps.length,
        officialCount,
        probationCount,
        otherActiveCount,
        resignedTotal,
        totalEmployees: allEmployees.length,
        joinedInPeriod,
        resignedInPeriod,
        turnoverCumulativeRate,
        turnoverPeriodRate,
        retentionRate
      },
      growth12Months: {
        points: series12Months,
        growthPercent
      },
      hierarchyStats,
      movement6Months: {
        points: series6Months,
        retentionRate
      },
      payrollCutoff: {
        cutoffDay,
        daysRemaining: computePayrollCutoffDays(cutoffDay, now),
        pendingApprovals: totalPendingApprovals
      },
      alerts: {
        criticalCount: urgentAlerts.filter(a => a.severity === 'CRITICAL').length,
        totalCount: urgentAlerts.length,
        avgAgeDays: avgAlertAgeDays,
        items: urgentAlerts.slice(0, 5)
      },
      pendingQueue: {
        totalCount: totalPendingQueueCount,
        actionApprovalsCount: totalPendingApprovals,
        pendingLeaves: pendingLeavesList.length,
        pendingAdjustments: pendingAdjustmentsList.length,
        pendingOT: pendingOTList.length,
        pendingDecisions: pendingDecisionsList.length,
        items: pendingPreviewItems
      },
      attendanceAndLeave: {
        pendingApprovals: totalPendingApprovals,
        expiringLeaveDays: expLeaveDays,
        breakdown: [
          {
            label: 'Nghỉ phép đã duyệt',
            count: approvedLeavesInPeriod,
            percent: totalActivityItems > 0 ? Math.round((approvedLeavesInPeriod / totalActivityItems) * 100) : 0,
            color: '#2563EB'
          },
          {
            label: 'Tăng ca (OT) đã duyệt',
            count: approvedOTInPeriod,
            percent: totalActivityItems > 0 ? Math.round((approvedOTInPeriod / totalActivityItems) * 100) : 0,
            color: '#7C3AED'
          },
          {
            label: 'Giải trình công đã duyệt',
            count: approvedAdjustmentsInPeriod,
            percent: totalActivityItems > 0 ? Math.round((approvedAdjustmentsInPeriod / totalActivityItems) * 100) : 0,
            color: '#06B6D4'
          }
        ],
        lateAttendanceCount: lateAttendancesInPeriod
      },
      recruitment: {
        openJobsCount: publishedJobs.length,
        candidatesInPeriod,
        totalCandidatesAll,
        openJobs: publishedJobs.slice(0, 3).map(j => ({
          id: j.id,
          title: j.title,
          deptName: j.department?.name || 'Toàn công ty',
          amount: j.amount,
          candidateCount: j._count.candidates
        }))
      },
      onboarding: {
        activeCount: activeOnboardingCount,
        items: onboardingItems.slice(0, 3)
      },
      processes,
      contractsSummary: {
        overdueCount: contractSummary.overdueCount,
        le15Count: contractSummary.le15Count,
        d16to45Count: contractSummary.d16to45Count,
        d46to90Count: contractSummary.d46to90Count,
        expiringWithinWarnCount: contractSummary.expiringWithinWarnCount,
        warnDays
      },
      payrollSummary,
      dataQuality
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return res.status(500).json({ error: 'Lỗi khi tải dữ liệu tổng quan hệ thống' });
  }
});

export default router;
