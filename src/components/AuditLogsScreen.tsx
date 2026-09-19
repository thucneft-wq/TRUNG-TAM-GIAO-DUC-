import React from 'react';
import { FileClock, ShieldCheck } from 'lucide-react';
import type { AuditLogItem } from '../types';

export const AuditLogsScreen: React.FC<{ logs: AuditLogItem[] }> = ({ logs }) => (
  <div className="space-y-6">
    <header className="border-b border-rule pb-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-academic-700"><ShieldCheck className="h-5 w-5" /></div>
        <div><h2 className="page-title">Nhật ký truy cập và thay đổi</h2><p className="mt-1 text-sm leading-6 text-slate-600">Theo dõi các thao tác CRUD và xuất dữ liệu quan trọng; giá trị nhạy cảm không được lưu trong nhật ký.</p></div>
      </div>
    </header>

    <section className="overflow-hidden rounded-lg border border-rule bg-white">
      {logs.length === 0 ? (
        <div className="p-10 text-center"><FileClock className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có sự kiện audit</h3><p className="mt-1 text-xs text-slate-500">CRUD và export mới sẽ được ghi nhận tại đây.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500"><tr><th className="px-5 py-3">Thời gian</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Đối tượng</th><th className="px-5 py-3">ID</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => <tr key={log.auditLogId} className="text-slate-700"><td className="whitespace-nowrap px-5 py-3">{new Date(log.createdAt).toLocaleString('vi-VN')}</td><td className="px-4 py-3"><span className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-academic-800">{log.actorRole}</span></td><td className="px-4 py-3 font-semibold">{log.action}</td><td className="px-4 py-3">{log.entityType}</td><td className="px-5 py-3 font-mono text-2xs text-slate-500">{log.entityId ?? '—'}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </div>
);
