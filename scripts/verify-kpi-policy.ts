import assert from 'node:assert/strict';
import {
  calculateKpiResult,
  evaluateKpis,
  getCounselorEvaluation,
  getPerformanceTargetAlignmentLabel,
  OFFICIAL_KPI_DEFINITIONS,
  REQUIRED_PASSED_KPIS,
} from '../src/domain/kpiPolicy.ts';
import { INITIAL_COUNSELORS } from '../src/mockData.ts';
import type { KPIItem, OfficialKpiId, TimeRange } from '../src/types.ts';

const definitionById = new Map(
  OFFICIAL_KPI_DEFINITIONS.map((definition) => [definition.id, definition]),
);

const createOfficialKpi = (id: OfficialKpiId, actualNumeric: number): KPIItem => {
  const definition = definitionById.get(id)!;
  const evidence: KPIItem['evidence'] = id === 'weighted-caseload-capacity'
    ? { sampleSize: actualNumeric, weightedCaseloadPoints: actualNumeric, fteRatio: 1 }
    : id === 'student-service-time'
      ? { numerator: 8, denominator: 10, studentServiceHours: 8, registeredHours: 10 }
      : id === 'eligible-session-completion'
        ? { numerator: 4, denominator: 5 }
        : id === 'assessment-follow-through'
          ? { numerator: 3, denominator: 3 }
          : { sampleSize: 5, minimumSampleSize: 5, averageRating: actualNumeric / 20 };
  return {
    ...definition,
    actualValue: String(actualNumeric),
    actualNumeric,
    score: 0,
    isPassed: false,
    notes: 'Anonymous KPI policy fixture',
    evidence,
  };
};

const passingValues: Record<OfficialKpiId, number> = {
  'weighted-caseload-capacity': 20,
  'student-service-time': 80,
  'eligible-session-completion': 80,
  'assessment-follow-through': 80,
  'student-outcome-experience': 80,
};

const fivePassingKpis = OFFICIAL_KPI_DEFINITIONS.map((definition) =>
  createOfficialKpi(definition.id, passingValues[definition.id]),
);

const passingEvaluation = evaluateKpis([...fivePassingKpis].reverse());
assert.equal(passingEvaluation.overallStatus, 'Pass');
assert.equal(passingEvaluation.overallScore, 100);
assert.equal(passingEvaluation.passedKpiCount, 4);
assert.deepEqual(
  passingEvaluation.kpis.map((kpi) => kpi.id),
  OFFICIAL_KPI_DEFINITIONS.map((definition) => definition.id),
  'A valid API set must be normalized to the official KPI order',
);

const minorMiss = fivePassingKpis.map((kpi) =>
  kpi.id === 'student-outcome-experience'
    ? { ...kpi, actualNumeric: 79 }
    : kpi,
);
const fourOfFiveEvaluation = evaluateKpis(minorMiss);
assert.equal(fourOfFiveEvaluation.passedKpiCount, REQUIRED_PASSED_KPIS);
assert.equal(fourOfFiveEvaluation.overallStatus, 'Pass');

const overloaded = fivePassingKpis.map((kpi) =>
  kpi.id === 'weighted-caseload-capacity'
    ? { ...kpi, actualNumeric: 21 }
    : kpi,
);
const overloadedEvaluation = evaluateKpis(overloaded);
assert.equal(overloadedEvaluation.guardrailsPassed, false);
assert.equal(overloadedEvaluation.overallStatus, 'Not Pass');

const insufficientSample = fivePassingKpis.map((kpi) =>
  kpi.id === 'student-outcome-experience'
    ? { ...kpi, actualNumeric: 95, evidence: { sampleSize: 4, minimumSampleSize: 5 } }
    : kpi,
);
assert.equal(
  evaluateKpis(insufficientSample).kpis.find((kpi) => kpi.id === 'student-outcome-experience')?.score,
  0,
);

const missingNumericData = fivePassingKpis.map((kpi) =>
  kpi.id === 'eligible-session-completion' ? { ...kpi, actualNumeric: Number.NaN } : kpi,
);
assert.equal(evaluateKpis(missingNumericData).overallStatus, 'Pass');
assert.equal(evaluateKpis(fivePassingKpis.slice(0, 4)).overallStatus, 'Insufficient Data');

const extraKpi: KPIItem = { ...fivePassingKpis[0], id: 'unexpected-kpi' };
assert.equal(evaluateKpis([...fivePassingKpis, extraKpi]).overallStatus, 'Insufficient Data');

const duplicateKpis = fivePassingKpis.map((kpi, index) =>
  index === 4 ? { ...kpi, id: 'weighted-caseload-capacity' } : kpi,
);
assert.equal(evaluateKpis(duplicateKpis).overallStatus, 'Insufficient Data');

const tamperedCaseload = {
  ...createOfficialKpi('weighted-caseload-capacity', 31),
  targetNumeric: 999,
  comparisonType: 'gte' as const,
  isPassed: true,
};
const tamperedEvaluation = evaluateKpis([
  tamperedCaseload,
  ...fivePassingKpis.filter((kpi) => kpi.id !== 'weighted-caseload-capacity'),
]);
assert.equal(tamperedEvaluation.overallStatus, 'Not Pass');
assert.equal(tamperedEvaluation.kpis[0].targetNumeric, 20);
assert.equal(tamperedEvaluation.kpis[0].comparisonType, 'lte');

assert.equal(calculateKpiResult(createOfficialKpi('weighted-caseload-capacity', 0)), false);
assert.equal(calculateKpiResult(createOfficialKpi('weighted-caseload-capacity', 1)), true);
assert.equal(calculateKpiResult(createOfficialKpi('weighted-caseload-capacity', 20)), true);
assert.equal(calculateKpiResult(createOfficialKpi('weighted-caseload-capacity', 21)), false);
assert.equal(
  getPerformanceTargetAlignmentLabel({
    ...createOfficialKpi('weighted-caseload-capacity', 0),
    isPassed: false,
  }),
  'Chưa đủ dữ liệu',
);
assert.equal(
  getPerformanceTargetAlignmentLabel({
    ...createOfficialKpi('weighted-caseload-capacity', 8),
    isPassed: true,
  }),
  'Trong giới hạn an toàn',
);
assert.equal(
  calculateKpiResult({
    ...createOfficialKpi('student-outcome-experience', 90),
    evidence: { sampleSize: 4, minimumSampleSize: 5 },
  }),
  false,
);
assert.equal(getPerformanceTargetAlignmentLabel({ ...overloaded[0], isPassed: false }), 'Đang quá tải');

const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;
const assertClose = (actual: number, expected: number, message: string) =>
  assert.ok(Math.abs(actual - expected) < 0.001, `${message}: expected ${expected}, received ${actual}`);

const timeRanges: TimeRange[] = ['this-month', 'last-month', 'all-time'];
for (const counselor of INITIAL_COUNSELORS) {
  for (const timeRange of timeRanges) {
    const metrics = counselor.timeRangeMetrics[timeRange];
    const evaluation = getCounselorEvaluation(counselor, timeRange);
    assert.equal(evaluation.kpis.length, 5, `${counselor.id} ${timeRange} must have five KPIs`);
    assert.deepEqual(
      evaluation.kpis.map((kpi) => kpi.id),
      OFFICIAL_KPI_DEFINITIONS.map((definition) => definition.id),
    );

    const actualById = new Map(evaluation.kpis.map((kpi) => [kpi.id, kpi.actualNumeric]));
    assert.equal(actualById.get('weighted-caseload-capacity'), metrics.assignedStudents);
    assertClose(
      actualById.get('student-service-time')!,
      roundToOneDecimal((metrics.completedSessions / metrics.totalSessions) * 100),
      `${counselor.id} ${timeRange} student-service formula`,
    );
    assertClose(
      actualById.get('eligible-session-completion')!,
      roundToOneDecimal((metrics.completedSessions / metrics.totalSessions) * 100),
      `${counselor.id} ${timeRange} eligible-session formula`,
    );
    assertClose(
      actualById.get('assessment-follow-through')!,
      roundToOneDecimal((metrics.completedTests / metrics.assignedTests) * 100),
      `${counselor.id} ${timeRange} assessment formula`,
    );
    assertClose(
      actualById.get('student-outcome-experience')!,
      roundToOneDecimal(metrics.satisfactionScore * 20),
      `${counselor.id} ${timeRange} outcome-experience formula`,
    );
  }
}

assert.equal(getCounselorEvaluation(INITIAL_COUNSELORS[0], 'this-month').overallStatus, 'Pass');
assert.equal(getCounselorEvaluation(INITIAL_COUNSELORS[1], 'this-month').overallStatus, 'Not Pass');
assert.equal(getCounselorEvaluation(INITIAL_COUNSELORS[1], 'last-month').overallStatus, 'Pass');

console.log('Four performance KPIs plus caseload safety policy verification passed.');
