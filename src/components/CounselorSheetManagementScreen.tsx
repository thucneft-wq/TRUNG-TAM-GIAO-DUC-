import React, { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw, Search, ShieldCheck, Users2 } from 'lucide-react';
import type { Counselor } from '../types';

interface CounselorSheetManagementScreenProps {
  counselors: Counselor[];
  googleEntryUrl: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

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
    <div id="screen-counselor-sheet-management" className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-cyan-900 via-blue-800 to-indigo-800 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/10 p-3"><Users2 className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Counselor management</p>
              <h2 className="mt-1 text-xl font-bold">Danh sách tư vấn viên</h2>
              <p className="mt-1 text-xs text-blue-100">
                Web chỉ dùng để xem. Thêm, sửa hoặc ngừng hoạt động tư vấn viên được thực hiện trên Google Sheet.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onRefresh} disabled={isRefreshing} className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/20 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button type="button" onClick={openSheet} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-50">
              <ExternalLink className="h-4 w-4" />
              Mở Sheet tư vấn viên
            </button>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Cổng quản trị chỉ có một tài khoản Admin. Hồ sơ tư vấn viên là dữ liệu nghiệp vụ và không tạo tài khoản đăng nhập web.
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Danh sách tư vấn viên</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {counselors.length} hồ sơ hiển thị · {activeCount} đang hoạt động
              {onLeaveCount > 0 ? ` · ${onLeaveCount} tạm nghỉ` : ''}
            </p>
          </div>
          <label className="relative block w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, email, số điện thoại" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase tracking-wide text-slate-500">
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
                const status = counselor.status ?? 'ACTIVE';
                const statusLabel = status === 'ON_LEAVE' ? 'UNACTIVE' : status;
                const statusClass = status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-700'
                  : status === 'ON_LEAVE'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-600';

                return (
                  <tr key={counselor.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3"><div className="font-bold text-slate-900">{counselor.name}</div><div className="mt-0.5 font-mono text-2xs text-slate-400">{counselor.externalId ?? 'Chưa có mã'}</div></td>
                    <td className="px-4 py-3 text-slate-700">{counselor.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{counselor.phoneNumber || '—'}</td>
                    <td className="px-4 py-3"><div className="font-semibold text-slate-800">{counselor.role || 'Counselor'}</div><div className="mt-0.5 text-slate-500">{counselor.specialization || '—'}</div></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-bold ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={openSheet} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700 hover:bg-blue-100" aria-label={`Mở Sheet cập nhật ${counselor.name}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Mở Sheet
                      </button>
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
