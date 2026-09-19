import React, { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import type { Counselor } from '../types';
import { Alert, Button, TextInput } from './ui/Primitives';

interface CounselorSheetManagementScreenProps {
  counselors: Counselor[];
  googleEntryUrl: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const getCounselorStatusPresentation = (counselor: Counselor) => {
  const status = counselor.status ?? 'ACTIVE';
  return {
    label: status === 'ACTIVE'
      ? 'Đang hoạt động'
      : status === 'ON_LEAVE'
        ? 'Tạm nghỉ'
        : 'Ngừng hoạt động',
    className: status === 'ACTIVE'
      ? 'bg-emerald-50 text-pine-700 ring-1 ring-inset ring-emerald-200'
      : status === 'ON_LEAVE'
        ? 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  };
};

export const CounselorSheetManagementScreen: React.FC<CounselorSheetManagementScreenProps> = ({
  counselors,
  googleEntryUrl,
  onRefresh,
  isRefreshing,
}) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const activeCount = counselors.filter((counselor) => counselor.status === 'ACTIVE').length;
  const onLeaveCount = counselors.filter((counselor) => counselor.status === 'ON_LEAVE').length;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return counselors;
    return counselors.filter((counselor) =>
      [
        counselor.name,
        counselor.email,
        counselor.phoneNumber,
        counselor.externalId,
        counselor.id,
      ]
        .some((value) => String(value ?? '').toLowerCase().includes(normalized)),
    );
  }, [counselors, query]);

  const openSheet = () => {
    if (!googleEntryUrl) {
      setError('Chưa cấu hình VITE_GOOGLE_COUNSELOR_ENTRY_URL trong .env.local.');
      return;
    }
    setError(null);
    window.open(googleEntryUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="screen-counselor-sheet-management" className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-rule pb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="page-title">Danh sách tư vấn viên</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Theo dõi hồ sơ nghiệp vụ và trạng thái hoạt động từ nguồn Google Sheet.</p>
          <p className="mt-2 text-xs text-slate-500"><strong className="font-semibold text-ink-950">{counselors.length}</strong> hồ sơ · <strong className="font-semibold text-ink-950">{activeCount}</strong> đang hoạt động{onLeaveCount > 0 ? ` · ${onLeaveCount} tạm nghỉ` : ''}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Button onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang làm mới' : 'Làm mới'}
          </Button>
          <Button variant="primary" onClick={openSheet}>
            <ExternalLink className="size-4" /> Mở Sheet tư vấn viên
          </Button>
        </div>
      </header>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-start gap-2 border-l-2 border-academic-700 bg-teal-50 px-3 py-2.5 text-xs text-academic-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Cổng quản trị chỉ có một tài khoản quản trị viên. Hồ sơ tư vấn viên là dữ liệu nghiệp vụ và không tạo tài khoản đăng nhập web.
        </span>
      </div>

      <section className="overflow-hidden border-y border-rule bg-white">
        <div className="flex flex-col gap-3 border-b border-rule p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Hồ sơ đang hiển thị</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filtered.length} kết quả phù hợp
            </p>
          </div>
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Tìm tư vấn viên</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, email, số điện thoại" className="pl-9" />
          </label>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-slate-500 md:hidden">Chưa có tư vấn viên phù hợp.</div>
        ) : (
          <div className="divide-y divide-rule md:hidden">
            {filtered.map((counselor) => {
              const statusPresentation = getCounselorStatusPresentation(counselor);
              return (
                <article key={counselor.id} className="min-w-0 p-4 text-sm text-slate-700">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-pretty font-semibold text-ink-950">{counselor.name}</h3>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">{counselor.externalId ?? 'Chưa có mã'}</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${statusPresentation.className}`}>
                      {statusPresentation.label}
                    </span>
                  </div>
                  <dl className="mt-4 grid min-w-0 grid-cols-1 gap-3 border-l border-rule pl-3">
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Email liên hệ</dt>
                      <dd className="mt-1 break-all text-slate-800">{counselor.email || '—'}</dd>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-slate-500">Số điện thoại</dt>
                        <dd className="mt-1 break-all text-slate-800">{counselor.phoneNumber || '—'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-slate-500">Vai trò</dt>
                        <dd className="mt-1 text-pretty font-semibold text-slate-800">{counselor.role || 'Tư vấn viên'}</dd>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Chuyên môn</dt>
                      <dd className="mt-1 text-pretty text-slate-800">{counselor.specialization || '—'}</dd>
                    </div>
                  </dl>
                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <Button size="sm" onClick={openSheet} aria-label={`Mở Sheet cập nhật ${counselor.name}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Mở Sheet
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Email đăng nhập</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Vai trò / chuyên môn</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Chưa có tư vấn viên phù hợp.</td></tr>
              ) : filtered.map((counselor) => {
                const statusPresentation = getCounselorStatusPresentation(counselor);

                return (
                  <tr key={counselor.id} className="hover:bg-teal-50/50">
                    <td className="px-4 py-3"><div className="font-bold text-slate-900">{counselor.name}</div><div className="mt-0.5 font-mono text-2xs text-slate-400">{counselor.externalId ?? 'Chưa có mã'}</div></td>
                    <td className="px-4 py-3 text-slate-700">{counselor.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{counselor.phoneNumber || '—'}</td>
                    <td className="px-4 py-3"><div className="font-semibold text-slate-800">{counselor.role || 'Tư vấn viên'}</div><div className="mt-0.5 text-slate-500">{counselor.specialization || '—'}</div></td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 font-semibold ${statusPresentation.className}`}>
                        {statusPresentation.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={openSheet} aria-label={`Mở Sheet cập nhật ${counselor.name}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Mở Sheet
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
