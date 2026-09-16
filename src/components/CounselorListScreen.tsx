import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowUpDown,
  UserCheck,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Counselor, CreateCounselorInput, TimeRange } from '../types';
import { getCounselorEvaluation, PERFORMANCE_KPI_COUNT } from '../domain/kpiPolicy';
import { CounselorFormModal } from './CounselorFormModal';

interface CounselorListScreenProps {
  counselors: Counselor[];
  timeRange: TimeRange;
  initialFilterStatus?: 'all' | 'pass' | 'not-pass';
  onSelectCounselor: (counselor: Counselor) => void;
  onNavigateToDetail: () => void;
  onCreateCounselor: (input: CreateCounselorInput) => Promise<void>;
  dataSource: 'api' | 'mock';
  canManageCounselors: boolean;
}

export const CounselorListScreen: React.FC<CounselorListScreenProps> = ({
  counselors,
  timeRange,
  initialFilterStatus = 'all',
  onSelectCounselor,
  onNavigateToDetail,
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
    onSelectCounselor(c);
    onNavigateToDetail();
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
    <div id="screen-counselor-performance" className="space-y-6">
      {/* Header Summary & Context */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Hiệu suất tư vấn viên và kiểm định KPI
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Kết quả <strong>Đạt</strong> yêu cầu ít nhất 3/4 KPI hiệu suất có đủ bằng chứng và đạt, đồng thời có ca nhưng không vượt giới hạn an toàn. Trường hợp thiếu dữ liệu được hiển thị riêng.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {canManageCounselors && (
              <button
                id="btn-add-counselor"
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Thêm tư vấn viên
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-2xs font-semibold uppercase text-slate-500">Tổng:</span>
              <span className="text-xs font-bold text-slate-800">{counselors.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-2xs font-semibold uppercase text-emerald-700">Đạt:</span>
              <span className="text-xs font-bold text-emerald-900">{passCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-lg border border-rose-200">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span className="text-2xs font-semibold uppercase text-rose-700">Chưa đạt:</span>
              <span className="text-xs font-bold text-rose-900">{notPassCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-2xs font-semibold uppercase text-amber-700">Thiếu dữ liệu:</span>
              <span className="text-xs font-bold text-amber-900">{insufficientCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div id="counselor-status-filters" className="flex items-center bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            id="filter-status-all"
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả tư vấn viên ({counselors.length})
          </button>
          <button
            id="filter-status-pass"
            type="button"
            onClick={() => setStatusFilter('pass')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === 'pass'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đạt ({passCount})</span>
          </button>
          <button
            id="filter-status-not-pass"
            type="button"
            onClick={() => setStatusFilter('not-pass')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === 'not-pass'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cần rà soát ({reviewCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="input-counselor-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc đơn vị..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Main Table for Desktop */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table id="counselor-performance-table" className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
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
                  const timeMetrics = c.timeRangeMetrics[timeRange];
                  const evaluation = getCounselorEvaluation(c, timeRange);
                  const passedKpis = evaluation.passedKpiCount;
                  const failedKpis = evaluation.failedKpiCount;
                  const isPass = evaluation.overallStatus === 'Pass';
                  const isInsufficientData = evaluation.overallStatus === 'Insufficient Data';

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
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    >
                      {/* Counselor ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <span className="px-2 py-1 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {c.externalId ?? 'Chưa có mã'}
                        </span>
                      </td>

                      {/* Name & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${c.avatarColor} text-white flex items-center justify-center text-2xs font-bold shrink-0`}>
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
                          {timeMetrics.assignedStudents} học sinh
                        </div>
                        <div className="text-2xs text-slate-500">
                          Hạn mức tải ca
                        </div>
                      </td>

                      {/* Passed KPI Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-md text-xs ${
                            isPass
                              ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {passedKpis} / {PERFORMANCE_KPI_COUNT}
                        </span>
                      </td>

                      {/* Failed KPI Count */}
                      <td className="py-3.5 px-4 text-center">
                        {failedKpis > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-xs border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            {failedKpis}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">0</span>
                        )}
                      </td>

                      {/* Overall Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isPass ? (
                          <span
                            id={`badge-status-${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đạt
                          </span>
                        ) : isInsufficientData ? (
                          <span
                            id={`badge-status-${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Chưa đủ dữ liệu
                          </span>
                        ) : (
                          <span
                            id={`badge-status-${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-all border border-slate-200 cursor-pointer shadow-xs group-hover:border-blue-300"
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
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Dữ liệu tư vấn viên đã tổng hợp · Không bao gồm thông tin định danh học sinh</span>
          </div>
          <div>
            Đang hiển thị <strong>{sortedCounselors.length}</strong> trên <strong>{counselors.length}</strong> tư vấn viên
          </div>
        </div>
      </div>

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
