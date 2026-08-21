import React from 'react';
import { FileClock, ShieldCheck } from 'lucide-react';
import type { AuditLogItem } from '../types';

export const AuditLogsScreen: React.FC<{ logs: AuditLogItem[] }> = ({ logs }) => (
  <div className="space-y-6">
    <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/10 p-2.5"><ShieldCheck className="h-6 w-6 text-teal-300" /></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-teal-300">FR-PRV-04</p><h2 className="mt-1 text-xl font-bold">Nhật ký truy cập và thay đổi</h2><p className="mt-1 text-xs text-slate-300">Theo dõi các thao tác CRUD và export quan trọng; giá trị nhạy cảm không được lưu trong nhật ký.</p></div>
      </div>
    </div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {logs.length === 0 ? (
        <div className="p-10 text-center"><FileClock className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có sự kiện audit</h3><p className="mt-1 text-xs text-slate-500">CRUD và export mới sẽ được ghi nhận tại đây.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-2xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Thời gian</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Đối tượng</th><th className="px-5 py-3">ID</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => <tr key={log.auditLogId} className="text-slate-700"><td className="whitespace-nowrap px-5 py-3">{new Date(log.createdAt).toLocaleString('vi-VN')}</td><td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-2xs font-bold uppercase text-blue-700">{log.actorRole}</span></td><td className="px-4 py-3 font-semibold">{log.action}</td><td className="px-4 py-3">{log.entityType}</td><td className="px-5 py-3 font-mono text-2xs text-slate-500">{log.entityId ?? '—'}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>
);
