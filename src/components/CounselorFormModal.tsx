import React, { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import type { Counselor, CounselorStatus, CreateCounselorInput } from '../types';
import { Alert, Button, ModalSurface, Select, TextInput } from './ui/Primitives';

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
    <form onSubmit={handleSubmit}>
      <ModalSurface
        title={mode === 'create' ? 'Thêm tư vấn viên' : 'Chỉnh sửa tư vấn viên'}
        onClose={onClose}
        className="max-w-2xl"
        footer={(
          <>
            <Button onClick={onClose} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === 'create' ? 'Tạo tư vấn viên' : 'Lưu thay đổi'}
            </Button>
          </>
        )}
      >
          <p className="mb-5 text-sm text-slate-500">
            {dataSource === 'mock'
              ? 'Chế độ demo: thay đổi chỉ được lưu trên trình duyệt này.'
              : 'Thay đổi sẽ được gửi đến API máy chủ đã xác thực.'}
          </p>

          {error && <Alert tone="error" className="mb-5">{error}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Tên <span className="text-rose-600">*</span>
              <TextInput value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} maxLength={100} required />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Họ và tên đệm <span className="text-rose-600">*</span>
              <TextInput value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} maxLength={100} required />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Email
              <TextInput type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} maxLength={225} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Số điện thoại
              <TextInput value={form.phoneNumber} onChange={(event) => setField('phoneNumber', event.target.value)} maxLength={20} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Giới tính
              <TextInput value={form.gender} onChange={(event) => setField('gender', event.target.value)} maxLength={20} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Ngày sinh
              <TextInput type="date" value={form.dateOfBirth} onChange={(event) => setField('dateOfBirth', event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Vai trò
              <TextInput value={form.role} onChange={(event) => setField('role', event.target.value)} maxLength={30} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Trạng thái
              <Select value={form.status} onChange={(event) => setField('status', event.target.value as CounselorStatus)}>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="ON_LEAVE">Đang nghỉ phép</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </Select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
              Chuyên môn
              <TextInput value={form.specialization} onChange={(event) => setField('specialization', event.target.value)} maxLength={225} />
            </label>
          </div>
      </ModalSurface>
    </form>
  );
};
