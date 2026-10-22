import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { User, UserRole, Department } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import { AddEmployeeModal } from './AddEmployeeModal';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Search,
  UserPlus,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  RotateCw,
  KeyRound,
  Eye,
  Edit2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Car,
  Calendar,
  AlertTriangle,
  CreditCard,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'employeeId' | 'role' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Profile View Modal State
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Edit Staff Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Admin Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    token?: string;
    expiresAt?: string;
    message?: string;
  } | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [usersData, deptsData] = await Promise.all([
        api.getUsers(),
        api.getDepartments().catch(() => []),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err: any) {
      console.error('Failed to load users', err);
      toast.error('Failed to load users', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await api.updateUser(user.id, { isActive: !user.isActive });
      toast.info(
        `User ${updated.isActive ? 'Activated' : 'Deactivated'}`,
        `${user.name}'s account has been ${updated.isActive ? 'enabled' : 'disabled'}.`
      );
      await fetchUsers();
      if (viewingUser?.id === user.id) {
        setViewingUser({ ...viewingUser, isActive: updated.isActive });
      }
    } catch (err: any) {
      console.error('Failed to update user', err);
      toast.error('Update failed', err.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, userName: string) => {
    try {
      await api.updateUser(userId, { role: newRole });
      toast.success('Role Updated', `${userName} is now assigned as ${newRole}.`);
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to change role', err);
      toast.error('Role update failed', err.message);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditJobTitle(user.jobTitle || '');
    setEditDeptId(user.departmentId || '');
    setEditLicense(user.licenseNumber || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setIsSavingEdit(true);
      await api.updateUser(editingUser.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        jobTitle: editJobTitle.trim() || undefined,
        departmentId: editDeptId || undefined,
        licenseNumber: editingUser.role === 'DRIVER' ? editLicense.trim() || undefined : undefined,
      });
      toast.success('Staff Profile Updated', `Changes for ${editName} have been saved.`);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not save profile changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!resetModalUser) return;
    try {
      setIsResetting(true);
      const res = await api.adminResetPassword(resetModalUser.id, forcePasswordChange);
      setResetResult({
        token: res.resetToken,
        expiresAt: res.expiresAt,
        message: res.message,
      });
      toast.success('Password Reset Initiated', res.message);
    } catch (err: any) {
      toast.error('Reset Failed', err.message || 'Could not initiate password reset.');
    } finally {
      setIsResetting(false);
    }
  };

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      const term = searchTerm.toLowerCase();
      const matchSearch =
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.employeeId && u.employeeId.toLowerCase().includes(term)) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

      // Department filter
      if (deptFilter !== 'ALL' && u.departmentId !== deptFilter) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';

      if (sortBy === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, roleFilter, deptFilter, statusFilter, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Statistics
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const employeeCount = users.filter((u) => u.role === 'EMPLOYEE').length;
  const driverCount = users.filter((u) => u.role === 'DRIVER').length;
  const logisticsAdminCount = users.filter((u) => u.role === 'LOGISTICS_ADMIN').length;
  const systemAdminCount = users.filter((u) => u.role === 'SYSTEM_ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              Staff Administration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Corporate Staff Directory
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Staff Directory & User Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Audit authorized personnel accounts, manage driver licenses, configure enterprise roles, and initiate security password resets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 shadow-sm shadow-brand-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Staff</span>
          </Button>
        </div>
      </div>

      {/* Staff Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Staff</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Employees</span>
            <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{employeeCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Booking Requesters</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Drivers</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{driverCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Assigned Chauffeurs</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Logistics Officers</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{logisticsAdminCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Fleet Dispatchers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">System Admins</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{systemAdminCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">IT Governance</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by name, email, staff ID, or job title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Roles</option>
              <option value="EMPLOYEE">Staff Employee</option>
              <option value="DRIVER">Fleet Driver</option>
              <option value="LOGISTICS_ADMIN">Logistics Officer</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => {
                  setSortBy('name');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}>
                  Staff Member & Contact {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => {
                  setSortBy('employeeId');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}>
                  Staff ID {sortBy === 'employeeId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => {
                  setSortBy('role');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}>
                  Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {searchTerm ? 'No staff matching your search criteria.' : 'No staff accounts found.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User and contact info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-navy-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingUser(u)}
                            className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors block truncate text-left"
                          >
                            {u.name}
                          </button>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{u.email}</span>
                            {u.phone && (
                              <>
                                <span>•</span>
                                <span>{u.phone}</span>
                              </>
                            )}
                          </div>
                          {u.jobTitle && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                              {u.jobTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {u.employeeId ? (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                          #{u.employeeId}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{u.department?.name || 'Capital Real Estate HQ'}</span>
                      </div>
                    </td>

                    {/* Role Permission Selector */}
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.name)}
                        className="text-xs py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="EMPLOYEE">Staff Employee</option>
                        <option value="DRIVER">Fleet Driver</option>
                        <option value="LOGISTICS_ADMIN">Logistics Officer</option>
                        <option value="SYSTEM_ADMIN">System Admin</option>
                      </select>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingUser(u)}
                          title="View Staff Profile"
                          leftIcon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                          className="h-[38px] px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 hover:border-brand-500"
                        >
                          <span className="hidden sm:inline">Profile</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Information"
                          leftIcon={<Edit2 className="w-3.5 h-3.5 text-blue-500" />}
                          className="h-[38px] px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 hover:border-blue-500"
                        >
                          <span className="hidden sm:inline">Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResetModalUser(u);
                            setResetResult(null);
                            setForcePasswordChange(true);
                          }}
                          title="Reset Password"
                          leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                          className="h-[38px] px-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-transparent hover:border-amber-300"
                        >
                          <span className="hidden md:inline">Reset</span>
                        </Button>

                        <Button
                          variant={u.isActive ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(u)}
                          className={`h-[38px] px-3 text-xs font-bold ${
                            u.isActive
                              ? 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/80 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{filteredUsers.length}</strong> staff accounts
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-[38px] px-3 text-xs font-semibold border-slate-300 dark:border-slate-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-[38px] px-3 text-xs font-semibold border-slate-300 dark:border-slate-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── View Staff Profile Modal ── */}
      {viewingUser && (
        <Modal
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title="Staff Profile Details"
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              {viewingUser.avatarUrl ? (
                <img
                  src={viewingUser.avatarUrl}
                  alt={viewingUser.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-navy-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                  {viewingUser.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{viewingUser.name}</span>
                  <Badge status={viewingUser.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewingUser.email} · {viewingUser.role.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {viewingUser.employeeId && (
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      ID: #{viewingUser.employeeId}
                    </span>
                  )}
                  {viewingUser.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {viewingUser.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Role-Specific Information */}
            {viewingUser.role === 'DRIVER' && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <Car className="w-4 h-4 text-amber-600" />
                  <span>Driver & Chauffeur Classification</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">License Number:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {viewingUser.licenseNumber || 'ET-DRV-COMMERCIAL-VALID'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Availability Status:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Available for Dispatch
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Assigned Classification:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      Standard / Executive Fleet
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Safety & Verification:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      Verified Corporate Chauffeur
                    </span>
                  </div>
                </div>
              </div>
            )}

            {viewingUser.role === 'EMPLOYEE' && (
              <div className="p-4 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-900 dark:text-brand-200">
                  <Briefcase className="w-4 h-4 text-brand-600" />
                  <span>Corporate Employee Profile</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Department:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {viewingUser.department?.name || 'Capital Real Estate'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Designation / Title:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {viewingUser.jobTitle || 'Department Staff'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Created: {formatEthiopianDateTime(viewingUser.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    handleOpenEdit(u);
                  }}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setViewingUser(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Staff Modal ── */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit Staff Profile: ${editingUser.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              id="editName"
              label="Full Legal Name"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={isSavingEdit}
            />

            <Input
              id="editPhone"
              label="Phone Number"
              placeholder="+251 91 123 4567"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              disabled={isSavingEdit}
            />

            <Input
              id="editJobTitle"
              label="Job Title / Professional Designation"
              placeholder="e.g. Senior Project Architect"
              value={editJobTitle}
              onChange={(e) => setEditJobTitle(e.target.value)}
              disabled={isSavingEdit}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Department
              </label>
              <select
                value={editDeptId}
                onChange={(e) => setEditDeptId(e.target.value)}
                disabled={isSavingEdit}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="">No Department Assigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {editingUser.role === 'DRIVER' && (
              <Input
                id="editLicense"
                label="Commercial Driver License Number"
                placeholder="e.g. ET-DRV-987410"
                value={editLicense}
                onChange={(e) => setEditLicense(e.target.value)}
                disabled={isSavingEdit}
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSavingEdit}
                isLoading={isSavingEdit}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Administrator Password Reset Modal ── */}
      {resetModalUser && (
        <Modal
          isOpen={!!resetModalUser}
          onClose={() => {
            setResetModalUser(null);
            setResetResult(null);
          }}
          title="Administrator Password Reset"
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Account Details Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target User Account
              </span>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {resetModalUser.name}
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {resetModalUser.email}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {resetModalUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {!resetResult ? (
              <>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold">Security Confirmation Notice</p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                      Initiating a reset will issue a cryptographically secure, single-use reset token and record this administrative action in the security audit log.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forcePasswordChange}
                      onChange={(e) => setForcePasswordChange(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Force Password Change on Next Sign In
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
                        The user will be required to establish a strong new password before receiving normal dashboard access.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetModalUser(null)}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAdminResetPassword}
                    isLoading={isResetting}
                    disabled={isResetting}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Generate Password Reset
                  </Button>
                </div>
              </>
            ) : (
              /* Success Result State */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 dark:text-emerald-200">
                    <p className="font-semibold">Password Reset Token Issued</p>
                    <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
                      {resetResult.message}
                    </p>
                    {resetResult.expiresAt && (
                      <p className="mt-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                        Expires: {formatEthiopianDateTime(resetResult.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>

                {resetResult.token && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Single-Use Reset Token:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={resetResult.token}
                        className="flex-1 font-mono text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white select-all focus:outline-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (resetResult.token) {
                            navigator.clipboard.writeText(resetResult.token);
                            setTokenCopied(true);
                            setTimeout(() => setTokenCopied(false), 2000);
                          }
                        }}
                      >
                        {tokenCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setResetModalUser(null);
                      setResetResult(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={() => fetchUsers()}
      />
    </div>
  );
};
