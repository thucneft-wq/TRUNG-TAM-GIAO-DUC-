import React from 'react';
import { Frown, MessageSquareHeart, Meh, ShieldCheck, Smile, Star } from 'lucide-react';
import type {
  AnalyticsFilterOptions,
  AnalyticsFilters,
  FeedbackAnalytics,
} from '../types';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';

interface FeedbackAnalyticsScreenProps {
  data: FeedbackAnalytics;
  filters: AnalyticsFilters;
  filterOptions: AnalyticsFilterOptions;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onExport: () => void;
  isExporting: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const FeedbackAnalyticsScreen: React.FC<FeedbackAnalyticsScreenProps> = ({
  data,
  filters,
  filterOptions,
  onFiltersChange,
  onExport,
  isExporting,
  onRefresh,
  isRefreshing,
}) => {
  const maximum = Math.max(
    1,
    data.distribution.positive,
    data.distribution.neutral,
    data.distribution.negative,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-900 to-cyan-900 p-6 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/10 p-2.5"><MessageSquareHeart className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">FR-ADM-06</p>
            <h2 className="mt-1 text-xl font-bold">Phân tích phản hồi học viên</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-emerald-100">
              Theo dõi phân bố tích cực, trung lập, tiêu cực và xu hướng điểm đánh giá ở dạng tổng hợp.
            </p>
          </div>
        </div>
      </div>

      <AnalyticsFilterBar
        filters={filters}
        options={filterOptions}
        onChange={onFiltersChange}
        onExport={onExport}
        isExporting={isExporting}
        exportLabel="Xuất feedback CSV"
        showTestFilter={false}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<MessageSquareHeart />} label="Tổng feedback" value={data.suppressed ? `< ${data.minimumSampleSize}` : String(data.sampleSize)} tone="slate" />
        <SummaryCard icon={<Smile />} label="Tích cực" value={data.suppressed ? 'Đã ẩn' : String(data.distribution.positive)} tone="emerald" />
        <SummaryCard icon={<Frown />} label="Tiêu cực" value={data.suppressed ? 'Đã ẩn' : String(data.distribution.negative)} tone="rose" />
        <SummaryCard icon={<Star />} label="Điểm trung bình" value={data.averageRating?.toFixed(2) ?? '—'} tone="amber" />
      </div>

      {data.suppressed ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold">Phân bố feedback đang được ẩn</h3>
            <p className="mt-1 text-xs">Cần tối thiểu {data.minimumSampleSize} phản hồi để hiển thị analytics.</p>
          </div>
        </div>
      ) : data.sampleSize === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <MessageSquareHeart className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có feedback trong kỳ</h3>
          <p className="mt-1 text-xs text-slate-500">Dữ liệu sẽ xuất hiện sau khi feedback được đồng bộ vào SQL.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Phân bố cảm nhận</h3>
            <div className="mt-5 space-y-5">
              <DistributionRow label="Tích cực" value={data.distribution.positive} maximum={maximum} color="bg-emerald-500" icon={<Smile />} />
              <DistributionRow label="Trung lập" value={data.distribution.neutral} maximum={maximum} color="bg-amber-400" icon={<Meh />} />
              <DistributionRow label="Tiêu cực" value={data.distribution.negative} maximum={maximum} color="bg-rose-500" icon={<Frown />} />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5">
              <h3 className="text-sm font-bold text-slate-900">Xu hướng theo kỳ</h3>
              <p className="mt-1 text-xs text-slate-500">Bảng tổng hợp không chứa nội dung feedback thô.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-y border-slate-200 bg-slate-50 text-2xs uppercase tracking-wider text-slate-500">
                  <tr><th className="px-5 py-3">Kỳ</th><th className="px-3 py-3">Tích cực</th><th className="px-3 py-3">Trung lập</th><th className="px-3 py-3">Tiêu cực</th><th className="px-5 py-3 text-right">Điểm TB</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.timeline.map((item) => (
                    <tr key={item.period} className="text-slate-700">
                      <td className="px-5 py-3 font-semibold">{item.period}</td>
                      <td className="px-3 py-3 text-emerald-700">{item.positive}</td>
                      <td className="px-3 py-3 text-amber-700">{item.neutral}</td>
                      <td className="px-3 py-3 text-rose-700">{item.negative}</td>
                      <td className="px-5 py-3 text-right font-bold">{item.averageRating?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'slate' | 'emerald' | 'rose' | 'amber' }) => {
  const styles = {
    slate: 'border-slate-200 bg-white text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return <div className={`rounded-2xl border p-5 ${styles[tone]}`}><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</div><div className="mt-2 text-3xl font-extrabold text-slate-950">{value}</div></div>;
};

const DistributionRow = ({ label, value, maximum, color, icon }: { label: string; value: number; maximum: number; color: string; icon: React.ReactNode }) => (
  <div><div className="mb-1.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-semibold text-slate-700"><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</span><span className="font-bold text-slate-900">{value}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${(value / maximum) * 100}%` }} /></div></div>
);
