import React from 'react';
import {
  Users,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  FlaskConical,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Counselor, DashboardMetrics, TimeRange, ScreenType } from '../types';
import type { ActiveStudentSummary } from '../domain/sheetStudentPolicy';
import type { SheetOperationsSummary } from '../domain/sheetOperationsPolicy';
import { getCounselorEvaluation, PERFORMANCE_KPI_COUNT } from '../domain/kpiPolicy';
import { KpiCard } from './KpiCard';
import { CounselorPassChart, BookingsChart } from './Charts';
import { Button } from './ui/Primitives';

interface DashboardScreenProps {
  metrics: DashboardMetrics;
  counselors: Counselor[];
  timeRange: TimeRange;
  onTimeRangeChange: (tr: TimeRange) => void;
  onNavigate: (screen: ScreenType) => void;
  onSelectCounselor: (counselor: Counselor) => void;
  onFilterCounselorsStatus?: (status: 'all' | 'pass' | 'not-pass') => void;
  onExport: () => void;
  isExporting: boolean;
  activeStudentSummary: ActiveStudentSummary;
  isStudentsLoading: boolean;
  studentsError: string | null;
  studentsLastUpdated: string | null;
  onRetryStudents: () => void;
  sheetOperations: SheetOperationsSummary | null;
  isSheetOperationsLoading: boolean;
  sheetOperationsError: string | null;
  sheetOperationsLastUpdated: string | null;
  onRetrySheetOperations: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  metrics,
  counselors,
  timeRange,
  onTimeRangeChange,
  onNavigate,
  onSelectCounselor,
  onFilterCounselorsStatus,
  onExport,
  isExporting,
  activeStudentSummary,
  isStudentsLoading,
  studentsError,
  studentsLastUpdated,
  onRetryStudents,
  sheetOperations,
  isSheetOperationsLoading,
  sheetOperationsError,
  sheetOperationsLastUpdated,
  onRetrySheetOperations,
}) => {
  const getTimeLabel = () => {
    switch (timeRange) {
      case 'this-month':
        return 'Tháng này';
      case 'last-month':
        return 'Tháng trước';
      case 'all-time':
        return 'Toàn thời gian';
    }
  };

  const formatLastUpdated = (value: string) => {
    if (!value) return 'Vừa xong';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const handleKpiFilterClick = (status: 'pass' | 'not-pass') => {
    if (onFilterCounselorsStatus) {
      onFilterCounselorsStatus(status);
    }
    onNavigate('counselors');
  };

  const formatStudentUpdateTime = (value: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="screen-dashboard" className="space-y-8">
      <section className="border-b border-rule pb-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-pine-700">
              <span className="size-2 rounded-full bg-pine-700" aria-hidden="true" />
              Dữ liệu phân tích đã sẵn sàng
            </div>
            <h2 className="page-title">
              Tổng quan vận hành trung tâm
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Theo dõi tải ca học sinh, lịch tham vấn và chất lượng làm việc của đội ngũ trong {getTimeLabel().toLowerCase()}.
            </p>
          </div>

          <div className="grid shrink-0 gap-2 border-l-2 border-academic-700 pl-4 text-xs text-slate-600 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-1">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-academic-700" />
              <span>Cập nhật {formatLastUpdated(metrics.lastUpdated)}</span>
            </div>
            <div>
              Nguồn đồng bộ: <span className="font-medium text-ink-950">{metrics.syncNode}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Mandatory KPI Cards */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="section-title">
            Chỉ số vận hành
          </h3>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">Kỳ: {getTimeLabel()}</span>
            <Button size="sm" variant="primary" disabled={isExporting} onClick={onExport}>
              <Download className="h-3.5 w-3.5" /> {isExporting ? 'Đang xuất…' : 'Xuất tổng quan'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 border-y border-rule bg-white sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. Active students from Sheet Mirror */}
          <KpiCard
            id="kpi-card-total-students"
            title="Học sinh đang hoạt động"
            value={isStudentsLoading || studentsError
              ? '—'
              : activeStudentSummary.total.toLocaleString('vi-VN')}
            subtitle="Hồ sơ đang được theo dõi"
            icon={Users}
            variant="blue"
            footer={(
              <div className="mt-1 space-y-1.5">
                <p className="text-slate-600">Gồm chờ chọn lịch và đang tư vấn</p>
                {studentsError ? (
                  <div role="alert" className="space-y-2 text-brick-700">
                    <p>Không thể tải dữ liệu học sinh từ Sheet Mirror.</p>
                    <Button size="sm" onClick={onRetryStudents}>
                      Thử lại
                    </Button>
                  </div>
                ) : isStudentsLoading ? (
                  <p className="text-slate-400" aria-live="polite">Đang tải Sheet Mirror…</p>
                ) : (
                  <>
                    <p className="font-medium text-slate-700">
                      THCS {activeStudentSummary.thcs} · THPT {activeStudentSummary.thpt}
                    </p>
                    <p className="text-slate-500">
                      Cập nhật lúc {formatStudentUpdateTime(studentsLastUpdated)}
                    </p>
                  </>
                )}
              </div>
            )}
          />

          {/* 2. Active Counselors */}
          <KpiCard
            id="kpi-card-active-counselors"
            title="Tư vấn viên hiện có"
            value={metrics.activeCounselors}
            subtitle="Nhân sự đang phụ trách"
            icon={UserCheck}
            variant="teal"
            trend={{
              value: '0%',
              isPositive: true,
              label: 'so với tháng trước',
            }}
          />

          {/* 3. Total Bookings */}
          <KpiCard
            id="kpi-card-total-bookings"
            title="Tổng số lịch hẹn"
            value={isSheetOperationsLoading || sheetOperationsError || !sheetOperations
              ? '—'
              : sheetOperations.totalBookings.toLocaleString('vi-VN')}
            subtitle="Tiếp nhận và phiên tham vấn"
            icon={CalendarCheck}
            variant="default"
            trend={sheetOperations
              && sheetOperations.bookingGrowthPercent !== null
              && sheetOperations.bookingGrowthPercent !== 0
              ? {
                  value: `${Math.abs(sheetOperations.bookingGrowthPercent).toLocaleString('vi-VN')}%`,
                  isPositive: sheetOperations.bookingGrowthPercent > 0,
                  label: 'so với kỳ trước',
                }
              : undefined}
            footer={(
              <div className="mt-1 text-slate-500">
                {sheetOperationsError ? (
                  <p>Dữ liệu Sheet Mirror chưa sẵn sàng</p>
                ) : isSheetOperationsLoading || !sheetOperations ? (
                  <p aria-live="polite">Đang tải Sheet Mirror…</p>
                ) : sheetOperations.bookingGrowthPercent === 0 ? (
                  <p>Không đổi so với kỳ trước</p>
                ) : sheetOperations.bookingGrowthPercent === null ? (
                  <p>Cập nhật từ Google Sheet</p>
                ) : null}
              </div>
            )}
          />

          <KpiCard
            id="kpi-card-total-tests"
            title="Bài test đang hoạt động"
            value={isSheetOperationsLoading || sheetOperationsError || !sheetOperations
              ? '—'
              : sheetOperations.activeTests.toLocaleString('vi-VN')}
            subtitle={sheetOperations && !sheetOperationsError && !isSheetOperationsLoading
              ? `${sheetOperations.totalTestAttempts.toLocaleString('vi-VN')} lượt học sinh làm bài`
              : 'Dữ liệu từ Google Sheet'}
            icon={FlaskConical}
            variant="default"
            footer={sheetOperations && !sheetOperationsError && !isSheetOperationsLoading ? (
              <p className="mt-1 text-slate-500">
                Cập nhật lúc {formatStudentUpdateTime(sheetOperationsLastUpdated)}
              </p>
            ) : undefined}
          />

          {/* 4. Passed Counselors */}
          <KpiCard
            id="kpi-card-passed-counselors"
            title="Tư vấn viên đạt chuẩn KPI"
            value={metrics.passedCounselors}
            subtitle="Đạt ít nhất 3/4 KPI và tải ca an toàn"
            icon={CheckCircle2}
            variant="success"
            trend={{
              value: `${
                metrics.activeCounselors > 0
                  ? Math.round((metrics.passedCounselors / metrics.activeCounselors) * 100)
                  : 0
              }%`,
              isPositive: true,
              label: 'tỷ lệ đạt',
            }}
            onClick={() => handleKpiFilterClick('pass')}
          />

          {/* 5. Not Passed Counselors */}
          <KpiCard
            id="kpi-card-not-passed-counselors"
            title="Tư vấn viên cần rà soát"
            value={metrics.notPassedCounselors}
            subtitle="Gồm chưa đạt hoặc chưa đủ dữ liệu"
            icon={XCircle}
            variant="danger"
            trend={{
              value: `${metrics.notPassedCounselors} người`,
              isPositive: false,
              label: 'cần rà soát',
            }}
            onClick={() => handleKpiFilterClick('not-pass')}
          />
        </div>
      </section>

      {/* Two Mandatory Charts: Counselor Pass/Not Pass & Booking Status Distribution */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Chart 1: Pass/Not Pass Counselor Chart */}
        <CounselorPassChart
          passed={metrics.passedCounselors}
          notPassed={metrics.notPassedCounselors}
          total={metrics.activeCounselors}
          kpiPassHistory={metrics.counselorPassHistory}
        />

        {/* Chart 2: Completed, Pending & Cancelled Booking Chart */}
        <BookingsChart
          summary={sheetOperations}
          isLoading={isSheetOperationsLoading}
          error={sheetOperationsError}
          onRetry={onRetrySheetOperations}
        />
      </div>

      {/* Counselor Fast-Access Roster Preview & Performance Jump */}
      <section className="border-y border-rule bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-rule px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div>
            <h4 className="text-base font-semibold text-ink-950">
              Trạng thái đội ngũ tư vấn
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {counselors.length} tư vấn viên được đánh giá trong {getTimeLabel().toLowerCase()}.
            </p>
          </div>

          <Button
            id="btn-view-all-counselors"
            onClick={() => onNavigate('counselors')}
            size="sm"
            className="self-start sm:self-auto"
          >
            Xem toàn bộ đội ngũ
          </Button>
        </div>

        <div className="divide-y divide-rule">
          {counselors.map((c) => {
            const evaluation = getCounselorEvaluation(c, timeRange);
            const isPass = evaluation.overallStatus === 'Pass';
            const isInsufficientData = evaluation.overallStatus === 'Insufficient Data';
            return (
              <button
                key={c.id}
                type="button"
                aria-label={`Mở chi tiết KPI của ${c.name}`}
                onClick={() => {
                  onSelectCounselor(c);
                  onNavigate('counselor-detail');
                }}
                className="group grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-teal-50/60 sm:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{c.externalId ?? 'Chưa có mã'}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold sm:hidden ${
                        isPass
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isInsufficientData
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isPass ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : isInsufficientData ? (
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {isPass ? 'Đạt' : isInsufficientData ? 'Chưa đủ dữ liệu' : 'Chưa đạt'}
                    </span>
                  </div>

                  <h5 className="truncate text-sm font-semibold text-ink-950 group-hover:text-academic-700">
                    {c.name}
                  </h5>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {c.department}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:block">
                  <span className="text-xs text-slate-500">
                    KPI hiệu suất <strong className="font-semibold text-ink-950">{evaluation.passedKpiCount}/{PERFORMANCE_KPI_COUNT} đạt</strong>
                  </span>
                  <span
                    className={`hidden w-fit items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold sm:mt-2 sm:inline-flex ${
                      isPass
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : isInsufficientData
                          ? 'border border-amber-200 bg-amber-50 text-amber-800'
                          : 'border border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                  >
                    {isPass ? 'Đạt' : isInsufficientData ? 'Chưa đủ dữ liệu' : 'Cần rà soát'}
                  </span>
                </div>

                <span className="flex items-center gap-1 text-xs font-semibold text-academic-700">
                  Chi tiết <ChevronRight className="size-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
