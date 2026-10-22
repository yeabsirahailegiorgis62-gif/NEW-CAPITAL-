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
  KeyRound,
  UserCheck,
  BarChart3,
  Settings,
  Building,
  UserCog,
  CalendarRange,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  section?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isEmployee = currentUser.role === 'EMPLOYEE';
  const isDriver = currentUser.role === 'DRIVER';
  const isLogistics = currentUser.role === 'LOGISTICS_ADMIN';
  const isSystemAdmin = currentUser.role === 'SYSTEM_ADMIN';

  const employeeLinks: NavItem[] = [
    { section: 'OVERVIEW', id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { section: 'TRANSPORT', id: 'new-booking', label: 'Book a Vehicle', icon: PlusCircle },
    { section: 'TRANSPORT', id: 'my-bookings', label: 'My Bookings', icon: Clock },
    { section: 'TRANSPORT', id: 'availability', label: 'Fleet Calendar', icon: CalendarDays },
    { section: 'ACCOUNT', id: 'profile-settings', label: 'Profile Settings', icon: UserCog },
  ];

  const driverLinks: NavItem[] = [
    { section: 'OVERVIEW', id: 'dashboard', label: 'Driver Dashboard', icon: LayoutDashboard },
    { section: 'OPERATIONS', id: 'availability', label: 'Fleet Calendar', icon: CalendarDays },
    { section: 'ACCOUNT', id: 'profile-settings', label: 'Profile Settings', icon: UserCog },
  ];

  const logisticsLinks: NavItem[] = [
    { section: 'OVERVIEW', id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { section: 'TRANSPORT OPERATIONS', id: 'requests-queue', label: 'Transport Requests', icon: ClipboardList },
    { section: 'TRANSPORT OPERATIONS', id: 'weekly-requests', label: 'Weekly Requests', icon: CalendarRange },
    { section: 'TRANSPORT OPERATIONS', id: 'assign-queue', label: 'Vehicle Assignments', icon: KeyRound },
    { section: 'TRANSPORT OPERATIONS', id: 'availability', label: 'Schedule / Calendar', icon: CalendarDays },
    { section: 'FLEET MANAGEMENT', id: 'vehicles', label: 'Vehicles', icon: Car },
    { section: 'FLEET MANAGEMENT', id: 'maintenance', label: 'Maintenance & Issues', icon: Wrench },
    { section: 'DRIVER MANAGEMENT', id: 'drivers', label: 'Chauffeur Registry', icon: UserCheck },
    { section: 'REPORTING', id: 'reports', label: 'Reports Hub', icon: BarChart3 },
    { section: 'ACCOUNT', id: 'profile-settings', label: 'Profile Settings', icon: UserCog },
  ];

  const adminLinks: NavItem[] = [
    { section: 'OVERVIEW', id: 'dashboard', label: 'Analytics & Command', icon: LayoutDashboard },
    { section: 'STAFF & STRUCTURE', id: 'users', label: 'Staff Directory', icon: Users },
    { section: 'STAFF & STRUCTURE', id: 'departments', label: 'Departments', icon: Building },
    { section: 'STAFF & STRUCTURE', id: 'drivers', label: 'Chauffeurs', icon: UserCheck },
    { section: 'FLEET & LOGISTICS', id: 'vehicles', label: 'Fleet Inventory', icon: Car },
    { section: 'FLEET & LOGISTICS', id: 'requests-queue', label: 'Review Requests', icon: ClipboardList },
    { section: 'FLEET & LOGISTICS', id: 'assign-queue', label: 'Assign Vehicles', icon: KeyRound },
    { section: 'REPORTING', id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { section: 'SYSTEM & SECURITY', id: 'settings', label: 'System Settings', icon: Settings },
    { section: 'SYSTEM & SECURITY', id: 'audit-logs', label: 'System Audit Logs', icon: ShieldCheck },
    { section: 'ACCOUNT', id: 'profile-settings', label: 'Profile Settings', icon: UserCog },
  ];

  const links: NavItem[] = isDriver ? driverLinks : isEmployee ? employeeLinks : isSystemAdmin ? adminLinks : logisticsLinks;


  const handleSelect = (id: string) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 w-64 select-none">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Workspace
        </div>
        <div className="text-sm font-medium text-slate-900 dark:text-white mt-1">
          {currentUser.department?.name || 'Capital Real Estate HQ'}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto min-h-0">
        {links.map((link, idx) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          const prevLink = links[idx - 1];
          const showSectionHeader = link.section && (!prevLink || prevLink.section !== link.section);

          return (
            <React.Fragment key={link.id}>
              {showSectionHeader && (
                <div className="pt-4 pb-1.5 px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {link.section}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleSelect(link.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all text-left relative group cursor-pointer',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4.5 h-4.5 shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                    )}
                  />
                  <span>{link.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/40 shadow-xs" />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {currentUser.role === 'LOGISTICS_ADMIN'
              ? 'Logistics Operations'
              : currentUser.role === 'SYSTEM_ADMIN'
              ? 'System Administrator'
              : currentUser.role === 'DRIVER'
              ? 'Professional Chauffeur'
              : 'Official Traveler'}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Addis Ababa (UTC+3)</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
