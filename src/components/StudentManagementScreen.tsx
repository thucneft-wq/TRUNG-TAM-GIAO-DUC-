import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type { CreateStudentInput, Student } from '../types';

interface StudentManagementScreenProps {
  students: Student[];
  isAdmin: boolean;
  onCreate: (input: CreateStudentInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<CreateStudentInput>) => Promise<void>;
  onDeactivate: (id: string) => Promise<void>;
  crudDemoMode: boolean;
  webCrudEnabled: boolean;
  googleEntryUrls: {
    thcs: string;
    thpt: string;
  };
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const StudentManagementScreen: React.FC<StudentManagementScreenProps> = ({
  students,
  isAdmin,
  onCreate,
  onUpdate,
  onDeactivate,
  crudDemoMode,
  webCrudEnabled,
  googleEntryUrls,
  onRefresh,
  isRefreshing,
}) => {
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'THCS' | 'THPT' | 'UNKNOWN'>('THCS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Student['status']>('ACTIVE');
  const [editing, setEditing] = useState<Student | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const levelCounts = useMemo(() => {
    const statusStudents = students.filter(
      (student) => statusFilter === 'ALL' || student.status === statusFilter,
    );
    return {
      THCS: statusStudents.filter((student) => student.schoolLevel === 'THCS').length,
      THPT: statusStudents.filter((student) => student.schoolLevel === 'THPT').length,
      UNKNOWN: statusStudents.filter((student) => !student.schoolLevel).length,
    };
  }, [statusFilter, students]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi-VN');
    return students.filter((student) => {
      if (statusFilter !== 'ALL' && student.status !== statusFilter) return false;
      const matchesLevel = levelFilter === 'UNKNOWN'
        ? !student.schoolLevel
        : student.schoolLevel === levelFilter;
      if (!matchesLevel) return false;
      if (!keyword) return true;
      return [
        student.name,
        student.email ?? '',
        student.phoneNumber,
        student.parentEmail ?? '',
        student.parentPhoneNumber ?? '',
      ]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword));
    });
  }, [levelFilter, query, statusFilter, students]);

  const activeStudentCount = useMemo(
    () => students.filter((student) => student.status === 'ACTIVE').length,
    [students],
  );

  const openSheet = (level: 'thcs' | 'thpt') => {
    const url = googleEntryUrls[level];
    if (!url) {
      setError(`Chưa cấu hình URL Google Sheet ${level.toUpperCase()} trong .env.local.`);
      return;
    }
    setError(null);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Vô hiệu hóa Student “${student.name}”? Dữ liệu lịch sử sẽ được giữ lại.`)) return;
    setBusyId(student.id);
    setError(null);
    try {
      await onDeactivate(student.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể vô hiệu hóa Student.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-sky-950 via-blue-900 to-indigo-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/10 p-2.5"><GraduationCap className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-200">Student Management</p>
              <h2 className="mt-1 text-xl font-bold">Quản lý hồ sơ Student</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-blue-100">
                {isAdmin
                  ? webCrudEnabled
                    ? 'Admin có thể quản lý toàn bộ Student trực tiếp trong hệ thống.'
                    : 'Admin chỉ xem dữ liệu trên web; mọi thay đổi được thực hiện trên Google Sheet.'
                  : 'Bạn chỉ thấy Student đang được phân công cho tài khoản Counselor này.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Làm mới
            </button>
            {webCrudEnabled ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-800 shadow-sm hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" /> Thêm Student
              </button>
            ) : (
              <>
                <button type="button" onClick={() => openSheet('thcs')} title="Mở tab quản lý học sinh cùng cột SĐT và email phụ huynh" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-800 shadow-sm hover:bg-blue-50">
                  <ExternalLink className="h-4 w-4" /> Mở Sheet THCS
                </button>
                <button type="button" onClick={() => openSheet('thpt')} title="Mở tab quản lý học sinh cùng cột SĐT và email phụ huynh" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-200 px-4 py-2.5 text-xs font-bold text-blue-950 shadow-sm hover:bg-cyan-100">
                  <ExternalLink className="h-4 w-4" /> Mở Sheet THPT
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
        <span>{webCrudEnabled
          ? 'Thao tác xóa là soft delete: hồ sơ chuyển sang INACTIVE, không xóa lịch sử liên quan.'
          : 'Gói hiện tại khóa CRUD trực tiếp trên web. Dữ liệu học sinh được quản lý ở hai tab Google Sheet riêng: THCS và THPT.'}</span>
      </div>

      {!webCrudEnabled && crudDemoMode && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          Dữ liệu cập nhật trên Google Sheet được hệ thống của đội dự án đồng bộ; danh sách trên web chỉ đọc và tự làm mới định kỳ.
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50/80 px-4 pt-4" role="tablist" aria-label="Lọc Student theo cấp học">
          {(['THCS', 'THPT'] as const).map((level) => (
            <button
              key={level}
              type="button"
              role="tab"
              aria-selected={levelFilter === level}
              onClick={() => setLevelFilter(level)}
              className={`rounded-t-xl border border-b-0 px-4 py-2.5 text-xs font-bold transition ${levelFilter === level ? 'border-blue-300 bg-white text-blue-800' : 'border-transparent text-slate-500 hover:text-blue-700'}`}
            >
              Học sinh {level} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-2xs text-slate-600">{levelCounts[level]}</span>
            </button>
          ))}
          {levelCounts.UNKNOWN > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={levelFilter === 'UNKNOWN'}
              onClick={() => setLevelFilter('UNKNOWN')}
              className={`rounded-t-xl border border-b-0 px-4 py-2.5 text-xs font-bold transition ${levelFilter === 'UNKNOWN' ? 'border-amber-300 bg-white text-amber-800' : 'border-transparent text-slate-500 hover:text-amber-700'}`}
            >
              Chưa phân loại <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-2xs text-amber-700">{levelCounts.UNKNOWN}</span>
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Danh sách {levelFilter === 'UNKNOWN' ? 'Student chưa phân loại' : `học sinh ${levelFilter}`}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{filtered.length} hồ sơ phù hợp · {activeStudentCount} hồ sơ đang tư vấn</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="block sm:w-44">
              <span className="sr-only">Lọc theo trạng thái</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | Student['status'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="INACTIVE">Ngừng theo dõi</option>
                <option value="ALL">Tất cả trạng thái</option>
              </select>
            </label>
            <label className="relative block w-full sm:w-80">
              <span className="sr-only">Tìm Student</span>
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserRound className="mx-auto h-9 w-9 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-800">Không có Student phù hợp</h3>
            <p className="mt-1 text-xs text-slate-500">Thêm Student mới hoặc thay đổi từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-xs">
              <thead className="bg-slate-50 text-2xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Liên hệ phụ huynh</th>
                  <th className="px-4 py-3">Ngày sinh</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Tư vấn viên</th>
                  {webCrudEnabled && <th className="px-5 py-3 text-right">Cập nhật</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => (
                  <tr key={student.id} className="text-slate-700 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="mt-0.5 font-mono text-2xs text-slate-400">
                        {student.externalId ?? 'Chưa có mã'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{student.phoneNumber}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-slate-500"><Mail className="h-3.5 w-3.5" />{student.email ?? 'Chưa có email'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {student.parentPhoneNumber ?? 'Chưa có SĐT'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        {student.parentEmail ?? 'Chưa có email'}
                      </div>
                    </td>
                    <td className="px-4 py-4">{student.dateOfBirth ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-2xs font-bold ${
                        student.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : student.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                      }`}>
                        {student.status === 'ACTIVE'
                          ? student.assignedCounselorId ? 'Đang tư vấn' : 'Chờ chọn lịch'
                          : student.status === 'COMPLETED'
                            ? 'Đã hoàn thành'
                            : 'Ngừng theo dõi'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>{student.assignedCounselorName ?? 'Chưa phân công'}</div>
                      {student.assignmentStatus && student.assignmentStatus !== 'ACTIVE' && (
                        <div className="mt-1 text-2xs text-slate-400">Phân công đã kết thúc</div>
                      )}
                    </td>
                    {webCrudEnabled && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditing(student)} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700" aria-label={`Sửa ${student.name}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" disabled={busyId === student.id} onClick={() => void handleDelete(student)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50" aria-label={`Xóa ${student.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {webCrudEnabled && (isCreating || editing) && (
        <StudentFormModal
          student={editing}
          onClose={() => { setIsCreating(false); setEditing(null); }}
          onSave={async (input) => {
            if (editing) await onUpdate(editing.id, input);
            else await onCreate(input);
            setIsCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const StudentFormModal = ({
  student,
  onClose,
  onSave,
}: {
  student: Student | null;
  onClose: () => void;
  onSave: (input: CreateStudentInput) => Promise<void>;
}) => {
  const [form, setForm] = useState<CreateStudentInput>({
    firstName: student?.firstName ?? '',
    lastName: student?.lastName ?? '',
    gender: student?.gender ?? '',
    phoneNumber: student?.phoneNumber ?? '',
    email: student?.email ?? '',
    parentPhoneNumber: student?.parentPhoneNumber ?? '',
    parentEmail: student?.parentEmail ?? '',
    dateOfBirth: student?.dateOfBirth ?? '',
    status: student?.status ?? 'ACTIVE',
    schoolLevel: student?.schoolLevel ?? null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        gender: form.gender || null,
        email: form.email || null,
        parentPhoneNumber: form.parentPhoneNumber || null,
        parentEmail: form.parentEmail || null,
        dateOfBirth: form.dateOfBirth || null,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể lưu Student.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div><h2 id="student-form-title" className="text-base font-bold text-slate-900">{student ? 'Chỉnh sửa Student' : 'Thêm Student'}</h2><p className="mt-0.5 text-xs text-slate-500">Thông tin hồ sơ cơ bản, không bao gồm ghi chú tâm lý.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {error && <div role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
          <Field label="Tên" required><input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={inputClass} /></Field>
          <Field label="Họ" required><input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={inputClass} /></Field>
          <Field label="Số điện thoại" required><input required value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} className={inputClass} /></Field>
          <Field label="Email"><input type="email" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></Field>
          <Field label="SĐT phụ huynh"><input value={form.parentPhoneNumber ?? ''} onChange={(event) => setForm({ ...form, parentPhoneNumber: event.target.value })} className={inputClass} /></Field>
          <Field label="Email phụ huynh"><input type="email" value={form.parentEmail ?? ''} onChange={(event) => setForm({ ...form, parentEmail: event.target.value })} className={inputClass} /></Field>
          <Field label="Ngày sinh"><input type="date" value={form.dateOfBirth ?? ''} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} className={inputClass} /></Field>
          <Field label="Giới tính"><select value={form.gender ?? ''} onChange={(event) => setForm({ ...form, gender: event.target.value })} className={inputClass}><option value="">Chưa xác định</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></Field>
          <Field label="Cấp học"><select value={form.schoolLevel ?? ''} onChange={(event) => setForm({ ...form, schoolLevel: (event.target.value || null) as CreateStudentInput['schoolLevel'] })} className={inputClass}><option value="">Chưa xác định</option><option value="THCS">THCS</option><option value="THPT">THPT</option></select></Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Hủy</button>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60">{isSaving ? 'Đang lưu…' : student ? 'Lưu thay đổi' : 'Thêm Student'}</button>
        </div>
      </form>
    </div>
  );
};

const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="text-xs font-semibold text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}{children}</label>
);
