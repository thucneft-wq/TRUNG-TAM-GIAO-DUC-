import React from 'react';
import {
  LayoutDashboard,
  Users2,
  FileCheck2,
  ShieldCheck,
  HeartPulse,
  LogOut,
  ChevronRight,
  Activity,
  LoaderCircle,
  X,
} from 'lucide-react';
import { ScreenType } from '../types';

interface SidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  selectedCounselorId?: string | null;
  dataSource: 'api' | 'mock';
  isDataLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpen,
  onClose,
  onLogout,
  selectedCounselorId,
  dataSource,
  isDataLoading,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng trình đơn điều hướng"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity cursor-default"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="app-sidebar"
        aria-label="Điều hướng chính"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                Bản sao số
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                Tham vấn tâm lý
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng trình đơn điều hướng"
              className="ml-auto lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-2xs text-slate-400 mt-2 font-medium">
            Hệ thống quản trị Trung tâm Sức khỏe Tâm lý Học đường
          </p>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <div className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Chức năng chính
            </div>
            <nav aria-label="Các trang quản trị" className="space-y-1.5">
              {/* Dashboard Screen */}
              <button
                id="nav-link-dashboard"
                type="button"
                aria-current={currentScreen === 'dashboard' ? 'page' : undefined}
                onClick={() => {
                  onNavigate('dashboard');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  currentScreen === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Tổng quan bảng điều khiển</span>
                </div>
                {currentScreen === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </button>

              {/* Counselor Performance Screen */}
              <button
                id="nav-link-counselors"
                type="button"
                aria-current={currentScreen === 'counselors' ? 'page' : undefined}
                onClick={() => {
                  onNavigate('counselors');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  currentScreen === 'counselors'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users2 className="w-4 h-4" />
                  <span>Hiệu suất tư vấn viên</span>
                </div>
                {currentScreen === 'counselors' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </button>

              {/* Counselor Detail (active when viewing detail) */}
              <button
                id="nav-link-counselor-detail"
                type="button"
                aria-current={currentScreen === 'counselor-detail' ? 'page' : undefined}
                onClick={() => {
                  onNavigate('counselor-detail');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  currentScreen === 'counselor-detail'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Chi tiết KPI tư vấn viên</span>
                </div>
                {selectedCounselorId && (
                  <span className="text-2xs bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded font-mono">
                    {selectedCounselorId}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Analytics data source status */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                {isDataLoading ? (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                Nguồn dữ liệu phân tích
              </span>
              <span className={`text-2xs font-mono px-1.5 py-0.5 rounded border ${
                dataSource === 'api'
                  ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                  : 'text-amber-300 bg-amber-950/60 border-amber-800'
              }`}>
                {isDataLoading ? 'Đang tải' : dataSource === 'api' ? 'API' : 'Demo'}
              </span>
            </div>
            <p className="text-2xs text-slate-400 leading-relaxed">
              Dữ liệu tư vấn viên, lịch hẹn và 5 KPI đã được chuẩn hóa theo kỳ báo cáo đã chọn.
            </p>
            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-2xs text-slate-400 font-mono">
              <span>Nguồn: {dataSource === 'api' ? 'API hệ thống' : 'Demo cục bộ'}</span>
              <span>Quy tắc: 5/5</span>
            </div>
          </div>

          {/* Privacy & Confidentiality Notice */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-2xs text-blue-200/90 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-100 mb-0.5">Đang bảo vệ quyền riêng tư</div>
              <p className="text-slate-300 leading-tight">
                Mã học sinh, lịch sử ca và ghi chú trắc nghiệm tâm lý đều được ẩn danh và bảo vệ nghiêm ngặt.
              </p>
            </div>
          </div>
        </div>

        {/* Footer / Sign Out */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            id="btn-sidebar-logout"
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800/50 border border-slate-700 text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
