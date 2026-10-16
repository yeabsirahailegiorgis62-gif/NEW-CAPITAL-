import React from 'react';
import { User } from '@/types';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Clock,
  Car,
  ClipboardList,
  Wrench,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isEmployee = currentUser.role === 'EMPLOYEE';
  const isLogistics = currentUser.role === 'LOGISTICS_ADMIN';
  const isSystemAdmin = currentUser.role === 'SYSTEM_ADMIN';

  const employeeLinks = [
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'new-booking', label: 'Book a Vehicle', icon: PlusCircle },
    { id: 'my-bookings', label: 'My Bookings', icon: Clock },
    { id: 'availability', label: 'Fleet Calendar', icon: CalendarDays },
  ];

  const logisticsLinks = [
    { id: 'dashboard', label: 'Logistics Overview', icon: LayoutDashboard },
    { id: 'requests-queue', label: 'Review Requests', icon: ClipboardList },
    { id: 'availability', label: 'Schedule & Calendar', icon: CalendarDays },
    { id: 'vehicles', label: 'Fleet Inventory', icon: Car },
    { id: 'maintenance', label: 'Vehicle Issues', icon: Wrench },
  ];

  const adminLinks = [
    { id: 'dashboard', label: 'Logistics Overview', icon: LayoutDashboard },
    { id: 'requests-queue', label: 'Review Requests', icon: ClipboardList },
    { id: 'availability', label: 'Fleet Calendar', icon: CalendarDays },
    { id: 'vehicles', label: 'Fleet Inventory', icon: Car },
    { id: 'users', label: 'Staff Accounts', icon: Users },
    { id: 'audit-logs', label: 'System Audit Logs', icon: ShieldCheck },
  ];

  const links = isEmployee ? employeeLinks : isSystemAdmin ? adminLinks : logisticsLinks;

  const handleSelect = (id: string) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 select-none">
      <div className="p-4 border-b border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Workspace
        </div>
        <div className="text-sm font-medium text-white mt-1">
          {currentUser.department?.name || 'Capital Real Estate HQ'}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => handleSelect(link.id)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left relative group',
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-900/40 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400')} />
                <span>{link.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-white/30 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-200">
            {currentUser.role === 'LOGISTICS_ADMIN'
              ? 'Logistics Operations'
              : currentUser.role === 'SYSTEM_ADMIN'
              ? 'System Administrator'
              : 'Official Traveler'}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">Addis Ababa (UTC+3)</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 dark:border-slate-800">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
