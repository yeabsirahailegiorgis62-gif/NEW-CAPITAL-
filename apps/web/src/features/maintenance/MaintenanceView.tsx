import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { VehicleIssue, Vehicle, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  Car,
  ShieldAlert,
} from 'lucide-react';

interface MaintenanceViewProps {
  currentUser: User;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ currentUser }) => {
  const [issues, setIssues] = useState<VehicleIssue[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Report Modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [setMaintenanceStatus, setSetMaintenanceStatus] = useState(false);
  const [affectedBookingsWarning, setAffectedBookingsWarning] = useState<any[]>([]);

  // Resolve Modal state
  const [resolvingIssue, setResolvingIssue] = useState<VehicleIssue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchIssuesAndVehicles = async () => {
    try {
      setIsLoading(true);
      const [issuesData, vehiclesData] = await Promise.all([
        api.getIssues(),
        api.getVehicles(),
      ]);
      setIssues(issuesData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Failed to load maintenance records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuesAndVehicles();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !description.trim()) return;

    try {
      const res = await api.reportIssue({
        vehicleId: selectedVehicleId,
        description: description.trim(),
        severity,
        setMaintenanceStatus,
      });

      if (res.affectedBookings && res.affectedBookings.length > 0) {
        setAffectedBookingsWarning(res.affectedBookings);
      } else {
        setIsReportOpen(false);
        setDescription('');
        setSelectedVehicleId('');
      }

      await fetchIssuesAndVehicles();
    } catch (err) {
      console.error('Failed to submit issue', err);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    try {
      await api.updateIssue(resolvingIssue.id, {
        status: 'RESOLVED',
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      setResolvingIssue(null);
      setResolutionNotes('');
      await fetchIssuesAndVehicles();
    } catch (err) {
      console.error('Failed to resolve issue', err);
    }
  };

  const openIssues = issues.filter((i) => i.status !== 'RESOLVED');
  const resolvedIssues = issues.filter((i) => i.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vehicle Issues & Workshop Maintenance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track reported defects, manage maintenance downtime, and resolve vehicle readiness.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setIsReportOpen(true);
            setAffectedBookingsWarning([]);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Report Vehicle Issue
        </Button>
      </div>

      {/* Open Issues Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Active Issues Requiring Attention ({openIssues.length})
        </h3>

        {openIssues.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            No open vehicle issues! All fleet units are in good working order.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openIssues.map((issue) => (
              <Card key={issue.id} className="border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900">
                <CardHeader className="bg-amber-50/40 dark:bg-amber-950/30 pb-3 border-amber-100 dark:border-amber-900/40">
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        {issue.severity} Severity
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                        {issue.vehicle?.name} ({issue.vehicle?.registrationNumber})
                      </h4>
                    </div>
                    <Badge status={issue.status} size="sm" />
                  </div>
                </CardHeader>

                <CardContent className="pt-3 space-y-3">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{issue.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>Reported by: {issue.reportedBy?.name || 'Staff'}</span>
                    <span>{formatEthiopianDateTime(issue.reportedAt)}</span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResolvingIssue(issue)}
                    >
                      Resolve & Clear Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resolved History Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Resolved Issues History ({resolvedIssues.length})
        </h3>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {resolvedIssues.map((issue) => (
            <div key={issue.id} className="p-4 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {issue.vehicle?.name} ({issue.vehicle?.registrationNumber})
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Resolved: {formatEthiopianDateTime(issue.resolvedAt)}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{issue.description}</p>
              {issue.resolutionNotes && (
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Resolution Notes: {issue.resolutionNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Issue Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Report Vehicle Defect or Issue"
        description="Log an operational problem to assist logistics coordination and workshop repairs"
        maxWidth="md"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Vehicle
            </label>
            <select
              required
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select vehicle...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registrationNumber}) · {v.operationalStatus}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="LOW">LOW (Cosmetic / Non-critical)</option>
              <option value="MEDIUM">MEDIUM (Requires service soon)</option>
              <option value="HIGH">HIGH (Immediate attention needed)</option>
              <option value="CRITICAL">CRITICAL (Safety hazard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the vehicle issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={setMaintenanceStatus}
                onChange={(e) => setSetMaintenanceStatus(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-brand-600 border-slate-300 dark:border-slate-700 focus:ring-brand-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Immediately Place Vehicle Under MAINTENANCE
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Blocks new bookings and identifies upcoming conflicting assignments.
                </span>
              </div>
            </label>
          </div>

          {/* Warning banner if affected bookings exist */}
          {affectedBookingsWarning.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-xs space-y-2 text-red-900 dark:text-red-200">
              <div className="flex items-center gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                Warning: Upcoming Bookings Impacted!
              </div>
              <p className="text-[11px]">
                The following active bookings are assigned to this vehicle and require manual re-allocation:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                {affectedBookingsWarning.map((b) => (
                  <li key={b.id}>
                    <strong>#{b.bookingReference}</strong> ({b.destination}) by {b.requester?.name}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="w-full mt-2"
                onClick={() => setIsReportOpen(false)}
              >
                Acknowledge & Close
              </Button>
            </div>
          )}

          {affectedBookingsWarning.length === 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsReportOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Log Issue
              </Button>
            </div>
          )}
        </form>
      </Modal>

      {/* Resolve Issue Modal */}
      {resolvingIssue && (
        <Modal
          isOpen={!!resolvingIssue}
          onClose={() => setResolvingIssue(null)}
          title={`Resolve Issue: ${resolvingIssue.vehicle?.name}`}
          description={resolvingIssue.description}
          maxWidth="md"
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resolution & Repair Notes
              </label>
              <textarea
                rows={3}
                required
                placeholder="Detail the repairs made or inspection sign-off..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setResolvingIssue(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Confirm Resolved
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
