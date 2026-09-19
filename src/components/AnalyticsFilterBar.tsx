import React from 'react';
import { Download, Filter, RefreshCw, RotateCcw } from 'lucide-react';
import type { AnalyticsFilterOptions, AnalyticsFilters } from '../types';
import { Button, Select } from './ui/Primitives';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters;
  options: AnalyticsFilterOptions;
  onChange: (filters: AnalyticsFilters) => void;
  onExport: () => void;
  isExporting: boolean;
  exportLabel: string;
  showTestFilter?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  options,
  onChange,
  onExport,
  isExporting,
  exportLabel,
  showTestFilter = true,
  onRefresh,
  isRefreshing = false,
}) => {
  const update = (key: keyof AnalyticsFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const hasFilters = Boolean(filters.counselorId || filters.testId || filters.category);

  return (
    <section className="border-y border-rule bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Filter className="h-4 w-4 text-academic-700" /> Bộ lọc phân tích
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Bộ lọc được áp dụng cho biểu đồ, số liệu và file xuất hiện tại.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              size="sm"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Đang cập nhật…' : 'Làm mới dữ liệu'}
            </Button>
          )}
          <Button
            size="sm"
            variant="quiet"
            disabled={!hasFilters}
            onClick={() => onChange({ counselorId: '', testId: '', category: '' })}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={isExporting}
            onClick={onExport}
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Đang xuất…' : exportLabel}
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${showTestFilter ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <label className="text-xs font-semibold text-slate-700">
          Tư vấn viên
          <Select
            value={filters.counselorId}
            onChange={(event) => update('counselorId', event.target.value)}
            className="mt-1 text-xs"
          >
            <option value="">Tất cả tư vấn viên</option>
            {options.counselors.map((counselor) => (
              <option key={counselor.id} value={counselor.id}>{counselor.name}</option>
            ))}
          </Select>
        </label>

        {showTestFilter && (
          <label className="text-xs font-semibold text-slate-700">
            Bài test
            <Select
              value={filters.testId}
              onChange={(event) => update('testId', event.target.value)}
              className="mt-1 text-xs"
            >
              <option value="">Tất cả bài test</option>
              {options.tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name}{test.type ? ` · ${test.type}` : ''}
                </option>
              ))}
            </Select>
          </label>
        )}

        <label className="text-xs font-semibold text-slate-700">
          Phân loại
          <Select
            value={filters.category}
            onChange={(event) => update('category', event.target.value)}
            className="mt-1 text-xs"
          >
            <option value="">Tất cả phân loại</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </label>
      </div>
    </section>
  );
};
