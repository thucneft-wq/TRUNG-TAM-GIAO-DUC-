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
  Award,
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
import { Alert, Button, IconButton, ModalSurface } from './ui/Primitives';

const formatSessionDuration = (hours: number | null | undefined): string => {
  if (!hours || hours <= 0) return '0 giờ';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
};

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
  const hrCompliance = timeMetrics?.hrCompliance ?? counselor.hrCompliance ?? {
    status: 'No Data' as const,
    registeredWorkdays: 0,
    registeredHours: 0,
    maxDailyHours: 0,
    overLimitDays: 0,
    weeksWithoutRest: 0,
    note: 'Chấm công HR được theo dõi riêng và không ảnh hưởng đến 4 KPI hiệu suất hoặc điều kiện an toàn tải ca.',
  };

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
    <div id="screen-counselor-detail" className="space-y-7">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          id="btn-back-to-counselors"
          onClick={onBack}
          size="sm"
          className="self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bảng hiệu suất</span>
        </Button>

        {canManageCounselors && <div className="flex flex-wrap items-center gap-2">
          <Button
            id="btn-edit-counselor"
            onClick={() => setIsEditOpen(true)}
            size="sm"
            variant="primary"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa tư vấn viên
          </Button>
          <Button
            id="btn-deactivate-counselor"
            onClick={() => {
              setDeactivateError(null);
              setIsDeactivateOpen(true);
            }}
            size="sm"
            className="border-red-200 text-brick-700 hover:bg-red-50"
          >
            <UserMinus className="h-3.5 w-3.5" />
            Ngừng hoạt động
          </Button>
        </div>}

        {/* Quick Counselor Switcher */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-2xs text-slate-500 font-medium">Chuyển tư vấn viên:</span>
          <IconButton
            onClick={() => onSelectCounselor(prevCounselor)}
            className="size-9 border-rule"
            aria-label={`Tư vấn viên trước: ${prevCounselor.name}`}
            title={`Trước: ${prevCounselor.name}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </IconButton>
          <span className="text-2xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {counselor.externalId ?? 'Chưa có mã'} ({currentIndex + 1}/{allCounselors.length})
          </span>
          <IconButton
            onClick={() => onSelectCounselor(nextCounselor)}
            className="size-9 border-rule"
            aria-label={`Tư vấn viên tiếp theo: ${nextCounselor.name}`}
            title={`Tiếp theo: ${nextCounselor.name}`}
          >
            <ChevronRight className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* Counselor Profile Header Card */}
      <header className="border-y border-rule bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded bg-academic-700 font-display text-xl font-semibold text-white"
            >
              {counselor.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-2xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {counselor.externalId ?? 'Chưa có mã'}
                </span>
                <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-2xs font-semibold text-academic-800">
                  {counselor.title}
                </span>
                <span className="text-2xs text-slate-500 font-medium">
                  Dữ liệu {getTimeRangeLabel().toLocaleLowerCase('vi-VN')}
                </span>
              </div>

              <h1 className="page-title">
                {counselor.name}
              </h1>

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
          <div className="min-w-56 border-l-2 border-academic-700 pl-4 text-left lg:text-right">
            <div className="mb-1 text-xs font-medium text-slate-500">
              Trạng thái chuyên môn tổng thể
            </div>

            {isOverallPass ? (
              <div
                id="counselor-detail-overall-status-pass"
                className="inline-flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-pine-700"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Đạt ({passedKpis}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất)</span>
              </div>
            ) : isInsufficientData ? (
              <div
                id="counselor-detail-overall-status-insufficient"
                className="inline-flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
              >
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Chưa đủ dữ liệu ({evaluation.evaluableKpiCount}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất)</span>
              </div>
            ) : (
              <div
                id="counselor-detail-overall-status-not-pass"
                className="inline-flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-brick-700"
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
      </header>

      {/* Section 1: Five KPI Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title flex flex-wrap items-center gap-2">
              Kết quả 4 KPI hiệu suất và 1 điều kiện an toàn
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                Điều kiện đạt: ít nhất {REQUIRED_PASSED_KPIS}/{PERFORMANCE_KPI_COUNT} KPI và không quá tải ca
              </span>
            </h2>
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
        <div className="grid grid-cols-1 gap-px border-y border-rule bg-rule md:grid-cols-2 lg:grid-cols-3">
          {!evaluation.hasExactlyFiveKpis && (
            <div className="flex items-start gap-2 bg-red-50 p-4 text-xs text-red-950 md:col-span-2 lg:col-span-3">
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
                className="flex flex-col justify-between bg-white p-5"
              >
                <div>
                  {/* Category & Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">
                      Tiêu chí {idx + 1} · {kpi.category}
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
                  <h3 className="mt-2 text-sm font-semibold text-ink-950">
                    {kpi.name}
                  </h3>

                  {/* Actual vs Target Comparison Table / Box */}
                  <div className="my-3 grid grid-cols-2 divide-x divide-rule border-y border-rule bg-slate-50">
                    <div className="p-3">
                      <div className="text-xs font-medium text-slate-500">Giá trị thực tế</div>
                      <div
                        className={`text-base font-bold mt-0.5 ${
                          !hasEnoughData ? 'text-amber-800' : isPass ? 'text-emerald-800' : 'text-rose-800'
                        }`}
                      >
                        {getKpiActualValueLabel(kpi)}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-medium text-slate-500">Giá trị mục tiêu</div>
                      <div className="text-base font-bold text-slate-700 mt-0.5">
                        {kpi.targetValue}
                      </div>
                    </div>
                  </div>

                  {/* Plain-language calculation note */}
                  <div className="border-l-2 border-rule pl-3 text-xs leading-relaxed text-slate-600">
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
          <aside className="flex flex-col justify-between bg-teal-50 p-5">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-academic-800">
                <Award className="h-4 w-4 text-academic-700" />
                Quy định tiêu chuẩn của đơn vị
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Trạng thái tổng thể <strong>Đạt</strong> khi có ít nhất {REQUIRED_PASSED_KPIS}/{PERFORMANCE_KPI_COUNT} KPI hiệu suất có đủ dữ liệu và đạt, đồng thời có ca được phân công nhưng không vượt mức an toàn. Thiếu dữ liệu không bị tính là hiệu suất kém.
              </p>
              <div className="mt-3 space-y-1 border-y border-teal-200 bg-white/70 px-3 py-2.5 text-xs text-slate-600">
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

            <div className="mt-4 flex items-center gap-1 border-t border-teal-200/70 pt-3 text-2xs font-medium text-academic-800">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Được giám sát bởi Hội đồng Sức khỏe Học đường
            </div>
          </aside>
        </div>
      </div>

      {/* HR attendance is intentionally separate from professional performance. */}
      <section className="space-y-4 border-y border-rule bg-white px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Clock className="h-4 w-4 text-academic-700" /> Tuân thủ chấm công HR
            </h2>
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
        <div className="grid grid-cols-2 gap-px bg-rule text-center md:grid-cols-5">
          {/* Ngày đăng ký */}
          <div className="flex flex-col justify-center bg-slate-50 p-3">
            <div className="text-2xs text-slate-500">Ngày đăng ký</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {hrCompliance.registeredWorkdays}
            </div>
          </div>

          {/* Giờ đăng ký */}
          <div className="flex flex-col justify-center bg-slate-50 p-3">
            <div className="text-2xs text-slate-500">Giờ đăng ký</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {hrCompliance.registeredHours}
            </div>
          </div>

          {/* Ca dài nhất */}
          <div className="flex flex-col justify-center bg-slate-50 p-3">
            <div className="text-2xs text-slate-500">Ca dài nhất</div>

            <div className="mt-1 text-lg font-bold text-slate-900">
              {formatSessionDuration(hrCompliance.maxDailyHours)}
            </div>

            <div className="text-2xs text-slate-400 mt-0.5 font-medium">
              Giới hạn: 1 giờ/ca
            </div>
          </div>

          {/* Ca vượt giới hạn */}
          <div className="flex flex-col justify-center bg-slate-50 p-3">
            <div className="text-2xs text-slate-500">Ca vượt 1 giờ</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {hrCompliance.overLimitDays}
            </div>
          </div>

          {/* Tuần thiếu ngày nghỉ */}
          <div className="flex flex-col justify-center bg-slate-50 p-3">
            <div className="text-2xs text-slate-500">Tuần thiếu ngày nghỉ</div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {hrCompliance.weeksWithoutRest}
            </div>
          </div>
        </div>

        <p className="text-2xs leading-relaxed text-slate-500">
          {hrCompliance.note}
        </p>
      </section>

      {/* Section 2: Relationship Summary */}
      <section className="space-y-4 border-y border-rule bg-white px-4 py-5 sm:px-6">
        <div>
          <h2 className="section-title flex flex-wrap items-center gap-2">
            Tổng hợp quan hệ và tải ca tư vấn viên
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-medium text-pine-700">
              Đã đồng bộ Bản sao số
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp tải ca học sinh, trạng thái phiên tham vấn và các bài trắc nghiệm tâm lý
          </p>
        </div>

        {/* 6 Metric Grid for Relationship Summary */}
        <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Assigned Students */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Users className="h-3.5 w-3.5 text-academic-700" />
              Học sinh được phân công
            </div>
            <div className="mt-1 font-display text-2xl font-semibold text-ink-950">
              {timeMetrics.assignedStudents}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Danh sách tiếp nhận đang hoạt động
            </div>
          </div>

          {/* 2. Completed Bookings */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarCheck className="h-3.5 w-3.5 text-academic-700" />
              Lịch hẹn đã hoàn thành
            </div>
            <div className="mt-1 font-display text-2xl font-semibold text-ink-950">
              {timeMetrics.completedBookings}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Phiên đã thực hiện
            </div>
          </div>

          {/* 3. Pending Bookings */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Lịch hẹn đang chờ
            </div>
            <div className="mt-1 font-display text-2xl font-semibold text-ink-950">
              {timeMetrics.pendingBookings}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Đang chờ xếp lịch
            </div>
          </div>

          {/* 4. Cancelled Bookings */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Ban className="w-3.5 h-3.5 text-slate-500" />
              Lịch hẹn đã hủy
            </div>
            <div className="mt-1 font-display text-2xl font-semibold text-ink-950">
              {timeMetrics.cancelledBookings}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Đổi lịch / Hủy bỏ
            </div>
          </div>

          {/* 5. Completed Tests */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <FileCheck className="w-3.5 h-3.5 text-teal-600" />
              Bài đánh giá đã hoàn thành
            </div>
            <div className="mt-1 font-display text-2xl font-semibold text-ink-950">
              {timeMetrics.completedTests}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              PHQ-9, GAD-7, DASS-21
            </div>
          </div>

          {/* 6. Pending Tests */}
          <div className="bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <FileText className="h-3.5 w-3.5 text-academic-700" />
              Bài đánh giá đang chờ
            </div>
            <div className="mt-1 font-display text-2xl font-semibold text-ink-950">
              {timeMetrics.pendingTests}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Bộ câu hỏi tự đánh giá
            </div>
          </div>
        </div>

        {/* Privacy Note Reminder Banner */}
        <div className="flex items-start gap-2 border-l-2 border-rule bg-slate-50 px-3 py-3 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Chính sách bảo mật:</strong> Theo mô hình quản trị dữ liệu của Trung tâm Tham vấn Tâm lý Học đường, mọi thông tin định danh học sinh, ghi chú đánh giá tâm lý thô và bản ghi nội dung phiên tham vấn đều không xuất hiện trên bảng phân tích quản trị. Hệ thống chỉ hiển thị các chỉ số vận hành đã tổng hợp.
          </p>
        </div>
      </section>

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
        <ModalSurface
          title={`Ngừng hoạt động của ${counselor.name}?`}
          onClose={() => setIsDeactivateOpen(false)}
          className="max-w-md"
          footer={(
            <>
              <Button disabled={isDeactivating} onClick={() => setIsDeactivateOpen(false)}>Hủy</Button>
              <Button
                variant="danger"
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
              >
                {isDeactivating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                Xác nhận ngừng hoạt động
              </Button>
            </>
          )}
        >
            <div className="flex items-start gap-3">
              <div className="rounded bg-red-50 p-2 text-brick-700">
                <UserMinus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm leading-relaxed text-slate-600">
                  Hồ sơ tư vấn viên vẫn được lưu giữ và trạng thái sẽ chuyển thành “Ngừng hoạt động”. Tư vấn viên sẽ không còn xuất hiện trong danh sách hiệu suất đang hoạt động.
                </p>
              </div>
            </div>
            {deactivateError && <Alert tone="error" className="mt-4">{deactivateError}</Alert>}
        </ModalSurface>
      )}
    </div>
  );
};
