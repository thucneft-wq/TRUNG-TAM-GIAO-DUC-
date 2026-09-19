import React from 'react';
import {
  Menu,
  LogOut,
  Calendar,
  LoaderCircle,
} from 'lucide-react';
import { AdminUser, TimeRange, ScreenType } from '../types';
import { IconButton } from './ui/Primitives';

interface NavbarProps {
  currentScreen: ScreenType;
  timeRange: TimeRange;
  onTimeRangeChange: (tr: TimeRange) => void;
  lastUpdated: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  selectedCounselorName?: string;
  adminUser: AdminUser;
  dataSource: 'api' | 'mock';
  isDataLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  timeRange,
  onTimeRangeChange,
  lastUpdated,
  onLogout,
  onToggleSidebar,
  isSidebarOpen,
  selectedCounselorName,
  adminUser,
  dataSource,
  isDataLoading,
}) => {
  const showTimeFilter = ![
    'students',
    'counselor-management',
    'knowledge-graph',
  ].includes(currentScreen);
  const initials = adminUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const formattedLastUpdated = (() => {
    if (!lastUpdated) return '';
    try {
      const date = new Date(lastUpdated);
      if (Number.isNaN(date.getTime())) return lastUpdated;
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return lastUpdated;
    }
  })();

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-white">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:min-h-[4.5rem] lg:px-8">
        {/* Left Side: Mobile Menu Button & Screen Title */}
        <div className="min-w-0 flex flex-1 items-center gap-3">
          <IconButton
            id="btn-toggle-sidebar-mobile"
            onClick={onToggleSidebar}
            aria-controls="app-sidebar"
            aria-expanded={isSidebarOpen}
            className="-ml-2 lg:hidden"
            aria-label="Bật hoặc tắt trình đơn điều hướng"
          >
            <Menu className="size-5" />
          </IconButton>

          <div className="min-w-0">
            <div className="mb-0.5 flex items-center gap-2">
              <span
                title={formattedLastUpdated ? `Cập nhật lần cuối: ${formattedLastUpdated}` : undefined}
                className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex"
              >
                {isDataLoading ? (
                  <LoaderCircle className="size-3 animate-spin text-academic-700" />
                ) : (
                  <span
                    className={`size-1.5 rounded-full ${
                      dataSource === 'api' ? 'bg-pine-700' : 'bg-amber-500'
                    }`}
                  />
                )}
                {isDataLoading
                  ? 'Đang cập nhật dữ liệu'
                  : dataSource === 'api'
                    ? 'Hệ thống đang kết nối'
                    : 'Dữ liệu cục bộ'}
              </span>
            </div>
            <h1 className="truncate font-display text-sm font-semibold text-ink-950 sm:max-w-[28rem] sm:text-base">
              {currentScreen === 'dashboard' && 'Tổng quan phân tích trung tâm'}
              {currentScreen === 'knowledge-graph' && 'Không gian Knowledge Graph'}
              {currentScreen === 'counselor-management' && 'Quản lý hồ sơ và tài khoản tư vấn viên'}
              {currentScreen === 'counselors' && 'Hiệu suất tư vấn viên và kiểm định KPI'}
              {currentScreen === 'students' && 'Quản lý hồ sơ học sinh'}
              {currentScreen === 'student-trends' && 'Xu hướng tình trạng học viên'}
              {currentScreen === 'feedback-analytics' && 'Phân tích phản hồi học viên'}
              {currentScreen === 'audit-logs' && 'Nhật ký bảo mật và thay đổi'}
              {currentScreen === 'counselor-detail' && (
                <>
                  <span className="font-sans font-normal text-slate-500">Tư vấn viên: </span>
                  <span>{selectedCounselorName || 'Chi tiết hiệu suất'}</span>
                </>
              )}
            </h1>
          </div>
        </div>

        {/* Right Side: Time Filter, Twin Status & Admin Avatar */}
        <div className="shrink-0 items-center gap-3 flex">
          {/* Time Filter Tabs */}
          {showTimeFilter && <div
            id="time-range-filter-group"
            className="hidden items-center border-l border-rule pl-4 md:flex"
          >
            <span className="mr-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Calendar className="size-3.5" />
              Kỳ báo cáo
            </span>
            <button
              id="time-filter-this-month"
              type="button"
              onClick={() => onTimeRangeChange('this-month')}
              aria-pressed={timeRange === 'this-month'}
              className={`min-h-9 border-b-2 px-3 text-xs font-semibold transition-colors ${
                timeRange === 'this-month'
                  ? 'border-academic-700 text-academic-700'
                  : 'border-transparent text-slate-600 hover:text-ink-950'
              }`}
            >
              Tháng này
            </button>
            <button
              id="time-filter-last-month"
              type="button"
              onClick={() => onTimeRangeChange('last-month')}
              aria-pressed={timeRange === 'last-month'}
              className={`min-h-9 border-b-2 px-3 text-xs font-semibold transition-colors ${
                timeRange === 'last-month'
                  ? 'border-academic-700 text-academic-700'
                  : 'border-transparent text-slate-600 hover:text-ink-950'
              }`}
            >
              Tháng trước
            </button>
            <button
              id="time-filter-all-time"
              type="button"
              onClick={() => onTimeRangeChange('all-time')}
              aria-pressed={timeRange === 'all-time'}
              className={`min-h-9 border-b-2 px-3 text-xs font-semibold transition-colors ${
                timeRange === 'all-time'
                  ? 'border-academic-700 text-academic-700'
                  : 'border-transparent text-slate-600 hover:text-ink-950'
              }`}
            >
              Toàn thời gian
            </button>
          </div>}

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-1 sm:border-l sm:border-rule sm:pl-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-ink-950">{adminUser.name}</span>
              <span className="text-2xs text-slate-500">{adminUser.role}</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded border border-academic-700 bg-academic-700 text-xs font-semibold text-white">
              {initials || 'AD'}
            </div>
            <IconButton
              id="btn-nav-logout"
              onClick={onLogout}
              title="Đăng xuất khỏi cổng quản trị"
              aria-label="Đăng xuất khỏi cổng quản trị"
              className="hidden text-slate-500 hover:bg-red-50 hover:text-brick-700 sm:inline-flex"
            >
              <LogOut className="size-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Mobile Time Filter Bar */}
      {showTimeFilter && <div className="flex items-center border-t border-rule bg-white px-4 md:hidden">
        <span className="mr-2 shrink-0 text-xs text-slate-500">Kỳ</span>
        <div className="grid min-w-0 flex-1 grid-cols-3">
          <button
            type="button"
            onClick={() => onTimeRangeChange('this-month')}
            aria-pressed={timeRange === 'this-month'}
            className={`min-h-10 border-b-2 px-1 text-xs font-semibold ${
              timeRange === 'this-month' ? 'border-academic-700 text-academic-700' : 'border-transparent text-slate-600'
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => onTimeRangeChange('last-month')}
            aria-pressed={timeRange === 'last-month'}
            className={`min-h-10 border-b-2 px-1 text-xs font-semibold ${
              timeRange === 'last-month' ? 'border-academic-700 text-academic-700' : 'border-transparent text-slate-600'
            }`}
          >
            Tháng trước
          </button>
          <button
            type="button"
            onClick={() => onTimeRangeChange('all-time')}
            aria-pressed={timeRange === 'all-time'}
            className={`min-h-10 border-b-2 px-1 text-xs font-semibold ${
              timeRange === 'all-time' ? 'border-academic-700 text-academic-700' : 'border-transparent text-slate-600'
            }`}
          >
            Toàn thời gian
          </button>
        </div>
      </div>}
    </header>
  );
};
