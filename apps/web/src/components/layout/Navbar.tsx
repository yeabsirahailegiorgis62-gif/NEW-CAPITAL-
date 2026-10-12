import React from 'react';
import { User } from '@/types';
import { Bell, LogOut, Menu, Truck } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  unreadCount?: number;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  unreadCount = 0,
  onLogout,
  onToggleMobileMenu,
  onOpenNotifications,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Brand and Mobile Toggle */}
          <div className="flex items-center gap-3">
            {currentUser && onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white shadow-sm">
                <Truck className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-navy-900">CAPITAL FLEET</span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 ml-2 tracking-wide uppercase">
                  Capital Real Estate
                </span>
              </div>
            </div>
          </div>

          {/* Right User Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* User Info & Role */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-semibold text-slate-800 leading-none">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {currentUser.role === 'LOGISTICS_ADMIN'
                        ? 'Logistics Admin'
                        : currentUser.role === 'SYSTEM_ADMIN'
                        ? 'System Admin'
                        : 'Staff Employee'}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-semibold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <a
                href="#signin"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
