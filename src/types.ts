export type TimeRange = 'this-month' | 'last-month' | 'all-time';

export type CounselorStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export type ScreenType =
  | 'login'
  | 'dashboard'
  | 'knowledge-graph'
  | 'counselor-management'
  | 'counselors'
  | 'counselor-detail'
  | 'students'
  | 'student-trends'
  | 'feedback-analytics'
  | 'audit-logs';

export type OfficialKpiId =
  | 'caseload-compliance'
  | 'session-completion-rate'
  | 'booking-cancellation-rate'
  | 'test-completion-rate'
  | 'student-satisfaction';

export interface KpiEvidence {
  numerator?: number;
  denominator?: number;
  sampleSize?: number;
}

export interface KPIItem {
  id: string;
  name: string;
  category: string;
  actualValue: string;
  actualNumeric: number;
  targetValue: string;
  targetNumeric: number;
  unit: string;
  comparisonType: 'gte' | 'lte' | 'exact'; // greater-than-or-equal, less-than-or-equal, exact
  isPassed: boolean;
  notes: string;
  evidence?: KpiEvidence;
}

export interface RelationshipSummary {
  assignedStudents: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedTests: number;
  pendingTests: number;
  avgResponseHours: number;
  satisfactionScore: number;
}

export interface CounselorPeriodMetrics {
  assignedStudents: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedTests: number;
  pendingTests: number;
  completedSessions: number;
  totalSessions: number;
  assignedTests: number;
  satisfactionScore: number;
  feedbackCount: number;
  passedKpiCount: number;
  overallStatus: 'Pass' | 'Not Pass';
  // The API should provide a period-specific set when KPI results vary by period.
  // When omitted, the latest counselor-level KPI set is used.
  kpis?: KPIItem[];
}

export interface Counselor {
  id: string; // e.g. "CO-101"
  name: string;
  title: string;
  department: string;
  email: string;
  firstName?: string;
  lastName?: string;
  gender?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  role?: string | null;
  specialization?: string | null;
  status?: CounselorStatus;
  avatarColor: string;
  assignedStudents: number;
  kpis: KPIItem[]; // exactly 5 KPIs
  passedKpiCount: number; // calculated: count of isPassed == true
  failedKpiCount: number; // includes an incomplete/invalid KPI-set policy failure
  overallStatus: 'Pass' | 'Not Pass'; // 'Pass' ONLY for exactly 5 unique, passing KPIs
  relationshipSummary: RelationshipSummary;
  timeRangeMetrics: Record<TimeRange, CounselorPeriodMetrics>;
}

export interface CreateCounselorInput {
  firstName: string;
  lastName: string;
  gender?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  role?: string | null;
  specialization?: string | null;
  status: CounselorStatus;
}

export type UpdateCounselorInput = Partial<CreateCounselorInput>;

export type StudentStatus = 'ACTIVE' | 'INACTIVE';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: string | null;
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  status: StudentStatus;
  schoolId: string | null;
  addressId: string | null;
  assignedCounselorId: string | null;
  assignedCounselorName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  gender?: string | null;
  phoneNumber: string;
  email?: string | null;
  dateOfBirth?: string | null;
  status: StudentStatus;
  counselorId?: string | null;
}

export type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'counselorId'>>;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleCode?: 'admin' | 'counselor';
}

export interface AuthSession {
  accessToken?: string;
  user: AdminUser;
  source: 'api' | 'mock';
}

export interface DashboardMetrics {
  totalStudents: number;
  activeCounselors: number;
  totalTests: number;
  totalTestAttempts: number;
  totalBookings: number;
  passedCounselors: number;
  notPassedCounselors: number;
  bookingsBreakdown: {
    completed: number;
    pending: number;
    cancelled: number;
  };
  monthlyTrends: {
    month: string;
    completed: number;
    pending: number;
    cancelled: number;
  }[];
  counselorPassHistory: {
    label: string;
    passed: number;
    notPassed: number;
  }[];
  lastUpdated: string;
  syncNode: string;
}

export interface AnalyticsFilters {
  counselorId: string;
  testId: string;
  category: string;
}

export interface AnalyticsFilterOptions {
  counselors: Array<{ id: string; name: string }>;
  tests: Array<{ id: string; name: string; type: string | null }>;
  categories: string[];
}

export interface StudentTrendAnalytics {
  period: string;
  sampleSize: number;
  minimumSampleSize: number;
  suppressed: boolean;
  totalAssessments: number;
  totalTestResults: number;
  timeline: Array<{
    period: string;
    assessments: number;
    testResults: number;
  }>;
  categoryDistribution: Array<{ category: string; count: number }>;
}

export interface FeedbackAnalytics {
  period: string;
  sampleSize: number;
  minimumSampleSize: number;
  suppressed: boolean;
  averageRating: number | null;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  timeline: Array<{
    period: string;
    positive: number;
    neutral: number;
    negative: number;
    averageRating: number | null;
  }>;
}

export interface AuditLogItem {
  auditLogId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}
