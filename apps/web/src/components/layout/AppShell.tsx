import React, { useState, useEffect, useCallback } from 'react';
import { User, InAppNotification, Booking } from '@/types';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { api } from '@/lib/api';
import { NotificationDetailsModal } from '@/components/notifications/NotificationDetailsModal';
import {
  X, Bell, CheckCheck, Clock, Car, ShieldCheck, XCircle,
  CheckCircle2, AlertCircle, Info, Inbox, ChevronRight, QrCode, ArrowLeft,
} from 'lucide-react';

const TAB_TITLES: Record<string, string> = {
  'dashboard': 'Dashboard Overview',
  'new-booking': 'Book a Vehicle',
  'my-bookings': 'My Trip Bookings & History',
  'requests-queue': 'Review Requests Queue',
  'assign-queue': 'Vehicle Assignment & Allocation Queue',
  'availability': 'Fleet Calendar & Schedules',
  'vehicles': 'Fleet Inventory',
  'drivers': 'Chauffeur & Driver Directory',
  'maintenance': 'Vehicle Issues & Workshop Maintenance',
  'reports': 'Executive Reports & Analytics Hub',
  'settings': 'Departments & System Settings',
  'users': 'Staff Accounts & Directory',
  'audit-logs': 'System Audit Logs',
};

// ──────────────────────────────────────────────────────────────────────────────
// Helper: pick icon + colour based on notification type
// ──────────────────────────────────────────────────────────────────────────────
function getNotifStyle(type: string): {
  icon: React.ReactNode;
  dot: string;
  ring: string;
  bg: string;
} {
  switch (type) {
    case 'BOOKING_APPROVED':
    case 'VEHICLE_ASSIGNED':
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-400/20',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      };
    case 'BOOKING_REJECTED':
      return {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        dot: 'bg-red-500',
        ring: 'ring-red-400/20',
        bg: 'bg-red-50 dark:bg-red-950/40',
      };
    case 'NEW_BOOKING_REQUEST':
      return {
        icon: <Car className="w-4 h-4 text-brand-500" />,
        dot: 'bg-brand-500',
        ring: 'ring-brand-400/20',
        bg: 'bg-brand-50 dark:bg-brand-950/40',
      };
    case 'BOOKING_CANCELLED':
      return {
        icon: <AlertCircle className="w-4 h-4 text-amber-500" />,
        dot: 'bg-amber-500',
        ring: 'ring-amber-400/20',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
      };
    default:
      return {
        icon: <Info className="w-4 h-4 text-blue-500" />,
        dot: 'bg-blue-500',
        ring: 'ring-blue-400/20',
        bg: 'bg-blue-50 dark:bg-blue-950/40',
      };
  }
}

/** Format a timestamp relative to now */
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Single notification card
// ──────────────────────────────────────────────────────────────────────────────
const NotifCard: React.FC<{
  n: InAppNotification;
  onSelect: (n: InAppNotification) => void;
}> = ({ n, onSelect }) => {
  const style = getNotifStyle(n.type);
  const isUnread = !n.readAt;

  return (
    <div
      onClick={() => onSelect(n)}
      className={`
        group relative flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
        hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] active:scale-[0.99]
        ${isUnread
          ? `${style.bg} border-slate-200 dark:border-slate-700/80 shadow-sm`
          : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-80'}
      `}
    >
      {/* Unread dot */}
      {isUnread && (
        <span
          className={`absolute top-4 right-4 w-2 h-2 rounded-full ${style.dot} ring-4 ${style.ring}`}
          aria-label="Unread"
        />
      )}

      {/* Icon bubble */}
      <div className={`
        shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
        ${isUnread ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800/60'}
      `}>
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-sm font-semibold leading-tight ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
          {n.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
          {n.message}
        </p>

        {/* QR Receipt Available Badge for approved bookings */}
        {(n.type === 'BOOKING_APPROVED' || n.type === 'VEHICLE_ASSIGNED') && (
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <QrCode className="w-3 h-3 text-emerald-600" />
              <span>QR Receipt Ready</span>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-1.5 mt-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {timeAgo(n.createdAt)}
            </span>
          </div>
          <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ChevronRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// AppShell
// ──────────────────────────────────────────────────────────────────────────────
interface AppShellProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void;
  notifications: InAppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onOpenProfile?: () => void;
  onOpenBooking?: (booking: Booking | { id: string }) => void;
  onOpenReceipt?: (booking: Booking | { id: string; bookingReference?: string }) => void;
  onOpenVerification?: (reference?: string) => void;
  onNotificationsRefresh?: (notifs: InAppNotification[]) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  notifications,
  onMarkNotificationRead,
  onOpenProfile,
  onOpenBooking,
  onOpenReceipt,
  onOpenVerification,
  onNotificationsRefresh,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<InAppNotification | null>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // ── Polling: refresh notifications every 30 seconds ──
  const pollNotifications = useCallback(async () => {
    try {
      const fresh = await api.getNotifications();
      onNotificationsRefresh?.(fresh);
    } catch {
      // silent – don't disrupt UX on poll failure
    }
  }, [onNotificationsRefresh]);

  useEffect(() => {
    // Poll immediately once, then every 30 s
    pollNotifications();
    const interval = setInterval(pollNotifications, 30_000);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  const handleMarkRead = (id: string) => {
    onMarkNotificationRead?.(id);
  };

  const handleSelectNotification = (n: InAppNotification) => {
    if (!n.readAt) {
      handleMarkRead(n.id);
    }
    setSelectedNotification({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      const fresh = await api.getNotifications();
      onNotificationsRefresh?.(fresh);
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar
        currentUser={currentUser}
        unreadCount={unreadCount}
        onLogout={onLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={onOpenProfile}
        onOpenVerification={onOpenVerification ? () => onOpenVerification() : undefined}
      />

      <div className="flex-1 flex w-full min-w-0 overflow-hidden">
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 h-full p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto overscroll-contain">
          {activeTab !== 'dashboard' && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all group cursor-pointer"
                title="Return to the main overview dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <button
                  type="button"
                  onClick={() => onTabChange('dashboard')}
                  className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-slate-900 dark:text-slate-200 font-semibold">
                  {TAB_TITLES[activeTab] || activeTab}
                </span>
              </div>
            </div>
          )}

          <div key={activeTab} className="page-enter w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* ── Notifications Slide-over Drawer ── */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Notifications panel">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsNotificationsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-[400px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center border border-brand-200 dark:border-brand-800">
                    <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 px-2.5 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Unread badge strip */}
              {unreadCount > 0 && (
                <div className="px-5 py-2 bg-brand-50 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/60">
                  <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-widest">
                    {unreadCount} New · Click to mark as read
                  </span>
                </div>
              )}

              {/* Notification list */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Inbox className="w-7 h-7 text-slate-400 dark:text-slate-500 stroke-1" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No notifications yet</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        You'll be notified here when your booking requests are reviewed.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-2.5">
                    {notifications.map((n) => (
                      <NotifCard key={n.id} n={n} onSelect={handleSelectNotification} />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                    Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · Updates every 30s
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Details Modal ── */}
      <NotificationDetailsModal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
        onInspectBooking={onOpenBooking}
        onOpenReceipt={onOpenReceipt}
        onMarkAsRead={handleMarkRead}
      />
    </div>
  );
};
