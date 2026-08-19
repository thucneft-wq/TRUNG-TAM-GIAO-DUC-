import React, { useState } from 'react';
import {
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { AuthSession } from '../types';
import {
  DEMO_ACCOUNTS,
  isRemoteApiConfigured,
  loginAdmin,
} from '../services/api';

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
      setErrorMsg('Vui lòng nhập email quản trị của đơn vị.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Vui lòng nhập đúng định dạng email của trường hoặc đơn vị.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu quản trị.');
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

  const handleFillDemo = (accountIndex: number) => {
    const account = DEMO_ACCOUNTS[accountIndex];
    setEmail(account.email);
    setPassword('');
    setErrorMsg(null);
  };

  return (
    <div
      id="login-screen-wrapper"
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Background Decorative Healthcare Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 border border-blue-400/30">
            <HeartPulse className="w-8 h-8" />
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-950/80 text-teal-400 border border-teal-800/80 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cổng thông tin dành cho người được ủy quyền
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Trung tâm Tham vấn Tâm lý Học đường
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-medium">
            Nền tảng phân tích quản trị Bản sao số
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl border border-slate-700/80 shadow-2xl">
          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {errorMsg && (
              <div
                id="login-error-alert"
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="input-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email của đơn vị
              </label>
              <div className="relative rounded-lg shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campus-counseling.edu"
                  autoComplete="username"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Mật khẩu quản trị
                </label>
                <span className="text-2xs text-slate-400">
                  {isRemoteApiConfigured ? 'Được xác thực bởi máy chủ' : 'Chế độ demo: nhập từ 6 ký tự bất kỳ'}
                </span>
              </div>
              <div className="relative rounded-lg shadow-inner">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isRemoteApiConfigured ? 'Đang kết nối API quản trị...' : 'Đang xác thực phiên...'}</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập vào bảng điều khiển</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Demo Quick Fill Shortcuts */}
            {!isRemoteApiConfigured && (
              <div className="pt-2 border-t border-slate-700/60">
                <div className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Tài khoản demo cục bộ
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.slice(1).map((account, index) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleFillDemo(index + 1)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-700/60 border border-slate-700 rounded-lg text-2xs text-slate-300 transition-colors text-center"
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-center gap-2 text-2xs text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>
              {isRemoteApiConfigured
                ? 'Thông tin đăng nhập được xác thực qua API đã cấu hình'
                : 'Chế độ MVP cục bộ · Không sử dụng thông tin đăng nhập thật'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
