import {
  enforceCounselorKpiPolicy,
  OFFICIAL_KPI_DEFINITIONS,
} from '../domain/kpiPolicy';
import { getDashboardMetricsByTimeRange, INITIAL_COUNSELORS } from '../mockData';
import {
  AdminUser,
  AuthSession,
  Counselor,
  CounselorPeriodMetrics,
  CreateCounselorInput,
  DashboardMetrics,
  KpiEvidence,
  KPIItem,
  RelationshipSummary,
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

export const DEMO_ACCOUNTS = [
  {
    label: 'Quản trị giám sát',
    email: 'admin@campus-counseling.edu',
    role: 'Quản trị giám sát',
  },
  {
    label: 'Trưởng nhóm chuyên môn',
    email: 'admin.lead@campus-counseling.edu',
    role: 'Trưởng nhóm chuyên môn',
  },
  {
    label: 'Giám sát dịch vụ',
    email: 'supervisor@campus-counseling.edu',
    role: 'Giám sát dịch vụ',
  },
] as const;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT ?? '/auth/login';
const COUNSELORS_ENDPOINT = import.meta.env.VITE_COUNSELORS_ENDPOINT ?? '/admin/counselors';
const COUNSELOR_DETAIL_ENDPOINT =
  import.meta.env.VITE_COUNSELOR_DETAIL_ENDPOINT ?? '/admin/counselors/:id';
const DASHBOARD_ENDPOINT = import.meta.env.VITE_DASHBOARD_ENDPOINT ?? '/admin/dashboard';
const parsedTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? '10000');
const API_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 10000;
const SESSION_STORAGE_KEY = 'digital-twin-admin-session';
const MOCK_COUNSELORS_STORAGE_KEY = 'digital-twin-admin-mock-counselors-v1';
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

const localizeCounselorName = (name: string): string =>
  name.replace(/^Demo Counselor\s+([A-Z])$/i, 'Tư vấn viên mẫu $1');

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
  });
};

const getMockCounselors = (): Counselor[] => {
  try {
    const stored = window.localStorage.getItem(MOCK_COUNSELORS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Counselor[];
      if (Array.isArray(parsed)) return parsed.map(withEditableProfile);
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
    isPassed: false,
    notes: 'Chưa có dữ liệu phân tích demo nào được ghi nhận cho tư vấn viên này.',
  }));

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
  overallStatus: 'Not Pass',
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
  caseload_compliance: 'caseload-compliance',
  session_completion_rate: 'session-completion-rate',
  booking_cancellation_rate: 'booking-cancellation-rate',
  test_completion_rate: 'test-completion-rate',
  student_satisfaction: 'student-satisfaction',
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
  const evidence: KpiEvidence = {};
  if (Number.isFinite(numerator)) evidence.numerator = numerator;
  if (Number.isFinite(denominator)) evidence.denominator = denominator;
  if (Number.isFinite(sampleSize)) evidence.sampleSize = sampleSize;
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
    // The strict KPI policy recalculates this value from actual and target values.
    isPassed: false,
    notes: toStringValue(pick(raw, 'notes', 'note', 'description'), 'Chưa có ghi chú kiểm định.'),
    evidence: normalizeEvidence(pick(raw, 'evidence', 'calculation', 'calculation_evidence')),
  };
};

const normalizeKpis = (value: unknown): KPIItem[] =>
  toArray(value).map((kpi, index) => normalizeKpi(kpi, index));

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
    overallStatus: 'Not Pass',
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
    status: (toStringValue(pick(value, 'status'), 'ACTIVE').toUpperCase() as Counselor['status']),
    avatarColor: toStringValue(
      pick(value, 'avatarColor', 'avatar_color'),
      AVATAR_COLORS[index % AVATAR_COLORS.length],
    ),
    assignedStudents: relationshipSummary.assignedStudents,
    kpis,
    passedKpiCount: 0,
    failedKpiCount: 5,
    overallStatus: 'Not Pass',
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
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(endpoint, query), {
      ...options,
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
      throw new ApiError(`Yêu cầu API đã quá thời gian chờ ${API_TIMEOUT_MS} mili giây.`);
    }
    throw new ApiError('Không thể kết nối đến API. Vui lòng kiểm tra máy chủ và kết nối mạng.');
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const authorizationHeaders = (session: AuthSession): HeadersInit =>
  session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};

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
  const user: AdminUser = {
    id: toStringValue(pick(userRecord, 'id', 'userId', 'user_id'), email),
    name: localizeProfileLabel(pick(userRecord, 'name', 'fullName', 'full_name'), 'Người quản trị'),
    email,
    role: localizeProfileLabel(pick(userRecord, 'role'), 'Quản trị viên'),
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
): Promise<AdminDataResult> => {
  if (!isRemoteApiConfigured || session.source === 'mock') {
    const counselors = getActiveMockCounselors();
    return {
      counselors,
      dashboard: getDashboardMetricsByTimeRange(timeRange, counselors),
      source: 'mock',
    };
  }

  const counselorsPayload = await requestJson(COUNSELORS_ENDPOINT, {
    headers: authorizationHeaders(session),
  }, { period: API_PERIOD_BY_TIME_RANGE[timeRange] });
  const counselors = extractCounselorArray(counselorsPayload).map((value, index) =>
    normalizeCounselor(value, index, timeRange),
  );

  try {
    const dashboardPayload = await requestJson(
      DASHBOARD_ENDPOINT,
      { headers: authorizationHeaders(session) },
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

  const endpoint = COUNSELOR_DETAIL_ENDPOINT.replace(':id', encodeURIComponent(counselorId));
  const payload = await requestJson(
    endpoint,
    { headers: authorizationHeaders(session) },
    { period: API_PERIOD_BY_TIME_RANGE[period] },
  );
  return normalizeCounselor(extractCounselorRecord(payload), 0, period);
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
      title: input.role ?? 'Tư vấn viên',
      department: input.specialization ?? 'Dịch vụ tham vấn',
      avatarColor: AVATAR_COLORS[current.length % AVATAR_COLORS.length],
      assignedStudents: 0,
      kpis: thisMonth.kpis ?? createUnavailableKpis(),
      passedKpiCount: 0,
      failedKpiCount: 5,
      overallStatus: 'Not Pass',
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

export const saveSession = (session: AuthSession): void => {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const restoreSession = (): AuthSession | null => {
  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as AuthSession;
    if (!session.user?.email || (session.source !== 'api' && session.source !== 'mock')) return null;
    return {
      ...session,
      user: {
        ...session.user,
        name: localizeProfileLabel(session.user.name, 'Người quản trị'),
        role: localizeProfileLabel(session.user.role, 'Quản trị viên'),
      },
    };
  } catch {
    return null;
  }
};

export const clearSession = (): void => {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
};
