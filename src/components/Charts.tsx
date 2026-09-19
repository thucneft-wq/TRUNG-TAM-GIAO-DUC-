import React, { useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import type {
  BookingsSheetSummary,
  BookingStatus,
} from '../domain/sheetOperationsPolicy';
import { Button } from './ui/Primitives';

interface CounselorPassChartProps {
  passed: number;
  notPassed: number;
  total: number;
  kpiPassHistory?: { label: string; passed: number; notPassed: number }[];
}

export const CounselorPassChart: React.FC<CounselorPassChartProps> = ({
  passed,
  notPassed,
  total,
  kpiPassHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState<'ratio' | 'kpis'>('ratio');
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // SVG Circular Gauge calculations
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const passDash = (passRate / 100) * circumference;

  return (
    <section id="counselor-pass-chart-container" className="flex flex-col justify-between border-y border-rule bg-white px-4 py-5 sm:px-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-ink-950">
            Phân bố kết quả KPI tư vấn viên
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            Đạt tối thiểu 3/4 KPI và bảo đảm an toàn tải ca.
          </p>
        </div>
        <div className="flex border-b border-rule text-xs font-medium" role="tablist" aria-label="Cách xem kết quả KPI">
          <button
            id="tab-pass-ratio"
            type="button"
            onClick={() => setActiveTab('ratio')}
            role="tab"
            aria-selected={activeTab === 'ratio'}
            className={`min-h-9 border-b-2 px-3 transition-colors ${
              activeTab === 'ratio'
                ? 'border-academic-700 font-semibold text-academic-700'
                : 'border-transparent text-slate-600 hover:text-ink-950'
            }`}
          >
            Tổng quan
          </button>
          <button
            id="tab-pass-kpis"
            type="button"
            onClick={() => setActiveTab('kpis')}
            role="tab"
            aria-selected={activeTab === 'kpis'}
            className={`min-h-9 border-b-2 px-3 transition-colors ${
              activeTab === 'kpis'
                ? 'border-academic-700 font-semibold text-academic-700'
                : 'border-transparent text-slate-600 hover:text-ink-950'
            }`}
          >
            Theo nhóm KPI
          </button>
        </div>
      </div>

      {activeTab === 'ratio' ? (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* Radial Donut Gauge */}
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#ffe4e6" // Rose 100
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Foreground progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#10b981" // Emerald 500
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={circumference - passDash}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-display text-3xl font-bold text-ink-950">
                {passRate}%
              </span>
              <span className="text-xs text-slate-500">
                Tỷ lệ đạt
              </span>
            </div>
          </div>

          {/* Metric Details */}
          <div className="space-y-3 w-full sm:w-56">
            <div className="flex items-center justify-between border-l-2 border-pine-700 py-2 pl-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">Đạt</div>
                  <div className="text-2xs text-emerald-700">Ít nhất 3/4 KPI và tải ca an toàn</div>
                </div>
              </div>
              <span className="text-base font-bold text-emerald-800">{passed}</span>
            </div>

            <div className="flex items-center justify-between border-l-2 border-brick-700 py-2 pl-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-950">Cần rà soát</div>
                  <div className="text-2xs text-rose-700">Chưa đạt hoặc chưa đủ dữ liệu</div>
                </div>
              </div>
              <span className="text-base font-bold text-rose-800">{notPassed}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 py-1">
          {kpiPassHistory.map((kpi, idx) => {
            const totalC = kpi.passed + kpi.notPassed;
            const rate = totalC > 0 ? Math.round((kpi.passed / totalC) * 100) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{kpi.label}</span>
                  <span className="text-slate-500 font-mono text-2xs">
                    {kpi.passed}/{totalC} đạt ({rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${rate}%` }}
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  />
                  <div
                    style={{ width: `${100 - rate}%` }}
                    className="bg-rose-400 h-full rounded-r-full transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          Thiếu dữ liệu được tách khỏi kết luận hiệu suất
        </span>
        <span>Nhân sự hoạt động: <strong className="font-semibold text-ink-950">{total}</strong></span>
      </div>
    </section>
  );
};

interface BookingsChartProps {
  summary: BookingsSheetSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const BOOKING_STATUS_PRESENTATION: Array<{
  key: BookingStatus;
  label: string;
  barClass: string;
  textClass: string;
  dotClass: string;
}> = [
  {
    key: 'completed',
    label: 'Đã hoàn thành',
    barClass: 'bg-academic-700',
    textClass: 'text-academic-800',
    dotClass: 'bg-academic-700',
  },
  {
    key: 'pending',
    label: 'Đang chờ',
    barClass: 'bg-amber-400',
    textClass: 'text-amber-800',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'confirmed',
    label: 'Đã xác nhận',
    barClass: 'bg-pine-700',
    textClass: 'text-pine-700',
    dotClass: 'bg-pine-700',
  },
  {
    key: 'scheduled',
    label: 'Đã xếp lịch',
    barClass: 'bg-sky-400',
    textClass: 'text-sky-800',
    dotClass: 'bg-sky-500',
  },
  {
    key: 'cancelled',
    label: 'Đã hủy',
    barClass: 'bg-slate-300',
    textClass: 'text-slate-700',
    dotClass: 'bg-slate-400',
  },
];

export const BookingsChart: React.FC<BookingsChartProps> = ({
  summary,
  isLoading,
  error,
  onRetry,
}) => {
  if (!summary || isLoading || error) {
    return (
      <section
        id="booking-status-chart-container"
        className="flex min-h-80 flex-col border-y border-rule bg-white px-4 py-5 sm:px-5"
      >
        <h4 className="text-base font-semibold text-ink-950">Trạng thái lịch hẹn tham vấn</h4>
        <p className="mt-1 text-xs text-slate-500">Dữ liệu được tổng hợp từ Google Sheet.</p>
        <div className="mt-6 flex flex-1 items-center justify-center border-y border-dashed border-rule px-4 py-8 text-center">
          {error ? (
            <div role="alert" className="max-w-sm space-y-3">
              <p className="text-sm font-medium text-brick-700">
                Không thể tải dữ liệu lịch hẹn từ Sheet Mirror.
              </p>
              <Button size="sm" onClick={onRetry}>Thử lại</Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500" aria-live="polite">
              Đang tải dữ liệu Sheet Mirror…
            </p>
          )}
        </div>
      </section>
    );
  }

  const total = summary.totalBookings;
  const percentage = (status: BookingStatus) =>
    total > 0 ? Math.round((summary.bookingsBreakdown[status] / total) * 100) : 0;
  const completedPercentage = percentage('completed');
  const timelineTotal = (point: BookingsSheetSummary['bookingTimeline'][number]) =>
    BOOKING_STATUS_PRESENTATION.reduce((sum, status) => sum + point[status.key], 0);
  const maxTimeline = Math.max(...summary.bookingTimeline.map(timelineTotal), 1);

  return (
    <section id="booking-status-chart-container" className="flex flex-col justify-between border-y border-rule bg-white px-4 py-5 sm:px-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-base font-semibold text-ink-950">
            Trạng thái lịch hẹn tham vấn
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {total} phiên được ghi nhận trong kỳ báo cáo.
          </p>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="space-y-1.5 my-2">
        <div className="flex justify-between text-2xs font-semibold text-slate-500">
          <span>Phân bố trạng thái phiên</span>
          <span className="font-mono">Hiệu suất hoàn thành {completedPercentage}%</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden bg-slate-100">
          {BOOKING_STATUS_PRESENTATION.map((status) => (
            <div
              key={status.key}
              style={{ width: `${percentage(status.key)}%` }}
              className={`h-full ${status.barClass}`}
              title={`${status.label}: ${summary.bookingsBreakdown[status.key]} (${percentage(status.key)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Key breakdown statistics */}
      <div className="my-3 grid grid-cols-2 border-y border-rule sm:grid-cols-5 sm:divide-x sm:divide-rule">
        {BOOKING_STATUS_PRESENTATION.map((status) => (
          <div key={status.key} className="border-b border-rule px-2 py-3 text-center last:border-b-0 sm:border-b-0">
            <div className={`flex items-center justify-center gap-1 text-2xs font-bold ${status.textClass}`}>
              <span className={`size-2 rounded-full ${status.dotClass}`} aria-hidden="true" />
              {status.label}
            </div>
            <div className="mt-0.5 text-lg font-bold text-ink-950">
              {summary.bookingsBreakdown[status.key]}
            </div>
            <div className="font-mono text-2xs text-slate-500">{percentage(status.key)}%</div>
          </div>
        ))}
      </div>

      {/* Timeline Breakdown / Trend */}
      <div className="mt-2 pt-2.5 border-t border-slate-100">
        <div className="mb-2 text-xs font-semibold text-ink-950">
          Diễn biến trong kỳ
        </div>
        <div className="space-y-1.5">
          {summary.bookingTimeline.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-500">Không có lịch hẹn trong kỳ này.</p>
          )}
          {summary.bookingTimeline.map((point) => {
            const sum = timelineTotal(point);
            const barWidth = (sum / maxTimeline) * 100;
            return (
              <div key={point.label} className="flex items-center gap-2 text-2xs">
                <span className="w-24 truncate font-medium text-slate-600">{point.label}</span>
                <div className="flex h-2.5 flex-1 overflow-hidden bg-slate-100">
                  {BOOKING_STATUS_PRESENTATION.map((status) => (
                    <div
                      key={status.key}
                      style={{ width: `${sum > 0 ? (point[status.key] / sum) * barWidth : 0}%` }}
                      className={`h-full ${status.barClass}`}
                    />
                  ))}
                </div>
                <span className="w-8 text-right font-mono font-bold text-slate-700">{sum}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
