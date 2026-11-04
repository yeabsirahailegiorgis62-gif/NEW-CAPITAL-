import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Search, Filter, ShieldCheck, Download, Eye, X, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');
  const [activeLogModal, setActiveLogModal] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.action) set.add(log.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueEntityTypes = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.entityType) set.add(log.entityType);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedActionFilter !== 'ALL' && log.action !== selectedActionFilter) {
        return false;
      }
      if (selectedEntityType !== 'ALL' && log.entityType !== selectedEntityType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actor = (log.actorName || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const entity = (log.entityType || '').toLowerCase();
        const entityId = (log.entityId || '').toLowerCase();
        const payload = log.newValues ? JSON.stringify(log.newValues).toLowerCase() : '';
        if (
          !actor.includes(q) &&
          !action.includes(q) &&
          !entity.includes(q) &&
          !entityId.includes(q) &&
          !payload.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedActionFilter, selectedEntityType, searchQuery]);

  // Safe CSV export with formula injection sanitization
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const sanitizeCell = (val: string) => {
      let clean = (val ?? '').replace(/"/g, '""');
      if (/^[=\+\-@\t\r]/.test(clean)) {
        clean = "'" + clean;
      }
      return `"${clean}"`;
    };

    const headers = ['Timestamp_EAT', 'Action', 'Actor', 'EntityType', 'EntityID', 'Payload'];
    const rows = filteredLogs.map((log) => [
      sanitizeCell(formatEthiopianDateTime(log.createdAt)),
      sanitizeCell(log.action),
      sanitizeCell(log.actorName || 'System Service'),
      sanitizeCell(log.entityType),
      sanitizeCell(log.entityId),
      sanitizeCell(log.newValues ? JSON.stringify(log.newValues) : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `capital_fleet_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('APPROVE') || action.includes('COMPLETE')) {
      return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
    }
    if (action.includes('REJECT') || action.includes('CANCEL')) {
      return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';
    }
    if (action.includes('ASSIGN')) {
      return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
    }
    if (action.includes('START') || action.includes('TRIP')) {
      return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
    }
    return 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Audit & Operations Log</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative, append-only security journal of vehicle assignments, approvals, cancellations, and administrative events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV ({filteredLogs.length})
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor name, action, booking ref, or payload..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="ALL">All Entities</option>
            {uniqueEntityTypes.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Record Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-white">{filteredLogs.length}</strong> of{' '}
          {logs.length} audit event{logs.length === 1 ? '' : 's'}
        </span>
        {(searchQuery || selectedActionFilter !== 'ALL' || selectedEntityType !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedActionFilter('ALL');
              setSelectedEntityType('ALL');
            }}
            className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 whitespace-nowrap">Timestamp (EAT)</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Details / Payload</th>
                <th className="py-3.5 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans text-sm">
                    {isLoading
                      ? 'Loading system audit trail...'
                      : logs.length === 0
                      ? 'No audit events recorded yet.'
                      : 'No audit records match the selected filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-sans text-xs">
                      {formatEthiopianDateTime(log.createdAt)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded border text-[11px] ${getActionBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                        {log.actorName || 'System Service'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-sans">
                        {log.entityType}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">({log.entityId.slice(0, 8)}...)</span>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-slate-400 max-w-xs sm:max-w-md truncate">
                      {log.newValues ? JSON.stringify(log.newValues) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActiveLogModal(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Full Audit Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setActiveLogModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Action</span>
                  <span className={`inline-block mt-1 font-bold px-2 py-0.5 rounded border text-xs ${getActionBadgeStyle(activeLogModal.action)}`}>
                    {activeLogModal.action}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Timestamp (EAT)</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block mt-1">
                    {formatEthiopianDateTime(activeLogModal.createdAt)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Actor</span>
                  <span className="font-bold text-slate-900 dark:text-white block mt-1">
                    {activeLogModal.actorName || 'System Service'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Target Entity</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 block mt-1">
                    {activeLogModal.entityType} ({activeLogModal.entityId})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                  Payload / Recorded State
                </span>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-64 leading-relaxed">
                  {activeLogModal.newValues ? JSON.stringify(activeLogModal.newValues, null, 2) : 'No payload recorded.'}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <Button size="sm" onClick={() => setActiveLogModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
