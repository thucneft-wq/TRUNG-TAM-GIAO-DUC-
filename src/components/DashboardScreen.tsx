import React from 'react';
import {
  Users,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  FlaskConical,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Counselor, DashboardMetrics, TimeRange, ScreenType } from '../types';
import { getCounselorEvaluation, PERFORMANCE_KPI_COUNT } from '../domain/kpiPolicy';
import { KpiCard } from './KpiCard';
import { CounselorPassChart, BookingsChart } from './Charts';

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

  return (
    <div id="screen-dashboard" className="space-y-6">
      {/* Top Banner: Digital Twin State & Last Updated Info */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-teal-500/10 blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                Dữ liệu phân tích đã sẵn sàng
              </span>
              <span className="text-2xs text-slate-300 font-mono">
                {metrics.syncNode}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Tổng quan Sức khỏe Tâm lý Học đường
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Theo dõi dữ liệu quản trị theo thời gian thực về tải ca học sinh, số phiên tham vấn và chuẩn KPI của tư vấn viên.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 shrink-0 flex flex-col justify-center text-xs">
            <div className="flex items-center gap-1.5 text-teal-300 font-semibold text-2xs uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Cập nhật gần nhất
            </div>
            <div className="font-mono text-white font-medium mt-0.5">
              {formatLastUpdated(metrics.lastUpdated)}
            </div>
            <div className="text-2xs text-slate-300 mt-1 flex items-center justify-between gap-3">
              <span>Kỳ báo cáo: <strong>{getTimeLabel()}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Mandatory KPI Cards */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Các chỉ số hiệu suất chính ({getTimeLabel()})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
              Cập nhật theo thời gian thực
            </span>
            <button type="button" disabled={isExporting} onClick={onExport} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60">
              <Download className="h-3.5 w-3.5" /> {isExporting ? 'Đang xuất…' : 'Xuất tổng quan'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Total Students */}
          <KpiCard
            id="kpi-card-total-students"
            title="Tổng số học sinh"
            value={metrics.totalStudents.toLocaleString('vi-VN')}
            subtitle="Tải ca đang hoạt động"
            icon={Users}
            variant="blue"
            trend={{
              value: '4.2%',
              isPositive: true,
              label: 'so với kỳ trước',
            }}
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
            value={metrics.totalBookings.toLocaleString('vi-VN')}
            subtitle="Tiếp nhận và phiên tham vấn"
            icon={CalendarCheck}
            variant="default"
            trend={{
              value: '8.5%',
              isPositive: true,
              label: 'so với tháng trước',
            }}
          />

          <KpiCard
            id="kpi-card-total-tests"
            title="Bài test áp dụng"
            value={metrics.totalTests.toLocaleString('vi-VN')}
            subtitle={`${metrics.totalTestAttempts.toLocaleString('vi-VN')} lượt học sinh làm bài`}
            icon={FlaskConical}
            variant="default"
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
      </div>

      {/* Two Mandatory Charts: Counselor Pass/Not Pass & Booking Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pass/Not Pass Counselor Chart */}
        <CounselorPassChart
          passed={metrics.passedCounselors}
          notPassed={metrics.notPassedCounselors}
          total={metrics.activeCounselors}
          kpiPassHistory={metrics.counselorPassHistory}
        />

        {/* Chart 2: Completed, Pending & Cancelled Booking Chart */}
        <BookingsChart metrics={metrics} />
      </div>

      {/* Counselor Fast-Access Roster Preview & Performance Jump */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Danh sách trạng thái tư vấn viên
              <span className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {counselors.length} nhân sự
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Xem nhanh kết quả đánh giá 5 KPI của từng tư vấn viên trong {getTimeLabel()}
            </p>
          </div>

          <button
            id="btn-view-all-counselors"
            type="button"
            onClick={() => onNavigate('counselors')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Mở bảng hiệu suất tư vấn viên</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs bg-slate-50/50 hover:bg-white transition-all cursor-pointer group flex flex-col justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {c.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold ${
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

                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {c.name}
                  </h5>
                  <p className="text-2xs text-slate-500 truncate mt-0.5">
                    {c.department}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-2xs">
                  <span className="text-slate-500 font-medium">
                    KPI hiệu suất: <strong className="text-slate-800">{evaluation.passedKpiCount}/{PERFORMANCE_KPI_COUNT} đạt</strong>
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                    Chi tiết <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
