import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Department } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  Building,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  RotateCw,
  Layers,
} from 'lucide-react';

export const DepartmentsManagementView: React.FC = () => {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      toast.error('Failed to load departments', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormIsActive(true);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code || '');
    setFormDescription(dept.description || '');
    setFormIsActive(dept.isActive !== false);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Department name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          name: formName.trim(),
          code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success('Department updated', `Changes saved for ${formName}.`);
        setEditingDept(null);
      } else {
        await api.createDepartment({
          name: formName.trim(),
          code: formCode.trim() ? formCode.trim().toUpperCase() : undefined,
          description: formDescription.trim() || undefined,
        });
        toast.success('Department created', `Department ${formName} added successfully.`);
        setIsCreateModalOpen(false);
      }
      await fetchDepartments();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (dept: Department) => {
    try {
      const nextStatus = dept.isActive === false;
      await api.updateDepartment(dept.id, { isActive: nextStatus });
      toast.info(
        `Department ${nextStatus ? 'Activated' : 'Deactivated'}`,
        `${dept.name} is now ${nextStatus ? 'active' : 'inactive'}.`
      );
      await fetchDepartments();
    } catch (err: any) {
      toast.error('Failed to update status', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    try {
      setIsSubmitting(true);
      await api.deleteDepartment(deletingDept.id);
      toast.success('Department removed', `${deletingDept.name} has been deleted.`);
      setDeletingDept(null);
      await fetchDepartments();
    } catch (err: any) {
      toast.error('Cannot Delete Department', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepartments = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Corporate Department Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure organizational divisions, department codes, requisition quotas, and staff assignment policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDepartments}
            className="text-xs"
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="bg-brand-600 hover:bg-brand-500 text-xs shadow-md shadow-brand-600/30 font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Department
          </Button>
        </div>
      </div>

      {/* Search and Table */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by department name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80"
            />
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredDepartments.length} of {departments.length} Departments
          </span>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Active Staff</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      No departments match your query.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => {
                    const isActive = dept.isActive !== false;
                    const staffCount = dept._count?.users || 0;

                    return (
                      <tr
                        key={dept.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {dept.code || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {dept.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {dept.description || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Users className="w-3 h-3 text-slate-400" />
                            {staffCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-slate-400" />
                                Deactivated
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(dept)}
                            className="text-xs"
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(dept)}
                            className="text-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingDept(dept)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Create or Edit Department */}
      {(isCreateModalOpen || editingDept) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingDept(null);
          }}
          title={editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
          description="Define the corporate organizational entity and transport allocation quota."
        >
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800">
                {formError}
              </div>
            )}

            <div>
              <Input
                label="Department Name"
                placeholder="e.g. Legal Affairs & Compliance"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Department Code (Optional)"
                placeholder="e.g. LEG-09"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              />
              <span className="text-[10px] text-slate-400 font-mono">
                Unique identifier used on transport requisition passes.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description & Scope
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                placeholder="Operational purpose and trip itinerary expectations..."
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-brand-500"
              />
            </div>

            {editingDept && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Department is currently Active
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingDept(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                className="bg-brand-600 hover:bg-brand-500"
              >
                {editingDept ? 'Save Changes' : 'Create Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete Confirmation with Safe Deletion Protection */}
      {deletingDept && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingDept(null)}
          title="Delete Department"
          description={`Are you sure you want to delete ${deletingDept.name}?`}
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Accidental Data Loss Protection</p>
                <p className="mt-1">
                  If this department currently has active staff members, the database constraint will automatically protect it and prevent deletion. If you only wish to temporarily suspend new bookings, consider <strong>Deactivating</strong> it instead.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDeletingDept(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isSubmitting}
                className="bg-red-600 hover:bg-red-500"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
