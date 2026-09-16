import type {
  Counselor,
  CounselorPeriodMetrics,
  DashboardMetrics,
  KPIItem,
  OfficialKpiId,
  TimeRange,
} from './types.ts';
import {
  enforceCounselorKpiPolicy,
  getCounselorEvaluation,
  OFFICIAL_KPI_DEFINITIONS,
} from './domain/kpiPolicy.ts';

interface DemoPeriodSeed {
  assignedStudents: number;
  registeredWorkdays?: number;
  registeredHours?: number;
  maxDailyHours?: number;
  overLimitDays?: number;
  weeksWithoutRest?: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedSessions: number;
  totalSessions: number;
  completedTests: number;
  assignedTests: number;
  satisfactionScore: number;
  feedbackCount: number;
}

interface DemoCounselorSeed {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  avatarColor: string;
  periods: Record<TimeRange, DemoPeriodSeed>;
}

const DEMO_COUNSELOR_SEEDS: DemoCounselorSeed[] = [
  {
    id: 'CO-101',
    name: 'Tư vấn viên mẫu A',
    title: 'Trưởng nhóm tham vấn',
    department: 'Đơn vị Tham vấn A',
    email: 'counselor.a@example.edu',
    avatarColor: 'from-blue-600 to-indigo-600',
    periods: {
      'this-month': { assignedStudents: 20, completedBookings: 92, pendingBookings: 8, cancelledBookings: 5, completedSessions: 88, totalSessions: 100, completedTests: 82, assignedTests: 96, satisfactionScore: 4.6, feedbackCount: 48 },
      'last-month': { assignedStudents: 20, completedBookings: 86, pendingBookings: 7, cancelledBookings: 5, completedSessions: 84, totalSessions: 98, completedTests: 76, assignedTests: 90, satisfactionScore: 4.5, feedbackCount: 44 },
      'all-time': { assignedStudents: 20, completedBookings: 520, pendingBookings: 32, cancelledBookings: 28, completedSessions: 502, totalSessions: 570, completedTests: 390, assignedTests: 455, satisfactionScore: 4.55, feedbackCount: 210 },
    },
  },
  {
    id: 'CO-102',
    name: 'Tư vấn viên mẫu B',
    title: 'Tư vấn viên cao cấp',
    department: 'Đơn vị Tham vấn B',
    email: 'counselor.b@example.edu',
    avatarColor: 'from-teal-600 to-cyan-700',
    periods: {
      'this-month': { assignedStudents: 34, completedBookings: 104, pendingBookings: 10, cancelledBookings: 9, completedSessions: 92, totalSessions: 110, completedTests: 74, assignedTests: 88, satisfactionScore: 4.3, feedbackCount: 52 },
      'last-month': { assignedStudents: 20, completedBookings: 98, pendingBookings: 8, cancelledBookings: 8, completedSessions: 88, totalSessions: 104, completedTests: 70, assignedTests: 84, satisfactionScore: 4.2, feedbackCount: 47 },
      'all-time': { assignedStudents: 34, completedBookings: 585, pendingBookings: 40, cancelledBookings: 42, completedSessions: 560, totalSessions: 650, completedTests: 350, assignedTests: 420, satisfactionScore: 4.25, feedbackCount: 226 },
    },
  },
  {
    id: 'CO-103',
    name: 'Tư vấn viên mẫu C',
    title: 'Tư vấn viên',
    department: 'Đơn vị Tham vấn C',
    email: 'counselor.c@example.edu',
    avatarColor: 'from-emerald-600 to-teal-700',
    periods: {
      'this-month': { assignedStudents: 24, completedBookings: 85, pendingBookings: 6, cancelledBookings: 4, completedSessions: 82, totalSessions: 94, completedTests: 72, assignedTests: 84, satisfactionScore: 4.7, feedbackCount: 41 },
      'last-month': { assignedStudents: 23, completedBookings: 80, pendingBookings: 5, cancelledBookings: 3, completedSessions: 78, totalSessions: 90, completedTests: 68, assignedTests: 80, satisfactionScore: 4.6, feedbackCount: 39 },
      'all-time': { assignedStudents: 24, completedBookings: 480, pendingBookings: 28, cancelledBookings: 22, completedSessions: 465, totalSessions: 520, completedTests: 330, assignedTests: 390, satisfactionScore: 4.65, feedbackCount: 194 },
    },
  },
  {
    id: 'CO-104',
    name: 'Tư vấn viên mẫu D',
    title: 'Tư vấn viên',
    department: 'Đơn vị Tham vấn D',
    email: 'counselor.d@example.edu',
    avatarColor: 'from-sky-600 to-blue-800',
    periods: {
      'this-month': { assignedStudents: 29, completedBookings: 75, pendingBookings: 12, cancelledBookings: 13, completedSessions: 75, totalSessions: 100, completedTests: 65, assignedTests: 85, satisfactionScore: 4.1, feedbackCount: 36 },
      'last-month': { assignedStudents: 28, completedBookings: 82, pendingBookings: 9, cancelledBookings: 9, completedSessions: 82, totalSessions: 100, completedTests: 67, assignedTests: 86, satisfactionScore: 4.2, feedbackCount: 38 },
      'all-time': { assignedStudents: 29, completedBookings: 410, pendingBookings: 55, cancelledBookings: 58, completedSessions: 390, totalSessions: 495, completedTests: 250, assignedTests: 325, satisfactionScore: 4.1, feedbackCount: 175 },
    },
  },
  {
    id: 'CO-105',
    name: 'Tư vấn viên mẫu E',
    title: 'Tư vấn viên cao cấp',
    department: 'Đơn vị Tham vấn E',
    email: 'counselor.e@example.edu',
    avatarColor: 'from-violet-600 to-purple-800',
    periods: {
      'this-month': { assignedStudents: 26, completedBookings: 90, pendingBookings: 6, cancelledBookings: 4, completedSessions: 91, totalSessions: 105, completedTests: 78, assignedTests: 92, satisfactionScore: 4.8, feedbackCount: 45 },
      'last-month': { assignedStudents: 25, completedBookings: 84, pendingBookings: 5, cancelledBookings: 4, completedSessions: 86, totalSessions: 100, completedTests: 73, assignedTests: 86, satisfactionScore: 4.7, feedbackCount: 42 },
      'all-time': { assignedStudents: 26, completedBookings: 500, pendingBookings: 30, cancelledBookings: 24, completedSessions: 490, totalSessions: 560, completedTests: 345, assignedTests: 405, satisfactionScore: 4.75, feedbackCount: 205 },
    },
  },
  {
    id: 'CO-106',
    name: 'Tư vấn viên mẫu F',
    title: 'Tư vấn viên',
    department: 'Đơn vị Tham vấn F',
    email: 'counselor.f@example.edu',
    avatarColor: 'from-blue-700 to-indigo-800',
    periods: {
      'this-month': { assignedStudents: 32, completedBookings: 95, pendingBookings: 10, cancelledBookings: 7, completedSessions: 94, totalSessions: 108, completedTests: 80, assignedTests: 96, satisfactionScore: 4.4, feedbackCount: 46 },
      'last-month': { assignedStudents: 30, completedBookings: 88, pendingBookings: 8, cancelledBookings: 6, completedSessions: 87, totalSessions: 102, completedTests: 74, assignedTests: 88, satisfactionScore: 4.3, feedbackCount: 43 },
      'all-time': { assignedStudents: 32, completedBookings: 530, pendingBookings: 36, cancelledBookings: 30, completedSessions: 510, totalSessions: 600, completedTests: 365, assignedTests: 435, satisfactionScore: 4.35, feedbackCount: 218 },
    },
  },
  {
    id: 'CO-107',
    name: 'Tư vấn viên mẫu G',
    title: 'Tư vấn viên',
    department: 'Đơn vị Tham vấn G',
    email: 'counselor.g@example.edu',
    avatarColor: 'from-teal-700 to-emerald-800',
    periods: {
      'this-month': { assignedStudents: 22, completedBookings: 70, pendingBookings: 10, cancelledBookings: 6, completedSessions: 74, totalSessions: 96, completedTests: 63, assignedTests: 80, satisfactionScore: 4.4, feedbackCount: 34 },
      'last-month': { assignedStudents: 21, completedBookings: 75, pendingBookings: 7, cancelledBookings: 5, completedSessions: 82, totalSessions: 98, completedTests: 70, assignedTests: 84, satisfactionScore: 4.5, feedbackCount: 36 },
      'all-time': { assignedStudents: 22, completedBookings: 360, pendingBookings: 42, cancelledBookings: 32, completedSessions: 380, totalSessions: 475, completedTests: 245, assignedTests: 310, satisfactionScore: 4.45, feedbackCount: 162 },
    },
  },
  {
    id: 'CO-108',
    name: 'Tư vấn viên mẫu H',
    title: 'Tư vấn viên',
    department: 'Đơn vị Tham vấn H',
    email: 'counselor.h@example.edu',
    avatarColor: 'from-cyan-700 to-blue-900',
    periods: {
      'this-month': { assignedStudents: 27, completedBookings: 78, pendingBookings: 8, cancelledBookings: 11, completedSessions: 80, totalSessions: 96, completedTests: 70, assignedTests: 86, satisfactionScore: 4.2, feedbackCount: 37 },
      'last-month': { assignedStudents: 26, completedBookings: 80, pendingBookings: 7, cancelledBookings: 8, completedSessions: 82, totalSessions: 98, completedTests: 71, assignedTests: 86, satisfactionScore: 4.3, feedbackCount: 39 },
      'all-time': { assignedStudents: 27, completedBookings: 420, pendingBookings: 35, cancelledBookings: 54, completedSessions: 430, totalSessions: 520, completedTests: 290, assignedTests: 355, satisfactionScore: 4.25, feedbackCount: 181 },
    },
  },
];

const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;

const calculateRate = (numerator: number, denominator: number): number =>
  denominator > 0 ? roundToOneDecimal((numerator / denominator) * 100) : Number.NaN;

const getDefinition = (id: OfficialKpiId) =>
  OFFICIAL_KPI_DEFINITIONS.find((definition) => definition.id === id)!;

const createKpi = (
  id: OfficialKpiId,
  actualNumeric: number,
  actualValue: string,
  notes: string,
  evidence: KPIItem['evidence'],
): KPIItem => {
  const definition = getDefinition(id);
  return {
    id,
    name: definition.name,
    category: definition.category,
    actualValue,
    actualNumeric,
    targetValue: definition.targetValue,
    targetNumeric: definition.targetNumeric,
    unit: definition.unit,
    comparisonType: definition.comparisonType,
    weight: definition.weight,
    score: 0,
    hardGuardrail: definition.hardGuardrail,
    isPassed: false,
    notes,
    evidence,
  };
};

const createOfficialKpis = (period: DemoPeriodSeed): KPIItem[] => {
  const sessionCompletionRate = calculateRate(period.completedSessions, period.totalSessions);
  const testCompletionRate = calculateRate(period.completedTests, period.assignedTests);
  const registeredHours = period.registeredHours ?? period.totalSessions;
  const studentServiceHours = period.completedSessions;
  const studentServiceRate = calculateRate(studentServiceHours, registeredHours);
  const outcomeExperienceScore = roundToOneDecimal(period.satisfactionScore * 20);

  return [
    createKpi(
      'weighted-caseload-capacity',
      period.assignedStudents,
      `${period.assignedStudents} điểm ca / FTE`,
      'Dữ liệu demo mặc định mỗi ca là 1 điểm và mỗi tư vấn viên là 1,0 FTE.',
      {
        sampleSize: period.assignedStudents,
        weightedCaseloadPoints: period.assignedStudents,
        fteRatio: 1,
      },
    ),
    createKpi(
      'student-service-time',
      studentServiceRate,
      `${studentServiceRate.toFixed(1)}%`,
      `${studentServiceHours} giờ phục vụ học sinh trên ${registeredHours} giờ dịch vụ đăng ký.`,
      {
        numerator: studentServiceHours,
        denominator: registeredHours,
        studentServiceHours,
        registeredHours,
      },
    ),
    createKpi(
      'eligible-session-completion',
      sessionCompletionRate,
      `${sessionCompletionRate.toFixed(1)}%`,
      `${period.completedSessions}/${period.totalSessions} phiên đến hạn đủ điều kiện đã hoàn thành.`,
      { numerator: period.completedSessions, denominator: period.totalSessions },
    ),
    createKpi(
      'assessment-follow-through',
      testCompletionRate,
      `${testCompletionRate.toFixed(1)}%`,
      `${period.completedTests}/${period.assignedTests} đánh giá đủ điều kiện đã hoàn thành.`,
      { numerator: period.completedTests, denominator: period.assignedTests },
    ),
    createKpi(
      'student-outcome-experience',
      outcomeExperienceScore,
      `${outcomeExperienceScore.toFixed(1)}%`,
      `Điểm quy đổi từ ${period.feedbackCount} phản hồi ẩn danh.`,
      {
        sampleSize: period.feedbackCount,
        minimumSampleSize: 5,
        averageRating: period.satisfactionScore,
      },
    ),
  ];
};

const createPeriodMetrics = (period: DemoPeriodSeed): CounselorPeriodMetrics => ({
  assignedStudents: period.assignedStudents,
  completedBookings: period.completedBookings,
  pendingBookings: period.pendingBookings,
  cancelledBookings: period.cancelledBookings,
  completedTests: period.completedTests,
  pendingTests: Math.max(0, period.assignedTests - period.completedTests),
  completedSessions: period.completedSessions,
  totalSessions: period.totalSessions,
  assignedTests: period.assignedTests,
  satisfactionScore: period.satisfactionScore,
  feedbackCount: period.feedbackCount,
  passedKpiCount: 0,
  overallScore: 0,
  overallStatus: 'Insufficient Data',
  hrCompliance: {
    status: (period.overLimitDays ?? 0) === 0 && (period.weeksWithoutRest ?? 0) === 0
      ? 'Compliant'
      : 'Needs Review',
    registeredWorkdays: period.registeredWorkdays ?? Math.ceil(period.totalSessions / 8),
    registeredHours: period.registeredHours ?? period.totalSessions,
    maxDailyHours: period.maxDailyHours ?? 8,
    overLimitDays: period.overLimitDays ?? 0,
    weeksWithoutRest: period.weeksWithoutRest ?? 0,
    note: 'Mỗi ca tư vấn tối đa 1 giờ. Các ca vượt giới hạn sẽ được ghi nhận riêng.',
  },
  kpis: createOfficialKpis(period),
});

export const INITIAL_COUNSELORS: Counselor[] = DEMO_COUNSELOR_SEEDS.map((seed) => {
  const timeRangeMetrics: Counselor['timeRangeMetrics'] = {
    'this-month': createPeriodMetrics(seed.periods['this-month']),
    'last-month': createPeriodMetrics(seed.periods['last-month']),
    'all-time': createPeriodMetrics(seed.periods['all-time']),
  };
  const current = timeRangeMetrics['this-month'];

  return enforceCounselorKpiPolicy({
    id: seed.id,
    name: seed.name,
    firstName: seed.name.split(' ')[0],
    lastName: seed.name.split(' ').slice(1).join(' '),
    title: seed.title,
    department: seed.department,
    email: seed.email,
    role: seed.title,
    specialization: seed.department,
    status: 'ACTIVE',
    fteRatio: 1,
    avatarColor: seed.avatarColor,
    assignedStudents: current.assignedStudents,
    kpis: current.kpis ?? [],
    passedKpiCount: 0,
    failedKpiCount: 5,
    overallScore: 0,
    overallStatus: 'Insufficient Data',
    hrCompliance: current.hrCompliance,
    relationshipSummary: {
      assignedStudents: current.assignedStudents,
      completedBookings: current.completedBookings,
      pendingBookings: current.pendingBookings,
      cancelledBookings: current.cancelledBookings,
      completedTests: current.completedTests,
      pendingTests: current.pendingTests,
      avgResponseHours: 0,
      satisfactionScore: current.satisfactionScore,
    },
    timeRangeMetrics,
  });
});

const distributeTotal = (total: number, weights: number[]): number[] => {
  let allocated = 0;
  return weights.map((weight, index) => {
    if (index === weights.length - 1) return total - allocated;
    const value = Math.round(total * weight);
    allocated += value;
    return value;
  });
};

const createBookingTrends = (
  timeRange: TimeRange,
  completed: number,
  pending: number,
  cancelled: number,
): DashboardMetrics['monthlyTrends'] => {
  const labels: Record<TimeRange, string[]> = {
    'this-month': ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4 (Hiện tại)'],
    'last-month': ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    'all-time': ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'],
  };
  const weights = [0.22, 0.25, 0.27, 0.26];
  const completedSeries = distributeTotal(completed, weights);
  const pendingSeries = distributeTotal(pending, weights);
  const cancelledSeries = distributeTotal(cancelled, weights);

  return labels[timeRange].map((month, index) => ({
    month,
    completed: completedSeries[index],
    pending: pendingSeries[index],
    cancelled: cancelledSeries[index],
  }));
};

export const getDashboardMetricsByTimeRange = (
  timeRange: TimeRange,
  counselors: Counselor[],
): DashboardMetrics => {
  const activeCounselors = counselors.length;
  let totalStudents = 0;
  let totalCompleted = 0;
  let totalPending = 0;
  let totalCancelled = 0;
  let passedCounselors = 0;

  counselors.forEach((counselor) => {
    const metrics = counselor.timeRangeMetrics[timeRange];
    const evaluation = getCounselorEvaluation(counselor, timeRange);
    totalStudents += metrics.assignedStudents;
    totalCompleted += metrics.completedBookings;
    totalPending += metrics.pendingBookings;
    totalCancelled += metrics.cancelledBookings;
    if (evaluation.overallStatus === 'Pass') passedCounselors += 1;
  });

  const counselorPassHistory = OFFICIAL_KPI_DEFINITIONS.map((definition) => {
    const passed = counselors.filter((counselor) =>
      getCounselorEvaluation(counselor, timeRange).kpis.some(
        (kpi) => kpi.id === definition.id && kpi.isPassed,
      ),
    ).length;

    return {
      label: definition.shortLabel,
      passed,
      notPassed: activeCounselors - passed,
    };
  });

  return {
    totalStudents,
    activeCounselors,
    totalTests: counselors.reduce(
      (sum, counselor) => sum + counselor.timeRangeMetrics[timeRange].assignedTests,
      0,
    ),
    totalTestAttempts: counselors.reduce(
      (sum, counselor) => sum + counselor.timeRangeMetrics[timeRange].completedTests,
      0,
    ),
    totalBookings: totalCompleted + totalPending + totalCancelled,
    passedCounselors,
    notPassedCounselors: activeCounselors - passedCounselors,
    bookingsBreakdown: {
      completed: totalCompleted,
      pending: totalPending,
      cancelled: totalCancelled,
    },
    monthlyTrends: createBookingTrends(
      timeRange,
      totalCompleted,
      totalPending,
      totalCancelled,
    ),
    counselorPassHistory,
    lastUpdated: `Demo ẩn danh cục bộ · ${new Date().toLocaleString('vi-VN')}`,
    syncNode: 'Bộ chuyển đổi demo giao diện',
  };
};
