import React, { useState } from 'react';
import { AuditLog, DashboardMetrics, Voucher } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Download,
  Filter,
  User,
  Store,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

interface Props {
  metrics: DashboardMetrics | null;
  logs: AuditLog[];
  vouchers: Voucher[];
  onRefresh: () => void;
}

export const AuditDashboard: React.FC<Props> = ({ metrics, logs, vouchers, onRefresh }) => {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');

  const filteredLogs = logs.filter(l => {
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesActor = actorFilter === 'all' || l.actor.includes(actorFilter);
    return matchesAction && matchesActor;
  });

  // Chart data for status distribution
  const statusData = [
    { name: 'Active', value: metrics?.totalActive || 0, color: '#10b981' },
    { name: 'Redeemed', value: metrics?.totalRedeemed || 0, color: '#3b82f6' },
    { name: 'Expired', value: metrics?.totalExpired || 0, color: '#f59e0b' },
    { name: 'Revoked', value: metrics?.totalRevoked || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Type breakdown
  const typeCountMap: Record<string, number> = {};
  vouchers.forEach(v => {
    const typeLabel = v.type.replace('_', ' ');
    typeCountMap[typeLabel] = (typeCountMap[typeLabel] || 0) + 1;
  });

  const typeData = Object.entries(typeCountMap).map(([name, count]) => ({
    name,
    count,
  }));

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Action', 'Status', 'Voucher Code', 'Actor / Cashier', 'Terminal', 'Details', 'IP'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.action,
      l.status,
      l.voucherCode,
      `"${l.actor.replace(/"/g, '""')}"`,
      l.terminalId || '',
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VoucherFlow_AuditLog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="audit-dashboard-section" className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Issued */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Issued</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{metrics?.totalIssued || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              ${(metrics?.totalIssuedValue || 0).toLocaleString()} Total Face Value
            </div>
          </div>
        </div>

        {/* Total Redeemed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Redeemed Single-Use</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">{metrics?.totalRedeemed || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              ${(metrics?.totalRedeemedValue || 0).toLocaleString()} Claimed Value ({metrics?.redemptionRate || 0}%)
            </div>
          </div>
        </div>

        {/* Active Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active & Outstanding</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600">{metrics?.totalActive || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ready for single-use redemption
            </div>
          </div>
        </div>

        {/* Blocked Collisions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Blocked Collisions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">{metrics?.collisionsBlocked || 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Duplicate redemptions prevented
            </div>
          </div>
        </div>

      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Status Distribution Pie */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Voucher Lifecycle Status Breakdown</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} vouchers`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No voucher data available</div>
            )}
          </div>
        </div>

        {/* Type Distribution Bar */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Voucher Volume by Program Type</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No voucher data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Security Audit Log Stream */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base text-slate-900">Immutable Audit Trail</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time chronological telemetry for every generation, validation, redemption, and blocked collision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              title="Refresh Audit Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={exportAuditCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'REDEEMED', label: 'Redemptions' },
            { id: 'REDEMPTION_COLLISION_BLOCKED', label: 'Blocked Collisions' },
            { id: 'VALIDATED', label: 'Validations' },
            { id: 'GENERATED', label: 'Generations' },
            { id: 'REVOKED', label: 'Revocations' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                actionFilter === f.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Log Entries List */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No audit logs found for the selected filter.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs hover:bg-slate-50/70 px-2 rounded-lg transition">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.action === 'REDEEMED' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'REDEMPTION_COLLISION_BLOCKED' ? 'bg-red-100 text-red-800 animate-pulse' :
                      log.action === 'VALIDATED' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'GENERATED' || log.action === 'BATCH_GENERATED' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>

                    <span className="font-mono font-bold text-slate-900">{log.voucherCode}</span>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-medium">
                    {log.details}
                  </p>
                </div>

                <div className="text-right sm:shrink-0 text-[11px] text-slate-400 space-y-0.5">
                  <div className="font-medium text-slate-600">{log.actor}</div>
                  <div>{new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}</div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
