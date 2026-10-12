import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatEthiopianDateTime } from '@/lib/utils';
import { ShieldCheck, History, Clock } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Audit & Operations Log</h2>
        <p className="text-xs text-slate-500 mt-1">
          Immutable historical records of all vehicle assignments, status changes, and administrative actions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (EAT)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details / Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-sans">
                    {formatEthiopianDateTime(log.createdAt)}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-slate-900 block">
                      {log.actorName || 'System'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {log.entityType} ({log.entityId.slice(0, 8)}...)
                  </td>

                  <td className="py-3 px-4 text-[11px] text-slate-600 max-w-md truncate">
                    {log.newValues ? JSON.stringify(log.newValues) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
