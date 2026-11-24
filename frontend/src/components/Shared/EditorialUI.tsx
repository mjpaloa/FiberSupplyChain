import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Bell, ChevronDown, LogOut, Menu, RefreshCw, X } from 'lucide-react';
import { getCacheState, invalidateApiCache, subscribeCache } from '../../utils/apiCache';

export function useCacheState() {
  return useSyncExternalStore(subscribeCache, getCacheState, getCacheState);
}

export interface EditorialNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  category?: string;
  hidden?: boolean;
}

interface EditorialShellProps {
  brandTitle: string;
  brandSubtitle: string;
  logoSrc?: string;
  navItems: EditorialNavItem[];
  activeNavId: string;
  onSelectNav: (id: string) => void;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  showRefresh?: boolean;
  onRefresh?: () => void;
  unreadCount?: number;
  showNotifications?: boolean;
  onToggleNotifications?: () => void;
  notificationContent?: React.ReactNode;
  profileName: string;
  profileRole: string;
  profileAvatar?: string | null;
  profileInitials?: string;
  showProfileMenu?: boolean;
  onToggleProfileMenu?: () => void;
  profileMenuContent?: React.ReactNode;
  onLogout: () => void;
  logoutLabel?: string;
  children: React.ReactNode;
}

export const EditorialShell: React.FC<EditorialShellProps> = ({
  brandTitle,
  brandSubtitle,
  logoSrc = '/assets/images/abacalogo.png',
  navItems,
  activeNavId,
  onSelectNav,
  pageTitle,
  pageSubtitle,
  headerActions,
  showRefresh = true,
  onRefresh,
  unreadCount = 0,
  showNotifications = false,
  onToggleNotifications,
  notificationContent,
  profileName,
  profileRole,
  profileAvatar,
  profileInitials,
  showProfileMenu = false,
  onToggleProfileMenu,
  profileMenuContent,
  onLogout,
  logoutLabel = 'Sign out',
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    triggerRef.current?.focus();
  };

  const initials =
    profileInitials ||
    (profileName || 'U')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const visibleNavItems = navItems.filter((item) => !item.hidden);
  const groupedNavItems = visibleNavItems.reduce<
    Array<{ category: string; items: EditorialNavItem[] }>
  >((groups, item) => {
    const category = item.category || '';
    const last = groups[groups.length - 1];
    if (last && last.category === category) {
      last.items.push(item);
    } else {
      groups.push({ category, items: [item] });
    }
    return groups;
  }, []);

  const renderSidebarBody = (mobile: boolean) => (
    <div className="flex flex-col h-full bg-white">
      {/* Brand + Notification Bell */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={logoSrc}
            alt={brandTitle}
            className="w-8 h-8 rounded-lg object-contain border border-gray-200 bg-gray-50 p-0.5 flex-shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{brandTitle}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{brandSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleNotifications && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleNotifications}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} unread notifications`}
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white"
                  />
                )}
              </button>
              {showNotifications && notificationContent && (
                <div className="fixed sm:absolute left-4 right-4 sm:left-0 sm:right-auto top-16 sm:top-full mt-2 sm:w-80 bg-white rounded-2xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                  {notificationContent}
                </div>
              )}
            </div>
          )}

          {mobile && (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleCloseDrawer}
              aria-label="Close navigation menu"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label={`${brandTitle} navigation`}
        className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide"
      >
        {groupedNavItems.map((group, groupIndex) => (
          <div
            key={group.category || `group-${groupIndex}`}
            className={groupIndex > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}
          >
            {group.category && (
              <p className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 select-none">
                {group.category}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectNav(item.id);
                      if (mobile) setDrawerOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-colors text-left ${
                      isActive
                        ? 'editorial-nav-active bg-[#EAF6F0] text-[#047857] font-semibold'
                        : 'text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 ${
                        isActive ? 'text-[#047857]' : 'text-gray-400'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Box & Sign Out */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-2 relative">
        <div className="relative">
          <button
            type="button"
            onClick={onToggleProfileMenu}
            disabled={!onToggleProfileMenu}
            aria-expanded={onToggleProfileMenu ? showProfileMenu : undefined}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white text-left transition-colors ${
              onToggleProfileMenu ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
            }`}
          >
            {profileAvatar ? (
              <img
                src={profileAvatar}
                alt={profileName}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{profileName}</p>
              <p className="text-[11px] text-gray-500 truncate">{profileRole}</p>
            </div>
            {onToggleProfileMenu && (
              <ChevronDown
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {showProfileMenu && profileMenuContent && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              {profileMenuContent}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{logoutLabel}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="editorial-portal flex h-screen bg-[#F8F9FA] text-gray-900 overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 border-r border-gray-200 bg-white flex-col">
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label={`${brandTitle} navigation menu`}
        >
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px]"
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full border-r border-gray-200 bg-white flex flex-col">
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{brandTitle}</p>
              <p className="text-[11px] text-gray-500 truncate">{pageTitle}</p>
            </div>
          </div>

          {onToggleNotifications && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleNotifications}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                )}
              </button>
              {showNotifications && notificationContent && (
                <div className="fixed left-4 right-4 top-16 bg-white rounded-2xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                  {notificationContent}
                </div>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8F9FA]">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1440px] mx-auto">
            {/* Editorial Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h1 className="font-serif text-2xl sm:text-[1.875rem] font-bold tracking-tight text-gray-900 leading-tight">
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="text-sm text-gray-500 mt-1">{pageSubtitle}</p>
                )}
              </div>
              {(headerActions || showRefresh) && (
                <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                  {headerActions}
                  {showRefresh && (
                    <button
                      type="button"
                      onClick={() => {
                        invalidateApiCache('manual');
                        onRefresh?.();
                      }}
                      title="Refresh latest data"
                      aria-label="Refresh latest data"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export interface KpiItem {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  accentSubtext?: React.ReactNode;
}

interface KpiStripProps {
  items: KpiItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const GRID_COL_CLASSES: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

export const KpiStrip: React.FC<KpiStripProps> = ({
  items,
  columns,
  className = '',
}) => {
  const cols = columns || (items.length <= 2 ? 2 : items.length === 3 ? 3 : items.length >= 6 ? 6 : items.length === 5 ? 5 : 4);
  const gridClass = GRID_COL_CLASSES[cols] || GRID_COL_CLASSES[4];

  return (
    <div
      className={`editorial-kpi-strip bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
    >
      <div className={`grid ${gridClass} bg-gray-200 gap-px`}>
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-5 sm:p-6 flex flex-col justify-between">
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-gray-900 tabular-nums mt-2 leading-none">
              {item.value}
            </p>
            {(item.subtext || item.accentSubtext) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                {item.subtext && <span>{item.subtext}</span>}
                {item.accentSubtext && (
                  <span className="text-[#92400E] font-medium">{item.accentSubtext}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface EditorialCardProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export const EditorialCard: React.FC<EditorialCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => {
  const hasHeader = Boolean(title || subtitle || badge || actions);
  return (
    <section
      className={`editorial-card bg-white rounded-2xl border border-gray-200 ${
        noPadding ? 'overflow-hidden' : 'p-5 sm:p-6'
      } ${className}`}
    >
      {hasHeader && (
        <div
          className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
            noPadding ? 'px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100' : 'mb-5'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h2 className="font-serif text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h2>
              )}
              {badge !== undefined && badge !== null && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#E59500] text-gray-900 text-xs font-bold tabular-nums">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
};

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'amber' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
}

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  options,
  value,
  onChange,
  variant = 'amber',
  size = 'sm',
  className = '',
}) => {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm';
  return (
    <div
      className={`inline-flex flex-wrap items-center max-w-full bg-white border border-gray-200 rounded-xl p-1 gap-1 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const activeStyle =
          variant === 'amber'
            ? 'bg-[#E59500] text-gray-900 font-semibold'
            : 'bg-gray-100 text-gray-900 font-semibold';
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`${pad} rounded-lg transition-colors whitespace-nowrap ${
              active ? activeStyle : 'text-gray-600 font-medium hover:text-gray-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const PILL_STYLES: Record<PillTone, { wrap: string; dot: string }> = {
  success: { wrap: 'bg-[#EAF6F0] text-[#047857] border-[#CBEAD9]', dot: 'bg-[#059669]' },
  warning: { wrap: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]', dot: 'bg-[#D97706]' },
  danger: { wrap: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]', dot: 'bg-[#DC2626]' },
  info: { wrap: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-600' },
  neutral: { wrap: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500' },
};

export const StatusPill: React.FC<{
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'neutral', children, className = '' }) => {
  const s = PILL_STYLES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${s.wrap} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
};

const CALLOUT_STYLES: Record<'amber' | 'emerald' | 'rose' | 'neutral', { wrap: string; dot: string }> = {
  amber: { wrap: 'bg-[#FFFBEB] border-[#FDE68A] text-gray-800', dot: 'bg-[#E59500]' },
  emerald: { wrap: 'bg-[#EAF6F0] border-[#CBEAD9] text-gray-800', dot: 'bg-[#047857]' },
  rose: { wrap: 'bg-rose-50 border-rose-200 text-gray-800', dot: 'bg-rose-600' },
  neutral: { wrap: 'bg-gray-50 border-gray-200 text-gray-800', dot: 'bg-gray-500' },
};

export const EditorialCallout: React.FC<{
  tone?: 'amber' | 'emerald' | 'rose' | 'neutral';
  title?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ tone = 'amber', title, children, action, className = '' }) => {
  const s = CALLOUT_STYLES[tone];
  return (
    <div
      className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm ${s.wrap} ${className}`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <span className={`w-2 h-2 rounded-full mt-1.5 sm:mt-0 flex-shrink-0 ${s.dot}`} aria-hidden="true" />
        <div className="min-w-0 leading-relaxed">
          {title && <span className="font-semibold text-gray-900 mr-1.5">{title}</span>}
          <span className="text-gray-700">{children}</span>
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export const EDITORIAL_CHART = {
  colors: {
    amber: '#E59500',
    emerald: '#047857',
    espresso: '#78350F',
    slate: '#CBD5E1',
    mutedSlate: '#94A3B8',
    teal: '#0F766E',
    danger: '#DC2626',
  },
  gridProps: {
    strokeDasharray: '0',
    stroke: '#F1F5F9',
    vertical: false,
  },
  xAxisProps: {
    stroke: '#6B7280',
    tick: { fill: '#6B7280', fontSize: 11 },
    axisLine: false,
    tickLine: false,
  },
  yAxisProps: {
    stroke: '#6B7280',
    tick: { fill: '#6B7280', fontSize: 11 },
    axisLine: false,
    tickLine: false,
  },
  tooltipStyle: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(17, 24, 39, 0.08)',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#111827',
  },
} as const;

interface KeepAlivePagesProps {
  activeId: string;
  pages: Record<string, () => React.ReactNode>;
  noKeepAlive?: string[];
}

interface MountedPageEntry {
  mountId: number;
  syncedVersion: number;
}

export const KeepAlivePages: React.FC<KeepAlivePagesProps> = ({
  activeId,
  pages,
  noKeepAlive = [],
}) => {
  const { version, lastReason, manualTick } = useCacheState();
  const mountIdRef = useRef(1);
  const prevManualTickRef = useRef(manualTick);
  const prevVersionRef = useRef(version);

  const [mounted, setMounted] = useState<Record<string, MountedPageEntry>>(() =>
    pages[activeId] ? { [activeId]: { mountId: 1, syncedVersion: version } } : {}
  );

  useEffect(() => {
    const manualChanged = prevManualTickRef.current !== manualTick;
    const versionChanged = prevVersionRef.current !== version;
    prevManualTickRef.current = manualTick;
    prevVersionRef.current = version;

    setMounted((prev) => {
      if (manualChanged) {
        if (!pages[activeId]) {
          return Object.keys(prev).length === 0 ? prev : {};
        }
        mountIdRef.current += 1;
        return {
          [activeId]: { mountId: mountIdRef.current, syncedVersion: version },
        };
      }

      if (versionChanged) {
        const next: Record<string, MountedPageEntry> = {};
        if (pages[activeId]) {
          const currentEntry = prev[activeId];
          if (currentEntry) {
            next[activeId] = {
              mountId: currentEntry.mountId,
              syncedVersion:
                lastReason === 'mutation' ? version : currentEntry.syncedVersion,
            };
          } else {
            mountIdRef.current += 1;
            next[activeId] = { mountId: mountIdRef.current, syncedVersion: version };
          }
        }
        return next;
      }

      let changed = false;
      const next: Record<string, MountedPageEntry> = { ...prev };

      for (const id of Object.keys(next)) {
        if (id !== activeId && noKeepAlive.includes(id)) {
          delete next[id];
          changed = true;
        }
      }

      if (pages[activeId]) {
        const existing = next[activeId];
        if (!existing || existing.syncedVersion !== version) {
          mountIdRef.current += 1;
          next[activeId] = { mountId: mountIdRef.current, syncedVersion: version };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [activeId, version, lastReason, manualTick, noKeepAlive, pages]);

  return (
    <>
      {Object.entries(mounted).map(([id, entry]) => {
        const renderPage = pages[id];
        if (!renderPage) return null;
        const isActive = id === activeId;
        return (
          <div
            key={`${id}-${entry.mountId}`}
            className={isActive ? 'block' : 'hidden'}
            aria-hidden={!isActive}
          >
            {renderPage()}
          </div>
        );
      })}
    </>
  );
};
