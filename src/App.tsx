import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';
import {
  AuthSession,
  Counselor,
  CreateCounselorInput,
  DashboardMetrics,
  ScreenType,
  TimeRange,
} from './types';
import { getDashboardMetricsByTimeRange } from './mockData';
import {
  clearSession,
  createCounselor,
  deactivateCounselor,
  loadAdminData,
  restoreSession,
  saveSession,
  UNAUTHORIZED_EVENT,
  updateCounselor,
} from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { CounselorListScreen } from './components/CounselorListScreen';
import { CounselorDetailScreen } from './components/CounselorDetailScreen';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => restoreSession());
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('this-month');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string | null>(null);
  const [remoteDashboard, setRemoteDashboard] = useState<DashboardMetrics | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>(session?.source ?? 'mock');
  const [isDataLoading, setIsDataLoading] = useState(Boolean(session));
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    if (!session) return;

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
    if (!isSidebarOpen) return;

    const closeSidebarWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };

    document.addEventListener('keydown', closeSidebarWithEscape);
    return () => document.removeEventListener('keydown', closeSidebarWithEscape);
  }, [isSidebarOpen]);

  const handleLogin = (authenticatedSession: AuthSession) => {
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
    setSelectedCounselorId(null);
    setRemoteDashboard(null);
    setDataError(null);
    setDataWarning(null);
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

  const handleNavigate = (screen: ScreenType) => {
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

  if (!session || currentScreen === 'login') {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

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
        selectedCounselorId={selectedCounselor?.id}
        dataSource={dataSource}
        isDataLoading={isDataLoading}
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
          isDataLoading={isDataLoading}
        />

        <main
          id="main-content"
          tabIndex={-1}
          aria-busy={isDataLoading}
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

          {isDataLoading && counselors.length === 0 ? (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800">Đang tải dữ liệu phân tích tư vấn viên</p>
                <p className="mt-1 text-xs text-slate-500">Đang kiểm tra bộ dữ liệu 5 KPI…</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentScreen === 'dashboard' && (
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
                  />
                </motion.div>
              )}

              {currentScreen === 'counselors' && (
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
                  />
                </motion.div>
              )}

              {currentScreen === 'counselor-detail' && selectedCounselor && (
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
