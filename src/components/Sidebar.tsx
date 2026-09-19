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
          className="fixed inset-0 z-40 cursor-default bg-ink-950/45 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="app-sidebar"
        aria-label="Điều hướng chính"
        className={`fixed inset-y-0 left-0 z-50 flex w-[calc(100%-2.5rem)] max-w-80 flex-col border-r border-rule bg-paper text-ink-950 transition-transform duration-200 ease-out lg:w-64 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="relative border-b border-rule bg-white px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded border border-academic-700 text-academic-700">
              <HeartPulse className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold leading-tight text-ink-950">
                Trung tâm giáo dục
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">Sổ vận hành học đường</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng trình đơn điều hướng"
              className="ml-auto inline-flex size-11 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-ink-950 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 border-l-2 border-academic-700 pl-3 text-xs text-slate-600">
            <span className={`size-2 rounded-full ${isDataLoading ? 'animate-pulse bg-amber-500' : dataSource === 'api' ? 'bg-pine-700' : 'bg-amber-500'}`} />
            {isDataLoading ? 'Đang cập nhật dữ liệu' : dataSource === 'api' ? 'Dữ liệu hệ thống đang hoạt động' : 'Đang dùng dữ liệu cục bộ'}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div>
            <div className="mb-2 px-3 text-xs font-semibold text-slate-500">
              Hồ sơ và vận hành
            </div>
            <nav aria-label="Các trang quản trị" className="space-y-1">
              <button
                id="nav-link-students"
                type="button"
                aria-current={currentScreen === 'students' ? 'page' : undefined}
                onClick={() => {
                  onNavigate('students');
                  onClose();
                }}
                className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  currentScreen === 'students'
                    ? 'border-academic-700 bg-teal-50 text-academic-800'
                    : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4" />
                  <span>Quản lý học sinh</span>
                </div>
                {currentScreen === 'students' && <ChevronRight className="size-4 text-academic-700" />}
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
                  className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    currentScreen === 'dashboard'
                      ? 'border-academic-700 bg-teal-50 text-academic-800'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Tổng quan bảng điều khiển</span>
                  </div>
                  {currentScreen === 'dashboard' && <ChevronRight className="size-4 text-academic-700" />}
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
                  className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    currentScreen === 'knowledge-graph'
                      ? 'border-academic-700 bg-teal-50 text-academic-800'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Network className="h-4 w-4 shrink-0" />
                    <span>Knowledge Graph</span>
                  </div>
                  {currentScreen === 'knowledge-graph' ? (
                    <ChevronRight className="size-4 text-academic-700" />
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
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
                  className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    currentScreen === 'counselor-management'
                      ? 'border-academic-700 bg-teal-50 text-academic-800'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users2 className="w-4 h-4" />
                    <span>Quản lý tư vấn viên</span>
                  </div>
                  {currentScreen === 'counselor-management' && <ChevronRight className="size-4 text-academic-700" />}
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
                  className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    currentScreen === 'counselors'
                      ? 'border-academic-700 bg-teal-50 text-academic-800'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4" />
                    <span>Hiệu suất tư vấn viên</span>
                  </div>
                  {currentScreen === 'counselors' && <ChevronRight className="size-4 text-academic-700" />}
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
                  className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    currentScreen === 'counselor-detail'
                      ? 'border-academic-700 bg-teal-50 text-academic-800'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Chi tiết KPI tư vấn viên</span>
                  </div>
                  {selectedCounselorId && (
                    <span className="rounded border border-rule bg-white px-1.5 py-0.5 font-mono text-2xs text-academic-700">
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
                    className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      currentScreen === 'student-trends'
                        ? 'border-academic-700 bg-teal-50 text-academic-800'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4" />
                      <span>Xu hướng học viên</span>
                    </div>
                    {currentScreen === 'student-trends' && <ChevronRight className="size-4 text-academic-700" />}
                  </button>

                  <button
                    id="nav-link-feedback-analytics"
                    type="button"
                    aria-current={currentScreen === 'feedback-analytics' ? 'page' : undefined}
                    onClick={() => {
                      onNavigate('feedback-analytics');
                      onClose();
                    }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      currentScreen === 'feedback-analytics'
                        ? 'border-academic-700 bg-teal-50 text-academic-800'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquareHeart className="w-4 h-4" />
                      <span>Phân tích feedback</span>
                    </div>
                    {currentScreen === 'feedback-analytics' && <ChevronRight className="size-4 text-academic-700" />}
                  </button>

                  <button
                    id="nav-link-audit-logs"
                    type="button"
                    aria-current={currentScreen === 'audit-logs' ? 'page' : undefined}
                    onClick={() => {
                      onNavigate('audit-logs');
                      onClose();
                    }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      currentScreen === 'audit-logs'
                        ? 'border-academic-700 bg-teal-50 text-academic-800'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileClock className="w-4 h-4" />
                      <span>Nhật ký bảo mật</span>
                    </div>
                    {currentScreen === 'audit-logs' && <ChevronRight className="size-4 text-academic-700" />}
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Footer / Sign Out */}
        <div className="border-t border-rule bg-white p-3">
          <button
            id="btn-sidebar-logout"
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded border border-rule bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-brick-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
