import React, { useMemo, useState } from 'react';
import {
  Database,
  ExternalLink,
  Network,
  RefreshCw,
  ShieldCheck,
  Waypoints,
} from 'lucide-react';
import { Button } from './ui/Primitives';

export type KnowledgeGraphStatus = 'connecting' | 'ready' | 'error';

interface KnowledgeGraphScreenProps {
  graphContent?: React.ReactNode;
  graphUrl?: string;
}

const DEFAULT_KNOWLEDGE_GRAPH_URL = 'https://knowledge-graph-psychological.onrender.com/graph-viewer';

const statusStyles: Record<KnowledgeGraphStatus, { label: string; className: string; dotClassName: string }> = {
  connecting: {
    label: 'Đang kết nối',
    className: 'border-teal-200 bg-teal-50 text-academic-800',
    dotClassName: 'bg-academic-700',
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
      <header className="border-b border-rule pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50">
              <Network className="h-5 w-5 text-academic-700" />
            </div>
            <div>
              <h2 className="page-title">Knowledge Graph</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Trực quan hóa mối liên hệ giữa học sinh, tư vấn viên, yêu cầu tư vấn,
                lịch hẹn, phiên tư vấn, phản hồi và kế hoạch hỗ trợ.
              </p>
            </div>
          </div>

          <div className="shrink-0 border-l-2 border-academic-700 pl-3">
            <div className="text-xs text-slate-500">Trạng thái module</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink-950">
              <span className={`h-2 w-2 rounded-full ${statusStyle.dotClassName}`} />
              {statusStyle.label}
            </div>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-rule bg-white">
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
              <Button
                size="sm"
                onClick={reloadGraph}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                Tải lại
              </Button>
              <a
                href={resolvedGraphUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-academic-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-academic-800"
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
                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-academic-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">Đang tải Knowledge Graph...</p>
                    <p className="mt-1 text-xs text-slate-500">Dịch vụ Render có thể cần vài giây để khởi động.</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50 p-6">
                  <div className="max-w-md rounded-lg border border-rose-200 bg-white p-6 text-center">
                    <Network className="mx-auto h-8 w-8 text-rose-500" />
                    <h4 className="mt-3 text-base font-bold text-slate-900">Không thể tải Knowledge Graph</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Dịch vụ có thể đang khởi động hoặc tạm thời mất kết nối. Hãy thử tải lại hoặc mở toàn màn hình.
                    </p>
                    <Button
                      variant="primary"
                      onClick={reloadGraph}
                      className="mt-4"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Thử lại
                    </Button>
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
        <div className="rounded-lg border border-rule bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="h-4 w-4 text-academic-700" /> Nguồn dữ liệu
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Node và quan hệ được tải từ dịch vụ Knowledge Graph đang chạy trên Render.
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Waypoints className="h-4 w-4 text-teal-600" /> Quan hệ dữ liệu
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Theo dõi quan hệ Student, Counselor, Request, Booking, Session, Feedback và Treatment Plan.
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-academic-700" /> Phạm vi truy cập
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Mục tích hợp trong cổng quản trị chỉ hiển thị với tài khoản Admin.
          </p>
        </div>
      </section>
    </div>
  );
};
