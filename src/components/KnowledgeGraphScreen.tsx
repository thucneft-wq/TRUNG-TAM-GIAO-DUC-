import React from 'react';
import {
  Braces,
  Database,
  Expand,
  Network,
  RotateCcw,
  Search,
  ShieldCheck,
  Waypoints,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export type KnowledgeGraphStatus = 'waiting' | 'connecting' | 'ready' | 'error';

interface KnowledgeGraphScreenProps {
  graphContent?: React.ReactNode;
  status?: KnowledgeGraphStatus;
}

const statusStyles: Record<KnowledgeGraphStatus, { label: string; className: string }> = {
  waiting: {
    label: 'Chờ tích hợp',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  connecting: {
    label: 'Đang kết nối',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  ready: {
    label: 'Sẵn sàng',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  error: {
    label: 'Lỗi kết nối',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
};

const PlaceholderGraph = () => (
  <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg
      viewBox="0 0 1000 520"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full opacity-60"
    >
      <g stroke="rgb(148 163 184)" strokeWidth="1.5" strokeDasharray="7 8">
        <line x1="180" y1="130" x2="390" y2="235" />
        <line x1="390" y1="235" x2="620" y2="145" />
        <line x1="390" y1="235" x2="690" y2="350" />
        <line x1="690" y1="350" x2="850" y2="220" />
        <line x1="180" y1="390" x2="390" y2="235" />
      </g>
      <g fill="rgb(255 255 255)" stroke="rgb(147 197 253)" strokeWidth="3">
        <circle cx="180" cy="130" r="22" />
        <circle cx="620" cy="145" r="18" />
        <circle cx="850" cy="220" r="21" />
        <circle cx="180" cy="390" r="17" />
        <circle cx="690" cy="350" r="24" />
      </g>
      <circle cx="390" cy="235" r="31" fill="rgb(239 246 255)" stroke="rgb(37 99 235)" strokeWidth="4" />
    </svg>
  </div>
);

export const KnowledgeGraphScreen: React.FC<KnowledgeGraphScreenProps> = ({
  graphContent,
  status = graphContent ? 'ready' : 'waiting',
}) => {
  const statusStyle = statusStyles[status];

  return (
    <div id="screen-knowledge-graph" className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-blue-800/40 bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 p-5 text-white shadow-md sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <Network className="h-6 w-6 text-teal-300" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-teal-300">
                  Khung tích hợp tương lai
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-2xs font-medium text-slate-300">
                  Chỉ dành cho Admin
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Knowledge Graph</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Không gian trực quan hóa mối liên hệ giữa học sinh, tư vấn viên, phiên tham vấn,
                bài đánh giá và kết quả sau khi module dữ liệu được bàn giao.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">Trạng thái module</div>
            <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Chưa nhận nguồn graph
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Không gian trực quan hóa</h3>
              <span className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${statusStyle.className}`}>
                {statusStyle.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Canvas sẽ được thay thế bằng graph thật khi API sẵn sàng.</p>
          </div>

          <div className="flex items-center gap-2" aria-label="Thanh công cụ Knowledge Graph chưa khả dụng">
            <label className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                disabled
                placeholder="Tìm node..."
                className="w-44 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-500 disabled:cursor-not-allowed"
              />
            </label>
            {[
              { label: 'Thu nhỏ', icon: ZoomOut },
              { label: 'Phóng to', icon: ZoomIn },
              { label: 'Đặt lại', icon: RotateCcw },
              { label: 'Toàn màn hình', icon: Expand },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                title={`${label} — khả dụng sau khi tích hợp`}
                aria-label={`${label} — chưa khả dụng`}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-400 disabled:cursor-not-allowed"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div
          id="knowledge-graph-viewport"
          data-integration-status={status}
          className="relative min-h-[460px] overflow-hidden bg-slate-50"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(203 213 225 / 0.72) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          {graphContent ? (
            <div className="absolute inset-0">{graphContent}</div>
          ) : (
            <>
              <PlaceholderGraph />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="relative max-w-md rounded-2xl border border-blue-200 bg-white/95 p-6 text-center shadow-xl shadow-slate-300/30 backdrop-blur-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Waypoints className="h-6 w-6" />
                  </div>
                  <h4 className="mt-4 text-base font-bold text-slate-900">Vùng hiển thị Knowledge Graph</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Khung giao diện đã sẵn sàng. Dữ liệu mẫu không được hiển thị để tránh nhầm với dữ liệu thật của hệ thống.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 font-mono text-2xs text-slate-600">
                    <Braces className="h-3.5 w-3.5 text-blue-600" />
                    knowledge-graph-viewport
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Thông tin chuẩn bị tích hợp">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="h-4 w-4 text-blue-600" /> Nguồn dữ liệu
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Chờ API cung cấp danh sách node, cạnh liên kết và thuộc tính hiển thị.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Waypoints className="h-4 w-4 text-teal-600" /> Quan hệ dữ liệu
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Sẵn sàng thể hiện quan hệ Student, Counselor, Session, Test và Result.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-violet-600" /> Phạm vi truy cập
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Khung chỉ xuất hiện với Admin; dữ liệu nhạy cảm vẫn cần được ẩn danh ở API.
          </p>
        </div>
      </section>
    </div>
  );
};
