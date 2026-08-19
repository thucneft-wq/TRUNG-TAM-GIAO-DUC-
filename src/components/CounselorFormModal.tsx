import React, { useState } from 'react';
import { AlertCircle, LoaderCircle, Save, X } from 'lucide-react';
import type { Counselor, CounselorStatus, CreateCounselorInput } from '../types';

interface CounselorFormModalProps {
  mode: 'create' | 'edit';
  counselor?: Counselor;
  dataSource: 'api' | 'mock';
  onClose: () => void;
  onSubmit: (input: CreateCounselorInput) => Promise<void>;
}

interface FormState {
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  role: string;
  specialization: string;
  status: CounselorStatus;
}

const createInitialState = (counselor?: Counselor): FormState => {
  const nameParts = counselor?.name.trim().split(/\s+/) ?? [];
  return {
    firstName: counselor?.firstName ?? nameParts[0] ?? '',
    lastName: counselor?.lastName ?? nameParts.slice(1).join(' '),
    gender: counselor?.gender ?? '',
    phoneNumber: counselor?.phoneNumber ?? '',
    email: counselor?.email ?? '',
    dateOfBirth: counselor?.dateOfBirth ?? '',
    role: counselor?.role ?? counselor?.title ?? 'Tư vấn viên',
    specialization: counselor?.specialization ?? counselor?.department ?? '',
    status: counselor?.status ?? 'ACTIVE',
  };
};

const fieldClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export const CounselorFormModal: React.FC<CounselorFormModalProps> = ({
  mode,
  counselor,
  dataSource,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(() => createInitialState(counselor));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName || !lastName) {
      setError('Họ và tên là thông tin bắt buộc.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email phải đúng định dạng địa chỉ hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        gender: form.gender.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        email: email || null,
        dateOfBirth: form.dateOfBirth || null,
        role: form.role.trim() || null,
        specialization: form.specialization.trim() || null,
        status: form.status,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể lưu thông tin tư vấn viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="counselor-form-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="counselor-form-title" className="text-base font-bold text-slate-900">
              {mode === 'create' ? 'Thêm tư vấn viên' : 'Chỉnh sửa tư vấn viên'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {dataSource === 'mock'
                ? 'Chế độ demo: thay đổi chỉ được lưu trên trình duyệt này.'
                : 'Thay đổi sẽ được gửi đến API máy chủ đã xác thực.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="Đóng biểu mẫu tư vấn viên"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Tên <span className="text-rose-600">*</span>
              <input value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} className={fieldClassName} maxLength={100} required />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Họ và tên đệm <span className="text-rose-600">*</span>
              <input value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} className={fieldClassName} maxLength={100} required />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Email
              <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className={fieldClassName} maxLength={225} />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Số điện thoại
              <input value={form.phoneNumber} onChange={(event) => setField('phoneNumber', event.target.value)} className={fieldClassName} maxLength={20} />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Giới tính
              <input value={form.gender} onChange={(event) => setField('gender', event.target.value)} className={fieldClassName} maxLength={20} />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Ngày sinh
              <input type="date" value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)} className={fieldClassName} />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Vai trò
              <input value={form.role} onChange={(event) => setField('role', event.target.value)} className={fieldClassName} maxLength={30} />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700">
              Trạng thái
              <select value={form.status} onChange={(event) => setField('status', event.target.value as CounselorStatus)} className={fieldClassName}>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="ON_LEAVE">Đang nghỉ phép</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
              Chuyên môn
              <input value={form.specialization} onChange={(event) => setField('specialization', event.target.value)} className={fieldClassName} maxLength={225} />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === 'create' ? 'Tạo tư vấn viên' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
