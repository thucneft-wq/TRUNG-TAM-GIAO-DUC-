import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpDown,
  ShieldCheck,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Counselor, CreateCounselorInput, TimeRange } from '../types';
import { getCounselorEvaluation, PERFORMANCE_KPI_COUNT } from '../domain/kpiPolicy';
import { CounselorFormModal } from './CounselorFormModal';
import { Button, TabButton, TextInput } from './ui/Primitives';

interface CounselorListScreenProps {
  counselors: Counselor[];
  timeRange: TimeRange;
  initialFilterStatus?: 'all' | 'pass' | 'not-pass';
  onViewDetails: (counselor: Counselor) => void;
  onCreateCounselor: (input: CreateCounselorInput) => Promise<void>;
  dataSource: 'api' | 'mock';
  canManageCounselors: boolean;
}

const getCounselorListPresentation = (counselor: Counselor, timeRange: TimeRange) => {
  const timeMetrics = counselor.timeRangeMetrics[timeRange];
  const evaluation = getCounselorEvaluation(counselor, timeRange);
  return {
    timeMetrics,
    evaluation,
    passedKpis: evaluation.passedKpiCount,
    failedKpis: evaluation.failedKpiCount,
    isPass: evaluation.overallStatus === 'Pass',
    isInsufficientData: evaluation.overallStatus === 'Insufficient Data',
  };
};

export const CounselorListScreen: React.FC<CounselorListScreenProps> = ({
  counselors,
  timeRange,
  initialFilterStatus = 'all',
  onViewDetails,
  onCreateCounselor,
  dataSource,
  canManageCounselors,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'not-pass'>(initialFilterStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'students' | 'kpis'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter & Search
  const filteredCounselors = counselors.filter((c) => {
    const evaluation = getCounselorEvaluation(c, timeRange);
    const matchesFilter =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pass'
        ? evaluation.overallStatus === 'Pass'
        : evaluation.overallStatus !== 'Pass';

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.externalId?.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Sort
  const sortedCounselors = [...filteredCounselors].sort((a, b) => {
    const aMetrics = a.timeRangeMetrics[timeRange];
    const bMetrics = b.timeRangeMetrics[timeRange];
    const aEvaluation = getCounselorEvaluation(a, timeRange);
    const bEvaluation = getCounselorEvaluation(b, timeRange);

    let comp = 0;
    if (sortBy === 'id') {
      comp = a.id.localeCompare(b.id);
    } else if (sortBy === 'name') {
      comp = a.name.localeCompare(b.name);
    } else if (sortBy === 'students') {
      comp = aMetrics.assignedStudents - bMetrics.assignedStudents;
    } else if (sortBy === 'kpis') {
      comp = aEvaluation.passedKpiCount - bEvaluation.passedKpiCount;
    }

    return sortOrder === 'asc' ? comp : -comp;
  });

  const toggleSort = (field: 'id' | 'name' | 'students' | 'kpis') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleRowClick = (c: Counselor) => {
    onViewDetails(c);
  };

  const passCount = counselors.filter(
    (c) => getCounselorEvaluation(c, timeRange).overallStatus === 'Pass',
  ).length;
  const notPassCount = counselors.filter(
    (c) => getCounselorEvaluation(c, timeRange).overallStatus === 'Not Pass',
  ).length;
  const insufficientCount = counselors.filter(
    (c) => getCounselorEvaluation(c, timeRange).overallStatus === 'Insufficient Data',
  ).length;
  const reviewCount = notPassCount + insufficientCount;

  return (
    <div id="screen-counselor-performance" className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-rule pb-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="page-title">Hiệu suất tư vấn viên</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              Kết quả <strong>Đạt</strong> yêu cầu ít nhất 3/4 KPI hiệu suất có đủ bằng chứng và đạt, đồng thời có ca nhưng không vượt giới hạn an toàn. Trường hợp thiếu dữ liệu được hiển thị riêng.
            </p>
            <p className="mt-2 text-xs text-slate-500">Dữ liệu theo kỳ đang chọn · <strong className="font-semibold text-ink-950">{counselors.length}</strong> tư vấn viên</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
            {canManageCounselors && (
              <Button
                id="btn-add-counselor"
                onClick={() => setIsCreateOpen(true)}
                variant="primary"
              >
                <Plus className="h-4 w-4" />
                Thêm tư vấn viên
              </Button>
            )}
          </div>
      </header>

      <section className="grid grid-cols-3 divide-x divide-rule border-y border-rule bg-white" aria-label="Tổng hợp trạng thái tư vấn viên">
        <div className="px-4 py-3"><p className="text-xs text-slate-500">Đạt yêu cầu</p><p className="mt-1 font-display text-2xl font-semibold text-pine-700">{passCount}</p></div>
        <div className="px-4 py-3"><p className="text-xs text-slate-500">Chưa đạt</p><p className="mt-1 font-display text-2xl font-semibold text-brick-700">{notPassCount}</p></div>
        <div className="px-4 py-3"><p className="text-xs text-slate-500">Thiếu dữ liệu</p><p className="mt-1 font-display text-2xl font-semibold text-amber-800">{insufficientCount}</p></div>
      </section>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col gap-3 border-b border-rule pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div id="counselor-status-filters" className="flex w-full overflow-x-auto border-b border-rule sm:w-auto" role="tablist" aria-label="Lọc theo kết quả KPI">
          <TabButton
            id="filter-status-all"
            role="tab"
            selected={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            className="shrink-0 px-3"
          >
            Tất cả ({counselors.length})
          </TabButton>
          <TabButton
            id="filter-status-pass"
            role="tab"
            selected={statusFilter === 'pass'}
            onClick={() => setStatusFilter('pass')}
            className="shrink-0 px-3"
          >
            <span>Đạt ({passCount})</span>
          </TabButton>
          <TabButton
            id="filter-status-not-pass"
            role="tab"
            selected={statusFilter === 'not-pass'}
            onClick={() => setStatusFilter('not-pass')}
            className="shrink-0 px-3"
          >
            <span>Cần rà soát ({reviewCount})</span>
          </TabButton>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <TextInput
            id="input-counselor-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc đơn vị..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Main Table for Desktop */}
      <section className="overflow-hidden border-y border-rule bg-white">
        {sortedCounselors.length === 0 ? (
          <div className="p-10 text-center text-slate-500 md:hidden">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="font-semibold text-slate-700">Không có tư vấn viên phù hợp</p>
            <p className="mt-0.5 text-2xs text-slate-400">Hãy xóa nội dung tìm kiếm hoặc chọn “Tất cả tư vấn viên”.</p>
          </div>
        ) : (
          <div className="divide-y divide-rule md:hidden">
            {sortedCounselors.map((counselor) => {
              const presentation = getCounselorListPresentation(counselor, timeRange);
              return (
                <article key={counselor.id} className="min-w-0 space-y-4 p-4 text-sm text-slate-700">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded bg-academic-700 text-xs font-semibold text-white">
                        {counselor.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-pretty font-semibold text-ink-950">{counselor.name}</h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{counselor.department}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded border border-rule bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                      {counselor.externalId ?? 'Chưa có mã'}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 border-l border-rule pl-3">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Học sinh</dt>
                      <dd className="mt-1 font-bold text-slate-800">{presentation.timeMetrics.assignedStudents}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">KPI hiệu suất</dt>
                      <dd className="mt-1 font-bold text-slate-800">{presentation.passedKpis}/{PERFORMANCE_KPI_COUNT} đạt · {presentation.failedKpis} chưa đạt</dd>
                    </div>
                  </dl>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    {presentation.isPass ? (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-pine-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đạt
                      </span>
                    ) : presentation.isInsufficientData ? (
                      <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Chưa đủ dữ liệu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-brick-700">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" /> Chưa đạt
                      </span>
                    )}
                    <Button size="sm" onClick={() => handleRowClick(counselor)}>
                      <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="hidden overflow-x-auto md:block">
          <table id="counselor-performance-table" className="w-full text-left text-xs">
            <thead className="border-b border-rule bg-slate-50 font-medium text-slate-500">
              <tr>
                <th
                  onClick={() => toggleSort('id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Mã tư vấn viên</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Họ tên và đơn vị chuyên môn</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('students')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 text-right sm:text-left"
                >
                  <div className="flex items-center gap-1">
                    <span>Học sinh được phân công</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('kpis')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>KPI hiệu suất đạt</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <span>KPI chưa đạt</span>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <span>Trạng thái tổng thể</span>
                </th>
                <th className="py-3.5 px-4 text-right">
                  <span>Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedCounselors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Không có tư vấn viên phù hợp</p>
                    <p className="text-2xs text-slate-400 mt-0.5">
                      Hãy xóa nội dung tìm kiếm hoặc chọn “Tất cả tư vấn viên”.
                    </p>
                  </td>
                </tr>
              ) : (
                sortedCounselors.map((c) => {
                  const presentation = getCounselorListPresentation(c, timeRange);

                  return (
                    <tr
                      key={c.id}
                      id={`counselor-row-${c.id}`}
                      tabIndex={0}
                      aria-label={`Mở chi tiết KPI của ${c.name}`}
                      onClick={() => handleRowClick(c)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleRowClick(c);
                        }
                      }}
                      className="group cursor-pointer hover:bg-teal-50/60 focus:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-academic-700"
                    >
                      {/* Counselor ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {c.externalId ?? 'Chưa có mã'}
                        </span>
                      </td>

                      {/* Name & Department */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 transition-colors group-hover:text-academic-700">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded bg-academic-700 text-xs font-semibold text-white">
                            {c.name.charAt(0)}
                          </div>
                          <span>{c.name}</span>
                        </div>
                        <div className="text-2xs text-slate-500 mt-0.5">
                          {c.department}
                        </div>
                      </td>

                      {/* Assigned Students */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {presentation.timeMetrics.assignedStudents} học sinh
                        </div>
                        <div className="text-2xs text-slate-500">
                          Hạn mức tải ca
                        </div>
                      </td>

                      {/* Passed KPI Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-md text-xs ${
                            presentation.isPass
                              ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {presentation.passedKpis} / {PERFORMANCE_KPI_COUNT}
                        </span>
                      </td>

                      {/* Failed KPI Count */}
                      <td className="py-3.5 px-4 text-center">
                        {presentation.failedKpis > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-xs border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            {presentation.failedKpis}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">0</span>
                        )}
                      </td>

                      {/* Overall Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {presentation.isPass ? (
                          <span
                            id={`badge-status-${c.id}`}
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-pine-700"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đạt
                          </span>
                        ) : presentation.isInsufficientData ? (
                          <span
                            id={`badge-status-${c.id}`}
                            className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Chưa đủ dữ liệu
                          </span>
                        ) : (
                          <span
                            id={`badge-status-${c.id}`}
                            className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-brick-700"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Chưa đạt
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-view-details-${c.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(c);
                          }}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded border border-rule bg-white px-3 text-xs font-semibold text-slate-700 hover:border-academic-700 hover:text-academic-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info notice */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-rule bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Dữ liệu tư vấn viên đã tổng hợp · Không bao gồm thông tin định danh học sinh</span>
          </div>
          <div>
            Đang hiển thị <strong>{sortedCounselors.length}</strong> trên <strong>{counselors.length}</strong> tư vấn viên
          </div>
        </div>
      </section>

      {canManageCounselors && isCreateOpen && (
        <CounselorFormModal
          mode="create"
          dataSource={dataSource}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (input) => {
            await onCreateCounselor(input);
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
};
