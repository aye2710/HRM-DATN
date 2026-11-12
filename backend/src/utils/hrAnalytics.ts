export type DashboardPeriod = 'MONTH' | 'YEAR';

export interface HierarchyBucketItem {
  level: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

const HIERARCHY_BUCKET_META: Array<{ level: string; label: string; color: string }> = [
  { level: 'Ban Giám đốc', label: 'Ban Giám đốc', color: '#F59E0B' },
  { level: 'Quản lý', label: 'Quản lý', color: '#7C3AED' },
  { level: 'Trưởng nhóm', label: 'Trưởng nhóm / CG', color: '#06B6D4' },
  { level: 'Nhân viên', label: 'Nhân viên', color: '#2563EB' }
];

/**
 * Phân loại cấp bậc nhân sự thống nhất theo Position.level và chức danh thực tế.
 */
export function classifyHierarchyBucket(level?: string | null, title?: string | null): string {
  const lvl = String(level || '').trim().toLowerCase();
  const ttl = String(title || '').trim().toLowerCase();

  if (lvl === 'director' || lvl === 'executive' || ttl.includes('giám đốc')) {
    return 'Ban Giám đốc';
  }
  if (
    lvl === 'manager' ||
    ttl.includes('trưởng phòng') ||
    ttl.includes('trưởng khối') ||
    ttl.includes('kế toán trưởng')
  ) {
    return 'Quản lý';
  }
  if (lvl === 'lead' || lvl === 'leader' || lvl === 'senior' || ttl.includes('trưởng nhóm')) {
    return 'Trưởng nhóm';
  }
  return 'Nhân viên';
}

/**
 * Tổng hợp cơ cấu cấp bậc và chuẩn hóa tỷ lệ % sao cho tổng luôn bằng 100% khi có nhân sự.
 */
export function buildHierarchyStats(
  employees: Array<{ position?: { level?: string | null; title?: string | null } | null }>
): HierarchyBucketItem[] {
  const counts: Record<string, number> = {
    'Ban Giám đốc': 0,
    'Quản lý': 0,
    'Trưởng nhóm': 0,
    'Nhân viên': 0
  };

  for (const emp of employees) {
    const bucket = classifyHierarchyBucket(emp.position?.level, emp.position?.title);
    counts[bucket] = (counts[bucket] || 0) + 1;
  }

  const total = employees.length;
  if (total === 0) {
    return HIERARCHY_BUCKET_META.map(meta => ({ ...meta, count: 0, percent: 0 }));
  }

  // Largest-remainder rounding so SVG donut segments always total 100%
  const raw = HIERARCHY_BUCKET_META.map(meta => {
    const count = counts[meta.level] || 0;
    const exact = (count / total) * 100;
    const floorVal = Math.floor(exact);
    return { ...meta, count, floorVal, remainder: exact - floorVal };
  });

  let remainderPoints = 100 - raw.reduce((sum, r) => sum + r.floorVal, 0);
  const byRemainder = [...raw].sort((a, b) => b.remainder - a.remainder);
  for (const item of byRemainder) {
    if (remainderPoints <= 0) break;
    if (item.count > 0) {
      item.floorVal += 1;
      remainderPoints -= 1;
    }
  }

  return raw.map(({ floorVal, remainder: _r, ...rest }) => ({
    ...rest,
    percent: floorVal
  }));
}

/**
 * Xác định khoảng thời gian [start, end] theo kỳ MONTH hoặc YEAR (hỗ trợ chọn tháng/năm tùy ý).
 */
export function getPeriodBounds(
  rawPeriod?: unknown,
  rawYear?: unknown,
  rawMonth?: unknown,
  refDate = new Date()
): {
  period: DashboardPeriod;
  year: number;
  month: number;
  start: Date;
  end: Date;
  seriesRefDate: Date;
  label: string;
  shortLabel: string;
} {
  const period: DashboardPeriod = String(rawPeriod || 'MONTH').toUpperCase() === 'YEAR' ? 'YEAR' : 'MONTH';
  const parsedYear = Number(rawYear);
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
    ? parsedYear
    : refDate.getFullYear();

  const parsedMonth = Number(rawMonth);
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth
    : refDate.getMonth() + 1;

  if (period === 'YEAR') {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    const seriesRefDate = year >= refDate.getFullYear() ? refDate : end;
    return {
      period,
      year,
      month,
      start,
      end,
      seriesRefDate,
      label: `Năm ${year}`,
      shortLabel: `${year}`
    };
  }

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const isCurrentOrFuture =
    year > refDate.getFullYear() ||
    (year === refDate.getFullYear() && month >= refDate.getMonth() + 1);

  return {
    period,
    year,
    month,
    start,
    end,
    seriesRefDate: isCurrentOrFuture ? refDate : end,
    label: `Tháng ${month}/${year}`,
    shortLabel: `T${month}/${year}`
  };
}

export interface MonthlyHeadcountPoint {
  key: string;
  monthLabel: string;
  fullLabel: string;
  headcount: number;
  joined: number;
  resigned: number;
}

/**
 * Tái dựng chuỗi quy mô và biến động nhân sự theo từng tháng từ dữ liệu joinDate & resignationDate thực tế.
 */
export function buildMonthlyEmployeeSeries(
  employees: Array<{ joinDate: Date; resignationDate: Date | null; status: string }>,
  refDate = new Date(),
  monthsCount = 12
): {
  series12Months: MonthlyHeadcountPoint[];
  series6Months: MonthlyHeadcountPoint[];
  growthPercent: number;
} {
  const series: MonthlyHeadcountPoint[] = [];
  const realNow = new Date();
  const realCurrentMonthStart = new Date(realNow.getFullYear(), realNow.getMonth(), 1, 0, 0, 0, 0);

  for (let offset = monthsCount - 1; offset >= 0; offset--) {
    const monthStart = new Date(refDate.getFullYear(), refDate.getMonth() - offset, 1, 0, 0, 0, 0);
    const monthEnd = new Date(refDate.getFullYear(), refDate.getMonth() - offset + 1, 0, 23, 59, 59, 999);
    const m = monthStart.getMonth() + 1;
    const y = monthStart.getFullYear();
    const isStrictlyPastMonth = monthStart < realCurrentMonthStart;

    let headcount = 0;
    let joined = 0;
    let resigned = 0;

    for (const emp of employees) {
      const join = emp.joinDate ? new Date(emp.joinDate) : null;
      const resign = emp.resignationDate ? new Date(emp.resignationDate) : null;

      if (join && join >= monthStart && join <= monthEnd) {
        joined++;
      }
      if (emp.status === 'RESIGNED' && resign && resign >= monthStart && resign <= monthEnd) {
        resigned++;
      }

      if (!join || join > monthEnd) continue;
      if (emp.status !== 'RESIGNED') {
        headcount++;
      } else if (isStrictlyPastMonth && resign && resign > monthEnd) {
        headcount++;
      }
    }

    series.push({
      key: `${y}-${String(m).padStart(2, '0')}`,
      monthLabel: String(m).padStart(2, '0'),
      fullLabel: `${String(m).padStart(2, '0')}/${y}`,
      headcount,
      joined,
      resigned
    });
  }

  const firstNonZero = series.find(p => p.headcount > 0);
  const latest = series[series.length - 1];
  const growthPercent =
    firstNonZero && latest && firstNonZero.headcount > 0
      ? Number((((latest.headcount - firstNonZero.headcount) / firstNonZero.headcount) * 100).toFixed(1))
      : 0;

  return {
    series12Months: series,
    series6Months: series.slice(-6),
    growthPercent
  };
}

