export interface StageCompensationConfig {
  internDurationMonths: number;
  internMonth1Stipend: number;
  internMonth2_3Stipend: number;
  probationSalaryPercent: number;
  defaultFixedAllowance: number;
}

export interface StageCompensationInput {
  contractType: string;
  employeeStatus: string;
  contractBaseSalary: number;
  contractAllowance: number;
  contractInsuranceSalary: number;
  startDate: Date | string | null | undefined;
  payrollYear: number;
  payrollMonth: number;
  targetDate?: Date | string | null;
  config: StageCompensationConfig;
}

export interface StageCompensationResult {
  stageCode: 'INTERN_M1' | 'INTERN_M2_3' | 'INTERN_OVERDUE' | 'PROBATION' | 'OFFICIAL' | 'SPLIT_PERIOD';
  stageLabel: string;
  internMonthIndex: number | null;
  isInternship: boolean;
  isProbation: boolean;
  isOfficialContract: boolean;
  baseSalary: number;
  appliedProbationPct: number;
  appliedMonthSalary: number;
  fixedAllowanceDefault: number;
  contractInsuranceSalary: number;
}

export interface ContractWindowInput {
  id?: string;
  contractType: string;
  baseSalary: number;
  allowance?: number | null;
  insuranceSalary?: number | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  status?: string;
}

export interface AttendanceDayInput {
  date: Date | string;
  workingDay: number;
}

export interface SplitSalarySegment {
  stageCode: string;
  stageLabel: string;
  contractType: string;
  fromDate: string;
  toDate: string;
  baseSalary: number;
  appliedProbationPct: number;
  appliedMonthSalary: number;
  workingDays: number;
  salaryByDays: number;
  fixedAllowanceRate: number;
}

export interface MonthlySplitPayrollResult {
  stageCode: StageCompensationResult['stageCode'];
  stageLabel: string;
  contractType: string;
  internMonthIndex: number | null;
  isSplitPeriod: boolean;
  splitSegments: SplitSalarySegment[];
  isOfficialContract: boolean;
  baseSalary: number;
  appliedProbationPct: number;
  appliedMonthSalary: number;
  totalWorkingDays: number;
  salaryByDays: number;
  fixedAllowanceDefault: number;
  contractInsuranceSalary: number;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (value: Date | string): string => {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const addMonthsMinusOneDay = (start: Date, months: number): string => {
  const end = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
  end.setDate(end.getDate() - 1);
  return toDateKey(end);
};

/**
 * Computes compensation parameters for a given contract and target date (or payroll month):
 * - INTERNSHIP (3 months): first 1 month = 800k prorated + 0 allowance;
 *   from month 2 onward = 1.5M prorated + 500k allowance.
 * - PROBATION (2 months): 85% contract baseSalary + 500k allowance, no BHXH.
 * - OFFICIAL (after probation): 100% contract baseSalary + allowance + BHXH.
 */
export const computeStageCompensation = (input: StageCompensationInput): StageCompensationResult => {
  const {
    contractType,
    employeeStatus,
    contractBaseSalary,
    contractAllowance,
    contractInsuranceSalary,
    startDate,
    payrollYear,
    payrollMonth,
    targetDate,
    config
  } = input;

  const isInternship = contractType === 'INTERNSHIP' || (!contractType && employeeStatus === 'INTERNSHIP');
  const isProbation = !isInternship && (contractType === 'PROBATION' || (!contractType && employeeStatus === 'PROBATION'));

  if (isInternship) {
    const ref = startDate ? new Date(startDate) : new Date(payrollYear, payrollMonth - 1, 1);
    const validRef = isNaN(ref.getTime()) ? new Date(payrollYear, payrollMonth - 1, 1) : ref;
    const duration = Math.max(1, config.internDurationMonths || 3);

    const target = targetDate ? new Date(targetDate) : new Date(payrollYear, payrollMonth - 1, validRef.getDate());
    const targetKey = toDateKey(target);
    const month1EndKey = addMonthsMinusOneDay(validRef, 1);
    const month3EndKey = addMonthsMinusOneDay(validRef, duration);

    let internMonthIndex = 1;
    if (targetKey > month1EndKey) {
      const targetYear = target.getFullYear();
      const targetMonth = target.getMonth() + 1;
      const month2EndKey = addMonthsMinusOneDay(validRef, 2);
      if (targetKey <= month2EndKey) {
        internMonthIndex = 2;
      } else if (targetKey <= month3EndKey) {
        internMonthIndex = 3;
      } else {
        const rawDiff = (targetYear - validRef.getFullYear()) * 12 + (targetMonth - (validRef.getMonth() + 1)) + 1;
        internMonthIndex = Math.max(duration + 1, rawDiff);
      }
    }

    if (internMonthIndex === 1) {
      const stipend = Number(config.internMonth1Stipend || 800000);
      return {
        stageCode: 'INTERN_M1',
        stageLabel: 'Thực tập T1',
        internMonthIndex,
        isInternship: true,
        isProbation: false,
        isOfficialContract: false,
        baseSalary: stipend,
        appliedProbationPct: 100,
        appliedMonthSalary: stipend,
        fixedAllowanceDefault: 0,
        contractInsuranceSalary: 0
      };
    }

    const stipend = Number(config.internMonth2_3Stipend || 1500000);
    const allowance = contractAllowance > 0 ? contractAllowance : Number(config.defaultFixedAllowance || 500000);
    const overdue = internMonthIndex > duration;
    return {
      stageCode: overdue ? 'INTERN_OVERDUE' : 'INTERN_M2_3',
      stageLabel: overdue ? `Thực tập T${internMonthIndex} (Quá ${duration}T)` : `Thực tập T${internMonthIndex}`,
      internMonthIndex,
      isInternship: true,
      isProbation: false,
      isOfficialContract: false,
      baseSalary: stipend,
      appliedProbationPct: 100,
      appliedMonthSalary: stipend,
      fixedAllowanceDefault: allowance,
      contractInsuranceSalary: 0
    };
  }

  if (isProbation) {
    const pct = Number(config.probationSalaryPercent || 85);
    const baseSalary = Number(contractBaseSalary || 0);
    const allowance = contractAllowance > 0 ? contractAllowance : Number(config.defaultFixedAllowance || 500000);
    return {
      stageCode: 'PROBATION',
      stageLabel: `Thử việc ${pct}%`,
      internMonthIndex: null,
      isInternship: false,
      isProbation: true,
      isOfficialContract: false,
      baseSalary,
      appliedProbationPct: pct,
      appliedMonthSalary: Math.round(baseSalary * (pct / 100)),
      fixedAllowanceDefault: allowance,
      contractInsuranceSalary: 0
    };
  }

  const baseSalary = Number(contractBaseSalary || 0);
  const isOfficialContract = contractType === 'OFFICIAL_1Y' || contractType === 'INDEFINITE';
  const allowance = contractAllowance > 0 ? contractAllowance : Number(config.defaultFixedAllowance || 500000);
  return {
    stageCode: 'OFFICIAL',
    stageLabel: 'Chính thức 100%',
    internMonthIndex: null,
    isInternship: false,
    isProbation: false,
    isOfficialContract,
    baseSalary,
    appliedProbationPct: 100,
    appliedMonthSalary: baseSalary,
    fixedAllowanceDefault: allowance,
    contractInsuranceSalary: isOfficialContract ? Number(contractInsuranceSalary || baseSalary) : 0
  };
};

const pickContractForDate = (contracts: ContractWindowInput[], dateKey: string): ContractWindowInput => {
  const matching = contracts.filter(c => {
    const startKey = toDateKey(c.startDate);
    const endKey = c.endDate ? toDateKey(c.endDate) : '9999-12-31';
    return startKey <= dateKey && dateKey <= endKey;
  });

  if (matching.length > 0) {
    matching.sort((a, b) => {
      const startDiff = toDateKey(b.startDate).localeCompare(toDateKey(a.startDate));
      if (startDiff !== 0) return startDiff;
      return (b.status === 'ACTIVE' ? 1 : 0) - (a.status === 'ACTIVE' ? 1 : 0);
    });
    return matching[0];
  }

  const startedBefore = contracts
    .filter(c => toDateKey(c.startDate) <= dateKey)
    .sort((a, b) => toDateKey(b.startDate).localeCompare(toDateKey(a.startDate)));
  if (startedBefore.length > 0) return startedBefore[0];

  return [...contracts].sort((a, b) => toDateKey(a.startDate).localeCompare(toDateKey(b.startDate)))[0];
};

/**
 * Splits a payroll month into exact date-based compensation phases whenever an employee
 * transitions mid-month (e.g., Intern M1 -> Intern M2, Intern -> Probation, Probation -> Official,
 * or mid-month contract salary change).
 */
export const computeMonthlySplitCompensation = (params: {
  contracts: ContractWindowInput[];
  employeeStatus: string;
  fallbackSalary: number;
  joinDate: Date | string | null | undefined;
  attendances: AttendanceDayInput[];
  overrideTotalWorkingDays?: number | null;
  standardDays: number;
  payrollYear: number;
  payrollMonth: number;
  config: StageCompensationConfig;
}): MonthlySplitPayrollResult => {
  const {
    contracts,
    employeeStatus,
    fallbackSalary,
    joinDate,
    attendances,
    overrideTotalWorkingDays,
    standardDays,
    payrollYear,
    payrollMonth,
    config
  } = params;

  const sortedContracts = [...contracts].sort((a, b) =>
    toDateKey(a.startDate).localeCompare(toDateKey(b.startDate))
  );
  const latestContract = sortedContracts[sortedContracts.length - 1];

  // If no attendance records exist or explicit single-number override applies (e.g. legacy LLA fixture), use single stage
  if (attendances.length === 0 || (overrideTotalWorkingDays !== undefined && overrideTotalWorkingDays !== null)) {
    const workingDays =
      overrideTotalWorkingDays !== undefined && overrideTotalWorkingDays !== null
        ? Number(overrideTotalWorkingDays)
        : 0;
    const single = computeStageCompensation({
      contractType: latestContract.contractType,
      employeeStatus,
      contractBaseSalary: Number(latestContract.baseSalary || fallbackSalary || 0),
      contractAllowance: Number(latestContract.allowance || 0),
      contractInsuranceSalary: Number(latestContract.insuranceSalary || 0),
      startDate: latestContract.startDate || joinDate,
      payrollYear,
      payrollMonth,
      config
    });
    const salaryByDays = standardDays > 0 ? Math.round((single.appliedMonthSalary / standardDays) * workingDays) : 0;
    const monthPrefix = `${payrollYear}-${pad2(payrollMonth)}`;
    const lastDay = new Date(payrollYear, payrollMonth, 0).getDate();
    return {
      stageCode: single.stageCode,
      stageLabel: single.stageLabel,
      contractType: latestContract.contractType,
      internMonthIndex: single.internMonthIndex,
      isSplitPeriod: false,
      splitSegments: [
        {
          stageCode: single.stageCode,
          stageLabel: single.stageLabel,
          contractType: latestContract.contractType,
          fromDate: `${monthPrefix}-01`,
          toDate: `${monthPrefix}-${pad2(lastDay)}`,
          baseSalary: single.baseSalary,
          appliedProbationPct: single.appliedProbationPct,
          appliedMonthSalary: single.appliedMonthSalary,
          workingDays,
          salaryByDays,
          fixedAllowanceRate: single.fixedAllowanceDefault
        }
      ],
      isOfficialContract: single.isOfficialContract,
      baseSalary: single.baseSalary,
      appliedProbationPct: single.appliedProbationPct,
      appliedMonthSalary: single.appliedMonthSalary,
      totalWorkingDays: workingDays,
      salaryByDays,
      fixedAllowanceDefault: single.fixedAllowanceDefault,
      contractInsuranceSalary: single.contractInsuranceSalary
    };
  }

  const orderedAtt = [...attendances].sort((a, b) =>
    toDateKey(a.date).localeCompare(toDateKey(b.date))
  );

  type Bucket = {
    key: string;
    contract: ContractWindowInput;
    comp: StageCompensationResult;
    fromDate: string;
    toDate: string;
    workingDays: number;
  };

  const bucketMap = new Map<string, Bucket>();
  const bucketOrder: Bucket[] = [];

  for (const att of orderedAtt) {
    const dayVal = Number(att.workingDay || 0);
    const dateKey = toDateKey(att.date);
    const matchedContract = pickContractForDate(sortedContracts, dateKey);
    const comp = computeStageCompensation({
      contractType: matchedContract.contractType,
      employeeStatus,
      contractBaseSalary: Number(matchedContract.baseSalary || fallbackSalary || 0),
      contractAllowance: Number(matchedContract.allowance || 0),
      contractInsuranceSalary: Number(matchedContract.insuranceSalary || 0),
      startDate: matchedContract.startDate || joinDate,
      payrollYear,
      payrollMonth,
      targetDate: att.date,
      config
    });

    const groupKey = [
      matchedContract.id || matchedContract.contractType,
      comp.stageCode,
      comp.baseSalary,
      comp.appliedMonthSalary,
      comp.fixedAllowanceDefault
    ].join('|');

    let bucket = bucketMap.get(groupKey);
    if (!bucket) {
      bucket = {
        key: groupKey,
        contract: matchedContract,
        comp,
        fromDate: dateKey,
        toDate: dateKey,
        workingDays: 0
      };
      bucketMap.set(groupKey, bucket);
      bucketOrder.push(bucket);
    }
    if (dateKey < bucket.fromDate) bucket.fromDate = dateKey;
    if (dateKey > bucket.toDate) bucket.toDate = dateKey;
    bucket.workingDays += dayVal;
  }

  // Filter zero-day buckets only if at least one non-zero bucket exists
  const activeBuckets = bucketOrder.some(b => b.workingDays > 0)
    ? bucketOrder.filter(b => b.workingDays > 0)
    : bucketOrder;

  const splitSegments: SplitSalarySegment[] = activeBuckets.map(b => ({
    stageCode: b.comp.stageCode,
    stageLabel: b.comp.stageLabel,
    contractType: b.contract.contractType,
    fromDate: b.fromDate,
    toDate: b.toDate,
    baseSalary: b.comp.baseSalary,
    appliedProbationPct: b.comp.appliedProbationPct,
    appliedMonthSalary: b.comp.appliedMonthSalary,
    workingDays: Number(b.workingDays.toFixed(2)),
    salaryByDays: standardDays > 0 ? Math.round((b.comp.appliedMonthSalary / standardDays) * b.workingDays) : 0,
    fixedAllowanceRate: b.comp.fixedAllowanceDefault
  }));

  const isSplitPeriod = splitSegments.length > 1;
  const totalWorkingDays = Number(
    splitSegments.reduce((s, seg) => s + seg.workingDays, 0).toFixed(2)
  );
  const salaryByDays = splitSegments.reduce((s, seg) => s + seg.salaryByDays, 0);

  if (!isSplitPeriod) {
    const only = activeBuckets[0];
    return {
      stageCode: only.comp.stageCode,
      stageLabel: only.comp.stageLabel,
      contractType: only.contract.contractType,
      internMonthIndex: only.comp.internMonthIndex,
      isSplitPeriod: false,
      splitSegments,
      isOfficialContract: only.comp.isOfficialContract,
      baseSalary: only.comp.baseSalary,
      appliedProbationPct: only.comp.appliedProbationPct,
      appliedMonthSalary: only.comp.appliedMonthSalary,
      totalWorkingDays,
      salaryByDays,
      fixedAllowanceDefault: only.comp.fixedAllowanceDefault,
      contractInsuranceSalary: only.comp.contractInsuranceSalary
    };
  }

  // For split months: compute weighted effective fixedAllowance and determine whether BHXH applies
  const uniqueAllowanceRates = new Set(splitSegments.map(s => s.fixedAllowanceRate));
  const fixedAllowanceDefault =
    uniqueAllowanceRates.size === 1
      ? splitSegments[0].fixedAllowanceRate
      : totalWorkingDays > 0
        ? Math.round(
            splitSegments.reduce((s, seg) => s + seg.fixedAllowanceRate * seg.workingDays, 0) /
              totalWorkingDays
          )
        : activeBuckets[activeBuckets.length - 1].comp.fixedAllowanceDefault;

  // Under VN BHXH practice, when transitioning from Probation/Intern to Official mid-month,
  // apply BHXH in that transition month only if official phase started on or before day 15 of the month
  const officialBuckets = activeBuckets.filter(b => b.comp.isOfficialContract);
  let isOfficialContract = false;
  let contractInsuranceSalary = 0;
  if (officialBuckets.length > 0) {
    const lastOfficial = officialBuckets[officialBuckets.length - 1];
    const contractStart = new Date(lastOfficial.contract.startDate);
    const monthStartStr = `${payrollYear}-${pad2(payrollMonth)}-01`;
    const startedBeforeMonth = toDateKey(contractStart) <= monthStartStr;
    const startedOnOrBefore15 = contractStart.getDate() <= 15;
    if (startedBeforeMonth || startedOnOrBefore15) {
      isOfficialContract = true;
      contractInsuranceSalary = lastOfficial.comp.contractInsuranceSalary;
    }
  }

  const latestBucket = activeBuckets[activeBuckets.length - 1];
  const stageLabel = splitSegments.map(s => s.stageLabel).join(' → ');
  const effectiveMonthlySalary =
    totalWorkingDays > 0 && standardDays > 0
      ? Math.round((salaryByDays / totalWorkingDays) * standardDays)
      : latestBucket.comp.appliedMonthSalary;

  return {
    stageCode: 'SPLIT_PERIOD',
    stageLabel,
    contractType: latestBucket.contract.contractType,
    internMonthIndex: latestBucket.comp.internMonthIndex,
    isSplitPeriod: true,
    splitSegments,
    isOfficialContract,
    baseSalary: latestBucket.comp.baseSalary,
    appliedProbationPct: latestBucket.comp.appliedProbationPct,
    appliedMonthSalary: effectiveMonthlySalary,
    totalWorkingDays,
    salaryByDays,
    fixedAllowanceDefault,
    contractInsuranceSalary
  };
};
