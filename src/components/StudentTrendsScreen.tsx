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
      <header className="border-b border-rule pb-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-academic-700"><BrainCircuit className="h-5 w-5" /></div>
          <div>
            <h2 className="page-title">Xu hướng tình trạng học viên</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Dữ liệu assessment và kết quả test được tổng hợp theo kỳ; không hiển thị danh tính,
              nội dung phiên tư vấn hoặc ghi chú tâm lý thô.
            </p>
          </div>
        </div>
      </header>

      <AnalyticsFilterBar
        filters={filters}
        options={filterOptions}
        onChange={onFiltersChange}
        onExport={onExport}
        isExporting={isExporting}
        exportLabel="Xuất xu hướng CSV"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={<Activity />} label="Assessment" value={data.suppressed ? 'Đã ẩn' : data.totalAssessments} />
        <MetricCard icon={<FileCheck2 />} label="Kết quả test" value={data.suppressed ? 'Đã ẩn' : data.totalTestResults} />
        <MetricCard icon={<UsersRound />} label="Cỡ mẫu sự kiện" value={data.suppressed ? `< ${data.minimumSampleSize}` : data.sampleSize} />
      </div>

      {data.suppressed ? (
        <PrivacyState minimum={data.minimumSampleSize} />
      ) : data.sampleSize === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-rule bg-white p-5">
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
                        className="bg-academic-700"
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

          <section className="rounded-lg border border-rule bg-white p-5">
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
                      className="h-full rounded-full bg-academic-700"
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) => {
  return (
    <div className="border-y border-rule bg-white p-5 text-academic-700">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums text-ink-950">
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </div>
    </div>
  );
};

const PrivacyState = ({ minimum }: { minimum: number }) => (
  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
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
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
    <BrainCircuit className="mx-auto h-8 w-8 text-slate-400" />
    <h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có dữ liệu xu hướng</h3>
    <p className="mt-1 text-xs text-slate-500">Hãy thay đổi kỳ hoặc bộ lọc sau khi assessment/test được ghi nhận.</p>
  </div>
);
