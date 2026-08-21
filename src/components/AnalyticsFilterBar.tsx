import React from 'react';
import { Download, Filter, RotateCcw } from 'lucide-react';
import type { AnalyticsFilterOptions, AnalyticsFilters } from '../types';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  options: AnalyticsFilterOptions;
  onChange: (filters: AnalyticsFilters) => void;
  onExport: () => void;
  isExporting: boolean;
  exportLabel: string;
  showTestFilter?: boolean;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  options,
  onChange,
  onExport,
  isExporting,
  exportLabel,
  showTestFilter = true,
}) => {
  const update = (key: keyof AnalyticsFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = Boolean(filters.counselorId || filters.testId || filters.category);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Filter className="h-4 w-4 text-blue-600" /> Bộ lọc phân tích
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Bộ lọc được áp dụng cho biểu đồ, số liệu và file xuất hiện tại.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => onChange({ counselorId: '', testId: '', category: '' })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Đang xuất…' : exportLabel}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${showTestFilter ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <label className="text-xs font-semibold text-slate-700">
          Tư vấn viên
          <select
            value={filters.counselorId}
            onChange={(event) => update('counselorId', event.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Tất cả tư vấn viên</option>
            {options.counselors.map((counselor) => (
              <option key={counselor.id} value={counselor.id}>{counselor.name}</option>
            ))}
          </select>
        </label>

        {showTestFilter && (
          <label className="text-xs font-semibold text-slate-700">
            Bài test
            <select
              value={filters.testId}
              onChange={(event) => update('testId', event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Tất cả bài test</option>
              {options.tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name}{test.type ? ` · ${test.type}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="text-xs font-semibold text-slate-700">
          Phân loại
          <select
            value={filters.category}
            onChange={(event) => update('category', event.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Tất cả phân loại</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
};
