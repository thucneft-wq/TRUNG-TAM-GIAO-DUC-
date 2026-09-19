import React, { useMemo, useState } from 'react';
import {
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type { CreateStudentInput, Student } from '../types';
import { cn } from '../lib/cn';
import { Alert, Button, IconButton, ModalSurface, Select, TabButton, TextInput } from './ui/Primitives';

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
  counselorWarning: string | null;
  onRetryCounselors: () => void;
  isCounselorRetrying: boolean;
}

const getStudentStatusPresentation = (student: Student) => ({
  className: student.status === 'ACTIVE'
    ? 'bg-teal-50 text-academic-800 ring-1 ring-inset ring-teal-200'
    : student.status === 'COMPLETED'
      ? 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
      : 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
  label: student.status === 'ACTIVE'
    ? student.assignedCounselorId ? 'Đang tư vấn' : 'Chờ chọn lịch'
    : student.status === 'COMPLETED'
      ? 'Đã hoàn thành'
      : 'Ngừng theo dõi',
});

const ParentContact = ({ student }: { student: Student }) => {
  if (!student.parentId) {
    return <p className="text-slate-500">Chưa có thông tin phụ huynh</p>;
  }

  const identity = [student.parentName || student.parentId, student.parentRelationship]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-w-0 space-y-1">
      {identity && <p className="break-words font-medium text-slate-800">{identity}</p>}
      {student.parentPhoneNumber && (
        <div className="flex min-w-0 items-center gap-1.5">
          <Phone className="size-3.5 shrink-0 text-slate-400" />
          <span className="min-w-0 break-all tabular-nums">{student.parentPhoneNumber}</span>
        </div>
      )}
      {student.parentEmail && (
        <div className="flex min-w-0 items-center gap-1.5 text-slate-500">
          <Mail className="size-3.5 shrink-0" />
          <span className="min-w-0 break-all">{student.parentEmail}</span>
        </div>
      )}
    </div>
  );
};

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
  counselorWarning,
  onRetryCounselors,
  isCounselorRetrying,
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
        student.parentName ?? '',
        student.parentRelationship ?? '',
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

  const primarySheetLevel = levelFilter === 'THPT' ? 'thpt' : 'thcs';
  const secondarySheetLevel = primarySheetLevel === 'thcs' ? 'thpt' : 'thcs';
  const pageDescription = isAdmin
    ? webCrudEnabled
      ? 'Quản lý thông tin, trạng thái và liên hệ của học sinh trong hệ thống.'
      : crudDemoMode
        ? 'Dữ liệu được đồng bộ từ Google Sheet và tự làm mới định kỳ trên web.'
        : 'Dữ liệu chỉ đọc trên web; mọi thay đổi được thực hiện trên Google Sheet.'
    : 'Danh sách học sinh đang được phân công cho tài khoản tư vấn viên này.';

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
    if (!window.confirm(`Ngừng theo dõi học sinh “${student.name}”? Dữ liệu lịch sử sẽ được giữ lại.`)) return;
    setBusyId(student.id);
    setError(null);
    try {
      await onDeactivate(student.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể ngừng theo dõi học sinh.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRetry = () => {
    setError(null);
    onRefresh();
  };

  const handleEmptyAction = () => {
    if (query || statusFilter !== 'ACTIVE') {
      setQuery('');
      setStatusFilter('ACTIVE');
      return;
    }
    if (webCrudEnabled) {
      setIsCreating(true);
      return;
    }
    openSheet(primarySheetLevel);
  };

  const renderStudentActions = (student: Student) => (
    <div className="flex flex-wrap justify-end gap-2">
      {webCrudEnabled ? (
        <>
          <IconButton onClick={() => setEditing(student)} className="size-10 border-rule" aria-label={`Sửa ${student.name}`}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton disabled={busyId === student.id} onClick={() => void handleDelete(student)} className="size-10 border-red-200 text-brick-700 hover:bg-red-50" aria-label={`Ngừng theo dõi ${student.name}`}>
            <Trash2 className="size-4" />
          </IconButton>
        </>
      ) : student.schoolLevel ? (
        <Button size="sm" onClick={() => openSheet(student.schoolLevel!.toLowerCase() as 'thcs' | 'thpt')}>
          <ExternalLink className="size-4" /> Mở Sheet {student.schoolLevel}
        </Button>
      ) : (
        <>
          <Button size="sm" onClick={() => openSheet('thcs')}>THCS</Button>
          <Button size="sm" onClick={() => openSheet('thpt')}>THPT</Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-rule pb-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="page-title">Hồ sơ học sinh</h1>
          <p className="mt-1 max-w-2xl text-pretty text-sm text-slate-600">{pageDescription}</p>
          <p className="mt-2 text-xs text-slate-500">
            <span className="tabular-nums font-semibold text-ink-950">{students.length}</span> hồ sơ · <span className="tabular-nums font-semibold text-ink-950">{activeStudentCount}</span> đang hoạt động
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Button onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className="size-4" /> {isRefreshing ? 'Đang làm mới' : 'Làm mới'}
          </Button>
          {webCrudEnabled ? (
            <Button variant="primary" onClick={() => setIsCreating(true)}>
              <Plus className="size-4" /> Thêm học sinh
            </Button>
          ) : (
            <>
              <Button variant="primary" onClick={() => openSheet(primarySheetLevel)} title="Mở tab quản lý học sinh cùng cột SĐT và email phụ huynh">
                <ExternalLink className="size-4" /> Mở Sheet {primarySheetLevel.toUpperCase()}
              </Button>
              <Button onClick={() => openSheet(secondarySheetLevel)} title="Mở tab quản lý học sinh cùng cột SĐT và email phụ huynh">
                <ExternalLink className="size-4" /> Mở Sheet {secondarySheetLevel.toUpperCase()}
              </Button>
            </>
          )}
        </div>
      </header>

      {error && <Alert tone="error" action={<Button size="sm" onClick={handleRetry}>Thử lại</Button>}>{error}</Alert>}

      {counselorWarning && (
        <Alert
          tone="warning"
          title="Dữ liệu tư vấn viên chưa sẵn sàng"
          action={(
            <Button size="sm" onClick={onRetryCounselors} disabled={isCounselorRetrying}>
              <RefreshCw className="size-3.5" />
              {isCounselorRetrying ? 'Đang thử lại' : 'Thử lại tư vấn viên'}
            </Button>
          )}
        >
          {counselorWarning}
        </Alert>
      )}

      <section className="min-w-0 overflow-hidden border-y border-rule bg-white">
        <div className="flex flex-wrap gap-x-4 border-b border-rule px-4" role="tablist" aria-label="Lọc học sinh theo cấp học">
          {(['THCS', 'THPT'] as const).map((level) => (
            <TabButton
              key={level}
              role="tab"
              selected={levelFilter === level}
              onClick={() => setLevelFilter(level)}
              className="inline-flex items-center gap-2 px-1"
            >
              Học sinh {level} <span className="tabular-nums text-xs text-slate-500">{levelCounts[level]}</span>
            </TabButton>
          ))}
          {levelCounts.UNKNOWN > 0 && (
            <TabButton
              role="tab"
              selected={levelFilter === 'UNKNOWN'}
              onClick={() => setLevelFilter('UNKNOWN')}
              className="inline-flex items-center gap-2 px-1"
            >
              Chưa phân loại <span className="tabular-nums text-xs text-slate-500">{levelCounts.UNKNOWN}</span>
            </TabButton>
          )}
        </div>
        <div className="flex flex-col gap-3 border-b border-rule p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-balance text-base font-semibold text-slate-950">Danh sách {levelFilter === 'UNKNOWN' ? 'học sinh chưa phân loại' : `học sinh ${levelFilter}`}</h2>
            <p className="mt-1 text-sm text-slate-500"><span className="tabular-nums">{filtered.length}</span> hồ sơ phù hợp</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_11rem] lg:w-auto lg:grid-cols-[20rem_11rem]">
            <label className="relative block min-w-0">
              <span className="sr-only">Tìm học sinh</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên, email, số điện thoại"
                className="pl-9"
              />
            </label>
            <label className="block min-w-0">
              <span className="sr-only">Lọc theo trạng thái</span>
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | Student['status'])}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="INACTIVE">Ngừng theo dõi</option>
                <option value="ALL">Tất cả trạng thái</option>
              </Select>
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <UserRound className="mx-auto size-8 text-slate-300" />
            <h3 className="mt-3 text-balance text-sm font-semibold text-slate-900">Không có học sinh phù hợp</h3>
            <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-slate-500">Thay đổi bộ lọc hoặc cập nhật nguồn dữ liệu để tiếp tục.</p>
            <Button variant="primary" onClick={handleEmptyAction} className="mt-4">
              {query || statusFilter !== 'ACTIVE'
                ? 'Xóa bộ lọc'
                : webCrudEnabled
                  ? 'Thêm học sinh'
                  : `Mở Sheet ${primarySheetLevel.toUpperCase()}`}
            </Button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 gap-px bg-rule md:grid-cols-2 lg:hidden">
            {filtered.map((student) => {
              const statusPresentation = getStudentStatusPresentation(student);
              return (
                <article key={student.id} className="min-w-0 bg-white p-4 text-sm text-slate-700">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-950">{student.name}</h3>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{student.externalId ?? 'Chưa có mã'}</p>
                    </div>
                    <span className={cn('shrink-0 rounded px-2 py-1 text-xs font-semibold', statusPresentation.className)}>
                      {statusPresentation.label}
                    </span>
                  </div>

                  <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Liên hệ học sinh</dt>
                      <dd className="mt-1 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5"><Phone className="size-3.5 shrink-0 text-slate-400" /><span className="min-w-0 break-all tabular-nums">{student.phoneNumber}</span></div>
                        <div className="flex items-center gap-1.5 text-slate-500"><Mail className="size-3.5 shrink-0" /><span className="min-w-0 break-all">{student.email ?? 'Chưa có email'}</span></div>
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Liên hệ phụ huynh</dt>
                      <dd className="mt-1 space-y-1 text-xs">
                        <ParentContact student={student} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Ngày sinh</dt>
                      <dd className="mt-1 tabular-nums font-medium text-slate-800">{student.dateOfBirth ?? '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Tư vấn viên</dt>
                      <dd className="mt-1 line-clamp-2 font-medium text-slate-800">
                        {counselorWarning
                          ? 'Tạm thời chưa tải được'
                          : student.assignedCounselorName ?? 'Chưa phân công'}
                      </dd>
                      {!counselorWarning && student.assignmentStatus && student.assignmentStatus !== 'ACTIVE' && (
                        <p className="mt-1 text-xs text-slate-400">Phân công đã kết thúc</p>
                      )}
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-slate-100 pt-3">{renderStudentActions(student)}</div>
                </article>
              );
            })}
          </div>

          <div className="hidden lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-3 py-3">Liên hệ</th>
                  <th className="px-3 py-3">Liên hệ phụ huynh</th>
                  <th className="px-3 py-3">Ngày sinh</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Tư vấn viên</th>
                  <th className="px-4 py-3 text-right">{webCrudEnabled ? 'Cập nhật' : 'Mở Sheet'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => {
                  const statusPresentation = getStudentStatusPresentation(student);
                  return (
                  <tr key={student.id} className="text-slate-700 hover:bg-slate-50">
                    <td className="px-4 py-3 align-top">
                      <div className="truncate font-semibold text-slate-950">{student.name}</div>
                      <div className="mt-0.5 truncate font-mono text-xs text-slate-500">
                        {student.externalId ?? 'Chưa có mã'}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-xs">
                      <div className="flex items-center gap-1.5"><Phone className="size-3.5 shrink-0 text-slate-400" /><span className="truncate tabular-nums">{student.phoneNumber}</span></div>
                      <div className="mt-1 flex items-center gap-1.5 text-slate-500"><Mail className="size-3.5 shrink-0" /><span className="truncate">{student.email ?? 'Chưa có email'}</span></div>
                    </td>
                    <td className="px-3 py-3 align-top text-xs">
                      <ParentContact student={student} />
                    </td>
                    <td className="px-3 py-3 align-top text-xs tabular-nums">{student.dateOfBirth ?? '—'}</td>
                    <td className="px-3 py-3 align-top">
                      <span className={cn('inline-flex rounded-md px-2 py-1 text-xs font-semibold', statusPresentation.className)}>
                        {statusPresentation.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-xs">
                      <div className="line-clamp-2">
                        {counselorWarning
                          ? 'Tạm thời chưa tải được'
                          : student.assignedCounselorName ?? 'Chưa phân công'}
                      </div>
                      {!counselorWarning && student.assignmentStatus && student.assignmentStatus !== 'ACTIVE' && (
                        <div className="mt-1 text-xs text-slate-400">Phân công đã kết thúc</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {renderStudentActions(student)}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
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
      setError(caught instanceof Error ? caught.message : 'Không thể lưu học sinh.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <ModalSurface
        title={student ? 'Chỉnh sửa học sinh' : 'Thêm học sinh'}
        onClose={onClose}
        className="max-w-2xl"
        footer={(
          <>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Đang lưu…' : student ? 'Lưu thay đổi' : 'Thêm học sinh'}</Button>
          </>
        )}
      >
        <p className="mb-5 text-sm text-slate-500">Thông tin hồ sơ cơ bản, không bao gồm ghi chú tâm lý.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && <Alert tone="error" className="sm:col-span-2">{error}</Alert>}
          <Field label="Tên" required><TextInput required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></Field>
          <Field label="Họ" required><TextInput required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></Field>
          <Field label="Số điện thoại" required><TextInput required value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} /></Field>
          <Field label="Email"><TextInput type="email" value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field label="SĐT phụ huynh"><TextInput value={form.parentPhoneNumber ?? ''} onChange={(event) => setForm({ ...form, parentPhoneNumber: event.target.value })} /></Field>
          <Field label="Email phụ huynh"><TextInput type="email" value={form.parentEmail ?? ''} onChange={(event) => setForm({ ...form, parentEmail: event.target.value })} /></Field>
          <Field label="Ngày sinh"><TextInput type="date" value={form.dateOfBirth ?? ''} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></Field>
          <Field label="Giới tính"><Select value={form.gender ?? ''} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="">Chưa xác định</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></Select></Field>
          <Field label="Cấp học"><Select value={form.schoolLevel ?? ''} onChange={(event) => setForm({ ...form, schoolLevel: (event.target.value || null) as CreateStudentInput['schoolLevel'] })}><option value="">Chưa xác định</option><option value="THCS">THCS</option><option value="THPT">THPT</option></Select></Field>
        </div>
      </ModalSurface>
    </form>
  );
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="space-y-1.5 text-sm font-medium text-slate-700">{label}{required && <span className="text-brick-700"> *</span>}{children}</label>
);
