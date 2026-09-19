import React, { useState } from 'react';
import {
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AuthSession } from '../types';
import {
  DEMO_ACCOUNTS,
  isRemoteApiConfigured,
  loginAdmin,
} from '../services/api';
import { Alert, Button, IconButton, TextInput } from './ui/Primitives';

interface LoginScreenProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState(isRemoteApiConfigured ? '' : DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation logic
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email tài khoản của đơn vị.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Vui lòng nhập đúng định dạng email của trường hoặc đơn vị.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await loginAdmin({ email, password });
      onLoginSuccess(session);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-screen-wrapper" className="min-h-screen bg-paper text-ink-950">
      <div aria-hidden="true" className="fixed inset-y-0 left-0 w-2 bg-academic-700 sm:w-3" />

      <main className="mx-auto grid min-h-screen w-full max-w-6xl items-stretch px-6 py-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-12">
        <section className="flex flex-col justify-between border-b border-rule pb-10 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-16">
          <div>
            <div className="flex size-12 items-center justify-center rounded border border-academic-700 bg-white text-academic-700">
              <HeartPulse className="size-6" aria-hidden="true" />
            </div>
            <h1 className="mt-8 max-w-xl font-display text-3xl font-bold leading-tight text-ink-950 sm:text-4xl lg:text-[2.7rem]">
              Trung tâm Tham vấn Tâm lý Học đường
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Cổng vận hành dành cho quản trị viên theo dõi học sinh, tư vấn viên và chất lượng hỗ trợ trong một hệ thống thống nhất.
            </p>
          </div>

          <div className="mt-12 max-w-xl border-t border-rule pt-5 lg:mt-16">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-pine-700" aria-hidden="true" />
              <p>
                Quyền truy cập được giới hạn theo vai trò. Dữ liệu nhạy cảm chỉ hiển thị trong phạm vi được cấp.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center pt-10 lg:pl-16 lg:pt-0">
          <div className="w-full max-w-md">
            <p className="text-sm font-medium text-academic-700">Cổng quản trị nội bộ</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink-950">Đăng nhập</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sử dụng tài khoản được trung tâm cấp để tiếp tục.
            </p>

            <form id="login-form" onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {errorMsg && (
                <Alert tone="error" className="text-xs" title="Không thể đăng nhập.">
                  <span id="login-error-alert" aria-live="assertive">{errorMsg}</span>
                </Alert>
              )}

              <div>
                <label htmlFor="input-email" className="mb-2 block text-sm font-semibold text-ink-950">
                  Email của đơn vị
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <TextInput
                    id="input-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@campus-counseling.edu"
                    autoComplete="username"
                    required
                    aria-describedby={errorMsg ? 'login-error-alert' : undefined}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor="input-password" className="text-sm font-semibold text-ink-950">
                    Mật khẩu
                  </label>
                  <span className="text-xs text-slate-500">
                    {isRemoteApiConfigured ? 'Xác thực qua máy chủ' : 'Demo: nhập ít nhất 6 ký tự'}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <TextInput
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    aria-describedby={errorMsg ? 'login-error-alert' : undefined}
                    className="pl-10 pr-12"
                  />
                  <IconButton
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 size-11 rounded-none border-0"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconButton>
                </div>
              </div>

              <Button id="btn-login-submit" type="submit" variant="primary" disabled={isLoading} className="w-full">
                {isLoading && <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />}
                {isLoading
                  ? isRemoteApiConfigured ? 'Đang kết nối hệ thống…' : 'Đang xác thực…'
                  : 'Đăng nhập'}
              </Button>

              {!isRemoteApiConfigured && (
                <p className="border-l-2 border-academic-700 pl-3 text-xs leading-5 text-slate-600">
                  Chế độ demo chỉ chấp nhận tài khoản quản trị đã điền sẵn.
                </p>
              )}
            </form>

            <div className="mt-8 flex items-start gap-2 border-t border-rule pt-4 text-xs leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pine-700" aria-hidden="true" />
              <span>
                {isRemoteApiConfigured
                  ? 'Thông tin đăng nhập được xác thực qua API đã cấu hình.'
                  : 'Môi trường cục bộ không sử dụng thông tin đăng nhập thật.'}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
