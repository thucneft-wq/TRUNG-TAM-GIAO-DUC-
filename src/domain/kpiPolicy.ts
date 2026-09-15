import type { Counselor, KPIItem, OfficialKpiId, TimeRange } from '../types.ts';

export const REQUIRED_KPI_COUNT = 5;
export const PERFORMANCE_KPI_COUNT = 4;
export const REQUIRED_PASSED_KPIS = 3;
export const MINIMUM_FEEDBACK_SAMPLE_SIZE = 5;
export const MINIMUM_ELIGIBLE_SESSIONS = 5;
export const MINIMUM_ASSIGNED_ASSESSMENTS = 3;

export interface OfficialKpiDefinition {
  id: OfficialKpiId;
  name: string;
  shortLabel: string;
  category: string;
  targetNumeric: number;
  targetValue: string;
  unit: string;
  comparisonType: KPIItem['comparisonType'];
  weight: number;
  hardGuardrail?: boolean;
}

export const OFFICIAL_KPI_DEFINITIONS: readonly OfficialKpiDefinition[] = [
  {
    id: 'weighted-caseload-capacity',
    name: 'Số học sinh đang phụ trách',
    shortLabel: 'Số ca phụ trách',
    category: 'Khối lượng công việc',
    targetNumeric: 20,
    targetValue: 'Không phụ trách quá 20 ca tương đương',
    unit: 'ca tương đương',
    comparisonType: 'lte',
    weight: 15,
    hardGuardrail: true,
  },
  {
    id: 'student-service-time',
    name: 'Thời gian dành cho học sinh',
    shortLabel: 'Giờ hỗ trợ học sinh',
    category: 'Thời gian hỗ trợ',
    targetNumeric: 80,
    targetValue: 'Ít nhất 80% giờ hỗ trợ đã đăng ký',
    unit: '%',
    comparisonType: 'gte',
    weight: 20,
  },
  {
    id: 'eligible-session-completion',
    name: 'Lịch tư vấn đã hoàn thành',
    shortLabel: 'Lịch tư vấn',
    category: 'Tiến độ tư vấn',
    targetNumeric: 80,
    targetValue: 'Hoàn thành ít nhất 80% lịch đến hạn',
    unit: '%',
    comparisonType: 'gte',
    weight: 25,
  },
  {
    id: 'assessment-follow-through',
    name: 'Bài đánh giá đã hoàn thành',
    shortLabel: 'Bài đánh giá',
    category: 'Theo dõi đánh giá',
    targetNumeric: 80,
    targetValue: 'Hoàn thành ít nhất 80% bài được giao',
    unit: '%',
    comparisonType: 'gte',
    weight: 20,
  },
  {
    id: 'student-outcome-experience',
    name: 'Mức hài lòng của học sinh',
    shortLabel: 'Học sinh hài lòng',
    category: 'Phản hồi học sinh',
    targetNumeric: 80,
    targetValue: 'Từ 4/5 điểm và có ít nhất 5 phản hồi',
    unit: '%',
    comparisonType: 'gte',
    weight: 20,
  },
];

const officialDefinitionById = new Map<string, OfficialKpiDefinition>(
  OFFICIAL_KPI_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export const isOfficialKpiId = (id: string): id is OfficialKpiId =>
  officialDefinitionById.has(id);

export interface KpiEvaluation {
  kpis: KPIItem[];
  passedKpiCount: number;
  failedKpiCount: number;
  evaluableKpiCount: number;
  insufficientDataKpiCount: number;
  hasExactlyFiveKpis: boolean;
  missingKpiIds: OfficialKpiId[];
  unexpectedKpiIds: string[];
  overallScore: number;
  guardrailsEvaluable: boolean;
  guardrailsPassed: boolean;
  overallStatus: 'Pass' | 'Not Pass' | 'Insufficient Data';
}

export const isKpiEvaluable = (kpi: KPIItem): boolean => {
  if (!Number.isFinite(kpi.actualNumeric) || !Number.isFinite(kpi.targetNumeric)) return false;
  switch (kpi.id) {
    case 'weighted-caseload-capacity':
      return kpi.actualNumeric > 0;
    case 'student-service-time':
      return (kpi.evidence?.registeredHours ?? kpi.evidence?.denominator ?? 0) > 0;
    case 'eligible-session-completion':
      return (kpi.evidence?.denominator ?? 0) >= MINIMUM_ELIGIBLE_SESSIONS;
    case 'assessment-follow-through':
      return (kpi.evidence?.denominator ?? 0) >= MINIMUM_ASSIGNED_ASSESSMENTS;
    case 'student-outcome-experience':
      return (kpi.evidence?.sampleSize ?? 0)
        >= (kpi.evidence?.minimumSampleSize ?? MINIMUM_FEEDBACK_SAMPLE_SIZE);
    default:
      return true;
  }
};

export const calculateKpiResult = (kpi: KPIItem): boolean => {
  if (!isKpiEvaluable(kpi)) return false;

  if (kpi.id === 'student-outcome-experience') {
    return kpi.actualNumeric >= kpi.targetNumeric;
  }

  switch (kpi.comparisonType) {
    case 'gte':
      return kpi.actualNumeric >= kpi.targetNumeric;
    case 'lte':
      return kpi.actualNumeric <= kpi.targetNumeric;
    case 'exact':
      return kpi.actualNumeric === kpi.targetNumeric;
  }
};

export const calculateKpiScore = (kpi: KPIItem): number => {
  if (!Number.isFinite(kpi.actualNumeric) || kpi.actualNumeric < 0) return 0;
  if (!isKpiEvaluable(kpi)) return 0;

  const ratio = kpi.comparisonType === 'gte'
    ? kpi.actualNumeric / kpi.targetNumeric
    : kpi.comparisonType === 'lte'
      ? kpi.actualNumeric <= kpi.targetNumeric
        ? 1
        : kpi.targetNumeric / kpi.actualNumeric
      : kpi.actualNumeric === kpi.targetNumeric ? 1 : 0;

  return Math.round(Math.min(Math.max(ratio, 0), 1) * 10_000) / 100;
};

export const getPerformanceTargetAlignmentLabel = (kpi: KPIItem): string => {
  if (!Number.isFinite(kpi.actualNumeric)) return 'Chưa đủ dữ liệu';
  if (kpi.id === 'weighted-caseload-capacity') {
    if (!isKpiEvaluable(kpi)) return 'Chưa đủ dữ liệu';
    return kpi.isPassed ? 'Trong giới hạn an toàn' : 'Đang quá tải';
  }
  if (!isKpiEvaluable(kpi)) {
    if (kpi.id === 'eligible-session-completion') return 'Chưa đủ lịch';
    if (kpi.id === 'assessment-follow-through') return 'Chưa đủ bài đánh giá';
    if (kpi.id === 'student-service-time') return 'Chưa đủ giờ đăng ký';
  }
  if (
    kpi.id === 'student-outcome-experience'
    && (kpi.evidence?.sampleSize ?? 0) < (kpi.evidence?.minimumSampleSize ?? MINIMUM_FEEDBACK_SAMPLE_SIZE)
  ) {
    return 'Chưa đủ phản hồi';
  }
  if (kpi.isPassed) return 'Đạt';
  return 'Cần cải thiện';
};

export const getKpiActualValueLabel = (kpi: KPIItem): string => {
  if (!Number.isFinite(kpi.actualNumeric)) return 'Chưa có dữ liệu';
  if (kpi.id === 'student-outcome-experience' && kpi.evidence?.averageRating !== undefined) {
    return `${kpi.evidence.averageRating.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} / 5`;
  }
  const value = kpi.actualNumeric.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return kpi.unit === '%' ? `${value}%` : `${value} ${kpi.unit}`;
};

export const getKpiAuditNote = (kpi: KPIItem): string => {
  const evidence = kpi.evidence ?? {};

  switch (kpi.id) {
    case 'weighted-caseload-capacity':
      return `Hiện tương đương ${kpi.actualNumeric} ca thông thường. Đây là điều kiện an toàn, không phải điểm hiệu suất. Không có ca được xếp là chưa đủ dữ liệu; trên 20 ca là quá tải.`;
    case 'student-service-time':
      return `Đã dành ${evidence.studentServiceHours ?? evidence.numerator ?? 0} giờ cho các buổi tư vấn hoàn thành, trên ${evidence.registeredHours ?? evidence.denominator ?? 0} giờ hỗ trợ đã đăng ký. Hiện chưa tính các việc hỗ trợ gián tiếp vì chưa có nhật ký thời gian.`;
    case 'eligible-session-completion':
      return `Đã hoàn thành ${evidence.numerator ?? 0}/${evidence.denominator ?? 0} lịch đến hạn. Không tính lịch chưa đến ngày, học sinh hủy, học sinh vắng hoặc lịch đã đổi.`;
    case 'assessment-follow-through':
      return `Đã hoàn thành ${evidence.numerator ?? 0}/${evidence.denominator ?? 0} bài đánh giá cần thực hiện. Không tính bài học sinh từ chối, rút lui, không còn cần hoặc đã hủy.`;
    case 'student-outcome-experience':
      return `Học sinh chấm trung bình ${evidence.averageRating ?? 0}/5 từ ${evidence.sampleSize ?? 0} phản hồi ẩn danh. Cần ít nhất ${evidence.minimumSampleSize ?? MINIMUM_FEEDBACK_SAMPLE_SIZE} phản hồi để kết quả đủ tin cậy.`;
    default:
      return kpi.notes || 'Chưa có ghi chú kiểm định.';
  }
};

export const evaluateKpis = (kpis: KPIItem[]): KpiEvaluation => {
  const normalizedKpis = kpis.map((kpi) => {
    const definition = officialDefinitionById.get(kpi.id);
    const canonicalKpi: KPIItem = definition
      ? {
          ...kpi,
          name: definition.name,
          category: definition.category,
          targetNumeric: definition.targetNumeric,
          targetValue: definition.targetValue,
          unit: definition.unit,
          comparisonType: definition.comparisonType,
          weight: definition.weight,
          hardGuardrail: definition.hardGuardrail,
        }
      : kpi;

    return {
      ...canonicalKpi,
      score: calculateKpiScore(canonicalKpi),
      isPassed: calculateKpiResult(canonicalKpi),
    };
  });
  const hasUniqueIds = new Set(normalizedKpis.map((kpi) => kpi.id)).size === REQUIRED_KPI_COUNT;
  const missingKpiIds = OFFICIAL_KPI_DEFINITIONS
    .filter((definition) => !normalizedKpis.some((kpi) => kpi.id === definition.id))
    .map((definition) => definition.id);
  const unexpectedKpiIds = normalizedKpis
    .filter((kpi) => !isOfficialKpiId(kpi.id))
    .map((kpi) => kpi.id);
  const hasExactlyFiveKpis = normalizedKpis.length === REQUIRED_KPI_COUNT
    && hasUniqueIds
    && missingKpiIds.length === 0
    && unexpectedKpiIds.length === 0;
  const orderedKpis = hasExactlyFiveKpis
    ? OFFICIAL_KPI_DEFINITIONS.map(
        (definition) => normalizedKpis.find((kpi) => kpi.id === definition.id)!,
      )
    : normalizedKpis;
  const performanceKpis = orderedKpis.filter((kpi) => !kpi.hardGuardrail);
  const guardrailKpis = orderedKpis.filter((kpi) => kpi.hardGuardrail);
  const evaluableKpiCount = performanceKpis.filter(isKpiEvaluable).length;
  const passedKpiCount = performanceKpis
    .filter((kpi) => isKpiEvaluable(kpi) && kpi.isPassed).length;
  const failedKpiCount = performanceKpis
    .filter((kpi) => isKpiEvaluable(kpi) && !kpi.isPassed).length;
  const insufficientDataKpiCount = Math.max(0, PERFORMANCE_KPI_COUNT - evaluableKpiCount);
  const performanceWeight = performanceKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
  const overallScore = performanceWeight > 0
    ? Math.round((performanceKpis.reduce(
        (sum, kpi) => sum + kpi.score * kpi.weight,
        0,
      ) / performanceWeight) * 100) / 100
    : 0;
  const guardrailsEvaluable = guardrailKpis.length > 0
    && guardrailKpis.every(isKpiEvaluable);
  const guardrailsPassed = guardrailsEvaluable
    && guardrailKpis.every((kpi) => kpi.isPassed);

  return {
    kpis: orderedKpis,
    passedKpiCount,
    failedKpiCount,
    evaluableKpiCount,
    insufficientDataKpiCount,
    hasExactlyFiveKpis,
    missingKpiIds,
    unexpectedKpiIds,
    overallScore,
    guardrailsEvaluable,
    guardrailsPassed,
    overallStatus: !hasExactlyFiveKpis || !guardrailsEvaluable
      ? 'Insufficient Data'
      : !guardrailsPassed
        ? 'Not Pass'
        : evaluableKpiCount < REQUIRED_PASSED_KPIS
          ? 'Insufficient Data'
          : passedKpiCount >= REQUIRED_PASSED_KPIS
            ? 'Pass'
            : 'Not Pass',
  };
};

export const getKpisForTimeRange = (
  counselor: Counselor,
  timeRange: TimeRange,
): KPIItem[] => counselor.timeRangeMetrics[timeRange].kpis ?? counselor.kpis;

export const getCounselorEvaluation = (
  counselor: Counselor,
  timeRange: TimeRange,
): KpiEvaluation => evaluateKpis(getKpisForTimeRange(counselor, timeRange));

export const enforceCounselorKpiPolicy = (counselor: Counselor): Counselor => {
  const latestEvaluation = evaluateKpis(counselor.kpis);
  const timeRangeMetrics = (Object.keys(counselor.timeRangeMetrics) as TimeRange[]).reduce(
    (accumulator, timeRange) => {
      const metrics = counselor.timeRangeMetrics[timeRange];
      const periodEvaluation = evaluateKpis(metrics.kpis ?? latestEvaluation.kpis);
      accumulator[timeRange] = {
        ...metrics,
        kpis: metrics.kpis ? periodEvaluation.kpis : undefined,
        passedKpiCount: periodEvaluation.passedKpiCount,
        overallScore: periodEvaluation.overallScore,
        overallStatus: periodEvaluation.overallStatus,
      };
      return accumulator;
    },
    {} as Counselor['timeRangeMetrics'],
  );

  return {
    ...counselor,
    kpis: latestEvaluation.kpis,
    passedKpiCount: latestEvaluation.passedKpiCount,
    failedKpiCount: latestEvaluation.failedKpiCount,
    overallScore: latestEvaluation.overallScore,
    overallStatus: latestEvaluation.overallStatus,
    timeRangeMetrics,
  };
};
