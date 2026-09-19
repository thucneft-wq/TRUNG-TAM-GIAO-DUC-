import React, { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users2,
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
  dataSource: 'api' | 'mock';
  isDataLoading: boolean;
  roleCode: 'admin' | 'counselor';
  crudDemoMode: boolean;
}

interface NavigationItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const NavigationItem: React.FC<NavigationItemProps> = ({
  id,
  label,
  icon,
  active,
  onClick,
}) => (
  <button
    id={id}
    type="button"
    aria-current={active ? 'page' : undefined}
    onClick={onClick}
    className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-r border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
      active
        ? 'border-academic-700 bg-teal-50 text-academic-800'
        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-ink-950'
    }`}
  >
    <span className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
      <span className="min-w-0 text-pretty leading-5">{label}</span>
    </span>
    {active ? (
      <ChevronRight className="size-4 shrink-0 text-academic-700" aria-hidden="true" />
    ) : null}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isOpen,
  onClose,
  onLogout,
  dataSource,
  isDataLoading,
  roleCode,
  crudDemoMode,
}) => {
  const isAdmin = roleCode === 'admin';
  const panelRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const isCounselorPerformanceActive = currentScreen === 'counselors'
    || currentScreen === 'counselor-detail';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        requestAnimationFrame(() => {
          document.getElementById('btn-toggle-sidebar-mobile')?.focus({ preventScroll: true });
        });
      }
      return undefined;
    }

    wasOpenRef.current = true;
    const panel = panelRef.current;
    if (!panel) return undefined;

    const getFocusableElements = (): HTMLElement[] => (
      Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]
    );

    requestAnimationFrame(() => {
      (document.getElementById('btn-close-sidebar-mobile') ?? getFocusableElements()[0])
        ?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
        ref={panelRef}
        id="app-sidebar"
        tabIndex={-1}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
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
              id="btn-close-sidebar-mobile"
              type="button"
              onClick={onClose}
              aria-label="Đóng trình đơn điều hướng"
              className="ml-auto inline-flex size-11 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-ink-950 lg:hidden"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 border-l-2 border-academic-700 pl-3 text-xs text-slate-600">
            <span className={`size-2 rounded-full ${isDataLoading ? 'animate-pulse bg-amber-500' : dataSource === 'api' ? 'bg-pine-700' : 'bg-amber-500'}`} />
            {isDataLoading ? 'Đang cập nhật dữ liệu' : dataSource === 'api' ? 'Dữ liệu hệ thống đang hoạt động' : 'Đang dùng dữ liệu cục bộ'}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5">
          <div>
            <div className="mb-2 px-3 text-xs font-semibold text-slate-500">
              Hồ sơ và vận hành
            </div>
            <nav aria-label="Các trang quản trị" className="space-y-1">
              {isAdmin && (
                <NavigationItem
                  id="nav-link-dashboard"
                  label="Tổng quan bảng điều khiển"
                  icon={<LayoutDashboard className="size-4" />}
                  active={currentScreen === 'dashboard'}
                  onClick={() => onNavigate('dashboard')}
                />
              )}

              <NavigationItem
                id="nav-link-students"
                label="Quản lý học sinh"
                icon={<GraduationCap className="size-4" />}
                active={currentScreen === 'students'}
                onClick={() => onNavigate('students')}
              />

              {isAdmin && (
                <NavigationItem
                  id="nav-link-knowledge-graph"
                  label="Knowledge Graph"
                  icon={<Network className="size-4" />}
                  active={currentScreen === 'knowledge-graph'}
                  onClick={() => onNavigate('knowledge-graph')}
                />
              )}

              {isAdmin && (
                <NavigationItem
                  id="nav-link-counselor-management"
                  label="Quản lý tư vấn viên"
                  icon={<Users2 className="size-4" />}
                  active={currentScreen === 'counselor-management'}
                  onClick={() => onNavigate('counselor-management')}
                />
              )}

              {isAdmin && (
                <div className="mb-2 mt-6 px-3 text-xs font-semibold text-slate-500">
                  Phân tích và chất lượng
                </div>
              )}

              {isAdmin && (
                <NavigationItem
                  id="nav-link-counselors"
                  label="Hiệu suất tư vấn viên"
                  icon={<Activity className="size-4" />}
                  active={isCounselorPerformanceActive}
                  onClick={() => onNavigate('counselors')}
                />
              )}

              {isAdmin && !crudDemoMode && (
                <>
                  <NavigationItem
                    id="nav-link-student-trends"
                    label="Xu hướng học viên"
                    icon={<TrendingUp className="size-4" />}
                    active={currentScreen === 'student-trends'}
                    onClick={() => onNavigate('student-trends')}
                  />

                  <NavigationItem
                    id="nav-link-feedback-analytics"
                    label="Phân tích feedback"
                    icon={<MessageSquareHeart className="size-4" />}
                    active={currentScreen === 'feedback-analytics'}
                    onClick={() => onNavigate('feedback-analytics')}
                  />

                  <div className="mb-2 mt-6 px-3 text-xs font-semibold text-slate-500">
                    Hệ thống
                  </div>

                  <NavigationItem
                    id="nav-link-audit-logs"
                    label="Nhật ký bảo mật"
                    icon={<FileClock className="size-4" />}
                    active={currentScreen === 'audit-logs'}
                    onClick={() => onNavigate('audit-logs')}
                  />
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Footer / Sign Out */}
        <div className="shrink-0 border-t border-rule bg-white p-3">
          <button
            id="btn-sidebar-logout"
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded border border-rule bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-brick-700"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
