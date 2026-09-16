import React from 'react';
import {
  Menu,
  LogOut,
  Calendar,
  LoaderCircle,
} from 'lucide-react';
import { AdminUser, TimeRange, ScreenType } from '../types';

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Screen Title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-sidebar-mobile"
            type="button"
            onClick={onToggleSidebar}
            aria-controls="app-sidebar"
            aria-expanded={isSidebarOpen}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Bật hoặc tắt trình đơn điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Phân tích Bản sao số
              </span>
              <span
                title={formattedLastUpdated ? `Cập nhật lần cuối: ${formattedLastUpdated}` : undefined}
                className={`hidden sm:inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded border ${
                  dataSource === 'api'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {isDataLoading ? (
                  <LoaderCircle className="w-3 h-3 animate-spin" />
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dataSource === 'api' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                )}
                {isDataLoading
                  ? 'Đang làm mới dữ liệu'
                  : dataSource === 'api'
                    ? 'Đã kết nối API hệ thống'
                    : 'Dữ liệu demo cục bộ'}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 mt-0.5">
              {currentScreen === 'dashboard' && 'Tổng quan phân tích trung tâm'}
              {currentScreen === 'knowledge-graph' && 'Không gian Knowledge Graph'}
              {currentScreen === 'counselor-management' && 'Quản lý hồ sơ và tài khoản tư vấn viên'}
              {currentScreen === 'counselors' && 'Hiệu suất tư vấn viên và kiểm định KPI'}
              {currentScreen === 'students' && 'Quản lý hồ sơ Student'}
              {currentScreen === 'student-trends' && 'Xu hướng tình trạng học viên'}
              {currentScreen === 'feedback-analytics' && 'Phân tích phản hồi học viên'}
              {currentScreen === 'audit-logs' && 'Nhật ký bảo mật và thay đổi'}
              {currentScreen === 'counselor-detail' && (
                <>
                  <span className="text-slate-500 font-normal">Tư vấn viên:</span>
                  <span>{selectedCounselorName || 'Chi tiết hiệu suất'}</span>
                </>
              )}
            </h1>
          </div>
        </div>

        {/* Right Side: Time Filter, Twin Status & Admin Avatar */}
        <div className="flex items-center gap-3">
          {/* Time Filter Tabs */}
          {showTimeFilter && <div
            id="time-range-filter-group"
            className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80"
          >
            <span className="text-2xs font-semibold uppercase text-slate-600 px-2 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              Kỳ:
            </span>
            <button
              id="time-filter-this-month"
              type="button"
              onClick={() => onTimeRangeChange('this-month')}
              aria-pressed={timeRange === 'this-month'}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'this-month'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
            <button
              id="time-filter-last-month"
              type="button"
              onClick={() => onTimeRangeChange('last-month')}
              aria-pressed={timeRange === 'last-month'}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'last-month'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng trước
            </button>
            <button
              id="time-filter-all-time"
              type="button"
              onClick={() => onTimeRangeChange('all-time')}
              aria-pressed={timeRange === 'all-time'}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'all-time'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn thời gian
            </button>
          </div>}

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{adminUser.name}</span>
              <span className="text-2xs text-slate-500">{adminUser.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initials || 'AD'}
            </div>
            <button
              id="btn-nav-logout"
              type="button"
              onClick={onLogout}
              title="Đăng xuất khỏi cổng quản trị"
              aria-label="Đăng xuất khỏi cổng quản trị"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Time Filter Bar */}
      {showTimeFilter && <div className="md:hidden px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-2xs font-semibold text-slate-500">Khoảng thời gian:</span>
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onTimeRangeChange('this-month')}
            aria-pressed={timeRange === 'this-month'}
            className={`px-2 py-0.5 text-2xs font-semibold rounded ${
              timeRange === 'this-month' ? 'bg-white text-blue-700' : 'text-slate-600'
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => onTimeRangeChange('last-month')}
            aria-pressed={timeRange === 'last-month'}
            className={`px-2 py-0.5 text-2xs font-semibold rounded ${
              timeRange === 'last-month' ? 'bg-white text-blue-700' : 'text-slate-600'
            }`}
          >
            Tháng trước
          </button>
          <button
            type="button"
            onClick={() => onTimeRangeChange('all-time')}
            aria-pressed={timeRange === 'all-time'}
            className={`px-2 py-0.5 text-2xs font-semibold rounded ${
              timeRange === 'all-time' ? 'bg-white text-blue-700' : 'text-slate-600'
            }`}
          >
            Toàn thời gian
          </button>
        </div>
      </div>}
    </header>
  );
};
