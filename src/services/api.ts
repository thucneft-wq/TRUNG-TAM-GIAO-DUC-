import {
  enforceCounselorKpiPolicy,
  OFFICIAL_KPI_DEFINITIONS,
} from '../domain/kpiPolicy';
import {
  enrichSheetStudentRows,
  isInactiveSheetValue,
  isSheetTrue,
  normalizedRecordId,
} from '../domain/sheetStudentPolicy';
import {
  calculateSheetOperationsSummary,
  type SheetOperationsSummary,
} from '../domain/sheetOperationsPolicy';
import { getDashboardMetricsByTimeRange, INITIAL_COUNSELORS } from '../mockData';
import {
  AnalyticsFilterOptions,
  AnalyticsFilters,
  AdminUser,
  AuditLogItem,
  AuthSession,
  Counselor,
  CounselorPeriodMetrics,
  CreateCounselorInput,
  DashboardMetrics,
  FeedbackAnalytics,
  HrComplianceSummary,
  KpiEvidence,
  KPIItem,
  RelationshipSummary,
  StudentTrendAnalytics,
  Student,
  CreateStudentInput,
  UpdateStudentInput,
  TimeRange,
  UpdateCounselorInput,
} from '../types';

type JsonRecord = Record<string, unknown>;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminDataResult {
  counselors: Counselor[];
  dashboard?: DashboardMetrics;
  source: 'api' | 'mock';
  warning?: string;
}

export interface AnalyticsDataResult {
  filterOptions: AnalyticsFilterOptions;
  studentTrends: StudentTrendAnalytics;
  feedback: FeedbackAnalytics;
}

export const DEMO_ACCOUNTS = [
  {
    label: 'Quản trị viên',
    email: 'admin@campus-counseling.edu',
    role: 'Quản trị viên',
    roleCode: 'admin',
  },
] as const;

const DEFAULT_PRODUCTION_API_BASE_URL =
  'https://trung-tam-giao-duc-backend.vercel.app/api';
const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
const shouldUseCanonicalProductionApiUrl =
  configuredApiBaseUrl.includes('trung-tam-giao-duc-backend-xi.vercel.app')
  || configuredApiBaseUrl === 'https://trung-tam-giao-duc-backend.vercel.app';
const API_BASE_URL = (
  import.meta.env.PROD && shouldUseCanonicalProductionApiUrl
    ? DEFAULT_PRODUCTION_API_BASE_URL
    : configuredApiBaseUrl || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_BASE_URL : '')
).replace(/\/$/, '');
const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT ?? '/auth/login';
const COUNSELORS_ENDPOINT = import.meta.env.VITE_COUNSELORS_ENDPOINT ?? '/admin/counselors';
const COUNSELOR_DETAIL_ENDPOINT =
  import.meta.env.VITE_COUNSELOR_DETAIL_ENDPOINT ?? '/admin/counselors/:id';
const DASHBOARD_ENDPOINT = import.meta.env.VITE_DASHBOARD_ENDPOINT ?? '/admin/dashboard';
const ANALYTICS_FILTERS_ENDPOINT =
  import.meta.env.VITE_ANALYTICS_FILTERS_ENDPOINT ?? '/admin/analytics/filters';
const STUDENT_TRENDS_ENDPOINT =
  import.meta.env.VITE_STUDENT_TRENDS_ENDPOINT ?? '/admin/analytics/student-trends';
const FEEDBACK_ANALYTICS_ENDPOINT =
  import.meta.env.VITE_FEEDBACK_ANALYTICS_ENDPOINT ?? '/admin/analytics/feedback';
const ANALYTICS_EXPORT_ENDPOINT =
  import.meta.env.VITE_ANALYTICS_EXPORT_ENDPOINT ?? '/admin/analytics/export';
const AUDIT_LOGS_ENDPOINT = import.meta.env.VITE_AUDIT_LOGS_ENDPOINT ?? '/admin/audit-logs';
const STUDENTS_ENDPOINT = import.meta.env.VITE_STUDENTS_ENDPOINT ?? '/students';
const SHEET_MIRROR_ENDPOINT =
  import.meta.env.VITE_SHEET_MIRROR_ENDPOINT ?? '/admin/sheet-mirror/:table';
const parsedTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? '10000');
const API_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 10000;
const SESSION_STORAGE_KEY = 'digital-twin-admin-session';
const MOCK_COUNSELORS_STORAGE_KEY = 'digital-twin-admin-mock-counselors-v1';
const MOCK_STUDENTS_STORAGE_KEY = 'digital-twin-admin-mock-students-v2';
export const UNAUTHORIZED_EVENT = 'digital-twin:unauthorized';

const API_PERIOD_BY_TIME_RANGE: Record<TimeRange, string> = {
  'this-month': 'this_month',
  'last-month': 'last_month',
  'all-time': 'all_time',
};

const AVATAR_COLORS = [
  'from-blue-600 to-indigo-600',
  'from-teal-600 to-cyan-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-800',
  'from-sky-600 to-blue-800',
];

const PROFILE_LABEL_TRANSLATIONS: Record<string, string> = {
  Counselor: 'Tư vấn viên',
  'Senior Counselor': 'Tư vấn viên cao cấp',
  'Lead Counselor': 'Trưởng nhóm tham vấn',
  'Counseling Services': 'Dịch vụ tham vấn',
  'Clinical Lead': 'Trưởng nhóm chuyên môn',
  'Service Supervisor': 'Giám sát dịch vụ',
  'Admin Supervisor': 'Quản trị giám sát',
  Administrator: 'Quản trị viên',
};

export const isRemoteApiConfigured = API_BASE_URL.length > 0;
export const isCrudDemoMode = (import.meta.env.VITE_CRUD_DEMO_MODE ?? 'false') === 'true';
// The customer's current package is read-only. Data maintenance stays in the
// configured Google Sheet and cannot be enabled from a deployment variable.
export const isWebCrudEnabled = false;
export const googleStudentEntryUrl = (
  import.meta.env.VITE_GOOGLE_STUDENT_ENTRY_URL ?? import.meta.env.VITE_GOOGLE_STUDENT_FORM_URL ?? ''
).trim();
const defaultStudentThcsSheetUrl = 'https://docs.google.com/spreadsheets/d/1VFfQsEoNPE_WCP1SHYMFsN2n-Y4V4_RVvt77Iv305Bg/edit?gid=1158513315#gid=1158513315&range=A1';
const defaultStudentThptSheetUrl = 'https://docs.google.com/spreadsheets/d/1VFfQsEoNPE_WCP1SHYMFsN2n-Y4V4_RVvt77Iv305Bg/edit?gid=1783407659#gid=1783407659&range=A1';
const defaultCounselorSheetUrl = 'https://docs.google.com/spreadsheets/d/1VFfQsEoNPE_WCP1SHYMFsN2n-Y4V4_RVvt77Iv305Bg/edit?gid=1153632058#gid=1153632058';

const normalizeStudentSheetUrl = (
  configuredUrl: string | undefined,
  fallbackUrl: string,
  sourceGid: string,
  managementGid: string,
): string => {
  const rawUrl = (configuredUrl ?? fallbackUrl).trim() || fallbackUrl;
  const managementUrl = rawUrl.split(`gid=${sourceGid}`).join(`gid=${managementGid}`);
  return /(?:^|[&#])range=/i.test(managementUrl)
    ? managementUrl.replace(/([&#])range=[^&#]*/i, '$1range=A1')
    : `${managementUrl}${managementUrl.includes('#') ? '&' : '#'}range=A1`;
};

export const googleStudentThcsEntryUrl = normalizeStudentSheetUrl(
  import.meta.env.VITE_GOOGLE_STUDENT_THCS_SHEET_URL,
  defaultStudentThcsSheetUrl,
  '1361399049',
  '1158513315',
);
export const googleStudentThptEntryUrl = normalizeStudentSheetUrl(
  import.meta.env.VITE_GOOGLE_STUDENT_THPT_SHEET_URL,
  defaultStudentThptSheetUrl,
  '618108581',
  '1783407659',
);
const configuredCounselorEntryUrl = (
  import.meta.env.VITE_GOOGLE_COUNSELOR_ENTRY_URL ?? googleStudentEntryUrl
).trim();
// Older deployments pointed this button at the raw counselor application form.
// Route that known legacy URL to the approved counselor management tab instead.
export const googleCounselorEntryUrl = configuredCounselorEntryUrl.includes('gid=1832606455')
  ? defaultCounselorSheetUrl
  : configuredCounselorEntryUrl || defaultCounselorSheetUrl;
const parsedStudentSyncInterval = Number(import.meta.env.VITE_STUDENT_SYNC_INTERVAL_MS ?? '60000');
export const studentSyncIntervalMs = Number.isFinite(parsedStudentSyncInterval)
  ? Math.max(parsedStudentSyncInterval, 60000)
  : 60000;
const parsedAnalyticsSyncInterval = Number(import.meta.env.VITE_ANALYTICS_SYNC_INTERVAL_MS ?? '15000');
export const analyticsSyncIntervalMs = Number.isFinite(parsedAnalyticsSyncInterval) && parsedAnalyticsSyncInterval >= 5000
  ? parsedAnalyticsSyncInterval
  : 15000;

const localizeCounselorName = (name: string): string =>
  name.replace(/^Demo Counselor\s+([A-Z])$/i, 'Tư vấn viên mẫu $1');

const normalizeCounselorStatus = (value: unknown): Counselor['status'] => {
  const status = toStringValue(value, 'ACTIVE').trim().toLowerCase();
  if (
    status === 'inactive'
    || status.includes('ngừng')
    || status.includes('ngung')
    || status.includes('không hoạt động')
    || status.includes('khong hoat dong')
  ) return 'INACTIVE';
  if (status === 'on_leave' || status.includes('nghỉ') || status.includes('nghi')) {
    return 'ON_LEAVE';
  }
  return 'ACTIVE';
};

const withEditableProfile = (counselor: Counselor): Counselor => {
  const name = localizeCounselorName(counselor.name);
  const nameParts = name.trim().split(/\s+/);
  return enforceCounselorKpiPolicy({
    ...counselor,
    name,
    title: localizeProfileLabel(counselor.title, 'Tư vấn viên'),
    department: localizeProfileLabel(counselor.department, 'Dịch vụ tham vấn'),
    firstName: counselor.firstName ?? nameParts[0] ?? '',
    lastName: counselor.lastName ?? nameParts.slice(1).join(' '),
    role: localizeProfileLabel(counselor.role ?? counselor.title),
    specialization: localizeProfileLabel(counselor.specialization ?? counselor.department),
    status: counselor.status ?? 'ACTIVE',
    fteRatio: counselor.fteRatio ?? 1,
  });
};

const getMockCounselors = (): Counselor[] => {
  try {
    const stored = window.localStorage.getItem(MOCK_COUNSELORS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Counselor[];
      if (Array.isArray(parsed)) {
        const expectedIds = new Set(OFFICIAL_KPI_DEFINITIONS.map((definition) => definition.id));
        return parsed.map((storedCounselor) => {
          const profile = withEditableProfile(storedCounselor);
          const hasCurrentPolicy = Array.isArray(profile.kpis)
            && profile.kpis.length === OFFICIAL_KPI_DEFINITIONS.length
            && profile.kpis.every((kpi) => expectedIds.has(kpi.id as typeof OFFICIAL_KPI_DEFINITIONS[number]['id']))
            && profile.hrCompliance !== undefined;
          if (hasCurrentPolicy) return enforceCounselorKpiPolicy(profile);

          const currentFixture = INITIAL_COUNSELORS.find((item) => item.id === profile.id);
          if (currentFixture) {
            return withEditableProfile({
              ...currentFixture,
              firstName: profile.firstName,
              lastName: profile.lastName,
              name: profile.name,
              gender: profile.gender,
              phoneNumber: profile.phoneNumber,
              email: profile.email,
              dateOfBirth: profile.dateOfBirth,
              role: profile.role,
              specialization: profile.specialization,
              status: profile.status,
              title: profile.title,
              department: profile.department,
            });
          }

          const emptyPeriod = createEmptyPeriodMetrics();
          return enforceCounselorKpiPolicy({
            ...profile,
            kpis: createUnavailableKpis(),
            passedKpiCount: 0,
            failedKpiCount: 5,
            overallScore: 0,
            overallStatus: 'Insufficient Data',
            hrCompliance: createEmptyHrCompliance(),
            timeRangeMetrics: {
              'this-month': emptyPeriod,
              'last-month': createEmptyPeriodMetrics(),
              'all-time': createEmptyPeriodMetrics(),
            },
          });
        });
      }
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; use memory fixtures.
  }
  return INITIAL_COUNSELORS.map(withEditableProfile);
};

const saveMockCounselors = (counselors: Counselor[]): void => {
  try {
    window.localStorage.setItem(MOCK_COUNSELORS_STORAGE_KEY, JSON.stringify(counselors));
  } catch {
    throw new ApiError('Không thể lưu thay đổi demo trên trình duyệt này.');
  }
};

const getActiveMockCounselors = (): Counselor[] =>
  getMockCounselors().filter((counselor) => counselor.status !== 'INACTIVE');

const INITIAL_STUDENTS: Student[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    firstName: 'Học viên',
    lastName: 'THCS Mẫu',
    name: 'Học viên THCS Mẫu',
    gender: 'UNSPECIFIED',
    phoneNumber: '000-100-0001',
    email: 'student@example.invalid',
    parentId: null,
    parentName: null,
    parentRelationship: null,
    parentIsPrimary: false,
    parentPhoneNumber: null,
    parentEmail: null,
    dateOfBirth: '2010-01-01',
    status: 'ACTIVE',
    schoolLevel: 'THCS',
    schoolId: null,
    addressId: null,
    assignedCounselorId: null,
    assignedCounselorName: 'Tư vấn viên mẫu',
    assignmentStatus: 'ACTIVE',
    assignmentEndedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    firstName: 'Học viên',
    lastName: 'THPT Mẫu',
    name: 'Học viên THPT Mẫu',
    gender: 'UNSPECIFIED',
    phoneNumber: '000-100-0002',
    email: 'student.thpt@example.invalid',
    parentId: null,
    parentName: null,
    parentRelationship: null,
    parentIsPrimary: false,
    parentPhoneNumber: null,
    parentEmail: null,
    dateOfBirth: '2008-01-01',
    status: 'ACTIVE',
    schoolLevel: 'THPT',
    schoolId: null,
    addressId: null,
    assignedCounselorId: null,
    assignedCounselorName: 'Tư vấn viên mẫu',
    assignmentStatus: 'ACTIVE',
    assignmentEndedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  },
];

const getMockStudents = (): Student[] => {
  try {
    const stored = window.localStorage.getItem(MOCK_STUDENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Student[];
      if (Array.isArray(parsed)) {
        return parsed.map((student) => ({
          ...student,
          parentId: student.parentId ?? null,
          parentName: student.parentName ?? null,
          parentRelationship: student.parentRelationship ?? null,
          parentIsPrimary: student.parentIsPrimary ?? false,
        }));
      }
    }
  } catch {
    // Use in-memory fixtures when storage is unavailable.
  }
  return INITIAL_STUDENTS;
};

const saveMockStudents = (students: Student[]): void => {
  try {
    window.localStorage.setItem(MOCK_STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch {
    throw new ApiError('Không thể lưu thay đổi Student demo trên trình duyệt này.');
  }
};

const createUnavailableKpis = (): KPIItem[] =>
  OFFICIAL_KPI_DEFINITIONS.map((definition) => ({
    id: definition.id,
    name: definition.name,
    category: definition.category,
    actualValue: 'Chưa có dữ liệu',
    actualNumeric: Number.NaN,
    targetValue: definition.targetValue,
    targetNumeric: definition.targetNumeric,
    unit: definition.unit,
    comparisonType: definition.comparisonType,
    weight: definition.weight,
    score: 0,
    hardGuardrail: definition.hardGuardrail,
    isPassed: false,
    notes: 'Chưa có dữ liệu phân tích demo nào được ghi nhận cho tư vấn viên này.',
  }));

const createEmptyHrCompliance = (): HrComplianceSummary => ({
  status: 'No Data',
  registeredWorkdays: 0,
  registeredHours: 0,
  maxDailyHours: 0,
  overLimitDays: 0,
  weeksWithoutRest: 0,
  note: 'Chấm công HR được theo dõi riêng; chưa có dữ liệu cho kỳ này.',
});

const createEmptyPeriodMetrics = (): CounselorPeriodMetrics => ({
  assignedStudents: 0,
  completedBookings: 0,
  pendingBookings: 0,
  cancelledBookings: 0,
  completedTests: 0,
  pendingTests: 0,
  completedSessions: 0,
  totalSessions: 0,
  assignedTests: 0,
  satisfactionScore: 0,
  feedbackCount: 0,
  passedKpiCount: 0,
  overallScore: 0,
  overallStatus: 'Insufficient Data',
  hrCompliance: createEmptyHrCompliance(),
  kpis: createUnavailableKpis(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pick = (record: JsonRecord, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
};

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;

const localizeProfileLabel = (value: unknown, fallback = ''): string => {
  const label = toStringValue(value, fallback);
  return PROFILE_LABEL_TRANSLATIONS[label] ?? label;
};

const localizePeriodLabel = (value: unknown, fallback: string): string => {
  const label = toStringValue(value, fallback);
  return label
    .replace(/^Week\s+(\d+)/i, 'Tuần $1')
    .replace(/^Q(\d+)$/i, 'Quý $1')
    .replace(/^Period\s+(\d+)/i, 'Kỳ $1')
    .replace(/\(Current\)/i, '(Hiện tại)');
};

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const unwrapRecord = (payload: unknown): JsonRecord => {
  if (!isRecord(payload)) return {};
  const data = payload.data;
  return isRecord(data) ? data : payload;
};

const normalizeComparisonType = (value: unknown): KPIItem['comparisonType'] => {
  const comparison = toStringValue(value).toLowerCase();
  if (comparison === 'lte' || comparison === '<=' || comparison === 'less_than_or_equal') {
    return 'lte';
  }
  if (comparison === 'exact' || comparison === '=' || comparison === 'eq') {
    return 'exact';
  }
  return 'gte';
};

const KPI_ID_ALIASES: Record<string, string> = {
  weighted_caseload_capacity: 'weighted-caseload-capacity',
  student_service_time: 'student-service-time',
  eligible_session_completion: 'eligible-session-completion',
  assessment_follow_through: 'assessment-follow-through',
  student_outcome_experience: 'student-outcome-experience',
  caseload_compliance: 'weighted-caseload-capacity',
  session_completion_rate: 'eligible-session-completion',
  test_completion_rate: 'assessment-follow-through',
  student_satisfaction: 'student-outcome-experience',
};

const normalizeKpiId = (value: unknown, fallback: string): string => {
  const rawId = toStringValue(value, fallback).trim().toLowerCase();
  return KPI_ID_ALIASES[rawId] ?? rawId;
};

const normalizeEvidence = (value: unknown): KpiEvidence | undefined => {
  if (!isRecord(value)) return undefined;
  const numerator = toNumberValue(pick(value, 'numerator'), Number.NaN);
  const denominator = toNumberValue(pick(value, 'denominator'), Number.NaN);
  const sampleSize = toNumberValue(pick(value, 'sampleSize', 'sample_size'), Number.NaN);
  const registeredHours = toNumberValue(pick(value, 'registeredHours', 'registered_hours'), Number.NaN);
  const maxDailyHours = toNumberValue(pick(value, 'maxDailyHours', 'max_daily_hours'), Number.NaN);
  const overLimitDays = toNumberValue(pick(value, 'overLimitDays', 'over_limit_days'), Number.NaN);
  const weeksWithoutRest = toNumberValue(pick(value, 'weeksWithoutRest', 'weeks_without_rest'), Number.NaN);
  const weightedCaseloadPoints = toNumberValue(pick(value, 'weightedCaseloadPoints', 'weighted_caseload_points'), Number.NaN);
  const fteRatio = toNumberValue(pick(value, 'fteRatio', 'fte_ratio'), Number.NaN);
  const studentServiceHours = toNumberValue(pick(value, 'studentServiceHours', 'student_service_hours'), Number.NaN);
  const minimumSampleSize = toNumberValue(pick(value, 'minimumSampleSize', 'minimum_sample_size'), Number.NaN);
  const averageRating = toNumberValue(pick(value, 'averageRating', 'average_rating'), Number.NaN);
  const evidence: KpiEvidence = {};
  if (Number.isFinite(numerator)) evidence.numerator = numerator;
  if (Number.isFinite(denominator)) evidence.denominator = denominator;
  if (Number.isFinite(sampleSize)) evidence.sampleSize = sampleSize;
  if (Number.isFinite(registeredHours)) evidence.registeredHours = registeredHours;
  if (Number.isFinite(maxDailyHours)) evidence.maxDailyHours = maxDailyHours;
  if (Number.isFinite(overLimitDays)) evidence.overLimitDays = overLimitDays;
  if (Number.isFinite(weeksWithoutRest)) evidence.weeksWithoutRest = weeksWithoutRest;
  if (Number.isFinite(weightedCaseloadPoints)) evidence.weightedCaseloadPoints = weightedCaseloadPoints;
  if (Number.isFinite(fteRatio)) evidence.fteRatio = fteRatio;
  if (Number.isFinite(studentServiceHours)) evidence.studentServiceHours = studentServiceHours;
  if (Number.isFinite(minimumSampleSize)) evidence.minimumSampleSize = minimumSampleSize;
  if (Number.isFinite(averageRating)) evidence.averageRating = averageRating;
  return Object.keys(evidence).length > 0 ? evidence : undefined;
};

const normalizeKpi = (value: unknown, index: number): KPIItem => {
  const raw = isRecord(value) ? value : {};
  const unit = toStringValue(pick(raw, 'unit', 'measurementUnit', 'measurement_unit'));
  const actualNumeric = toNumberValue(
    pick(raw, 'actualNumeric', 'actual_numeric', 'actual', 'actualValue', 'actual_value'),
    Number.NaN,
  );
  const targetNumeric = toNumberValue(
    pick(raw, 'targetNumeric', 'target_numeric', 'target', 'targetValue', 'target_value'),
    Number.NaN,
  );

  return {
    id: normalizeKpiId(pick(raw, 'id', 'kpiId', 'kpi_id'), `kpi-${index + 1}`),
    name: toStringValue(pick(raw, 'name', 'kpiName', 'kpi_name'), `KPI ${index + 1}`),
    category: toStringValue(pick(raw, 'category', 'domain'), 'Hiệu suất'),
    actualValue: toStringValue(
      pick(raw, 'actualValue', 'actual_value'),
      Number.isFinite(actualNumeric) ? `${actualNumeric}${unit ? ` ${unit}` : ''}` : 'Chưa có dữ liệu',
    ),
    actualNumeric,
    targetValue: toStringValue(
      pick(raw, 'targetValue', 'target_value'),
      Number.isFinite(targetNumeric) ? `${targetNumeric}${unit ? ` ${unit}` : ''}` : 'Chưa có dữ liệu',
    ),
    targetNumeric,
    unit,
    comparisonType: normalizeComparisonType(
      pick(raw, 'comparisonType', 'comparison_type', 'operator'),
    ),
    weight: toNumberValue(pick(raw, 'weight'), 0),
    score: toNumberValue(pick(raw, 'score'), 0),
    hardGuardrail: Boolean(pick(raw, 'hardGuardrail', 'hard_guardrail')),
    // The canonical weighted policy recalculates this value from trusted definitions.
    isPassed: false,
    notes: toStringValue(pick(raw, 'notes', 'note', 'description'), 'Chưa có ghi chú kiểm định.'),
    evidence: normalizeEvidence(pick(raw, 'evidence', 'calculation', 'calculation_evidence')),
  };
};

const normalizeKpis = (value: unknown): KPIItem[] =>
  toArray(value).map((kpi, index) => normalizeKpi(kpi, index));

const normalizeHrCompliance = (value: unknown): HrComplianceSummary => {
  if (!isRecord(value)) return createEmptyHrCompliance();
  const rawStatus = toStringValue(pick(value, 'status'), 'No Data');
  const status: HrComplianceSummary['status'] = rawStatus === 'Compliant'
    ? 'Compliant'
    : rawStatus === 'Needs Review'
      ? 'Needs Review'
      : 'No Data';
  return {
    status,
    registeredWorkdays: toNumberValue(pick(value, 'registeredWorkdays', 'registered_workdays')),
    registeredHours: toNumberValue(pick(value, 'registeredHours', 'registered_hours')),
    maxDailyHours: toNumberValue(pick(value, 'maxDailyHours', 'max_daily_hours')),
    overLimitDays: toNumberValue(pick(value, 'overLimitDays', 'over_limit_days')),
    weeksWithoutRest: toNumberValue(pick(value, 'weeksWithoutRest', 'weeks_without_rest')),
    note: toStringValue(
      pick(value, 'note'),
      'Chấm công HR được theo dõi riêng và không ảnh hưởng đến 4 KPI hiệu suất hoặc điều kiện an toàn tải ca.',
    ),
  };
};

const normalizeRelationshipSummary = (value: unknown, fallback: JsonRecord): RelationshipSummary => {
  const raw = isRecord(value) ? value : {};
  const readNumber = (...keys: string[]) =>
    toNumberValue(pick(raw, ...keys), toNumberValue(pick(fallback, ...keys)));

  return {
    assignedStudents: readNumber('assignedStudents', 'assigned_students'),
    completedBookings: readNumber('completedBookings', 'completed_bookings'),
    pendingBookings: readNumber('pendingBookings', 'pending_bookings'),
    cancelledBookings: readNumber('cancelledBookings', 'cancelled_bookings'),
    completedTests: readNumber('completedTests', 'completed_tests'),
    pendingTests: readNumber('pendingTests', 'pending_tests'),
    avgResponseHours: readNumber('avgResponseHours', 'avg_response_hours'),
    satisfactionScore: readNumber('satisfactionScore', 'satisfaction_score'),
  };
};

const getPeriodRecord = (metrics: JsonRecord, timeRange: TimeRange): JsonRecord => {
  const aliases: Record<TimeRange, string[]> = {
    'this-month': ['this-month', 'thisMonth', 'this_month'],
    'last-month': ['last-month', 'lastMonth', 'last_month'],
    'all-time': ['all-time', 'allTime', 'all_time'],
  };
  const value = pick(metrics, ...aliases[timeRange]);
  return isRecord(value) ? value : {};
};

const normalizePeriodMetrics = (
  value: JsonRecord,
  fallback: RelationshipSummary,
): CounselorPeriodMetrics => {
  const readNumber = (camelCase: string, snakeCase: string, fallbackValue: number) =>
    toNumberValue(pick(value, camelCase, snakeCase), fallbackValue);
  const rawKpis = pick(value, 'kpis', 'kpiResults', 'kpi_results');
  const hrCompliance = normalizeHrCompliance(pick(value, 'hrCompliance', 'hr_compliance'));
  const completedTests = readNumber('completedTests', 'completed_tests', fallback.completedTests);
  const pendingTests = readNumber('pendingTests', 'pending_tests', fallback.pendingTests);
  const completedSessions = readNumber('completedSessions', 'completed_sessions', 0);
  const totalSessions = readNumber('totalSessions', 'total_sessions', 0);
  const assignedTests = readNumber(
    'assignedTests',
    'assigned_tests',
    completedTests + pendingTests,
  );

  return {
    assignedStudents: readNumber('assignedStudents', 'assigned_students', fallback.assignedStudents),
    completedBookings: readNumber('completedBookings', 'completed_bookings', fallback.completedBookings),
    pendingBookings: readNumber('pendingBookings', 'pending_bookings', fallback.pendingBookings),
    cancelledBookings: readNumber('cancelledBookings', 'cancelled_bookings', fallback.cancelledBookings),
    completedTests,
    pendingTests,
    completedSessions,
    totalSessions,
    assignedTests,
    satisfactionScore: readNumber(
      'satisfactionScore',
      'satisfaction_score',
      fallback.satisfactionScore,
    ),
    feedbackCount: readNumber('feedbackCount', 'feedback_count', 0),
    passedKpiCount: 0,
    overallScore: 0,
    overallStatus: 'Insufficient Data',
    hrCompliance,
    kpis: rawKpis === undefined ? undefined : normalizeKpis(rawKpis),
  };
};

const normalizeCounselor = (
  value: unknown,
  index: number,
  requestedPeriod?: TimeRange,
): Counselor => {
  if (!isRecord(value)) {
    throw new ApiError(`Dữ liệu tư vấn viên thứ ${index + 1} không phải là một đối tượng hợp lệ.`);
  }

  const id = toStringValue(pick(value, 'id', 'counselorId', 'counselor_id'));
  const firstName = toStringValue(pick(value, 'firstName', 'first_name'));
  const lastName = toStringValue(pick(value, 'lastName', 'last_name'));
  const name = localizeCounselorName(toStringValue(
    pick(value, 'name', 'fullName', 'full_name'),
    `${firstName} ${lastName}`.trim(),
  ));
  if (!id || !name) {
    throw new ApiError(`Dữ liệu tư vấn viên thứ ${index + 1} bị thiếu mã hoặc họ tên.`);
  }

  const directPeriodValue = pick(value, 'periodMetrics', 'period_metrics');
  const directPeriod = isRecord(directPeriodValue) ? directPeriodValue : {};
  const topLevelKpis = pick(value, 'kpis', 'kpiResults', 'kpi_results');
  const directPeriodKpis = pick(directPeriod, 'kpis', 'kpiResults', 'kpi_results');
  const kpis = normalizeKpis(topLevelKpis ?? directPeriodKpis);
  const hrCompliance = normalizeHrCompliance(
    pick(value, 'hrCompliance', 'hr_compliance')
      ?? pick(directPeriod, 'hrCompliance', 'hr_compliance'),
  );
  const relationshipSummary = normalizeRelationshipSummary(
    pick(value, 'relationshipSummary', 'relationship_summary'),
    value,
  );
  const rawMetricsValue = pick(value, 'timeRangeMetrics', 'time_range_metrics', 'metricsByPeriod');
  const rawMetrics = isRecord(rawMetricsValue) ? rawMetricsValue : {};
  const periodRecord = (timeRange: TimeRange): JsonRecord =>
    requestedPeriod === timeRange && Object.keys(directPeriod).length > 0
      ? directPeriod
      : getPeriodRecord(rawMetrics, timeRange);

  const counselor: Counselor = {
    id,
    externalId: toStringValue(
      pick(value, 'externalId', 'externalCounselorId', 'external_counselor_id'),
      id,
    ) || null,
    name,
    title: localizeProfileLabel(pick(value, 'title', 'jobTitle', 'job_title'), 'Tư vấn viên'),
    department: localizeProfileLabel(pick(value, 'department', 'unit'), 'Dịch vụ tham vấn'),
    email: toStringValue(pick(value, 'email')),
    firstName: firstName || name.split(' ')[0] || '',
    lastName: lastName || name.split(' ').slice(1).join(' '),
    gender: toStringValue(pick(value, 'gender')) || null,
    phoneNumber: toStringValue(pick(value, 'phoneNumber', 'phone_number')) || null,
    dateOfBirth: toStringValue(pick(value, 'dateOfBirth', 'date_of_birth')) || null,
    role: localizeProfileLabel(pick(value, 'role')) || null,
    specialization: localizeProfileLabel(pick(value, 'specialization')) || null,
    status: normalizeCounselorStatus(pick(value, 'status')),
    fteRatio: toNumberValue(pick(value, 'fteRatio', 'fte_ratio'), 1),
    avatarColor: toStringValue(
      pick(value, 'avatarColor', 'avatar_color'),
      AVATAR_COLORS[index % AVATAR_COLORS.length],
    ),
    assignedStudents: relationshipSummary.assignedStudents,
    kpis,
    passedKpiCount: 0,
    failedKpiCount: 5,
    overallScore: 0,
    overallStatus: 'Insufficient Data',
    hrCompliance,
    relationshipSummary,
    timeRangeMetrics: {
      'this-month': normalizePeriodMetrics(
        periodRecord('this-month'),
        relationshipSummary,
      ),
      'last-month': normalizePeriodMetrics(
        periodRecord('last-month'),
        relationshipSummary,
      ),
      'all-time': normalizePeriodMetrics(
        periodRecord('all-time'),
        relationshipSummary,
      ),
    },
  };

  return enforceCounselorKpiPolicy(counselor);
};

const extractCounselorArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const root = unwrapRecord(payload);
  const candidate = pick(root, 'counselors', 'items', 'results');
  if (Array.isArray(candidate)) return candidate;
  throw new ApiError('API tư vấn viên không trả về danh sách hợp lệ.');
};

const extractCounselorRecord = (payload: unknown): unknown => {
  const root = unwrapRecord(payload);
  return pick(root, 'counselor', 'item') ?? root;
};

const normalizeStudent = (value: unknown): Student => {
  if (!isRecord(value)) throw new ApiError('API Student trả về bản ghi không hợp lệ.');
  const firstName = toStringValue(pick(value, 'firstName', 'first_name'));
  const lastName = toStringValue(pick(value, 'lastName', 'last_name'));
  const id = toStringValue(pick(value, 'id', 'studentId', 'student_id'));
  if (!id || !firstName || !lastName) {
    throw new ApiError('Bản ghi Student bị thiếu mã hoặc họ tên.');
  }
  const schoolValue = pick(value, 'school');
  const schoolRecord = isRecord(schoolValue) ? schoolValue : {};
  const gradeLevel = toNumberValue(pick(value, 'gradeLevel', 'grade_level'), Number.NaN);
  const rawSchoolLevel = toStringValue(
    pick(
      value,
      'schoolLevel',
      'school_level',
      'educationLevel',
      'education_level',
      'schoolType',
      'school_type',
      'sourceSheet',
      'source_sheet',
    ) ?? pick(schoolRecord, 'level', 'schoolLevel', 'school_level', 'type', 'name'),
  ).toUpperCase();
  const schoolLevel: Student['schoolLevel'] = rawSchoolLevel.includes('THCS')
    ? 'THCS'
    : rawSchoolLevel.includes('THPT')
      ? 'THPT'
      : Number.isFinite(gradeLevel)
        ? gradeLevel <= 9 ? 'THCS' : 'THPT'
        : null;
  const rawStudentStatus = toStringValue(pick(value, 'status')).trim().toLowerCase();
  const status: Student['status'] = rawStudentStatus === 'completed'
    || rawStudentStatus.includes('hoàn thành')
    || rawStudentStatus.includes('hoan thanh')
    ? 'COMPLETED'
    : rawStudentStatus === 'active'
      || rawStudentStatus.includes('đang hoạt động')
      || rawStudentStatus.includes('dang hoat dong')
      ? 'ACTIVE'
      : 'INACTIVE';
  return {
    id,
    externalId: toStringValue(
      pick(value, 'externalId', 'externalStudentId', 'external_student_id'),
      id,
    ) || null,
    firstName,
    lastName,
    name: toStringValue(pick(value, 'name', 'fullName', 'full_name'), `${firstName} ${lastName}`),
    gender: toStringValue(pick(value, 'gender')) || null,
    phoneNumber: toStringValue(pick(value, 'phoneNumber', 'phone_number')),
    email: toStringValue(pick(value, 'email')) || null,
    parentId: toStringValue(pick(value, 'parentId', 'parent_id')) || null,
    parentName: toStringValue(pick(value, 'parentName', 'parent_name')) || null,
    parentRelationship: toStringValue(
      pick(value, 'parentRelationship', 'parent_relationship', 'relationship'),
    ) || null,
    parentIsPrimary: isSheetTrue(pick(value, 'parentIsPrimary', 'parent_is_primary')),
    parentPhoneNumber: toStringValue(
      pick(value, 'parentPhoneNumber', 'parent_phone_number', 'guardianPhoneNumber', 'guardian_phone_number'),
    ) || null,
    parentEmail: toStringValue(
      pick(value, 'parentEmail', 'parent_email', 'guardianEmail', 'guardian_email'),
    ) || null,
    dateOfBirth: toStringValue(pick(value, 'dateOfBirth', 'date_of_birth')) || null,
    status,
    schoolLevel,
    schoolId: toStringValue(pick(value, 'schoolId', 'school_id')) || null,
    addressId: toStringValue(pick(value, 'addressId', 'address_id')) || null,
    assignedCounselorId: toStringValue(
      pick(value, 'assignedCounselorId', 'assigned_counselor_id'),
    ) || null,
    assignedCounselorName: toStringValue(
      pick(value, 'assignedCounselorName', 'assigned_counselor_name'),
    ) || null,
    assignmentStatus: toStringValue(
      pick(value, 'assignmentStatus', 'assignment_status'),
    ) || null,
    assignmentEndedAt: toStringValue(
      pick(value, 'assignmentEndedAt', 'assignment_ended_at'),
    ) || null,
    createdAt: toStringValue(pick(value, 'createdAt', 'created_at')),
    updatedAt: toStringValue(pick(value, 'updatedAt', 'updated_at')) || null,
  };
};

const extractStudentArray = (payload: unknown): Student[] => {
  if (Array.isArray(payload)) return payload.map(normalizeStudent);
  const root = unwrapRecord(payload);
  const items = pick(root, 'students', 'items', 'results');
  if (!Array.isArray(items)) throw new ApiError('API Student không trả về danh sách hợp lệ.');
  return items.map(normalizeStudent);
};

const extractStudentRecord = (payload: unknown): Student => {
  const root = unwrapRecord(payload);
  return normalizeStudent(pick(root, 'student', 'item') ?? root);
};

const normalizeDashboard = (payload: unknown): DashboardMetrics => {
  const root = unwrapRecord(payload);
  const hasDashboardData =
    pick(root, 'totalStudents', 'total_students') !== undefined ||
    pick(root, 'bookingsBreakdown', 'bookings_breakdown') !== undefined ||
    pick(root, 'monthlyTrends', 'monthly_trends', 'trends') !== undefined;
  if (!hasDashboardData) {
    throw new ApiError('Phản hồi API bảng điều khiển không chứa dữ liệu tổng hợp.');
  }
  const bookingValue = pick(root, 'bookingsBreakdown', 'bookings_breakdown', 'bookingStatus', 'booking_status');
  const booking = isRecord(bookingValue) ? bookingValue : {};
  const trendItems = toArray(pick(root, 'monthlyTrends', 'monthly_trends', 'trends'));
  const historyItems = toArray(
    pick(root, 'counselorPassHistory', 'counselor_pass_history', 'kpiPassHistory'),
  );

  return {
    totalStudents: toNumberValue(pick(root, 'totalStudents', 'total_students')),
    activeCounselors: toNumberValue(pick(root, 'activeCounselors', 'active_counselors')),
    totalTests: toNumberValue(pick(root, 'totalTests', 'total_tests')),
    totalTestAttempts: toNumberValue(pick(root, 'totalTestAttempts', 'total_test_attempts')),
    totalBookings: toNumberValue(pick(root, 'totalBookings', 'total_bookings')),
    passedCounselors: toNumberValue(pick(root, 'passedCounselors', 'passed_counselors')),
    notPassedCounselors: toNumberValue(
      pick(root, 'notPassedCounselors', 'not_passed_counselors'),
    ),
    bookingsBreakdown: {
      completed: toNumberValue(pick(booking, 'completed')),
      pending: toNumberValue(pick(booking, 'pending')),
      cancelled: toNumberValue(pick(booking, 'cancelled', 'canceled')),
    },
    monthlyTrends: trendItems.map((item, index) => {
      const trend = isRecord(item) ? item : {};
      return {
        month: localizePeriodLabel(pick(trend, 'month', 'label'), `Kỳ ${index + 1}`),
        completed: toNumberValue(pick(trend, 'completed')),
        pending: toNumberValue(pick(trend, 'pending')),
        cancelled: toNumberValue(pick(trend, 'cancelled', 'canceled')),
      };
    }),
    counselorPassHistory: historyItems.map((item, index) => {
      const history = isRecord(item) ? item : {};
      return {
        label: OFFICIAL_KPI_DEFINITIONS[index]?.shortLabel ?? `KPI ${index + 1}`,
        passed: toNumberValue(pick(history, 'passed')),
        notPassed: toNumberValue(pick(history, 'notPassed', 'not_passed')),
      };
    }),
    lastUpdated: toStringValue(
      pick(root, 'lastUpdated', 'last_updated'),
      new Date().toLocaleString('vi-VN'),
    ),
    syncNode: toStringValue(pick(root, 'syncNode', 'sync_node'), 'API hệ thống'),
  };
};

const normalizeFilterOptions = (payload: unknown): AnalyticsFilterOptions => {
  const root = unwrapRecord(payload);
  return {
    counselors: toArray(pick(root, 'counselors')).map((item) => {
      const record = isRecord(item) ? item : {};
      return {
        id: toStringValue(pick(record, 'id', 'counselorId', 'counselor_id')),
        name: toStringValue(pick(record, 'name'), 'Tư vấn viên'),
      };
    }).filter((item) => item.id.length > 0),
    tests: toArray(pick(root, 'tests')).map((item) => {
      const record = isRecord(item) ? item : {};
      const type = toStringValue(pick(record, 'type', 'testType', 'test_type'));
      return {
        id: toStringValue(pick(record, 'id', 'testId', 'test_id')),
        name: toStringValue(pick(record, 'name', 'testName', 'test_name'), 'Bài test'),
        type: type || null,
      };
    }).filter((item) => item.id.length > 0),
    categories: toArray(pick(root, 'categories'))
      .map((item) => toStringValue(item))
      .filter(Boolean),
  };
};

const normalizeStudentTrends = (payload: unknown): StudentTrendAnalytics => {
  const root = unwrapRecord(payload);
  return {
    period: toStringValue(pick(root, 'period')),
    sampleSize: toNumberValue(pick(root, 'sampleSize', 'sample_size')),
    minimumSampleSize: toNumberValue(
      pick(root, 'minimumSampleSize', 'minimum_sample_size'),
      5,
    ),
    suppressed: pick(root, 'suppressed') === true,
    totalAssessments: toNumberValue(pick(root, 'totalAssessments', 'total_assessments')),
    totalTestResults: toNumberValue(pick(root, 'totalTestResults', 'total_test_results')),
    timeline: toArray(pick(root, 'timeline')).map((item) => {
      const record = isRecord(item) ? item : {};
      return {
        period: toStringValue(pick(record, 'period', 'label')),
        assessments: toNumberValue(pick(record, 'assessments')),
        testResults: toNumberValue(pick(record, 'testResults', 'test_results')),
      };
    }),
    categoryDistribution: toArray(
      pick(root, 'categoryDistribution', 'category_distribution'),
    ).map((item) => {
      const record = isRecord(item) ? item : {};
      return {
        category: toStringValue(pick(record, 'category'), 'Chưa phân loại'),
        count: toNumberValue(pick(record, 'count')),
      };
    }),
  };
};

const normalizeFeedbackAnalytics = (payload: unknown): FeedbackAnalytics => {
  const root = unwrapRecord(payload);
  const distributionValue = pick(root, 'distribution');
  const distribution = isRecord(distributionValue) ? distributionValue : {};
  const averageRatingValue = pick(root, 'averageRating', 'average_rating');
  return {
    period: toStringValue(pick(root, 'period')),
    sampleSize: toNumberValue(pick(root, 'sampleSize', 'sample_size')),
    minimumSampleSize: toNumberValue(
      pick(root, 'minimumSampleSize', 'minimum_sample_size'),
      5,
    ),
    suppressed: pick(root, 'suppressed') === true,
    averageRating: averageRatingValue === null || averageRatingValue === undefined
      ? null
      : toNumberValue(averageRatingValue),
    distribution: {
      positive: toNumberValue(pick(distribution, 'positive')),
      neutral: toNumberValue(pick(distribution, 'neutral')),
      negative: toNumberValue(pick(distribution, 'negative')),
    },
    timeline: toArray(pick(root, 'timeline')).map((item) => {
      const record = isRecord(item) ? item : {};
      const rating = pick(record, 'averageRating', 'average_rating');
      return {
        period: toStringValue(pick(record, 'period', 'label')),
        positive: toNumberValue(pick(record, 'positive')),
        neutral: toNumberValue(pick(record, 'neutral')),
        negative: toNumberValue(pick(record, 'negative')),
        averageRating: rating === null || rating === undefined ? null : toNumberValue(rating),
      };
    }),
  };
};

const analyticsQuery = (
  timeRange: TimeRange,
  filters: AnalyticsFilters,
): Record<string, string> => ({
  period: API_PERIOD_BY_TIME_RANGE[timeRange],
  ...(filters.counselorId ? { counselorId: filters.counselorId } : {}),
  ...(filters.testId ? { testId: filters.testId } : {}),
  ...(filters.category ? { category: filters.category } : {}),
});

const buildUrl = (endpoint: string, query?: Record<string, string>): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`${API_BASE_URL}${normalizedEndpoint}`);
  Object.entries(query ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
};

const getHttpErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
    case 422:
      return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    case 401:
      return 'Thông tin đăng nhập không hợp lệ hoặc phiên làm việc đã hết hạn.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 404:
      return 'Không tìm thấy dữ liệu được yêu cầu.';
    case 409:
      return 'Dữ liệu bị xung đột với bản ghi hiện có.';
    case 429:
      return 'Có quá nhiều yêu cầu. Vui lòng thử lại sau.';
    default:
      return status >= 500
        ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
        : `Yêu cầu API không thành công (mã ${status}).`;
  }
};

const requestJson = async (
  endpoint: string,
  options: RequestInit = {},
  query?: Record<string, string>,
): Promise<unknown> => {
  const controller = new AbortController();
  const callerSignal = options.signal;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const { signal: _callerSignal, ...fetchOptions } = options;

  try {
    const response = await fetch(buildUrl(endpoint, query), {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    const responseText = await response.text();
    let payload: unknown;
    try {
      payload = responseText ? JSON.parse(responseText) : undefined;
    } catch {
      payload = responseText;
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }

      throw new ApiError(
        getHttpErrorMessage(response.status),
        response.status,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (callerSignal?.aborted) throw error;
      throw new ApiError(`Yêu cầu API đã quá thời gian chờ ${API_TIMEOUT_MS} mili giây.`);
    }
    throw new ApiError('Không thể kết nối đến API. Vui lòng kiểm tra máy chủ và kết nối mạng.');
  } finally {
    window.clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
};

const authorizationHeaders = (session: AuthSession): HeadersInit =>
  session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};

type SheetMirrorTable =
  | 'students'
  | 'counselors'
  | 'parents'
  | 'student_parents'
  | 'counselor_assignments'
  | 'bookings'
  | 'tests'
  | 'test_attempts';

const sheetMirrorRowsCache = new Map<
  SheetMirrorTable,
  { expiresAt: number; rows: JsonRecord[] }
>();

export const clearStudentSheetMirrorCache = (): void => {
  const studentTables: SheetMirrorTable[] = [
    'students',
    'parents',
    'student_parents',
  ];
  studentTables.forEach((table) => sheetMirrorRowsCache.delete(table));
};

export const clearDashboardOperationsSheetMirrorCache = (): void => {
  const operationsTables: SheetMirrorTable[] = ['bookings', 'tests', 'test_attempts'];
  operationsTables.forEach((table) => sheetMirrorRowsCache.delete(table));
};

const loadSheetMirrorRows = async (
  session: AuthSession,
  table: SheetMirrorTable,
  signal?: AbortSignal,
): Promise<JsonRecord[]> => {
  const cached = sheetMirrorRowsCache.get(table);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  const endpoint = SHEET_MIRROR_ENDPOINT.replace(':table', encodeURIComponent(table));
  const rows: JsonRecord[] = [];
  const pageSize = 500;

  for (let page = 1; page <= 100; page += 1) {
    const payload = await requestJson(
      endpoint,
      { headers: authorizationHeaders(session), cache: 'no-store', signal },
      { page: String(page), pageSize: String(pageSize) },
    );
    if (!isRecord(payload) || payload.ok !== true || !Array.isArray(payload.data)) {
      throw new ApiError(`Sheet ${table} không trả về danh sách hợp lệ.`);
    }

    const pageRows = payload.data.filter(isRecord);
    rows.push(...pageRows);
    const total = toNumberValue(payload.total, rows.length);
    if (pageRows.length === 0 || rows.length >= total) break;
  }

  sheetMirrorRowsCache.set(table, { expiresAt: Date.now() + 20000, rows });
  return rows;
};

const mergeCounselorProfiles = (
  sheetRows: JsonRecord[],
  apiCounselors: Counselor[],
  period: TimeRange,
): Counselor[] => {
  const apiById = new Map<string, Counselor>();
  apiCounselors.forEach((counselor) => {
    [counselor.id, counselor.externalId].forEach((id) => {
      const key = normalizedRecordId(id);
      if (key) apiById.set(key, counselor);
    });
  });

  return sheetRows
    .map((row, index) => normalizeCounselor(row, index, period))
    .filter((profile) => profile.status !== 'INACTIVE')
    .map((profile) => {
      const metrics = apiById.get(normalizedRecordId(profile.id))
        ?? apiById.get(normalizedRecordId(profile.externalId));
      if (!metrics) return profile;
      return enforceCounselorKpiPolicy({
        ...metrics,
        id: profile.id,
        externalId: profile.externalId,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        gender: profile.gender,
        phoneNumber: profile.phoneNumber,
        email: profile.email,
        dateOfBirth: profile.dateOfBirth,
        role: profile.role,
        specialization: profile.specialization,
        status: profile.status,
        fteRatio: profile.fteRatio,
        title: profile.title,
        department: profile.department,
      });
    });
};

const loadSheetCounselors = async (
  session: AuthSession,
  period: TimeRange,
  signal?: AbortSignal,
): Promise<Counselor[]> => {
  const sheetRows = await loadSheetMirrorRows(session, 'counselors', signal);
  let apiCounselors: Counselor[] = [];
  try {
    const apiPayload = await requestJson(
      COUNSELORS_ENDPOINT,
      { headers: authorizationHeaders(session), signal },
      { period: API_PERIOD_BY_TIME_RANGE[period] },
    );
    apiCounselors = extractCounselorArray(apiPayload).map((value, index) =>
      normalizeCounselor(value, index, period),
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    // The Sheet remains authoritative for visible profiles even if KPI enrichment is unavailable.
  }
  return mergeCounselorProfiles(sheetRows, apiCounselors, period);
};

export const loginAdmin = async (credentials: LoginCredentials): Promise<AuthSession> => {
  if (!isRemoteApiConfigured) {
    const account = DEMO_ACCOUNTS.find(
      (candidate) =>
        candidate.email.toLowerCase() === credentials.email.trim().toLowerCase(),
    );
    if (!account || credentials.password.length < 6) {
      throw new ApiError('Hãy dùng một tài khoản demo trong danh sách và mật khẩu bất kỳ có từ 6 ký tự.', 401);
    }

    return {
      accessToken: 'local-demo-session',
      source: 'mock',
      user: {
        id: account.email,
        name: account.label,
        email: account.email,
        role: account.role,
        roleCode: account.roleCode,
      },
    };
  }

  const payload = await requestJson(AUTH_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email.trim(),
      password: credentials.password,
    }),
  });
  const root = unwrapRecord(payload);
  const userValue = pick(root, 'user', 'admin', 'account');
  const userRecord = isRecord(userValue) ? userValue : {};
  const email = toStringValue(pick(userRecord, 'email'), credentials.email.trim());
  const rawRole = toStringValue(pick(userRecord, 'role')).toLowerCase();
  if (rawRole !== 'admin' && rawRole !== 'administrator') {
    throw new ApiError('Tài khoản này không có quyền truy cập cổng quản trị.', 403);
  }
  const user: AdminUser = {
    id: toStringValue(pick(userRecord, 'id', 'userId', 'user_id'), email),
    name: localizeProfileLabel(pick(userRecord, 'name', 'fullName', 'full_name'), 'Người quản trị'),
    email,
    role: 'Quản trị viên',
    roleCode: 'admin',
  };

  return {
    accessToken: toStringValue(pick(root, 'accessToken', 'access_token', 'token')) || undefined,
    source: 'api',
    user,
  };
};

export const loadAdminData = async (
  session: AuthSession,
  timeRange: TimeRange,
  signal?: AbortSignal,
): Promise<AdminDataResult> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const counselors = getActiveMockCounselors();
    return {
      counselors,
      dashboard: getDashboardMetricsByTimeRange(timeRange, counselors),
      source: 'mock',
    };
  }

  const counselors = await loadSheetCounselors(session, timeRange, signal);

  try {
    const dashboardPayload = await requestJson(
      DASHBOARD_ENDPOINT,
      { headers: authorizationHeaders(session), signal },
      { period: API_PERIOD_BY_TIME_RANGE[timeRange] },
    );
    return {
      counselors,
      dashboard: normalizeDashboard(dashboardPayload),
      source: 'api',
    };
  } catch (error) {
    return {
      counselors,
      source: 'api',
      warning: `API tổng hợp bảng điều khiển chưa khả dụng; các số liệu tổng được tính từ dữ liệu tư vấn viên. ${
        error instanceof Error ? error.message : ''
      }`.trim(),
    };
  }
};

export const loadAnalyticsData = async (
  session: AuthSession,
  timeRange: TimeRange,
  filters: AnalyticsFilters,
  signal?: AbortSignal,
): Promise<AnalyticsDataResult> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const counselors = getActiveMockCounselors().filter(
      (counselor) => !filters.counselorId || counselor.id === filters.counselorId,
    );
    const totalAssessments = counselors.reduce(
      (sum, counselor) => sum + counselor.timeRangeMetrics[timeRange].completedSessions,
      0,
    );
    const totalTestResults = counselors.reduce(
      (sum, counselor) => sum + counselor.timeRangeMetrics[timeRange].completedTests,
      0,
    );
    const feedbackCount = counselors.reduce(
      (sum, counselor) => sum + counselor.timeRangeMetrics[timeRange].feedbackCount,
      0,
    );
    const weightedRating = counselors.reduce((sum, counselor) => {
      const metrics = counselor.timeRangeMetrics[timeRange];
      return sum + metrics.satisfactionScore * metrics.feedbackCount;
    }, 0);
    const positive = Math.round(feedbackCount * 0.7);
    const neutral = Math.round(feedbackCount * 0.2);
    const negative = Math.max(0, feedbackCount - positive - neutral);
    const period = API_PERIOD_BY_TIME_RANGE[timeRange];

    return {
      filterOptions: {
        counselors: getActiveMockCounselors().map((counselor) => ({
          id: counselor.id,
          name: counselor.name,
        })),
        tests: [],
        categories: ['Tổng hợp ẩn danh'],
      },
      studentTrends: {
        period,
        sampleSize: totalAssessments + totalTestResults,
        minimumSampleSize: 5,
        suppressed: false,
        totalAssessments,
        totalTestResults,
        timeline: [{ period, assessments: totalAssessments, testResults: totalTestResults }],
        categoryDistribution: [{
          category: 'Tổng hợp ẩn danh',
          count: totalAssessments + totalTestResults,
        }],
      },
      feedback: {
        period,
        sampleSize: feedbackCount,
        minimumSampleSize: 5,
        suppressed: false,
        averageRating: feedbackCount === 0
          ? null
          : Math.round((weightedRating / feedbackCount) * 100) / 100,
        distribution: { positive, neutral, negative },
        timeline: [{
          period,
          positive,
          neutral,
          negative,
          averageRating: feedbackCount === 0
            ? null
            : Math.round((weightedRating / feedbackCount) * 100) / 100,
        }],
      },
    };
  }

  const query = analyticsQuery(timeRange, filters);
  const analyticsRequestOptions: RequestInit = {
    headers: authorizationHeaders(session),
    cache: 'no-store',
    signal,
  };
  const [filterPayload, studentPayload, feedbackPayload] = await Promise.all([
    requestJson(ANALYTICS_FILTERS_ENDPOINT, analyticsRequestOptions),
    requestJson(STUDENT_TRENDS_ENDPOINT, analyticsRequestOptions, query),
    requestJson(FEEDBACK_ANALYTICS_ENDPOINT, analyticsRequestOptions, query),
  ]);

  return {
    filterOptions: normalizeFilterOptions(filterPayload),
    studentTrends: normalizeStudentTrends(studentPayload),
    feedback: normalizeFeedbackAnalytics(feedbackPayload),
  };
};

export const loadAuditLogs = async (
  session: AuthSession,
  signal?: AbortSignal,
): Promise<AuditLogItem[]> => {
  if (!isRemoteApiConfigured || session.source === 'mock') return [];
  const payload = await requestJson(
    AUDIT_LOGS_ENDPOINT,
    { headers: authorizationHeaders(session), signal },
    { limit: '100' },
  );
  const root = unwrapRecord(payload);
  return toArray(pick(root, 'auditLogs', 'audit_logs')).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      auditLogId: toStringValue(pick(record, 'audit_log_id', 'auditLogId')),
      actorRole: toStringValue(pick(record, 'actor_role', 'actorRole'), 'unknown'),
      action: toStringValue(pick(record, 'action')),
      entityType: toStringValue(pick(record, 'entity_type', 'entityType')),
      entityId: toStringValue(pick(record, 'entity_id', 'entityId')) || null,
      createdAt: toStringValue(pick(record, 'created_at', 'createdAt')),
    };
  });
};

export const downloadAnalyticsExport = async (
  session: AuthSession,
  timeRange: TimeRange,
  filters: AnalyticsFilters,
  type: 'overview' | 'student_trends' | 'feedback',
): Promise<void> => {
  const query = { ...analyticsQuery(timeRange, filters), type };
  let blob: Blob;
  let filename = `${type}-${API_PERIOD_BY_TIME_RANGE[timeRange]}.csv`;

  if (!isRemoteApiConfigured || session.source === 'mock') {
    const data = await loadAnalyticsData(session, timeRange, filters);
    const lines = type === 'feedback'
      ? [
          ['Phân loại', 'Số lượng'],
          ['Tích cực', data.feedback.distribution.positive],
          ['Trung lập', data.feedback.distribution.neutral],
          ['Tiêu cực', data.feedback.distribution.negative],
        ]
      : [
          ['Chỉ số', 'Giá trị'],
          ['Assessment', data.studentTrends.totalAssessments],
          ['Kết quả test', data.studentTrends.totalTestResults],
          ['Feedback', data.feedback.sampleSize],
        ];
    const content = `\uFEFF${lines.map((line) => line.join(',')).join('\r\n')}\r\n`;
    blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  } else {
    const response = await fetch(buildUrl(ANALYTICS_EXPORT_ENDPOINT, query), {
      headers: { Accept: 'text/csv', ...authorizationHeaders(session) },
      credentials: 'include',
    });
    if (!response.ok) throw new ApiError(getHttpErrorMessage(response.status), response.status);
    blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    const match = disposition?.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) filename = match[1];
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const loadCounselorDetail = async (
  session: AuthSession,
  counselorId: string,
  period: TimeRange,
): Promise<Counselor> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const counselor = getMockCounselors().find((item) => item.id === counselorId);
    if (!counselor) throw new ApiError('Không tìm thấy tư vấn viên.', 404);
    return counselor;
  }

  const counselors = await loadSheetCounselors(session, period);
  const counselor = counselors.find((item) =>
    normalizedRecordId(item.id) === normalizedRecordId(counselorId)
    || normalizedRecordId(item.externalId) === normalizedRecordId(counselorId));
  if (!counselor) throw new ApiError('Không tìm thấy tư vấn viên trên Sheet.', 404);
  return counselor;
};

export const createCounselor = async (
  session: AuthSession,
  input: CreateCounselorInput,
): Promise<Counselor> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const current = getMockCounselors();
    const thisMonth = createEmptyPeriodMetrics();
    const lastMonth = createEmptyPeriodMetrics();
    const allTime = createEmptyPeriodMetrics();
    const counselor = enforceCounselorKpiPolicy({
      id: crypto.randomUUID(),
      name: `${input.firstName} ${input.lastName}`.trim(),
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender ?? null,
      phoneNumber: input.phoneNumber ?? null,
      email: input.email ?? '',
      dateOfBirth: input.dateOfBirth ?? null,
      role: input.role ?? 'Tư vấn viên',
      specialization: input.specialization ?? 'Dịch vụ tham vấn',
      status: input.status,
      fteRatio: input.fteRatio ?? 1,
      title: input.role ?? 'Tư vấn viên',
      department: input.specialization ?? 'Dịch vụ tham vấn',
      avatarColor: AVATAR_COLORS[current.length % AVATAR_COLORS.length],
      assignedStudents: 0,
      kpis: thisMonth.kpis ?? createUnavailableKpis(),
      passedKpiCount: 0,
      failedKpiCount: 5,
      overallScore: 0,
      overallStatus: 'Insufficient Data',
      hrCompliance: createEmptyHrCompliance(),
      relationshipSummary: {
        assignedStudents: 0,
        completedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        completedTests: 0,
        pendingTests: 0,
        avgResponseHours: 0,
        satisfactionScore: 0,
      },
      timeRangeMetrics: {
        'this-month': thisMonth,
        'last-month': lastMonth,
        'all-time': allTime,
      },
    });
    saveMockCounselors([...current, counselor]);
    return counselor;
  }

  const payload = await requestJson(COUNSELORS_ENDPOINT, {
    method: 'POST',
    headers: authorizationHeaders(session),
    body: JSON.stringify(input),
  });
  return normalizeCounselor(extractCounselorRecord(payload), 0, 'this-month');
};

export const updateCounselor = async (
  session: AuthSession,
  counselorId: string,
  input: UpdateCounselorInput,
  period: TimeRange,
): Promise<Counselor> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const counselors = getMockCounselors();
    const index = counselors.findIndex((counselor) => counselor.id === counselorId);
    if (index < 0) throw new ApiError('Không tìm thấy tư vấn viên.', 404);
    const current = counselors[index];
    const firstName = input.firstName ?? current.firstName ?? current.name.split(' ')[0];
    const lastName = input.lastName ?? current.lastName ?? current.name.split(' ').slice(1).join(' ');
    const updated = withEditableProfile({
      ...current,
      ...input,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: input.email === undefined ? current.email : input.email ?? '',
      title: input.role === undefined ? current.title : input.role ?? 'Tư vấn viên',
      department: input.specialization === undefined
        ? current.department
        : input.specialization ?? 'Dịch vụ tham vấn',
    });
    counselors[index] = updated;
    saveMockCounselors(counselors);
    return updated;
  }

  const endpoint = COUNSELOR_DETAIL_ENDPOINT.replace(':id', encodeURIComponent(counselorId));
  const payload = await requestJson(
    endpoint,
    {
      method: 'PATCH',
      headers: authorizationHeaders(session),
      body: JSON.stringify(input),
    },
    { period: API_PERIOD_BY_TIME_RANGE[period] },
  );
  return normalizeCounselor(extractCounselorRecord(payload), 0, period);
};

export const deactivateCounselor = async (
  session: AuthSession,
  counselorId: string,
): Promise<void> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const counselors = getMockCounselors();
    const index = counselors.findIndex((counselor) => counselor.id === counselorId);
    if (index < 0) throw new ApiError('Không tìm thấy tư vấn viên.', 404);
    counselors[index] = { ...counselors[index], status: 'INACTIVE' };
    saveMockCounselors(counselors);
    return;
  }

  const endpoint = COUNSELOR_DETAIL_ENDPOINT.replace(':id', encodeURIComponent(counselorId));
  await requestJson(endpoint, {
    method: 'DELETE',
    headers: authorizationHeaders(session),
  });
};

export const loadStudents = async (
  session: AuthSession,
  signal?: AbortSignal,
): Promise<Student[]> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    return getMockStudents().filter((student) => student.status === 'ACTIVE');
  }
  const [students, counselors, assignments, parents, studentParents] = await Promise.all([
    loadSheetMirrorRows(session, 'students', signal),
    loadSheetMirrorRows(session, 'counselors', signal),
    loadSheetMirrorRows(session, 'counselor_assignments', signal),
    loadSheetMirrorRows(session, 'parents', signal),
    loadSheetMirrorRows(session, 'student_parents', signal),
  ]);
  return enrichSheetStudentRows(
    students,
    counselors,
    assignments,
    parents,
    studentParents,
  ).map(normalizeStudent).filter((student) => student.status !== 'INACTIVE');
};

export const loadDashboardSheetOperations = async (
  session: AuthSession,
  period: TimeRange,
  signal?: AbortSignal,
): Promise<SheetOperationsSummary> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    return calculateSheetOperationsSummary([], [], [], period);
  }
  const [bookings, tests, testAttempts] = await Promise.all([
    loadSheetMirrorRows(session, 'bookings', signal),
    loadSheetMirrorRows(session, 'tests', signal),
    loadSheetMirrorRows(session, 'test_attempts', signal),
  ]);
  return calculateSheetOperationsSummary(bookings, tests, testAttempts, period);
};

export const createStudent = async (
  session: AuthSession,
  input: CreateStudentInput,
): Promise<Student> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const student: Student = {
      id: crypto.randomUUID(),
      firstName: input.firstName,
      lastName: input.lastName,
      name: `${input.firstName} ${input.lastName}`.trim(),
      gender: input.gender ?? null,
      phoneNumber: input.phoneNumber,
      email: input.email ?? null,
      parentId: null,
      parentName: null,
      parentRelationship: null,
      parentIsPrimary: false,
      parentPhoneNumber: input.parentPhoneNumber ?? null,
      parentEmail: input.parentEmail ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      status: input.status,
      schoolLevel: input.schoolLevel ?? null,
      schoolId: null,
      addressId: null,
      assignedCounselorId: session.user.roleCode === 'counselor' ? session.user.id : null,
      assignedCounselorName: session.user.roleCode === 'counselor' ? session.user.name : null,
      assignmentStatus: session.user.roleCode === 'counselor' ? 'ACTIVE' : null,
      assignmentEndedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    saveMockStudents([...getMockStudents(), student]);
    return student;
  }
  const payload = await requestJson(STUDENTS_ENDPOINT, {
    method: 'POST',
    headers: authorizationHeaders(session),
    body: JSON.stringify(input),
  });
  return extractStudentRecord(payload);
};

export const updateStudent = async (
  session: AuthSession,
  studentId: string,
  input: UpdateStudentInput,
): Promise<Student> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const students = getMockStudents();
    const index = students.findIndex((student) => student.id === studentId);
    if (index < 0) throw new ApiError('Không tìm thấy Student.', 404);
    const current = students[index];
    const firstName = input.firstName ?? current.firstName;
    const lastName = input.lastName ?? current.lastName;
    students[index] = {
      ...current,
      ...input,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      updatedAt: new Date().toISOString(),
    };
    saveMockStudents(students);
    return students[index];
  }
  const endpoint = `${STUDENTS_ENDPOINT}/${encodeURIComponent(studentId)}`;
  const payload = await requestJson(endpoint, {
    method: 'PATCH',
    headers: authorizationHeaders(session),
    body: JSON.stringify(input),
  });
  return extractStudentRecord(payload);
};

export const deactivateStudent = async (
  session: AuthSession,
  studentId: string,
): Promise<void> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const students = getMockStudents();
    const index = students.findIndex((student) => student.id === studentId);
    if (index < 0) throw new ApiError('Không tìm thấy Student.', 404);
    students[index] = { ...students[index], status: 'INACTIVE', updatedAt: new Date().toISOString() };
    saveMockStudents(students);
    return;
  }
  await requestJson(`${STUDENTS_ENDPOINT}/${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
    headers: authorizationHeaders(session),
  });
};

export const saveSession = (session: AuthSession): void => {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const restoreSession = (): AuthSession | null => {
  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as AuthSession;
    if (
      !session.user?.email
      || session.user.roleCode !== 'admin'
      || (session.source !== 'api' && session.source !== 'mock')
    ) return null;
    // Never keep a browser-only demo session once this build is connected to
    // the production API. It would make the UI continue showing mock metrics
    // even after the database has changed.
    if (isRemoteApiConfigured && session.source !== 'api') return null;
    return {
      ...session,
      user: {
        ...session.user,
        name: localizeProfileLabel(session.user.name, 'Người quản trị'),
        role: localizeProfileLabel(session.user.role, 'Quản trị viên'),
        roleCode: 'admin',
      },
    };
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
};
