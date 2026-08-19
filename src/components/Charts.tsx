import React, { useState } from 'react';
import { CheckCircle2, XCircle, Calendar, Clock, AlertTriangle, Info } from 'lucide-react';
import { DashboardMetrics } from '../types';

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
    <div id="counselor-pass-chart-container" className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Phân bố kết quả KPI tư vấn viên
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Yêu cầu đủ 5 KPI
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá tuân thủ Bản sao số theo thời gian thực
          </p>
        </div>
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            id="tab-pass-ratio"
            type="button"
            onClick={() => setActiveTab('ratio')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'ratio'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tổng quan
          </button>
          <button
            id="tab-pass-kpis"
            type="button"
            onClick={() => setActiveTab('kpis')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'kpis'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
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
              <span className="text-3xl font-extrabold text-slate-900">
                {passRate}%
              </span>
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Tỷ lệ đạt
              </span>
            </div>
          </div>

          {/* Metric Details */}
          <div className="space-y-3 w-full sm:w-56">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">Đạt (5/5 KPI)</div>
                  <div className="text-2xs text-emerald-700">Đáp ứng đầy đủ tiêu chuẩn</div>
                </div>
              </div>
              <span className="text-base font-bold text-emerald-800">{passed}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-950">Chưa đạt</div>
                  <div className="text-2xs text-rose-700">Chưa tuân thủ đủ 5/5</div>
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

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          Áp dụng ngưỡng đạt KPI tuyệt đối 100%
        </span>
        <span className="font-mono text-slate-600">Nhân sự hoạt động: {total}</span>
      </div>
    </div>
  );
};

interface BookingsChartProps {
  metrics: DashboardMetrics;
}

export const BookingsChart: React.FC<BookingsChartProps> = ({ metrics }) => {
  const { completed, pending, cancelled } = metrics.bookingsBreakdown;
  const total = completed + pending + cancelled;

  const compPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  const cancPct = total > 0 ? Math.max(0, 100 - compPct - pendPct) : 0;

  // Max value in trends for scaling bar charts
  const maxWeekly = Math.max(
    ...metrics.monthlyTrends.map((t) => t.completed + t.pending + t.cancelled),
    1
  );

  return (
    <div id="booking-status-chart-container" className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Trạng thái lịch hẹn tham vấn
            <span className="text-xs font-normal text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Tổng {total} phiên
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Các lịch hẹn đã hoàn thành, đang chờ phân loại và đã hủy
          </p>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="space-y-1.5 my-2">
        <div className="flex justify-between text-2xs font-semibold text-slate-500">
          <span>Phân bố trạng thái phiên</span>
          <span className="font-mono">Hiệu suất hoàn thành {compPct}%</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${compPct}%` }}
            className="bg-blue-600 h-full transition-all duration-500"
            title={`Đã hoàn thành: ${completed} (${compPct}%)`}
          />
          <div
            style={{ width: `${pendPct}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Đang chờ: ${pending} (${pendPct}%)`}
          />
          <div
            style={{ width: `${cancPct}%` }}
            className="bg-slate-300 h-full transition-all duration-500"
            title={`Đã hủy: ${cancelled} (${cancPct}%)`}
          />
        </div>
      </div>

      {/* Key breakdown statistics */}
      <div className="grid grid-cols-3 gap-2 my-2">
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-center">
          <div className="flex items-center justify-center gap-1 text-2xs font-bold text-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Đã hoàn thành
          </div>
          <div className="text-lg font-bold text-blue-950 mt-0.5">{completed}</div>
          <div className="text-2xs text-blue-600 font-mono">{compPct}%</div>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 text-center">
          <div className="flex items-center justify-center gap-1 text-2xs font-bold text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Đang chờ
          </div>
          <div className="text-lg font-bold text-amber-950 mt-0.5">{pending}</div>
          <div className="text-2xs text-amber-600 font-mono">{pendPct}%</div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200 text-center">
          <div className="flex items-center justify-center gap-1 text-2xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Đã hủy
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{cancelled}</div>
          <div className="text-2xs text-slate-500 font-mono">{cancPct}%</div>
        </div>
      </div>

      {/* Timeline Breakdown / Trend */}
      <div className="mt-2 pt-2.5 border-t border-slate-100">
        <div className="text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Phân bố theo dòng thời gian của kỳ
        </div>
        <div className="space-y-1.5">
          {metrics.monthlyTrends.map((t, idx) => {
            const sum = t.completed + t.pending + t.cancelled;
            const barWidth = (sum / maxWeekly) * 100;
            const completedWidth = sum > 0 ? (t.completed / sum) * barWidth : 0;
            const pendingWidth = sum > 0 ? (t.pending / sum) * barWidth : 0;
            const cancelledWidth = sum > 0 ? (t.cancelled / sum) * barWidth : 0;
            return (
              <div key={idx} className="flex items-center text-2xs gap-2">
                <span className="w-24 text-slate-600 font-medium truncate">{t.month}</span>
                <div className="flex-1 bg-slate-100 h-2.5 rounded overflow-hidden flex">
                  <div
                    style={{ width: `${completedWidth}%` }}
                    className="bg-blue-600 h-full"
                  />
                  <div
                    style={{ width: `${pendingWidth}%` }}
                    className="bg-amber-400 h-full"
                  />
                  <div
                    style={{ width: `${cancelledWidth}%` }}
                    className="bg-slate-300 h-full"
                  />
                </div>
                <span className="w-8 text-right font-mono font-bold text-slate-700">{sum}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
