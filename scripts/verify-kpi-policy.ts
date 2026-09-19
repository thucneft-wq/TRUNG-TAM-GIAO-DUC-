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
import {
  countActiveStudentsByLevel,
  enrichSheetStudentRows,
  isSheetTrue,
} from '../src/domain/sheetStudentPolicy.ts';
import { calculateSheetOperationsSummary } from '../src/domain/sheetOperationsPolicy.ts';
import { loadStudentSheetSources } from '../src/domain/studentLoadPolicy.ts';
import { SharedRequestPool } from '../src/services/sharedRequestPool.ts';

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

assert.equal(isSheetTrue(true), true);
assert.equal(isSheetTrue('TRUE'), true);
assert.equal(isSheetTrue(1), true);
assert.equal(isSheetTrue('yes'), true);
assert.equal(isSheetTrue('false'), false);

const sheetStudents = [
  { student_id: 'HS-01', first_name: 'Học', last_name: 'Sinh', status: 'ACTIVE', school_level: 'THCS' },
  { student_id: 'HS-02', first_name: 'Đã', last_name: 'Ẩn', status: 'INACTIVE', school_level: 'THPT' },
  { student_id: 'HS-03', first_name: 'Liên', last_name: 'Kết', status: 'INACTIVE', school_level: 'THCS' },
  { student_id: 'HS-04', first_name: 'Thiếu', last_name: 'Liên hệ', status: 'INACTIVE', school_level: 'THCS' },
];
const sheetParents = [
  {
    parent_id: 'PH-01',
    first_name: 'Kim',
    last_name: 'Ánh',
    phone_number: '0901000001',
    email: 'kim.anh@example.com',
    status: 'ACTIVE',
  },
  {
    parent_id: 'PH-02',
    first_name: 'Phụ huynh',
    last_name: 'Phụ',
    phone_number: '0902000002',
    email: 'secondary@example.com',
    status: 'ACTIVE',
  },
  { parent_id: 'PH-03', first_name: 'Không', last_name: 'Liên hệ', status: 'ACTIVE' },
];
const sheetStudentParents = [
  {
    student_parent_id: 'HSPH-02',
    student_id: 'HS-01',
    parent_id: 'PH-02',
    relationship: 'Cha',
    is_primary: false,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    student_parent_id: 'HSPH-01',
    student_id: 'HS-01',
    parent_id: 'PH-01',
    relationship: 'Mẹ',
    is_primary: 'TRUE',
    status: 'ACTIVE',
    created_at: '2026-02-01T00:00:00.000Z',
  },
  {
    student_parent_id: 'HSPH-03',
    student_id: 'HS-03',
    parent_id: 'PH-01',
    relationship: 'Mẹ',
    is_primary: 1,
    status: 'ACTIVE',
  },
  {
    student_parent_id: 'HSPH-04',
    student_id: 'HS-04',
    parent_id: 'PH-03',
    relationship: 'Người giám hộ',
    is_primary: 'yes',
    status: 'ACTIVE',
  },
];

const enrichedStudents = enrichSheetStudentRows(
  sheetStudents,
  [],
  [],
  sheetParents,
  [...sheetStudentParents].reverse(),
);
const hs01 = enrichedStudents.find((student) => student.student_id === 'HS-01')!;
assert.equal(hs01.parent_id, 'PH-01');
assert.equal(hs01.parent_name, 'Kim Ánh');
assert.equal(hs01.parent_relationship, 'Mẹ');
assert.equal(hs01.parent_is_primary, true);
assert.equal(hs01.parent_phone_number, '0901000001');
assert.equal(hs01.parent_email, 'kim.anh@example.com');
assert.equal(
  enrichedStudents.find((student) => student.student_id === 'HS-03')?.parent_id,
  'PH-01',
  'One parent can be linked to multiple students',
);
assert.equal(
  enrichedStudents.find((student) => student.student_id === 'HS-04')?.parent_email,
  null,
  'A linked parent may omit email and phone without failing enrichment',
);

const nonPrimaryLinks = [
  {
    student_parent_id: 'HSPH-11',
    student_id: 'HS-05',
    parent_id: 'PH-01',
    relationship: 'Mẹ',
    is_primary: false,
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    student_parent_id: 'HSPH-12',
    student_id: 'HS-05',
    parent_id: 'PH-02',
    relationship: 'Cha',
    is_primary: false,
    status: 'ACTIVE',
    created_at: '2026-02-01T00:00:00.000Z',
  },
];
const selectFallbackParent = (links: typeof nonPrimaryLinks) => enrichSheetStudentRows(
  [{ student_id: 'HS-05', first_name: 'Không', last_name: 'Primary', status: 'ACTIVE' }],
  [],
  [],
  sheetParents,
  links,
)[0].parent_id;
assert.equal(selectFallbackParent(nonPrimaryLinks), 'PH-01');
assert.equal(
  selectFallbackParent([...nonPrimaryLinks].reverse()),
  'PH-01',
  'Fallback parent selection must not depend on Sheet row order',
);

assert.deepEqual(
  countActiveStudentsByLevel([
    { status: 'ACTIVE', schoolLevel: 'THCS' },
    { status: 'INACTIVE', schoolLevel: 'THPT' },
    { status: 'ACTIVE', schoolLevel: null },
  ]),
  { total: 1, thcs: 1, thpt: 0 },
  'Active student KPI must equal active THCS plus active THPT and exclude inactive records',
);

const sheetBookings = [
  { booking_id: 'BKG-01', start_time: '2026-09-01T02:00:00Z', status: 'completed' },
  {
    booking_id: 'BKG-02',
    start_time: '2026-09-02T02:00:00Z',
    status: 'scheduled',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    booking_id: 'BKG-02',
    start_time: '2026-09-02T02:00:00Z',
    status: 'pending',
    updated_at: '2026-09-02T00:00:00Z',
  },
  { booking_id: 'BKG-03', start_time: '2026-09-03T02:00:00Z', status: 'CONFIRMED' },
  { booking_id: 'BKG-04', start_time: '2026-09-04 09:00:00', status: 'scheduled' },
  {
    booking_id: 'BKG-05',
    start_time: '2026-08-31T18:00:00Z',
    status: 'cancelled',
  },
  { booking_id: 'BKG-06', start_time: '2026-08-15T02:00:00Z', status: 'completed' },
  { booking_id: 'BKG-07', start_time: '2026-09-05T02:00:00Z', status: 'rescheduled' },
];
const sheetTests = [
  { test_id: 'TST-01', status: 'ACTIVE', updated_at: '2026-09-02T00:00:00Z' },
  { test_id: 'TST-02', status: 'INACTIVE' },
  { test_id: 'TST-01', status: 'inactive', updated_at: '2026-09-01T00:00:00Z' },
];
const sheetTestAttempts = [
  {
    test_attempt_id: 'LANTHI-01',
    submitted_at: '2026-09-06T02:00:00Z',
    assigned_at: '2026-08-01T02:00:00Z',
  },
  { test_attempt_id: 'LANTHI-02', assigned_at: '2026-09-07T02:00:00Z' },
  { test_attempt_id: 'LANTHI-03', created_at: '2026-09-08T02:00:00Z' },
  { test_attempt_id: 'LANTHI-04', created_at: '2026-08-08T02:00:00Z' },
  {
    test_attempt_id: 'LANTHI-05',
    submitted_at: '2026-10-01T02:00:00Z',
    assigned_at: '2026-09-09T02:00:00Z',
  },
];

const sheetOperations = calculateSheetOperationsSummary(
  sheetBookings,
  sheetTests,
  sheetTestAttempts,
  'this-month',
  new Date('2026-09-19T05:00:00Z'),
);
assert.deepEqual(sheetOperations.rawRowCounts, { bookings: 8, tests: 3, testAttempts: 5 });
assert.equal(sheetOperations.totalBookings, 5, 'Unique bookings must be filtered by start_time');
assert.deepEqual(sheetOperations.countedIds.bookings, [
  'BKG-01',
  'BKG-02',
  'BKG-03',
  'BKG-04',
  'BKG-05',
]);
assert.deepEqual(sheetOperations.bookingsBreakdown, {
  completed: 1,
  pending: 1,
  confirmed: 1,
  scheduled: 1,
  cancelled: 1,
});
assert.equal(
  sheetOperations.bookingTimeline.reduce(
    (sum, point) => sum
      + point.completed
      + point.pending
      + point.confirmed
      + point.scheduled
      + point.cancelled,
    0,
  ),
  sheetOperations.totalBookings,
  'Booking chart and KPI must use the same filtered booking set',
);
assert.equal(sheetOperations.bookingGrowthPercent, 400);
assert.equal(sheetOperations.activeTests, 1);
assert.deepEqual(sheetOperations.countedIds.activeTests, ['TST-01']);
assert.equal(sheetOperations.totalTestAttempts, 3);
assert.deepEqual(sheetOperations.countedIds.testAttempts, [
  'LANTHI-01',
  'LANTHI-02',
  'LANTHI-03',
]);

const resilientSources = await loadStudentSheetSources(async (table) => {
  if (table === 'counselors') throw new Error('Counselor timeout');
  if (table === 'students') return sheetStudents;
  if (table === 'parents') return sheetParents;
  if (table === 'student_parents') return sheetStudentParents;
  return [];
});
assert.equal(resilientSources.counselorDataAvailable, false);
assert.match(resilientSources.counselorWarning ?? '', /tư vấn viên/i);
const resilientStudents = enrichSheetStudentRows(
  resilientSources.students,
  resilientSources.counselors,
  resilientSources.assignments,
  resilientSources.parents,
  resilientSources.studentParents,
);
const resilientHs01 = resilientStudents.find((student) => student.student_id === 'HS-01')!;
assert.equal(resilientHs01.parent_id, 'PH-01');
assert.equal(resilientHs01.parent_name, 'Kim Ánh');

await assert.rejects(
  () => loadStudentSheetSources(async (table) => {
    if (table === 'students') throw new Error('Students unavailable');
    return [];
  }),
  /Students unavailable/,
  'A required Sheet table failure must reject the student load',
);

const sharedPool = new SharedRequestPool<string, string[]>();
let mirrorRequestCount = 0;
let resolveSharedRequest!: (value: string[]) => void;
const sharedFactory = () => {
  mirrorRequestCount += 1;
  return new Promise<string[]>((resolve) => {
    resolveSharedRequest = resolve;
  });
};
const dashboardCounselors = sharedPool.run('counselors', sharedFactory);
const studentCounselors = sharedPool.run('counselors', sharedFactory);
await Promise.resolve();
assert.equal(mirrorRequestCount, 1, 'Concurrent consumers must share one mirror request');
resolveSharedRequest(['TVV-01']);
assert.deepEqual(await dashboardCounselors, ['TVV-01']);
assert.deepEqual(await studentCounselors, ['TVV-01']);
assert.equal(sharedPool.has('counselors'), false, 'Finished requests must leave the in-flight pool');

const retryPool = new SharedRequestPool<string, string>();
let abortedRequestCount = 0;
const staleRequest = retryPool.run('counselors', (signal) => new Promise<string>((_resolve, reject) => {
  if (signal.aborted) {
    abortedRequestCount += 1;
    reject(new DOMException('Retry', 'AbortError'));
    return;
  }
  signal.addEventListener('abort', () => {
    abortedRequestCount += 1;
    reject(new DOMException('Retry', 'AbortError'));
  }, { once: true });
}));
retryPool.abort('counselors');
await assert.rejects(staleRequest, (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError');
assert.equal(abortedRequestCount, 1, 'Retry must abort the stale in-flight request');
assert.equal(await retryPool.run('counselors', async () => 'fresh'), 'fresh');

console.log('KPI, resilient Sheet student/parent, shared request, and operations policy verification passed.');
