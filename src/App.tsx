import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';
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
  studentSyncIntervalMs,
  restoreSession,
  saveSession,
  UNAUTHORIZED_EVENT,
  updateCounselor,
  updateStudent,
} from './services/api';
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
  const [isStudentsLoading, setIsStudentsLoading] = useState(Boolean(session));
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [initialCounselorFilter, setInitialCounselorFilter] =
    useState<'all' | 'pass' | 'not-pass'>('all');

  const selectedCounselor = useMemo(
    () => counselors.find((counselor) => counselor.id === selectedCounselorId) ?? counselors[0] ?? null,
    [counselors, selectedCounselorId],
  );

  const derivedDashboard = useMemo(
    () => getDashboardMetricsByTimeRange(timeRange, counselors),
    [timeRange, counselors],
  );

  // API totals and trend data are used when available. Counselor pass/fail values
  // always come from the frontend's strict five-KPI policy.
  const dashboardMetrics = useMemo<DashboardMetrics>(() => {
    if (!remoteDashboard) return derivedDashboard;

    return {
      ...remoteDashboard,
      activeCounselors: derivedDashboard.activeCounselors,
      passedCounselors: derivedDashboard.passedCounselors,
      notPassedCounselors: derivedDashboard.notPassedCounselors,
      counselorPassHistory: derivedDashboard.counselorPassHistory,
      monthlyTrends:
        remoteDashboard.monthlyTrends.length > 0
          ? remoteDashboard.monthlyTrends
          : derivedDashboard.monthlyTrends,
    };
  }, [derivedDashboard, remoteDashboard]);

  useEffect(() => {
    if (!session || session.user.roleCode !== 'admin') {
      setIsDataLoading(false);
      return;
    }

    let isCurrentRequest = true;
    setIsDataLoading(true);
    setDataError(null);
    setDataWarning(null);

    loadAdminData(session, timeRange)
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
          return result.counselors[0]?.id ?? null;
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
    };
  }, [session, timeRange, refreshKey]);

  useEffect(() => {
    if (!session || session.user.roleCode !== 'admin' || isCrudDemoMode) {
      setIsAnalyticsLoading(false);
      return;
    }
    let isCurrentRequest = true;
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);

    loadAnalyticsData(session, timeRange, analyticsFilters)
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
    };
  }, [session, timeRange, analyticsFilters, refreshKey]);

  useEffect(() => {
    if (!session) return;
    let isCurrentRequest = true;
    setIsStudentsLoading(true);
    setDataError(null);
    loadStudents(session)
      .then((result) => {
        if (isCurrentRequest) setStudents(result);
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setDataError(error instanceof Error ? error.message : 'Không thể tải danh sách Student.');
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsStudentsLoading(false);
      });
    return () => {
      isCurrentRequest = false;
    };
  }, [session, refreshKey]);

  useEffect(() => {
    if (!session) return;
    const intervalId = window.setInterval(() => {
      loadStudents(session).then(setStudents).catch(() => {
        // Keep the last successful list; the next interval retries automatically.
      });
      if (session.user.roleCode === 'admin') {
        loadAdminData(session, timeRange).then((result) => {
          setCounselors(result.counselors);
          setRemoteDashboard(result.dashboard ?? null);
          setDataSource(result.source);
          setDataWarning(result.warning ?? null);
        }).catch(() => {
          // Keep the last successful Counselor list and retry on the next interval.
        });
      }
    }, studentSyncIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [session, timeRange]);

  useEffect(() => {
    if (
      !session ||
      session.user.roleCode !== 'admin' ||
      isCrudDemoMode ||
      currentScreen !== 'feedback-analytics'
    ) return;

    let isActive = true;
    let isRequestRunning = false;
    const refreshFeedback = async () => {
      if (isRequestRunning) return;
      isRequestRunning = true;
      try {
        const result = await loadAnalyticsData(session, timeRange, analyticsFilters);
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
      }
    };

    void refreshFeedback();
    const intervalId = window.setInterval(() => void refreshFeedback(), analyticsSyncIntervalMs);
    const refreshOnFocus = () => void refreshFeedback();
    window.addEventListener('focus', refreshOnFocus);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [session, currentScreen, timeRange, analyticsFilters]);

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
    if (!session || session.user.roleCode !== 'admin' || currentScreen !== 'audit-logs') return;
    loadAuditLogs(session).then(setAuditLogs).catch((error) => {
      setAnalyticsError(error instanceof Error ? error.message : 'Không thể tải nhật ký audit.');
    });
  }, [session, currentScreen, refreshKey]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const closeSidebarWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };

    document.addEventListener('keydown', closeSidebarWithEscape);
    return () => document.removeEventListener('keydown', closeSidebarWithEscape);
  }, [isSidebarOpen]);

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
    setDataWarning(null);
    setAnalyticsError(null);
    setAuditLogs([]);
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

  const handleNavigate = (screen: ScreenType) => {
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
    setCurrentScreen(screen);
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
  const isPageLoading = isStudentsLoading || (isAdmin && (isDataLoading || isAnalyticsLoading));

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-700 focus:shadow-lg"
      >
        Chuyển đến nội dung chính
      </a>

      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        selectedCounselorId={selectedCounselor?.externalId}
        dataSource={dataSource}
        isDataLoading={isPageLoading}
        roleCode={session.user.roleCode ?? 'admin'}
        crudDemoMode={isCrudDemoMode}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
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
          isDataLoading={isPageLoading}
        />

        <main
          id="main-content"
          tabIndex={-1}
          aria-busy={isPageLoading}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto focus:outline-none"
        >
          {dataError && (
            <div
              role="alert"
              className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span><strong>Không thể tải dữ liệu quản trị.</strong> {dataError}</span>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Thử lại
              </button>
            </div>
          )}

          {dataWarning && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{dataWarning}</span>
            </div>
          )}

          {analyticsError && (
            <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span><strong>Analytics:</strong> {analyticsError}</span>
            </div>
          )}

          {isPageLoading && (currentScreen === 'students' ? students.length === 0 : isAdmin && counselors.length === 0) ? (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  {currentScreen === 'students'
                    ? 'Đang tải danh sách Student'
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
            <AnimatePresence mode="wait">
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
                    onRefresh={() => setRefreshKey((key) => key + 1)}
                    isRefreshing={isStudentsLoading}
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
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    onNavigate={handleNavigate}
                    onSelectCounselor={(counselor) => setSelectedCounselorId(counselor.id)}
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
                    onSelectCounselor={(counselor) => setSelectedCounselorId(counselor.id)}
                    onNavigateToDetail={() => handleNavigate('counselor-detail')}
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
                    onBack={() => handleNavigate('counselors')}
                    onSelectCounselor={(counselor) => setSelectedCounselorId(counselor.id)}
                    onNavigate={handleNavigate}
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
