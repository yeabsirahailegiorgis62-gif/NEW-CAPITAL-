// COMPONENT: Top bar with theme toggle, notifications, profile, and logout.
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Bell, LogOut, Menu, Moon, Sun, UserCheck, Clock, Settings, ChevronDown, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SmartDropdown } from '@/components/ui/SmartDropdown';

interface NavbarProps {
  currentUser: User | null;
  unreadCount?: number;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenVerification?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  unreadCount = 0,
  onLogout,
  onToggleMobileMenu,
  onOpenNotifications,
  onOpenProfile,
  onOpenVerification,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live Addis Ababa Time (UTC+3)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Addis_Ababa',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);



  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Left Brand and Mobile Toggle */}
          <div className="flex items-center gap-3">
            {currentUser && onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <BrandLogo size="md" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all border border-slate-200/60 dark:border-slate-800"
              title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {currentUser ? (
              <>
                {/* Verify Pass / QR Code Action */}
                {onOpenVerification && (
                  <button
                    type="button"
                    onClick={onOpenVerification}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
                    title="Verify official vehicle booking QR code or reference"
                  >
                    <QrCode className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span className="hidden md:inline">Verify Pass</span>
                  </button>
                )}

                {/* Notification Bell */}
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-200/60 dark:border-slate-800"
                  aria-label="View notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                  )}
                </button>

                {/* Smart User Dropdown with Intelligent Viewport Collision Detection */}
                <SmartDropdown
                  align="right"
                  minWidth={288}
                  trigger={({ isOpen, toggle, ref }) => (
                    <button
                      ref={ref}
                      type="button"
                      onClick={toggle}
                      className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-left group"
                      aria-expanded={isOpen}
                      aria-label="User account menu"
                    >
                      <div className="hidden sm:block text-right">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {currentUser.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {currentUser.role === 'LOGISTICS_ADMIN'
                            ? 'Logistics Admin'
                            : currentUser.role === 'SYSTEM_ADMIN'
                            ? 'System Admin'
                            : 'Staff Employee'}
                        </div>
                      </div>

                      <div className="relative">
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full object-cover border border-brand-400 shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-navy-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {currentUser.name.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
                      </div>

                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
                    </button>
                  )}
                >
                  {({ close }) => (
                    <div className="w-72 py-2">
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-brand-500 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-navy-900 dark:bg-brand-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            {currentUser.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {currentUser.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {currentUser.email}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge status={currentUser.role} size="sm" />
                            {currentUser.employeeId && (
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                #{currentUser.employeeId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="p-1.5 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            onOpenProfile?.();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-brand-500" />
                          <span>Edit Profile & Credentials</span>
                        </button>

                        {onOpenVerification && (
                          <button
                            type="button"
                            onClick={() => {
                              close();
                              onOpenVerification();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                          >
                            <QrCode className="w-4 h-4 text-emerald-500" />
                            <span>Verify QR Credential</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            toggleTheme();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {theme === 'dark' ? (
                              <Sun className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Moon className="w-4 h-4 text-indigo-500" />
                            )}
                            <span>Appearance</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {theme === 'dark' ? 'Dark' : 'Bright'}
                          </span>
                        </button>
                      </div>

                      {/* Corporate Identity Footer */}
                      <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/60">
                        <div className="flex items-center gap-1.5 font-medium">
                          <img
                            src="/assets/capital-emblem.png"
                            alt="Capital Real Estate & Apartment"
                            className="w-4 h-4 object-contain"
                          />
                          <span>Capital Real Estate & Apartment</span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                          FLEET
                        </span>
                      </div>

                      {/* Logout Section */}
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 p-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            onLogout?.();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors group"
                        >
                          <LogOut className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                          <span>Sign Out Securely</span>
                        </button>
                      </div>
                    </div>
                  )}
                </SmartDropdown>
              </>
            ) : (
              <a
                href="#signin"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-md shadow-brand-500/20 transition-all"
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
