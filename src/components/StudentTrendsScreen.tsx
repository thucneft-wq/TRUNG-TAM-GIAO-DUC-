import React from 'react';
import { Activity, BrainCircuit, FileCheck2, ShieldCheck, UsersRound } from 'lucide-react';
import type {
  AnalyticsFilterOptions,
  AnalyticsFilters,
  StudentTrendAnalytics,
} from '../types';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';

interface StudentTrendsScreenProps {
  data: StudentTrendAnalytics;
  filters: AnalyticsFilters;
  filterOptions: AnalyticsFilterOptions;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onExport: () => void;
  isExporting: boolean;
}

const periodLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? `Tháng ${Number(match[2])}/${match[1]}` : value;
};

export const StudentTrendsScreen: React.FC<StudentTrendsScreenProps> = ({
  data,
  filters,
  filterOptions,
  onFiltersChange,
  onExport,
  isExporting,
}) => {
  const maximum = Math.max(
    1,
    ...data.timeline.map((item) => item.assessments + item.testResults),
    ...data.categoryDistribution.map((item) => item.count),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-cyan-900 p-6 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/10 p-2.5"><BrainCircuit className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">FR-ADM-05</p>
            <h2 className="mt-1 text-xl font-bold">Xu hướng tình trạng học viên</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-blue-100">
              Dữ liệu assessment và kết quả test được tổng hợp theo kỳ; không hiển thị danh tính,
              nội dung phiên tư vấn hoặc ghi chú tâm lý thô.
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
        exportLabel="Xuất xu hướng CSV"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={<Activity />} label="Assessment" value={data.suppressed ? 'Đã ẩn' : data.totalAssessments} tone="blue" />
        <MetricCard icon={<FileCheck2 />} label="Kết quả test" value={data.suppressed ? 'Đã ẩn' : data.totalTestResults} tone="teal" />
        <MetricCard icon={<UsersRound />} label="Cỡ mẫu sự kiện" value={data.suppressed ? `< ${data.minimumSampleSize}` : data.sampleSize} tone="indigo" />
      </div>

      {data.suppressed ? (
        <PrivacyState minimum={data.minimumSampleSize} />
      ) : data.sampleSize === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Diễn biến theo thời gian</h3>
            <p className="mt-1 text-xs text-slate-500">Số sự kiện đã hoàn thành trong từng kỳ.</p>
            <div className="mt-5 space-y-4">
              {data.timeline.map((item) => {
                const total = item.assessments + item.testResults;
                return (
                  <div key={item.period}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{periodLabel(item.period)}</span>
                      <span className="font-mono text-slate-500">{total} sự kiện</span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="bg-blue-600"
                        title={`Assessment: ${item.assessments}`}
                        style={{ width: `${(item.assessments / maximum) * 100}%` }}
                      />
                      <div
                        className="bg-teal-500"
                        title={`Kết quả test: ${item.testResults}`}
                        style={{ width: `${(item.testResults / maximum) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 flex gap-4 text-2xs text-slate-500">
                      <span>Assessment: {item.assessments}</span>
                      <span>Kết quả test: {item.testResults}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Phân bố nhóm kết quả</h3>
            <p className="mt-1 text-xs text-slate-500">Nhóm assessment/test đã chuẩn hóa trong SQL.</p>
            <div className="mt-5 space-y-3">
              {data.categoryDistribution.map((item) => (
                <div key={item.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                      style={{ width: `${(item.count / maximum) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: 'blue' | 'teal' | 'indigo';
}) => {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}
      </div>
      <div className="mt-2 text-3xl font-extrabold text-slate-950">
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </div>
    </div>
  );
};

const PrivacyState = ({ minimum }: { minimum: number }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
    <div>
      <h3 className="text-sm font-bold">Dữ liệu đang được bảo vệ</h3>
      <p className="mt-1 text-xs leading-relaxed">
        Cần tối thiểu {minimum} bản ghi trước khi hiển thị phân bố và xu hướng để hạn chế khả năng
        nhận diện học viên từ nhóm mẫu nhỏ.
      </p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
    <BrainCircuit className="mx-auto h-8 w-8 text-slate-400" />
    <h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có dữ liệu xu hướng</h3>
    <p className="mt-1 text-xs text-slate-500">Hãy thay đổi kỳ hoặc bộ lọc sau khi assessment/test được ghi nhận.</p>
  </div>
);
