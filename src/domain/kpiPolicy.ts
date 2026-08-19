import type { Counselor, KPIItem, OfficialKpiId, TimeRange } from '../types.ts';

export const REQUIRED_KPI_COUNT = 5;

export interface OfficialKpiDefinition {
  id: OfficialKpiId;
  name: string;
  shortLabel: string;
  category: string;
  targetNumeric: number;
  targetValue: string;
  unit: string;
  comparisonType: KPIItem['comparisonType'];
}

export const OFFICIAL_KPI_DEFINITIONS: readonly OfficialKpiDefinition[] = [
  {
    id: 'caseload-compliance',
    name: 'Tuân thủ tải ca',
    shortLabel: 'Tải ca',
    category: 'Khối lượng công việc',
    targetNumeric: 30,
    targetValue: '≤ 30 học sinh',
    unit: 'học sinh',
    comparisonType: 'lte',
  },
  {
    id: 'session-completion-rate',
    name: 'Tỷ lệ hoàn thành phiên tham vấn',
    shortLabel: 'Phiên tham vấn',
    category: 'Cung cấp dịch vụ',
    targetNumeric: 80,
    targetValue: '≥ 80%',
    unit: '%',
    comparisonType: 'gte',
  },
  {
    id: 'booking-cancellation-rate',
    name: 'Tỷ lệ hủy lịch hẹn',
    shortLabel: 'Hủy lịch',
    category: 'Chất lượng đặt lịch',
    targetNumeric: 10,
    targetValue: '≤ 10%',
    unit: '%',
    comparisonType: 'lte',
  },
  {
    id: 'test-completion-rate',
    name: 'Tỷ lệ hoàn thành bài đánh giá',
    shortLabel: 'Bài đánh giá',
    category: 'Theo dõi đánh giá',
    targetNumeric: 80,
    targetValue: '≥ 80%',
    unit: '%',
    comparisonType: 'gte',
  },
  {
    id: 'student-satisfaction',
    name: 'Mức độ hài lòng của học sinh',
    shortLabel: 'Hài lòng',
    category: 'Trải nghiệm học sinh',
    targetNumeric: 4,
    targetValue: '≥ 4,0 / 5,0',
    unit: '/ 5,0',
    comparisonType: 'gte',
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
  hasExactlyFiveKpis: boolean;
  missingKpiIds: OfficialKpiId[];
  unexpectedKpiIds: string[];
  overallStatus: 'Pass' | 'Not Pass';
}

export const calculateKpiResult = (kpi: KPIItem): boolean => {
  if (!Number.isFinite(kpi.actualNumeric) || !Number.isFinite(kpi.targetNumeric)) {
    return false;
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

export const getPerformanceTargetAlignmentLabel = (kpi: KPIItem): string => {
  if (kpi.isPassed) {
    return 'Đạt mục tiêu';
  }

  switch (kpi.comparisonType) {
    case 'gte':
      return 'Dưới ngưỡng chuẩn';
    case 'lte':
      return 'Vượt giới hạn';
    case 'exact':
      return 'Không khớp mục tiêu';
  }
};

export const getKpiActualValueLabel = (kpi: KPIItem): string => {
  if (!Number.isFinite(kpi.actualNumeric)) return 'Chưa có dữ liệu';

  const value = kpi.actualNumeric.toLocaleString('vi-VN', {
    maximumFractionDigits: 2,
  });

  switch (kpi.id) {
    case 'caseload-compliance':
      return `${value} học sinh`;
    case 'session-completion-rate':
    case 'booking-cancellation-rate':
    case 'test-completion-rate':
      return `${value}%`;
    case 'student-satisfaction':
      return `${value} / 5,0`;
    default:
      return kpi.actualValue;
  }
};

export const getKpiAuditNote = (kpi: KPIItem): string => {
  const { numerator, denominator, sampleSize } = kpi.evidence ?? {};

  switch (kpi.id) {
    case 'caseload-compliance':
      return `Dữ liệu tổng hợp ẩn danh từ ${sampleSize ?? kpi.actualNumeric} học sinh đang được phân công trong kỳ đã chọn.`;
    case 'session-completion-rate':
      return numerator !== undefined && denominator !== undefined
        ? `${numerator} trên tổng số ${denominator} phiên tham vấn đã hoàn thành.`
        : 'Tỷ lệ phiên tham vấn hoàn thành trong kỳ đã chọn.';
    case 'booking-cancellation-rate':
      return numerator !== undefined && denominator !== undefined
        ? `${numerator} trên tổng số ${denominator} lịch hẹn đã bị hủy.`
        : 'Tỷ lệ lịch hẹn bị hủy trong kỳ đã chọn.';
    case 'test-completion-rate':
      return numerator !== undefined && denominator !== undefined
        ? `${numerator} trên tổng số ${denominator} bài đánh giá được phân công đã hoàn thành.`
        : 'Tỷ lệ bài đánh giá hoàn thành trong kỳ đã chọn.';
    case 'student-satisfaction':
      return sampleSize !== undefined
        ? `Điểm trung bình ẩn danh từ ${sampleSize} lượt phản hồi.`
        : 'Điểm hài lòng trung bình ẩn danh của học sinh trong kỳ đã chọn.';
    default:
      return kpi.notes || 'Chưa có ghi chú kiểm định.';
  }
};

export const evaluateKpis = (kpis: KPIItem[]): KpiEvaluation => {
  const normalizedKpis = kpis.map((kpi) => {
    const officialDefinition = officialDefinitionById.get(kpi.id);
    const canonicalKpi: KPIItem = officialDefinition
      ? {
          ...kpi,
          name: officialDefinition.name,
          category: officialDefinition.category,
          targetNumeric: officialDefinition.targetNumeric,
          targetValue: officialDefinition.targetValue,
          unit: officialDefinition.unit,
          comparisonType: officialDefinition.comparisonType,
        }
      : kpi;

    return {
      ...canonicalKpi,
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
  const hasExactlyFiveKpis =
    normalizedKpis.length === REQUIRED_KPI_COUNT &&
    hasUniqueIds &&
    missingKpiIds.length === 0 &&
    unexpectedKpiIds.length === 0;
  const orderedKpis = hasExactlyFiveKpis
    ? OFFICIAL_KPI_DEFINITIONS.map(
        (definition) => normalizedKpis.find((kpi) => kpi.id === definition.id)!,
      )
    : normalizedKpis;
  const passedKpiCount = orderedKpis.filter((kpi) => kpi.isPassed).length;
  const failedKpiCount = hasExactlyFiveKpis
    ? REQUIRED_KPI_COUNT - passedKpiCount
    : Math.max(1, REQUIRED_KPI_COUNT - Math.min(passedKpiCount, REQUIRED_KPI_COUNT));

  return {
    kpis: orderedKpis,
    passedKpiCount,
    failedKpiCount,
    hasExactlyFiveKpis,
    missingKpiIds,
    unexpectedKpiIds,
    overallStatus:
      hasExactlyFiveKpis && passedKpiCount === REQUIRED_KPI_COUNT ? 'Pass' : 'Not Pass',
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
    overallStatus: latestEvaluation.overallStatus,
    timeRangeMetrics,
  };
};
