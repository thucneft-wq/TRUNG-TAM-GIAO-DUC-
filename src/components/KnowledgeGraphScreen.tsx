import React, { useMemo, useState } from 'react';
import {
  Database,
  ExternalLink,
  Network,
  RefreshCw,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';

export type KnowledgeGraphStatus = 'connecting' | 'ready' | 'error';

interface KnowledgeGraphScreenProps {
  graphContent?: React.ReactNode;
  graphUrl?: string;
}

const DEFAULT_KNOWLEDGE_GRAPH_URL = 'https://knowledge-graph-psychological.onrender.com/graph-viewer';

const statusStyles: Record<KnowledgeGraphStatus, { label: string; className: string; dotClassName: string }> = {
  connecting: {
    label: 'Đang kết nối',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    dotClassName: 'bg-blue-500',
  },
  ready: {
    label: 'Đã kết nối',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-400',
  },
  error: {
    label: 'Không thể tải',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-400',
  },
};

const normalizeGraphUrl = (value: string | undefined) => {
  const candidate = value?.trim() || DEFAULT_KNOWLEDGE_GRAPH_URL;

  try {
    const parsedUrl = new URL(candidate);
    if (parsedUrl.protocol !== 'https:') return DEFAULT_KNOWLEDGE_GRAPH_URL;
    return parsedUrl.toString();
  } catch {
    return DEFAULT_KNOWLEDGE_GRAPH_URL;
  }
};

export const KnowledgeGraphScreen: React.FC<KnowledgeGraphScreenProps> = ({
  graphContent,
  graphUrl,
}) => {
  const resolvedGraphUrl = useMemo(
    () => normalizeGraphUrl(graphUrl ?? import.meta.env.VITE_KNOWLEDGE_GRAPH_URL),
    [graphUrl],
  );
  const [status, setStatus] = useState<KnowledgeGraphStatus>(graphContent ? 'ready' : 'connecting');
  const [frameKey, setFrameKey] = useState(0);
  const statusStyle = statusStyles[status];

  const reloadGraph = () => {
    setStatus('connecting');
    setFrameKey((value) => value + 1);
  };

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
                  KG 360°
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-2xs font-medium text-slate-300">
                  Chỉ dành cho Admin
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Knowledge Graph</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
                Trực quan hóa mối liên hệ giữa học sinh, tư vấn viên, yêu cầu tư vấn,
                lịch hẹn, phiên tư vấn, phản hồi và kế hoạch hỗ trợ.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">Trạng thái module</div>
            <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
              <span className={`h-2 w-2 rounded-full ${statusStyle.dotClassName}`} />
              {statusStyle.label}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Đồ thị dữ liệu tâm lý học đường</h3>
              <span className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${statusStyle.className}`}>
                {statusStyle.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Dữ liệu được tải trực tiếp từ dịch vụ Knowledge Graph đã triển khai.
            </p>
          </div>

          {!graphContent && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reloadGraph}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                Tải lại
              </button>
              <a
                href={resolvedGraphUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Mở toàn màn hình
              </a>
            </div>
          )}
        </div>

        <div
          id="knowledge-graph-viewport"
          data-integration-status={status}
          className="relative min-h-[620px] overflow-hidden bg-slate-50"
        >
          {graphContent ? (
            <div className="absolute inset-0">{graphContent}</div>
          ) : (
            <>
              {status === 'connecting' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">Đang tải Knowledge Graph...</p>
                    <p className="mt-1 text-xs text-slate-500">Dịch vụ Render có thể cần vài giây để khởi động.</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50 p-6">
                  <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
                    <Network className="mx-auto h-8 w-8 text-rose-500" />
                    <h4 className="mt-3 text-base font-bold text-slate-900">Không thể tải Knowledge Graph</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Dịch vụ có thể đang khởi động hoặc tạm thời mất kết nối. Hãy thử tải lại hoặc mở toàn màn hình.
                    </p>
                    <button
                      type="button"
                      onClick={reloadGraph}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Thử lại
                    </button>
                  </div>
                </div>
              )}
              <iframe
                key={frameKey}
                src={resolvedGraphUrl}
                title="Knowledge Graph tâm lý học đường"
                className="absolute inset-0 h-full w-full border-0"
                loading="eager"
                allow="fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => setStatus('ready')}
                onError={() => setStatus('error')}
              />
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Thông tin Knowledge Graph">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="h-4 w-4 text-blue-600" /> Nguồn dữ liệu
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Node và quan hệ được tải từ dịch vụ Knowledge Graph đang chạy trên Render.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Waypoints className="h-4 w-4 text-teal-600" /> Quan hệ dữ liệu
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Theo dõi quan hệ Student, Counselor, Request, Booking, Session, Feedback và Treatment Plan.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-violet-600" /> Phạm vi truy cập
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Mục tích hợp trong cổng quản trị chỉ hiển thị với tài khoản Admin.
          </p>
        </div>
      </section>
    </div>
  );
};
