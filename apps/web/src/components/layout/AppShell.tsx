import React, { useState } from 'react';
import { User, InAppNotification } from '@/types';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { X, Bell } from 'lucide-react';
import { formatEthiopianDateTime } from '@/lib/utils';

interface AppShellProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void;
  notifications: InAppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onLogout,
  notifications,
  onMarkNotificationRead,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        unreadCount={unreadCount}
        onLogout={onLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Notifications Slide-over Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsNotificationsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-brand-100 text-brand-800 font-medium px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                  aria-label="Close notifications panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 stroke-1 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead && !n.readAt && onMarkNotificationRead(n.id)}
                      className={`p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                        !n.readAt
                          ? 'bg-blue-50/50 border-blue-200 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200/80 text-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs tracking-tight text-slate-800">
                          {n.title}
                        </span>
                        {!n.readAt && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs mt-1 text-slate-600 leading-relaxed">{n.message}</p>
                      <span className="text-[11px] text-slate-400 mt-2 block">
                        {formatEthiopianDateTime(n.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
