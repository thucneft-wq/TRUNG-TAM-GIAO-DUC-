import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import {
  AnalyticsFilterOptions,
  AnalyticsFilters,
  AuthSession,
  AuditLogItem,
  Counselor,
  CreateCounselorInput,
  DashboardMetrics,
  FeedbackAnalytics,
  ScreenType,
  StudentTrendAnalytics,
  Student,
  StudentDataSourceState,
  CreateStudentInput,
  TimeRange,
} from './types';
import { getDashboardMetricsByTimeRange } from './mockData';
import {
  clearSession,
  createCounselor,
  deactivateCounselor,
  createStudent,
  deactivateStudent,
  downloadAnalyticsExport,
  loadAdminData,
  loadAnalyticsData,
  loadAuditLogs,
  loadStudents,
  isCrudDemoMode,
  isRemoteApiConfigured,
  isWebCrudEnabled,
  googleStudentThcsEntryUrl,
  googleStudentThptEntryUrl,
  googleCounselorEntryUrl,
  analyticsSyncIntervalMs,
  clearDashboardOperationsSheetMirrorCache,
  clearStudentCounselorSheetMirrorCache,
  clearStudentParentSheetMirrorCache,
  clearStudentSheetMirrorCache,
  loadDashboardSheetOperations,
  loadStudentParentData,
  reloadStudentCounselorData,
  studentSyncIntervalMs,
  restoreSession,
  saveSession,
  UNAUTHORIZED_EVENT,
  updateCounselor,
  updateStudent,
} from './services/api';
import { countActiveStudentsByLevel } from './domain/sheetStudentPolicy';
import {
  createLoadingSheetOperationsState,
  type DashboardSheetOperationsState,
  type SheetOperationSourceKey,
} from './domain/sheetOperationsPolicy';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { CounselorListScreen } from './components/CounselorListScreen';
import { CounselorDetailScreen } from './components/CounselorDetailScreen';
import { StudentTrendsScreen } from './components/StudentTrendsScreen';
import { FeedbackAnalyticsScreen } from './components/FeedbackAnalyticsScreen';
import { AuditLogsScreen } from './components/AuditLogsScreen';
import { StudentManagementScreen } from './components/StudentManagementScreen';
import { CounselorSheetManagementScreen } from './components/CounselorSheetManagementScreen';
import { KnowledgeGraphScreen } from './components/KnowledgeGraphScreen';
import { Alert, Button } from './components/ui/Primitives';

const EMPTY_FILTER_OPTIONS: AnalyticsFilterOptions = {
  counselors: [],
  tests: [],
  categories: [],
};

const EMPTY_STUDENT_TRENDS: StudentTrendAnalytics = {
  period: 'this_month',
  sampleSize: 0,
  minimumSampleSize: 5,
  suppressed: false,
  totalAssessments: 0,
  totalTestResults: 0,
  timeline: [],
  categoryDistribution: [],
};

const EMPTY_FEEDBACK: FeedbackAnalytics = {
  period: 'this_month',
  sampleSize: 0,
  minimumSampleSize: 5,
  suppressed: false,
  averageRating: null,
  distribution: { positive: 0, neutral: 0, negative: 0 },
  timeline: [],
};

type CounselorDetailSource = 'dashboard' | 'counselors' | 'counselor-management';

const loadingStudentSource = (): StudentDataSourceState => ({
  status: 'loading',
  error: null,
  lastUpdated: null,
});

const studentSourceAvailable = (): StudentDataSourceState => ({
  status: 'available',
  error: null,
  lastUpdated: new Date().toISOString(),
});

const studentSourceError = (error: unknown, fallback: string): StudentDataSourceState => ({
  status: 'error',
  error: error instanceof Error ? error.message : fallback,
  lastUpdated: null,
});

const studentLookup = (students: Student[]): Map<string, Student> => {
  const lookup = new Map<string, Student>();
  students.forEach((student) => {
    lookup.set(student.id, student);
    if (student.externalId) lookup.set(student.externalId, student);
  });
  return lookup;
};

const mergeStudentParentDetails = (current: Student[], hydrated: Student[]): Student[] => {
  const incoming = studentLookup(hydrated);
  return current.map((student) => {
    const updated = incoming.get(student.id) ?? (student.externalId ? incoming.get(student.externalId) : undefined);
    return updated ? {
      ...student,
      parentId: updated.parentId,
      parentName: updated.parentName,
      parentRelationship: updated.parentRelationship,
      parentIsPrimary: updated.parentIsPrimary,
      parentPhoneNumber: updated.parentPhoneNumber,
      parentEmail: updated.parentEmail,
    } : student;
  });
};

const mergeStudentCounselorDetails = (current: Student[], hydrated: Student[]): Student[] => {
  const incoming = studentLookup(hydrated);
  return current.map((student) => {
    const updated = incoming.get(student.id) ?? (student.externalId ? incoming.get(student.externalId) : undefined);
    return updated ? {
      ...student,
      assignedCounselorId: updated.assignedCounselorId,
      assignedCounselorName: updated.assignedCounselorName,
      assignmentStatus: updated.assignmentStatus,
      assignmentEndedAt: updated.assignmentEndedAt,
    } : student;
  });
};

const DEFAULT_ADMIN_SESSION: AuthSession = {
  user: {
    id: 'demo-admin',
    name: 'Người quản trị',
    email: 'admin@campus-counseling.edu',
    role: 'Quản trị viên',
    roleCode: 'admin',
  },
  source: 'mock',
};

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    restoreSession() ?? (isRemoteApiConfigured ? null : DEFAULT_ADMIN_SESSION),
  );
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('this-month');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string | null>(null);
  const [counselorDetailSource, setCounselorDetailSource] =
    useState<CounselorDetailSource>('counselors');
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null);
  const [remoteDashboard, setRemoteDashboard] = useState<DashboardMetrics | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>(session?.source ?? 'mock');
  const [isDataLoading, setIsDataLoading] = useState(Boolean(session));
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({
    counselorId: '',
    testId: '',
    category: '',
  });
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [studentTrends, setStudentTrends] = useState(EMPTY_STUDENT_TRENDS);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState(EMPTY_FEEDBACK);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(Boolean(session));
  const [studentsSource, setStudentsSource] = useState<StudentDataSourceState>(() =>
    session ? loadingStudentSource() : { status: 'available', error: null, lastUpdated: null });
  const [parentsSource, setParentsSource] = useState<StudentDataSourceState>(loadingStudentSource);
  const [counselorsSource, setCounselorsSource] = useState<StudentDataSourceState>(loadingStudentSource);
  const [studentRefreshKey, setStudentRefreshKey] = useState(0);
  const [isStudentParentRetrying, setIsStudentParentRetrying] = useState(false);
  const studentParentRetryController = useRef<AbortController | null>(null);
  const [isStudentCounselorRetrying, setIsStudentCounselorRetrying] = useState(false);
  const studentCounselorRetryController = useRef<AbortController | null>(null);
  const [sheetOperations, setSheetOperations] = useState<DashboardSheetOperationsState>(
    createLoadingSheetOperationsState,
  );
  const sheetOperationRetryControllers = useRef<
    Partial<Record<SheetOperationSourceKey, AbortController>>
  >({});
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [initialCounselorFilter, setInitialCounselorFilter] =
    useState<'all' | 'pass' | 'not-pass'>('all');

  const selectedCounselor = useMemo(
    () => counselors.find((counselor) => counselor.id === selectedCounselorId) ?? null,
    [counselors, selectedCounselorId],
  );

  const derivedDashboard = useMemo(
    () => getDashboardMetricsByTimeRange(timeRange, counselors),
    [timeRange, counselors],
  );

  const activeStudentSummary = useMemo(
    () => countActiveStudentsByLevel(students),
    [students],
  );

  const isStudentsLoading = studentsSource.status === 'loading';
  const studentsError = studentsSource.status === 'error' ? studentsSource.error : null;
  const studentsLastUpdated = studentsSource.lastUpdated;

  // API totals and trend data are used when available. Counselor pass/fail values
  // always come from the frontend's strict five-KPI policy.
  const dashboardMetrics = useMemo<DashboardMetrics>(() => {
    if (!remoteDashboard) {
      return { ...derivedDashboard, totalStudents: activeStudentSummary.total };
    }

    return {
      ...remoteDashboard,
      // Student totals are authoritative only from the Sheet Mirror student load.
      totalStudents: activeStudentSummary.total,
      activeCounselors: derivedDashboard.activeCounselors,
      passedCounselors: derivedDashboard.passedCounselors,
      notPassedCounselors: derivedDashboard.notPassedCounselors,
      counselorPassHistory: derivedDashboard.counselorPassHistory,
      monthlyTrends:
        remoteDashboard.monthlyTrends.length > 0
          ? remoteDashboard.monthlyTrends
          : derivedDashboard.monthlyTrends,
    };
  }, [activeStudentSummary.total, derivedDashboard, remoteDashboard]);

  useEffect(() => {
    if (!session || session.user.roleCode !== 'admin') {
      setIsDataLoading(false);
      return;
    }

    let isCurrentRequest = true;
    const controller = new AbortController();
    setIsDataLoading(true);
    setDataError(null);
    setDataWarning(null);

    loadAdminData(session, timeRange, controller.signal)
      .then((result) => {
        if (!isCurrentRequest) return;
        setCounselors(result.counselors);
        setRemoteDashboard(result.dashboard ?? null);
        setDataSource(result.source);
        setDataWarning(result.warning ?? null);
        setSelectedCounselorId((currentId) => {
          if (currentId && result.counselors.some((counselor) => counselor.id === currentId)) {
            return currentId;
          }
          return null;
        });
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        setDataError(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản trị.');
        setRemoteDashboard(null);
      })
      .finally(() => {
        if (isCurrentRequest) setIsDataLoading(false);
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [session, timeRange, refreshKey]);

  useEffect(() => {
    if (!session || session.user.roleCode !== 'admin' || isCrudDemoMode) {
      setIsAnalyticsLoading(false);
      return;
    }
    let isCurrentRequest = true;
    const controller = new AbortController();
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);

    loadAnalyticsData(session, timeRange, analyticsFilters, controller.signal)
      .then((result) => {
        if (!isCurrentRequest) return;
        setFilterOptions(result.filterOptions);
        setStudentTrends(result.studentTrends);
        setFeedbackAnalytics(result.feedback);
      })
      .catch((error) => {
        if (!isCurrentRequest) return;
        setAnalyticsError(
          error instanceof Error ? error.message : 'Không thể tải dữ liệu phân tích mở rộng.',
        );
      })
      .finally(() => {
        if (isCurrentRequest) setIsAnalyticsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [session, timeRange, analyticsFilters, refreshKey]);

  useEffect(() => {
    if (!session) return;
    let isCurrentRequest = true;
    const controller = new AbortController();
    setStudentsSource(loadingStudentSource());
    setParentsSource(loadingStudentSource());
    setCounselorsSource(loadingStudentSource());
    loadStudents(session, controller.signal)
      .then((result) => {
        if (!isCurrentRequest) return;
        const renderStartedAt = performance.now();
        setStudents(result.students);
        setStudentsSource(studentSourceAvailable());
        requestAnimationFrame(() => {
          console.info('[student-source]', {
            source: 'students',
            phase: 'render',
            rowCount: result.students.length,
            durationMs: Math.round(performance.now() - renderStartedAt),
            result: 'success',
          });
        });

        void loadStudentParentData(session, result.students, controller.signal)
          .then((parentResult) => {
            if (!isCurrentRequest) return;
            setStudents((current) => mergeStudentParentDetails(current, parentResult.students));
            setParentsSource(studentSourceAvailable());
          })
          .catch((error) => {
            if (!isCurrentRequest || controller.signal.aborted) return;
            setParentsSource(studentSourceError(
              error,
              'Tạm thời chưa tải được thông tin phụ huynh.',
            ));
          });

        void reloadStudentCounselorData(session, result.students, controller.signal)
          .then((counselorResult) => {
            if (!isCurrentRequest) return;
            if (!counselorResult.counselorDataAvailable) {
              setCounselorsSource({
                status: 'error',
                error: counselorResult.counselorWarning
                  ?? 'Tạm thời chưa tải được phân công.',
                lastUpdated: null,
              });
              return;
            }
            setStudents((current) => mergeStudentCounselorDetails(current, counselorResult.students));
            setCounselorsSource(studentSourceAvailable());
          })
          .catch((error) => {
            if (!isCurrentRequest || controller.signal.aborted) return;
            setCounselorsSource(studentSourceError(
              error,
              'Tạm thời chưa tải được phân công.',
            ));
          });
      })
      .catch((error) => {
        if (!isCurrentRequest || controller.signal.aborted) return;
        setStudentsSource(studentSourceError(error, 'Không thể tải danh sách học sinh.'));
        setParentsSource({
          status: 'error',
          error: 'Không thể tải thông tin phụ huynh khi danh sách học sinh chưa sẵn sàng.',
          lastUpdated: null,
        });
        setCounselorsSource({
          status: 'error',
          error: 'Không thể tải phân công khi danh sách học sinh chưa sẵn sàng.',
          lastUpdated: null,
        });
      });
    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [session, studentRefreshKey]);

  useEffect(() => () => {
    studentParentRetryController.current?.abort();
    studentCounselorRetryController.current?.abort();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    let isCurrentRequest = true;
    const controller = new AbortController();
    (['bookings', 'tests', 'test_attempts'] as SheetOperationSourceKey[]).forEach((source) => {
      sheetOperationRetryControllers.current[source]?.abort();
      delete sheetOperationRetryControllers.current[source];
    });
    setSheetOperations(createLoadingSheetOperationsState());

    (['bookings', 'tests', 'test_attempts'] as SheetOperationSourceKey[]).forEach((source) => {
      loadDashboardSheetOperations(session, timeRange, source, controller.signal)
        .then((result) => {
          if (!isCurrentRequest) return;
          setSheetOperations((current) => ({ ...current, ...result }));
        });
    });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [session, timeRange]);

  useEffect(() => () => {
    (['bookings', 'tests', 'test_attempts'] as SheetOperationSourceKey[]).forEach((source) => {
      sheetOperationRetryControllers.current[source]?.abort();
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    const activeControllers = new Set<AbortController>();
    const intervalId = window.setInterval(() => {
      const controller = new AbortController();
      activeControllers.add(controller);
      let pendingRequests = session.user.roleCode === 'admin' ? 2 : 1;
      const markRequestFinished = () => {
        pendingRequests -= 1;
        if (pendingRequests === 0) activeControllers.delete(controller);
      };
      loadStudents(session, controller.signal).then(async (result) => {
        setStudents(result.students);
        setStudentsSource(studentSourceAvailable());
        setParentsSource(loadingStudentSource());
        setCounselorsSource(loadingStudentSource());

        await Promise.allSettled([
          loadStudentParentData(session, result.students, controller.signal).then((parentResult) => {
            setStudents((current) => mergeStudentParentDetails(current, parentResult.students));
            setParentsSource(studentSourceAvailable());
          }).catch((error) => {
            if (!controller.signal.aborted) {
              setParentsSource(studentSourceError(
                error,
                'Tạm thời chưa tải được thông tin phụ huynh.',
              ));
            }
          }),
          reloadStudentCounselorData(session, result.students, controller.signal).then((counselorResult) => {
            if (!counselorResult.counselorDataAvailable) {
              setCounselorsSource({
                status: 'error',
                error: counselorResult.counselorWarning ?? 'Tạm thời chưa tải được phân công.',
                lastUpdated: null,
              });
              return;
            }
            setStudents((current) => mergeStudentCounselorDetails(current, counselorResult.students));
            setCounselorsSource(studentSourceAvailable());
          }).catch((error) => {
            if (!controller.signal.aborted) {
              setCounselorsSource(studentSourceError(
                error,
                'Tạm thời chưa tải được phân công.',
              ));
            }
          }),
        ]);
      }).catch(() => {
        // Keep the last successful list; the next interval retries automatically.
      }).finally(markRequestFinished);
      if (session.user.roleCode === 'admin') {
        loadAdminData(session, timeRange, controller.signal).then((result) => {
          setCounselors(result.counselors);
          setRemoteDashboard(result.dashboard ?? null);
          setDataSource(result.source);
          setDataWarning(result.warning ?? null);
        }).catch(() => {
          // Keep the last successful Counselor list and retry on the next interval.
        }).finally(markRequestFinished);
      }
    }, studentSyncIntervalMs);
    return () => {
      window.clearInterval(intervalId);
      activeControllers.forEach((controller) => controller.abort());
    };
  }, [session, timeRange, refreshKey]);

  useEffect(() => {
    if (
      !session ||
      session.user.roleCode !== 'admin' ||
      isCrudDemoMode ||
      currentScreen !== 'feedback-analytics'
    ) return;

    let isActive = true;
    let isRequestRunning = false;
    let activeController: AbortController | null = null;
    const refreshFeedback = async () => {
      if (isRequestRunning) return;
      isRequestRunning = true;
      activeController = new AbortController();
      try {
        const result = await loadAnalyticsData(
          session,
          timeRange,
          analyticsFilters,
          activeController.signal,
        );
        if (!isActive) return;
        setFilterOptions(result.filterOptions);
        setStudentTrends(result.studentTrends);
        setFeedbackAnalytics(result.feedback);
        setAnalyticsError(null);
      } catch (error) {
        if (!isActive) return;
        setAnalyticsError(
          error instanceof Error ? error.message : 'Không thể cập nhật dữ liệu feedback.',
        );
      } finally {
        isRequestRunning = false;
        activeController = null;
      }
    };

    const intervalId = window.setInterval(() => void refreshFeedback(), analyticsSyncIntervalMs);
    const refreshOnFocus = () => void refreshFeedback();
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      isActive = false;
      activeController?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [session, currentScreen, timeRange, analyticsFilters, refreshKey]);

  useEffect(() => {
    if (session?.user.roleCode === 'counselor' && currentScreen !== 'students') {
      setCurrentScreen('students');
      return;
    }
    if (
      isCrudDemoMode &&
      session?.user.roleCode === 'admin' &&
      currentScreen !== 'dashboard' &&
      currentScreen !== 'knowledge-graph' &&
      currentScreen !== 'students' &&
      currentScreen !== 'counselor-management' &&
      currentScreen !== 'counselors' &&
      currentScreen !== 'counselor-detail'
    ) {
      setCurrentScreen('dashboard');
    }
  }, [session, currentScreen]);

  useEffect(() => {
    if (
      session?.user.roleCode === 'admin'
      && currentScreen === 'counselor-detail'
      && !selectedCounselorId
      && !isDataLoading
    ) {
      setNavigationNotice('Hãy chọn một tư vấn viên trước khi mở chi tiết KPI.');
      setCurrentScreen('counselors');
    }
  }, [session, currentScreen, selectedCounselorId, isDataLoading]);

  useEffect(() => {
    if (!session || session.user.roleCode !== 'admin' || currentScreen !== 'audit-logs') return;
    const controller = new AbortController();
    loadAuditLogs(session, controller.signal)
      .then(setAuditLogs)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setAnalyticsError(error instanceof Error ? error.message : 'Không thể tải nhật ký audit.');
        }
      });
    return () => controller.abort();
  }, [session, currentScreen, refreshKey]);

  const handleLogin = (authenticatedSession: AuthSession) => {
    if (authenticatedSession.user.roleCode !== 'admin') {
      clearSession();
      setSession(null);
      setDataError('Tài khoản này không có quyền truy cập cổng quản trị.');
      return;
    }
    saveSession(authenticatedSession);
    setSession(authenticatedSession);
    setDataSource(authenticatedSession.source);
    setSelectedCounselorId(null);
    setCounselorDetailSource('counselors');
    setNavigationNotice(null);
    setCurrentScreen('dashboard');
    setIsDataLoading(true);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setCounselors([]);
    setStudents([]);
    setSelectedCounselorId(null);
    setRemoteDashboard(null);
    setDataError(null);
    setStudentsSource({ status: 'available', error: null, lastUpdated: null });
    setParentsSource({ status: 'available', error: null, lastUpdated: null });
    setCounselorsSource({ status: 'available', error: null, lastUpdated: null });
    setSheetOperations(createLoadingSheetOperationsState());
    setDataWarning(null);
    setAnalyticsError(null);
    setAuditLogs([]);
    setCounselorDetailSource('counselors');
    setNavigationNotice(null);
    setCurrentScreen('login');
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const handleUnauthorized = () => handleLogout();
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const handleCreateCounselor = async (input: CreateCounselorInput) => {
    if (!session) return;
    await createCounselor(session, input);
    setRefreshKey((key) => key + 1);
  };

  const handleUpdateCounselor = async (input: CreateCounselorInput) => {
    if (!session || !selectedCounselorId) return;
    const updated = await updateCounselor(session, selectedCounselorId, input, timeRange);
    setCounselors((current) =>
      current.map((counselor) => counselor.id === updated.id ? updated : counselor),
    );
    setRefreshKey((key) => key + 1);
  };

  const handleDeactivateCounselor = async () => {
    if (!session || !selectedCounselorId) return;
    await deactivateCounselor(session, selectedCounselorId);
    setSelectedCounselorId(null);
    setRefreshKey((key) => key + 1);
  };

  const handleCreateStudent = async (input: CreateStudentInput) => {
    if (!session) return;
    const created = await createStudent(session, input);
    setStudents((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
  };

  const handleUpdateStudent = async (id: string, input: Partial<CreateStudentInput>) => {
    if (!session) return;
    const allowedInput = { ...input };
    delete allowedInput.counselorId;
    const updated = await updateStudent(session, id, allowedInput);
    setStudents((current) => current.map((student) => student.id === id ? updated : student));
  };

  const handleDeactivateStudent = async (id: string) => {
    if (!session) return;
    await deactivateStudent(session, id);
    setStudents((current) => current.filter((student) => student.id !== id));
  };

  const handleStudentsRefresh = () => {
    clearStudentSheetMirrorCache();
    clearStudentParentSheetMirrorCache();
    clearStudentCounselorSheetMirrorCache();
    studentParentRetryController.current?.abort();
    studentCounselorRetryController.current?.abort();
    setStudentsSource(loadingStudentSource());
    setParentsSource(loadingStudentSource());
    setCounselorsSource(loadingStudentSource());
    setStudentRefreshKey((key) => key + 1);
  };

  const handleStudentParentRetry = async () => {
    if (!session || students.length === 0) return;
    studentParentRetryController.current?.abort();
    clearStudentParentSheetMirrorCache();
    const controller = new AbortController();
    studentParentRetryController.current = controller;
    setIsStudentParentRetrying(true);
    setParentsSource(loadingStudentSource());
    try {
      const result = await loadStudentParentData(session, students, controller.signal);
      if (studentParentRetryController.current !== controller) return;
      setStudents((current) => mergeStudentParentDetails(current, result.students));
      setParentsSource(studentSourceAvailable());
    } catch (error) {
      if (controller.signal.aborted) return;
      setParentsSource(studentSourceError(
        error,
        'Tạm thời chưa tải được thông tin phụ huynh.',
      ));
    } finally {
      if (studentParentRetryController.current === controller) {
        studentParentRetryController.current = null;
        setIsStudentParentRetrying(false);
      }
    }
  };

  const handleStudentCounselorRetry = async () => {
    if (!session) return;
    studentCounselorRetryController.current?.abort();
    clearStudentCounselorSheetMirrorCache();
    const controller = new AbortController();
    studentCounselorRetryController.current = controller;
    setIsStudentCounselorRetrying(true);
    setCounselorsSource(loadingStudentSource());
    try {
      const result = await reloadStudentCounselorData(session, students, controller.signal);
      if (studentCounselorRetryController.current !== controller) return;
      if (!result.counselorDataAvailable) {
        setCounselorsSource({
          status: 'error',
          error: result.counselorWarning ?? 'Tạm thời chưa tải được phân công.',
          lastUpdated: null,
        });
        return;
      }
      setStudents((current) => mergeStudentCounselorDetails(current, result.students));
      setCounselorsSource(studentSourceAvailable());
    } catch (error) {
      if (controller.signal.aborted) return;
      setCounselorsSource(studentSourceError(
        error,
        'Tạm thời chưa tải được phân công.',
      ));
    } finally {
      if (studentCounselorRetryController.current === controller) {
        studentCounselorRetryController.current = null;
        setIsStudentCounselorRetrying(false);
      }
    }
  };

  const handleSheetOperationRetry = async (source: SheetOperationSourceKey) => {
    if (!session) return;
    sheetOperationRetryControllers.current[source]?.abort();
    clearDashboardOperationsSheetMirrorCache([source]);
    const controller = new AbortController();
    sheetOperationRetryControllers.current[source] = controller;
    const stateKey = source === 'test_attempts' ? 'testAttempts' : source;
    setSheetOperations((current) => ({
      ...current,
      [stateKey]: { status: 'loading', data: null, error: null, lastUpdated: null },
    }));

    const result = await loadDashboardSheetOperations(
      session,
      timeRange,
      source,
      controller.signal,
    );
    if (sheetOperationRetryControllers.current[source] !== controller) return;
    setSheetOperations((current) => ({ ...current, ...result }));
    delete sheetOperationRetryControllers.current[source];
  };

  const handleNavigate = (screen: ScreenType) => {
    const shouldRestoreMenuFocus = isSidebarOpen;
    if (session?.user.roleCode === 'counselor' && screen !== 'students') return;
    if (
      isCrudDemoMode &&
      screen !== 'dashboard' &&
      screen !== 'knowledge-graph' &&
      screen !== 'students' &&
      screen !== 'counselor-management' &&
      screen !== 'counselors' &&
      screen !== 'counselor-detail'
    ) return;

    if (screen === 'counselor-detail' && !selectedCounselorId) {
      setNavigationNotice('Hãy chọn một tư vấn viên trước khi mở chi tiết KPI.');
      setCurrentScreen('counselors');
      setIsSidebarOpen(false);
      return;
    }

    setNavigationNotice(null);
    setCurrentScreen(screen);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    requestAnimationFrame(() => {
      if (shouldRestoreMenuFocus) {
        document.getElementById('btn-toggle-sidebar-mobile')?.focus({ preventScroll: true });
      } else {
        document.getElementById('main-content')?.focus({ preventScroll: true });
      }
    });
  };

  const handleOpenCounselorDetail = (
    counselor: Counselor,
    source: CounselorDetailSource,
  ) => {
    setSelectedCounselorId(counselor.id);
    setCounselorDetailSource(source);
    setNavigationNotice(null);
    setCurrentScreen('counselor-detail');
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    });
  };

  const handleFilterCounselorsStatus = (status: 'all' | 'pass' | 'not-pass') => {
    setInitialCounselorFilter(status);
  };

  const handleExport = async (type: 'overview' | 'student_trends' | 'feedback') => {
    if (!session) return;
    setIsExporting(true);
    setAnalyticsError(null);
    try {
      await downloadAnalyticsExport(session, timeRange, analyticsFilters, type);
      if (session.user.roleCode === 'admin') {
        setAuditLogs(await loadAuditLogs(session));
      }
    } catch (error) {
      setAnalyticsError(error instanceof Error ? error.message : 'Không thể xuất báo cáo.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!session || currentScreen === 'login') {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  const isAdmin = session.user.roleCode === 'admin';
  const isAnalyticsScreen = currentScreen === 'student-trends'
    || currentScreen === 'feedback-analytics'
    || currentScreen === 'audit-logs';
  const isAdminDataScreen = currentScreen === 'dashboard'
    || currentScreen === 'counselor-management'
    || currentScreen === 'counselors'
    || currentScreen === 'counselor-detail';
  const isPageLoading = currentScreen === 'students'
    ? isStudentsLoading && !studentsError
    : isAnalyticsScreen
      ? isAnalyticsLoading && !analyticsError
      : isAdminDataScreen
        ? isDataLoading && !dataError
        : false;
  const isAnyDataLoading = (isStudentsLoading && !studentsError)
    || (isAdmin && isDataLoading && !dataError)
    || (isAdmin && isAnalyticsLoading && !analyticsError);
  const visibleDataError = currentScreen === 'students' ? studentsError : dataError;

  return (
    <div className="flex min-h-screen bg-paper text-ink-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:border focus:border-academic-700 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-academic-700 focus:shadow-lg"
      >
        Chuyển đến nội dung chính
      </a>

      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        dataSource={dataSource}
        isDataLoading={isAnyDataLoading}
        roleCode={session.user.roleCode ?? 'admin'}
        crudDemoMode={isCrudDemoMode}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Navbar
          currentScreen={currentScreen}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          lastUpdated={dashboardMetrics.lastUpdated}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          selectedCounselorName={selectedCounselor?.name}
          adminUser={session.user}
          dataSource={dataSource}
          isDataLoading={isAnyDataLoading}
        />

        <main
          id="main-content"
          tabIndex={-1}
          aria-busy={isPageLoading}
          className="mx-auto w-full max-w-[94rem] flex-1 px-4 py-5 focus:outline-none sm:px-6 sm:py-7 lg:px-8 lg:py-8"
        >
          {navigationNotice && (
            <Alert tone="info" className="mb-5 text-xs">
              {navigationNotice}
            </Alert>
          )}

          {visibleDataError && !(currentScreen === 'students' && students.length === 0) && (
            <Alert
              tone="error"
              title="Không thể tải dữ liệu quản trị."
              className="mb-5"
              action={(
                <Button
                  size="sm"
                  onClick={currentScreen === 'students'
                    ? handleStudentsRefresh
                    : () => setRefreshKey((key) => key + 1)}
                >
                  <RefreshCw className="size-3.5" /> Thử lại
                </Button>
              )}
            >
              {visibleDataError}
            </Alert>
          )}

          {dataWarning && (
            <Alert tone="warning" className="mb-5 text-xs">{dataWarning}</Alert>
          )}

          {analyticsError && isAnalyticsScreen && (
            <Alert tone="error" title="Không thể tải dữ liệu phân tích." className="mb-5 text-xs">
              {analyticsError}
            </Alert>
          )}

          {isPageLoading && (currentScreen === 'students' ? students.length === 0 : isAdmin && counselors.length === 0) ? (
            <div className="flex min-h-80 items-center justify-center border-y border-rule bg-white">
              <div className="text-center">
                <LoaderCircle className="mx-auto size-7 animate-spin text-academic-700" />
                <p className="mt-3 text-sm font-semibold text-ink-950">
                  {currentScreen === 'students'
                    ? 'Đang tải danh sách học sinh'
                    : isCrudDemoMode
                      ? 'Đang tải danh sách tư vấn viên'
                      : 'Đang tải dữ liệu phân tích tư vấn viên'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {currentScreen === 'students'
                    ? 'Đang áp dụng phạm vi quyền tài khoản…'
                    : isCrudDemoMode
                      ? 'Đang đọc dữ liệu mới nhất từ PostgreSQL…'
                      : 'Đang kiểm tra bộ dữ liệu 5 KPI…'}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {currentScreen === 'students' && (
                <motion.div key="screen-students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <StudentManagementScreen
                    students={students}
                    isAdmin={isAdmin}
                    onCreate={handleCreateStudent}
                    onUpdate={handleUpdateStudent}
                    onDeactivate={handleDeactivateStudent}
                    crudDemoMode={isCrudDemoMode}
                    webCrudEnabled={isWebCrudEnabled}
                    googleEntryUrls={{
                      thcs: googleStudentThcsEntryUrl,
                      thpt: googleStudentThptEntryUrl,
                    }}
                    onRefresh={handleStudentsRefresh}
                    isRefreshing={isStudentsLoading}
                    studentsSource={studentsSource}
                    parentsSource={parentsSource}
                    counselorsSource={counselorsSource}
                    onRetryParents={() => void handleStudentParentRetry()}
                    isParentRetrying={isStudentParentRetrying}
                    onRetryCounselors={() => void handleStudentCounselorRetry()}
                    isCounselorRetrying={isStudentCounselorRetrying}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'dashboard' && (
                <motion.div
                  key="screen-dashboard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <DashboardScreen
                    metrics={dashboardMetrics}
                    counselors={counselors}
                    activeStudentSummary={activeStudentSummary}
                    isStudentsLoading={isStudentsLoading}
                    studentsError={studentsError}
                    studentsLastUpdated={studentsLastUpdated}
                    onRetryStudents={handleStudentsRefresh}
                    sheetOperations={sheetOperations}
                    onRetrySheetOperation={(source) => void handleSheetOperationRetry(source)}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    onNavigate={handleNavigate}
                    onOpenCounselorDetail={(counselor) => (
                      handleOpenCounselorDetail(counselor, 'dashboard')
                    )}
                    onFilterCounselorsStatus={handleFilterCounselorsStatus}
                    onExport={() => void handleExport('overview')}
                    isExporting={isExporting}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'knowledge-graph' && (
                <motion.div
                  key="screen-knowledge-graph"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <KnowledgeGraphScreen />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'counselor-management' && (
                <motion.div
                  key="screen-counselor-management"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <CounselorSheetManagementScreen
                    counselors={counselors}
                    googleEntryUrl={googleCounselorEntryUrl}
                    onRefresh={() => setRefreshKey((key) => key + 1)}
                    isRefreshing={isDataLoading}
                    onViewDetails={(counselor) => (
                      handleOpenCounselorDetail(counselor, 'counselor-management')
                    )}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'counselors' && (
                <motion.div
                  key="screen-counselors"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <CounselorListScreen
                    counselors={counselors}
                    timeRange={timeRange}
                    initialFilterStatus={initialCounselorFilter}
                    onViewDetails={(counselor) => (
                      handleOpenCounselorDetail(counselor, 'counselors')
                    )}
                    onCreateCounselor={handleCreateCounselor}
                    dataSource={dataSource}
                    canManageCounselors={session.user.roleCode === 'admin' && isWebCrudEnabled}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'counselor-detail' && selectedCounselor && (
                <motion.div
                  key="screen-counselor-detail"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <CounselorDetailScreen
                    counselor={selectedCounselor}
                    allCounselors={counselors}
                    timeRange={timeRange}
                    onBack={() => handleNavigate(counselorDetailSource)}
                    backLabel={counselorDetailSource === 'dashboard'
                      ? 'Quay lại Tổng quan bảng điều khiển'
                      : counselorDetailSource === 'counselor-management'
                        ? 'Quay lại Quản lý tư vấn viên'
                        : 'Quay lại Hiệu suất tư vấn viên'}
                    onSelectCounselor={(counselor) => setSelectedCounselorId(counselor.id)}
                    onUpdateCounselor={handleUpdateCounselor}
                    onDeactivateCounselor={handleDeactivateCounselor}
                    dataSource={dataSource}
                    canManageCounselors={session.user.roleCode === 'admin' && isWebCrudEnabled}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'student-trends' && (
                <motion.div key="screen-student-trends" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <StudentTrendsScreen
                    data={studentTrends}
                    filters={analyticsFilters}
                    filterOptions={filterOptions}
                    onFiltersChange={setAnalyticsFilters}
                    onExport={() => void handleExport('student_trends')}
                    isExporting={isExporting}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'feedback-analytics' && (
                <motion.div key="screen-feedback-analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <FeedbackAnalyticsScreen
                    data={feedbackAnalytics}
                    filters={analyticsFilters}
                    filterOptions={filterOptions}
                    onFiltersChange={setAnalyticsFilters}
                    onExport={() => void handleExport('feedback')}
                    isExporting={isExporting}
                    onRefresh={() => setRefreshKey((key) => key + 1)}
                    isRefreshing={isAnalyticsLoading}
                  />
                </motion.div>
              )}

              {isAdmin && currentScreen === 'audit-logs' && (
                <motion.div key="screen-audit-logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <AuditLogsScreen logs={auditLogs} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
