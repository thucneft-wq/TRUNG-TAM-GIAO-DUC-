import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Users,
  CalendarCheck,
  Clock,
  Ban,
  FileCheck,
  FileText,
  Building2,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  TrendingUp,
  Award,
  AlertCircle,
  AlertTriangle,
  LoaderCircle,
  Pencil,
  UserMinus,
} from 'lucide-react';
import { Counselor, CreateCounselorInput, TimeRange, ScreenType } from '../types';
import {
  getCounselorEvaluation,
  getKpiActualValueLabel,
  getKpiAuditNote,
  getPerformanceTargetAlignmentLabel,
  isKpiEvaluable,
  PERFORMANCE_KPI_COUNT,
  REQUIRED_PASSED_KPIS,
  REQUIRED_KPI_COUNT,
} from '../domain/kpiPolicy';
import { CounselorFormModal } from './CounselorFormModal';

interface CounselorDetailScreenProps {
  counselor: Counselor;
  allCounselors: Counselor[];
  timeRange: TimeRange;
  onBack: () => void;
  onSelectCounselor: (counselor: Counselor) => void;
  onNavigate: (screen: ScreenType) => void;
  onUpdateCounselor: (input: CreateCounselorInput) => Promise<void>;
  onDeactivateCounselor: () => Promise<void>;
  dataSource: 'api' | 'mock';
  canManageCounselors: boolean;
}

export const CounselorDetailScreen: React.FC<CounselorDetailScreenProps> = ({
  counselor,
  allCounselors,
  timeRange,
  onBack,
  onSelectCounselor,
  onNavigate,
  onUpdateCounselor,
  onDeactivateCounselor,
  dataSource,
  canManageCounselors,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  // Current time metrics for the selected counselor
  const timeMetrics = counselor.timeRangeMetrics[timeRange];
  const evaluation = getCounselorEvaluation(counselor, timeRange);
  const periodKpis = evaluation.kpis;
  const passedKpis = evaluation.passedKpiCount;
  const failedKpis = evaluation.failedKpiCount;
  const isOverallPass = evaluation.overallStatus === 'Pass';
  const isInsufficientData = evaluation.overallStatus === 'Insufficient Data';
  const hrCompliance = timeMetrics.hrCompliance ?? counselor.hrCompliance;

  // Next / Previous counselor switcher
  const currentIndex = allCounselors.findIndex((c) => c.id === counselor.id);
  const prevCounselor =
    currentIndex > 0 ? allCounselors[currentIndex - 1] : allCounselors[allCounselors.length - 1];
  const nextCounselor =
    currentIndex < allCounselors.length - 1 ? allCounselors[currentIndex + 1] : allCounselors[0];

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'this-month':
        return 'Tháng này';
      case 'last-month':
        return 'Tháng trước';
      case 'all-time':
        return 'Toàn thời gian';
    }
  };

  return (
    <div id="screen-counselor-detail" className="space-y-6">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="btn-back-to-counselors"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors shadow-xs self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bảng hiệu suất</span>
        </button>

        {canManageCounselors && <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-edit-counselor"
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa tư vấn viên
          </button>
          <button
            id="btn-deactivate-counselor"
            type="button"
            onClick={() => {
              setDeactivateError(null);
              setIsDeactivateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <UserMinus className="h-3.5 w-3.5" />
            Ngừng hoạt động
          </button>
        </div>}

        {/* Quick Counselor Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-2xs text-slate-500 font-medium">Chuyển tư vấn viên:</span>
          <button
            type="button"
            onClick={() => onSelectCounselor(prevCounselor)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 shadow-xs"
            title={`Trước: ${prevCounselor.name}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">{prevCounselor.id}</span>
          </button>
          <span className="text-2xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {counselor.id} ({currentIndex + 1}/{allCounselors.length})
          </span>
          <button
            type="button"
            onClick={() => onSelectCounselor(nextCounselor)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1 shadow-xs"
            title={`Tiếp theo: ${nextCounselor.name}`}
          >
            <span className="hidden md:inline">{nextCounselor.id}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Counselor Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${counselor.avatarColor} text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0`}
            >
              {counselor.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-2xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {counselor.id}
                </span>
                <span className="text-2xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {counselor.title}
                </span>
                <span className="text-2xs text-slate-500 font-medium">
                  Dữ liệu {getTimeRangeLabel().toLocaleLowerCase('vi-VN')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {counselor.name}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {counselor.department}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {counselor.email}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Performance Status Badge Hero */}
          <div className="p-4 rounded-xl border flex flex-col items-center lg:items-end justify-center text-center lg:text-right bg-slate-50 border-slate-200 min-w-56">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Trạng thái chuyên môn tổng thể
            </div>

            {isOverallPass ? (
              <div
                id="counselor-detail-overall-status-pass"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Đạt ({passedKpis}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất)</span>
              </div>
            ) : isInsufficientData ? (
              <div
                id="counselor-detail-overall-status-insufficient"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Chưa đủ dữ liệu ({evaluation.evaluableKpiCount}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất)</span>
              </div>
            ) : (
              <div
                id="counselor-detail-overall-status-not-pass"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-xs"
              >
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Cần cải thiện ({passedKpis}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất đạt)</span>
              </div>
            )}

            <div className="text-2xs text-slate-500 mt-2">
              {isOverallPass
                ? 'Đạt ít nhất 3/4 KPI hiệu suất và khối lượng ca đang ở mức an toàn.'
                : isInsufficientData
                  ? 'Cần tối thiểu 3 KPI hiệu suất có đủ bằng chứng và phải có ca được phân công.'
                  : 'Cần đạt ít nhất 3/4 KPI hiệu suất và không phụ trách quá nhiều ca.'}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Five KPI Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Kết quả 4 KPI hiệu suất và 1 điều kiện an toàn
              <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Điều kiện đạt: ít nhất {REQUIRED_PASSED_KPIS}/{PERFORMANCE_KPI_COUNT} KPI và không quá tải ca
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Khối lượng ca là điều kiện an toàn, không được cộng thành tích hiệu suất; chấm công HR được tách riêng
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-2xs">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đạt: {passedKpis}
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
              <XCircle className="w-3.5 h-3.5" /> Cần cải thiện: {failedKpis}
            </span>
            {evaluation.insufficientDataKpiCount > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Chưa đủ dữ liệu: {evaluation.insufficientDataKpiCount}
              </span>
            )}
          </div>
        </div>

        {/* 5 KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!evaluation.hasExactlyFiveKpis && (
            <div className="md:col-span-2 lg:col-span-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <p>
                <strong>Chưa đủ dữ liệu để kết luận:</strong> hệ thống cần đủ {REQUIRED_KPI_COUNT} tiêu chí, nhưng hiện nhận được {periodKpis.length}. Kết quả tạm thời là <strong>Cần kiểm tra</strong>.
              </p>
            </div>
          )}

          {periodKpis.map((kpi, idx) => {
            const isPass = kpi.isPassed;
            const hasEnoughData = isKpiEvaluable(kpi);

            return (
              <div
                key={kpi.id}
                id={`kpi-card-${kpi.id}`}
                className={`p-5 rounded-xl border shadow-xs transition-all bg-white flex flex-col justify-between ${
                  !hasEnoughData
                    ? 'border-amber-200 hover:border-amber-300'
                    : isPass
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-rose-200 hover:border-rose-300'
                }`}
              >
                <div>
                  {/* Category & Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Tiêu chí #{idx + 1} • {kpi.category}
                    </span>
                    {!hasEnoughData ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        {getPerformanceTargetAlignmentLabel(kpi)}
                      </span>
                    ) : isPass ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {getPerformanceTargetAlignmentLabel(kpi)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        {getPerformanceTargetAlignmentLabel(kpi)}
                      </span>
                    )}
                  </div>

                  {/* KPI Name */}
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {kpi.name}
                  </h4>

                  {/* Actual vs Target Comparison Table / Box */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <div className="text-2xs font-medium text-slate-500 uppercase">Giá trị thực tế</div>
                      <div
                        className={`text-base font-bold mt-0.5 ${
                          !hasEnoughData ? 'text-amber-800' : isPass ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        {getKpiActualValueLabel(kpi)}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xs font-medium text-slate-500 uppercase">Giá trị mục tiêu</div>
                      <div className="text-base font-bold text-slate-700 mt-0.5">
                        {kpi.targetValue}
                      </div>
                    </div>
                  </div>

                  {/* Plain-language calculation note */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-2xs leading-relaxed text-slate-600">
                    <strong className="text-slate-700">Cách tính: </strong>
                    {getKpiAuditNote(kpi)}
                  </div>
                </div>

                {/* Plain-language status; no weighted score is shown to users. */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-2xs text-slate-500 font-medium">
                    <span>Kết luận</span>
                    <span className={!hasEnoughData ? 'text-amber-700' : isPass ? 'text-emerald-700' : 'text-rose-700'}>
                      {getPerformanceTargetAlignmentLabel(kpi)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 6th Card: Evaluation Rule Explanation Card */}
          <div className="p-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-teal-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-2">
                <Award className="w-4 h-4 text-blue-700" />
                Quy định tiêu chuẩn của đơn vị
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Trạng thái tổng thể <strong>Đạt</strong> khi có ít nhất {REQUIRED_PASSED_KPIS}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất có đủ dữ liệu và đạt, đồng thời có ca được phân công nhưng không vượt mức an toàn. Thiếu dữ liệu không bị tính là hiệu suất kém.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-white/80 border border-blue-100 text-2xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>KPI hiệu suất đạt:</span>
                  <span className="font-bold text-slate-800">{passedKpis} / {PERFORMANCE_KPI_COUNT}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tiêu chí chưa đủ dữ liệu:</span>
                  <span className="font-bold text-amber-700">{evaluation.insufficientDataKpiCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kết quả kiểm định:</span>
                  <span className={`font-bold ${isOverallPass ? 'text-emerald-700' : isInsufficientData ? 'text-amber-700' : 'text-rose-700'}`}>
                    {isOverallPass
                      ? 'ĐẠT (Tuân thủ)'
                      : isInsufficientData
                        ? 'CHƯA ĐỦ DỮ LIỆU'
                        : 'CHƯA ĐẠT (Cần khắc phục)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/60 text-2xs text-blue-800 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Được giám sát bởi Hội đồng Sức khỏe Học đường
            </div>
          </div>
        </div>
      </div>

      {/* HR attendance is intentionally separate from professional performance. */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" /> Tuân thủ chấm công HR
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi nhân sự riêng, không ảnh hưởng đến 4 KPI hiệu suất và điều kiện an toàn tải ca
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
            hrCompliance.status === 'Compliant'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : hrCompliance.status === 'Needs Review'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            {hrCompliance.status === 'Compliant'
              ? 'Không có cảnh báo'
              : hrCompliance.status === 'Needs Review'
                ? 'Cần rà soát'
                : 'Chưa có dữ liệu'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          {[
            ['Ngày đăng ký', hrCompliance.registeredWorkdays],
            ['Giờ đăng ký', hrCompliance.registeredHours],
            ['Giờ tối đa/ngày', hrCompliance.maxDailyHours],
            ['Ngày vượt 8 giờ', hrCompliance.overLimitDays],
            ['Tuần thiếu ngày nghỉ', hrCompliance.weeksWithoutRest],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="text-2xs text-slate-500">{label}</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
            </div>
          ))}
        </div>
        <p className="text-2xs leading-relaxed text-slate-500">{hrCompliance.note}</p>
      </div>

      {/* Section 2: Relationship Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Tổng hợp quan hệ và tải ca tư vấn viên
            <span className="text-2xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Đã đồng bộ Bản sao số
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp tải ca học sinh, trạng thái phiên tham vấn và các bài trắc nghiệm tâm lý
          </p>
        </div>

        {/* 6 Metric Grid for Relationship Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Assigned Students */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-500">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Học sinh được phân công
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {timeMetrics.assignedStudents}
            </div>
            <div className="text-2xs text-slate-500 mt-0.5">
              Danh sách tiếp nhận đang hoạt động
            </div>
          </div>

          {/* 2. Completed Bookings */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-blue-700">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
              Lịch hẹn đã hoàn thành
            </div>
            <div className="text-2xl font-extrabold text-blue-950 mt-1">
              {timeMetrics.completedBookings}
            </div>
            <div className="text-2xs text-blue-600 mt-0.5">
              Phiên đã thực hiện
            </div>
          </div>

          {/* 3. Pending Bookings */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-amber-700">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Lịch hẹn đang chờ
            </div>
            <div className="text-2xl font-extrabold text-amber-950 mt-1">
              {timeMetrics.pendingBookings}
            </div>
            <div className="text-2xs text-amber-600 mt-0.5">
              Đang chờ xếp lịch
            </div>
          </div>

          {/* 4. Cancelled Bookings */}
          <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-600">
              <Ban className="w-3.5 h-3.5 text-slate-500" />
              Lịch hẹn đã hủy
            </div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {timeMetrics.cancelledBookings}
            </div>
            <div className="text-2xs text-slate-500 mt-0.5">
              Đổi lịch / Hủy bỏ
            </div>
          </div>

          {/* 5. Completed Tests */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-teal-700">
              <FileCheck className="w-3.5 h-3.5 text-teal-600" />
              Bài đánh giá đã hoàn thành
            </div>
            <div className="text-2xl font-extrabold text-teal-950 mt-1">
              {timeMetrics.completedTests}
            </div>
            <div className="text-2xs text-teal-600 mt-0.5">
              PHQ-9, GAD-7, DASS-21
            </div>
          </div>

          {/* 6. Pending Tests */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-indigo-700">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Bài đánh giá đang chờ
            </div>
            <div className="text-2xl font-extrabold text-indigo-950 mt-1">
              {timeMetrics.pendingTests}
            </div>
            <div className="text-2xs text-indigo-600 mt-0.5">
              Bộ câu hỏi tự đánh giá
            </div>
          </div>
        </div>

        {/* Privacy Note Reminder Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-2xs text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Chính sách bảo mật:</strong> Theo mô hình quản trị dữ liệu của Trung tâm Tham vấn Tâm lý Học đường, mọi thông tin định danh học sinh, ghi chú đánh giá tâm lý thô và bản ghi nội dung phiên tham vấn đều không xuất hiện trên bảng phân tích quản trị. Hệ thống chỉ hiển thị các chỉ số vận hành đã tổng hợp.
          </p>
        </div>
      </div>

      {canManageCounselors && isEditOpen && (
        <CounselorFormModal
          mode="edit"
          counselor={counselor}
          dataSource={dataSource}
          onClose={() => setIsEditOpen(false)}
          onSubmit={async (input) => {
            await onUpdateCounselor(input);
            setIsEditOpen(false);
          }}
        />
      )}

      {canManageCounselors && isDeactivateOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-counselor-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
                <UserMinus className="h-5 w-5" />
              </div>
              <div>
                <h2 id="deactivate-counselor-title" className="text-base font-bold text-slate-900">
                  Ngừng hoạt động của {counselor.name}?
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Hồ sơ tư vấn viên vẫn được lưu giữ và trạng thái sẽ chuyển thành “Ngừng hoạt động”. Tư vấn viên sẽ không còn xuất hiện trong danh sách hiệu suất đang hoạt động.
                </p>
              </div>
            </div>
            {deactivateError && (
              <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {deactivateError}
              </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeactivating}
                onClick={() => setIsDeactivateOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeactivating}
                onClick={async () => {
                  setIsDeactivating(true);
                  setDeactivateError(null);
                  try {
                    await onDeactivateCounselor();
                    setIsDeactivateOpen(false);
                    onBack();
                  } catch (error) {
                    setDeactivateError(error instanceof Error ? error.message : 'Không thể ngừng hoạt động của tư vấn viên.');
                  } finally {
                    setIsDeactivating(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeactivating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                Xác nhận ngừng hoạt động
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
