import assert from 'node:assert/strict';
import {
  calculateKpiResult,
  evaluateKpis,
  getCounselorEvaluation,
  getPerformanceTargetAlignmentLabel,
  OFFICIAL_KPI_DEFINITIONS,
} from '../src/domain/kpiPolicy.ts';
import { INITIAL_COUNSELORS } from '../src/mockData.ts';
import type { KPIItem, OfficialKpiId, TimeRange } from '../src/types.ts';

const definitionById = new Map(
  OFFICIAL_KPI_DEFINITIONS.map((definition) => [definition.id, definition]),
);

const createOfficialKpi = (id: OfficialKpiId, actualNumeric: number): KPIItem => {
  const definition = definitionById.get(id)!;
  return {
    id,
    name: definition.name,
    category: definition.category,
    actualValue: String(actualNumeric),
    actualNumeric,
    targetValue: definition.targetValue,
    targetNumeric: definition.targetNumeric,
    unit: definition.unit,
    comparisonType: definition.comparisonType,
    isPassed: true,
    notes: 'Anonymous KPI policy fixture',
  };
};

const passingValues: Record<OfficialKpiId, number> = {
  'caseload-compliance': 30,
  'session-completion-rate': 80,
  'booking-cancellation-rate': 10,
  'test-completion-rate': 80,
  'student-satisfaction': 4,
};

const failingValues: Record<OfficialKpiId, number> = {
  'caseload-compliance': 31,
  'session-completion-rate': 79.9,
  'booking-cancellation-rate': 10.1,
  'test-completion-rate': 79.9,
  'student-satisfaction': 3.9,
};

const fivePassingKpis = OFFICIAL_KPI_DEFINITIONS.map((definition) =>
  createOfficialKpi(definition.id, passingValues[definition.id]),
);

const passingEvaluation = evaluateKpis([...fivePassingKpis].reverse());
assert.equal(passingEvaluation.overallStatus, 'Pass');
assert.deepEqual(
  passingEvaluation.kpis.map((kpi) => kpi.id),
  OFFICIAL_KPI_DEFINITIONS.map((definition) => definition.id),
  'A valid API set must be normalized to the official KPI order',
);

for (const definition of OFFICIAL_KPI_DEFINITIONS) {
  const oneFailure = fivePassingKpis.map((kpi) =>
    kpi.id === definition.id
      ? { ...kpi, actualNumeric: failingValues[definition.id], isPassed: true }
      : kpi,
  );
  const evaluation = evaluateKpis(oneFailure);
  assert.equal(evaluation.overallStatus, 'Not Pass', `${definition.id} failure must fail overall`);
  assert.equal(
    evaluation.kpis.find((kpi) => kpi.id === definition.id)?.isPassed,
    false,
    `${definition.id} must ignore API isPassed=true`,
  );
}

const missingNumericData = fivePassingKpis.map((kpi) =>
  kpi.id === 'student-satisfaction' ? { ...kpi, actualNumeric: Number.NaN } : kpi,
);
assert.equal(evaluateKpis(missingNumericData).overallStatus, 'Not Pass');
assert.equal(evaluateKpis(fivePassingKpis.slice(0, 4)).overallStatus, 'Not Pass');

const extraKpi: KPIItem = {
  ...fivePassingKpis[0],
  id: 'unexpected-kpi',
};
assert.equal(evaluateKpis([...fivePassingKpis, extraKpi]).overallStatus, 'Not Pass');

const duplicateKpis = fivePassingKpis.map((kpi, index) =>
  index === 4 ? { ...kpi, id: 'caseload-compliance' } : kpi,
);
assert.equal(evaluateKpis(duplicateKpis).overallStatus, 'Not Pass');

const wrongFiveUnique = fivePassingKpis.map((kpi, index) =>
  index === 4 ? { ...kpi, id: 'unknown-satisfaction' } : kpi,
);
const wrongSetEvaluation = evaluateKpis(wrongFiveUnique);
assert.equal(wrongSetEvaluation.overallStatus, 'Not Pass');
assert.deepEqual(wrongSetEvaluation.missingKpiIds, ['student-satisfaction']);
assert.deepEqual(wrongSetEvaluation.unexpectedKpiIds, ['unknown-satisfaction']);

const tamperedCaseload = {
  ...createOfficialKpi('caseload-compliance', 31),
  targetNumeric: 999,
  comparisonType: 'gte' as const,
  isPassed: true,
};
const tamperedEvaluation = evaluateKpis([
  tamperedCaseload,
  ...fivePassingKpis.filter((kpi) => kpi.id !== 'caseload-compliance'),
]);
assert.equal(tamperedEvaluation.overallStatus, 'Not Pass');
assert.equal(tamperedEvaluation.kpis[0].targetNumeric, 30);
assert.equal(tamperedEvaluation.kpis[0].comparisonType, 'lte');
assert.equal(tamperedEvaluation.kpis[0].isPassed, false);

assert.equal(
  calculateKpiResult({ ...fivePassingKpis[0], actualNumeric: 100, targetNumeric: 100, comparisonType: 'exact' }),
  true,
);

assert.equal(getPerformanceTargetAlignmentLabel(fivePassingKpis[0]), 'Đạt mục tiêu');
assert.equal(
  getPerformanceTargetAlignmentLabel({
    ...createOfficialKpi('session-completion-rate', 79),
    isPassed: false,
  }),
  'Dưới ngưỡng chuẩn',
);
assert.equal(
  getPerformanceTargetAlignmentLabel({
    ...createOfficialKpi('caseload-compliance', 34),
    isPassed: false,
  }),
  'Vượt giới hạn',
);
assert.equal(
  getPerformanceTargetAlignmentLabel({
    ...fivePassingKpis[0],
    comparisonType: 'exact',
    isPassed: false,
  }),
  'Không khớp mục tiêu',
);

const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;
const assertClose = (actual: number, expected: number, message: string) =>
  assert.ok(Math.abs(actual - expected) < 0.001, `${message}: expected ${expected}, received ${actual}`);

const timeRanges: TimeRange[] = ['this-month', 'last-month', 'all-time'];
for (const counselor of INITIAL_COUNSELORS) {
  assert.match(counselor.name, /^Tư vấn viên mẫu /, `${counselor.id} must remain anonymous`);

  for (const timeRange of timeRanges) {
    const metrics = counselor.timeRangeMetrics[timeRange];
    const evaluation = getCounselorEvaluation(counselor, timeRange);
    assert.equal(evaluation.kpis.length, 5, `${counselor.id} ${timeRange} must have five KPIs`);
    assert.deepEqual(
      evaluation.kpis.map((kpi) => kpi.id),
      OFFICIAL_KPI_DEFINITIONS.map((definition) => definition.id),
      `${counselor.id} ${timeRange} must use the official KPI set`,
    );
    assert.equal(
      evaluation.overallStatus,
      evaluation.passedKpiCount === 5 ? 'Pass' : 'Not Pass',
      `${counselor.id} ${timeRange} violates the strict 5/5 rule`,
    );

    const totalBookings =
      metrics.completedBookings + metrics.pendingBookings + metrics.cancelledBookings;
    const actualById = new Map(evaluation.kpis.map((kpi) => [kpi.id, kpi.actualNumeric]));
    assert.equal(actualById.get('caseload-compliance'), metrics.assignedStudents);
    assertClose(
      actualById.get('session-completion-rate')!,
      roundToOneDecimal((metrics.completedSessions / metrics.totalSessions) * 100),
      `${counselor.id} ${timeRange} session formula`,
    );
    assertClose(
      actualById.get('booking-cancellation-rate')!,
      roundToOneDecimal((metrics.cancelledBookings / totalBookings) * 100),
      `${counselor.id} ${timeRange} booking formula`,
    );
    assertClose(
      actualById.get('test-completion-rate')!,
      roundToOneDecimal((metrics.completedTests / metrics.assignedTests) * 100),
      `${counselor.id} ${timeRange} test formula`,
    );
    assert.equal(actualById.get('student-satisfaction'), metrics.satisfactionScore);
  }
}

for (const timeRange of timeRanges) {
  const evaluations = INITIAL_COUNSELORS.map((counselor) =>
    getCounselorEvaluation(counselor, timeRange).overallStatus,
  );
  assert.ok(evaluations.includes('Pass'), `${timeRange} needs a passing demo record`);
  assert.ok(evaluations.includes('Not Pass'), `${timeRange} needs a failing demo record`);
}

assert.equal(getCounselorEvaluation(INITIAL_COUNSELORS[0], 'this-month').overallStatus, 'Pass');
assert.equal(getCounselorEvaluation(INITIAL_COUNSELORS[1], 'this-month').overallStatus, 'Not Pass');
assert.equal(getCounselorEvaluation(INITIAL_COUNSELORS[1], 'last-month').overallStatus, 'Pass');

console.log('Official five-KPI policy verification passed.');
