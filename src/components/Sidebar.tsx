import React from 'react';
import {
  LayoutDashboard,
  Users2,
  FileCheck2,
  HeartPulse,
  LogOut,
  ChevronRight,
  Activity,
  TrendingUp,
  MessageSquareHeart,
  FileClock,
  X,
  GraduationCap,
  Network,
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
  roleCode: 'admin' | 'counselor';
  crudDemoMode: boolean;
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
  roleCode,
  crudDemoMode,
}) => {
  const isAdmin = roleCode === 'admin';
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
              <button
                id="nav-link-students"
                type="button"
                aria-current={currentScreen === 'students' ? 'page' : undefined}
                onClick={() => {
                  onNavigate('students');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  currentScreen === 'students'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4" />
                  <span>Quản lý Student</span>
                </div>
                {currentScreen === 'students' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </button>

              {isAdmin && (
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
              )}

              {isAdmin && (
                <button
                  id="nav-link-knowledge-graph"
                  type="button"
                  aria-current={currentScreen === 'knowledge-graph' ? 'page' : undefined}
                  onClick={() => {
                    onNavigate('knowledge-graph');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    currentScreen === 'knowledge-graph'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Network className="h-4 w-4 shrink-0" />
                    <span>Knowledge Graph</span>
                  </div>
                  {currentScreen === 'knowledge-graph' ? (
                    <ChevronRight className="h-3.5 w-3.5 text-blue-200" />
                  ) : (
                    <span className="rounded border border-emerald-700/70 bg-emerald-950/70 px-1.5 py-0.5 text-2xs font-bold text-emerald-300">
                      Đã kết nối
                    </span>
                  )}
                </button>
              )}

              {isAdmin && (
                <button
                  id="nav-link-counselor-management"
                  type="button"
                  aria-current={currentScreen === 'counselor-management' ? 'page' : undefined}
                  onClick={() => {
                    onNavigate('counselor-management');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    currentScreen === 'counselor-management'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users2 className="w-4 h-4" />
                    <span>Quản lý tư vấn viên</span>
                  </div>
                  {currentScreen === 'counselor-management' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </button>
              )}

              {isAdmin && (
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
                    <Activity className="w-4 h-4" />
                    <span>Hiệu suất tư vấn viên</span>
                  </div>
                  {currentScreen === 'counselors' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </button>
              )}

              {isAdmin && (
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
              )}

              {isAdmin && !crudDemoMode && (
                <>
                  <button
                    id="nav-link-student-trends"
                    type="button"
                    aria-current={currentScreen === 'student-trends' ? 'page' : undefined}
                    onClick={() => {
                      onNavigate('student-trends');
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      currentScreen === 'student-trends'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4" />
                      <span>Xu hướng học viên</span>
                    </div>
                    {currentScreen === 'student-trends' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </button>

                  <button
                    id="nav-link-feedback-analytics"
                    type="button"
                    aria-current={currentScreen === 'feedback-analytics' ? 'page' : undefined}
                    onClick={() => {
                      onNavigate('feedback-analytics');
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      currentScreen === 'feedback-analytics'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquareHeart className="w-4 h-4" />
                      <span>Phân tích feedback</span>
                    </div>
                    {currentScreen === 'feedback-analytics' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </button>

                  <button
                    id="nav-link-audit-logs"
                    type="button"
                    aria-current={currentScreen === 'audit-logs' ? 'page' : undefined}
                    onClick={() => {
                      onNavigate('audit-logs');
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      currentScreen === 'audit-logs'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileClock className="w-4 h-4" />
                      <span>Nhật ký bảo mật</span>
                    </div>
                    {currentScreen === 'audit-logs' && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                  </button>
                </>
              )}
            </nav>
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
