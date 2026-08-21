import React, { useState } from 'react';
import { Voucher, VoucherType } from '../types';
import { api } from '../services/api';
import { VoucherPassModal } from './VoucherPassModal';
import { VoucherDetailsModal } from './VoucherDetailsModal';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ShieldAlert,
  ArrowUpDown,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  QrCode,
  ListOrdered,
  History,
  Tag,
  User,
  ShieldCheck,
  Database,
  CheckSquare,
  Square,
  Layers,
  AlertTriangle,
  Flame,
  CheckCheck
} from 'lucide-react';

interface Props {
  vouchers: Voucher[];
  onRefresh: () => void;
  onSelectForRedeem: (code: string) => void;
}

const getNormStatus = (status?: string): 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED' => {
  if (!status) return 'ACTIVE';
  const upper = status.toUpperCase().trim();
  if (upper === 'REDEEMED') return 'REDEEMED';
  if (upper === 'EXPIRED') return 'EXPIRED';
  if (upper === 'CANCELLED' || upper === 'REVOKED') return 'CANCELLED';
  return 'ACTIVE';
};

type BatchDeleteMode = 'redeemed' | 'expired' | 'cancelled' | 'inactive_all' | 'filtered' | 'selected' | 'single';

export const VoucherRegistry: React.FC<Props> = ({ vouchers, onRefresh, onSelectForRedeem }) => {
  const [activeView, setActiveView] = useState<'all' | 'redemption_history'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & action states
  const [selectedVoucherForPass, setSelectedVoucherForPass] = useState<Voucher | null>(null);
  const [selectedVoucherForDetails, setSelectedVoucherForDetails] = useState<Voucher | null>(null);
  
  // Single voucher revoke
  const [voucherToRevoke, setVoucherToRevoke] = useState<Voucher | null>(null);
  const [revocationReason, setRevocationReason] = useState('Customer requested cancellation');
  const [isRevoking, setIsRevoking] = useState(false);

  // Delete modal state
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<BatchDeleteMode>('redeemed');
  const [singleVoucherToDelete, setSingleVoucherToDelete] = useState<Voucher | null>(null);
  const [deleteReason, setDeleteReason] = useState('Registry cleanup and database maintenance');
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Status counts (normalized to ACTIVE, REDEEMED, EXPIRED, CANCELLED)
  const activeCount = vouchers.filter(v => getNormStatus(v.status) === 'ACTIVE').length;
  const redeemedCount = vouchers.filter(v => getNormStatus(v.status) === 'REDEEMED').length;
  const expiredCount = vouchers.filter(v => getNormStatus(v.status) === 'EXPIRED').length;
  const cancelledCount = vouchers.filter(v => getNormStatus(v.status) === 'CANCELLED').length;
  const inactiveCount = redeemedCount + expiredCount + cancelledCount;

  // Filter logic
  const filteredVouchers = vouchers.filter((v) => {
    const vStatus = getNormStatus(v.status);
    const vType = v.voucherType || v.type || 'fixed_amount';

    if (activeView === 'redemption_history' && vStatus !== 'REDEEMED') {
      return false;
    }

    const matchesStatus = statusFilter === 'all' || vStatus === statusFilter.toUpperCase();
    const matchesType = typeFilter === 'all' || vType === typeFilter;
    const query = searchTerm.toLowerCase().trim();
    
    const cashierName = typeof v.redeemedBy === 'object' ? v.redeemedBy?.cashierName : (typeof v.redeemedBy === 'string' ? v.redeemedBy : '');
    const terminalId = typeof v.redemptionLocation === 'object' ? v.redemptionLocation?.terminalId : (typeof v.redeemedBy === 'object' ? v.redeemedBy?.terminalId : '');

    const matchesSearch = !query || 
      v.code.toLowerCase().includes(query) ||
      (v.title && v.title.toLowerCase().includes(query)) ||
      (v.customerReference && v.customerReference.toLowerCase().includes(query)) ||
      (v.customerName && v.customerName.toLowerCase().includes(query)) ||
      (v.customerEmail && v.customerEmail.toLowerCase().includes(query)) ||
      (v.purchaseId && v.purchaseId.toLowerCase().includes(query)) ||
      (v.orderId && v.orderId.toLowerCase().includes(query)) ||
      (cashierName && cashierName.toLowerCase().includes(query)) ||
      (terminalId && terminalId.toLowerCase().includes(query));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Calculate items targeted by current deleteMode
  const getTargetVouchersForDelete = (mode: BatchDeleteMode): Voucher[] => {
    if (mode === 'single') {
      return singleVoucherToDelete ? [singleVoucherToDelete] : [];
    }
    if (mode === 'selected') {
      return vouchers.filter(v => selectedIds.has(v.id));
    }
    if (mode === 'redeemed') {
      return vouchers.filter(v => getNormStatus(v.status) === 'REDEEMED');
    }
    if (mode === 'expired') {
      return vouchers.filter(v => getNormStatus(v.status) === 'EXPIRED');
    }
    if (mode === 'cancelled') {
      return vouchers.filter(v => getNormStatus(v.status) === 'CANCELLED');
    }
    if (mode === 'inactive_all') {
      return vouchers.filter(v => {
        const st = getNormStatus(v.status);
        return st === 'REDEEMED' || st === 'EXPIRED' || st === 'CANCELLED';
      });
    }
    if (mode === 'filtered') {
      return filteredVouchers;
    }
    return [];
  };

  const targetVouchers = getTargetVouchersForDelete(deleteMode);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredVouchers.length && filteredVouchers.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredVouchers.map(v => v.id));
      setSelectedIds(allIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleRevokeConfirm = async () => {
    if (!voucherToRevoke) return;
    setIsRevoking(true);

    try {
      await api.revokeVoucher(voucherToRevoke.id, revocationReason);
      setVoucherToRevoke(null);
      showNotification(`Voucher ${voucherToRevoke.code} status updated to CANCELLED.`);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel voucher');
    } finally {
      setIsRevoking(false);
    }
  };

  // Trigger single item deletion
  const handlePromptSingleDelete = (voucher: Voucher) => {
    setSingleVoucherToDelete(voucher);
    setDeleteMode('single');
    setDeleteReason(`Manual deletion of voucher ${voucher.code}`);
    setIsBatchDeleteModalOpen(true);
  };

  // Open batch delete modal with preset mode
  const handleOpenBatchDelete = (presetMode?: BatchDeleteMode) => {
    setSingleVoucherToDelete(null);
    if (presetMode) {
      setDeleteMode(presetMode);
    } else if (selectedIds.size > 0) {
      setDeleteMode('selected');
    } else if (statusFilter !== 'all') {
      if (statusFilter === 'REDEEMED') setDeleteMode('redeemed');
      else if (statusFilter === 'EXPIRED') setDeleteMode('expired');
      else if (statusFilter === 'CANCELLED') setDeleteMode('cancelled');
      else setDeleteMode('filtered');
    } else {
      setDeleteMode('redeemed');
    }
    setDeleteReason('Batch cleanup by filter');
    setIsBatchDeleteModalOpen(true);
  };

  // Execute deletion
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteMode === 'single' && singleVoucherToDelete) {
        await api.deleteVoucher(singleVoucherToDelete.id, deleteReason);
        showNotification(`Voucher ${singleVoucherToDelete.code} was permanently deleted.`);
      } else if (deleteMode === 'selected') {
        const ids = Array.from(selectedIds) as string[];
        const res = await api.batchDeleteVouchers({ ids, reason: deleteReason });
        setSelectedIds(new Set());
        showNotification(`Successfully deleted ${res.deletedCount} selected voucher(s) permanently.`);
      } else if (deleteMode === 'redeemed') {
        const res = await api.batchDeleteVouchers({ filter: { status: 'REDEEMED' }, reason: deleteReason });
        showNotification(`Successfully deleted ${res.deletedCount} REDEEMED voucher(s) permanently.`);
      } else if (deleteMode === 'expired') {
        const res = await api.batchDeleteVouchers({ filter: { status: 'EXPIRED' }, reason: deleteReason });
        showNotification(`Successfully deleted ${res.deletedCount} EXPIRED voucher(s) permanently.`);
      } else if (deleteMode === 'cancelled') {
        const res = await api.batchDeleteVouchers({ filter: { status: 'CANCELLED' }, reason: deleteReason });
        showNotification(`Successfully deleted ${res.deletedCount} CANCELLED voucher(s) permanently.`);
      } else if (deleteMode === 'inactive_all') {
        const res = await api.batchDeleteVouchers({ filter: { inactiveOnly: true }, reason: deleteReason });
        showNotification(`Successfully deleted ${res.deletedCount} inactive voucher(s) permanently.`);
      } else if (deleteMode === 'filtered') {
        const ids = filteredVouchers.map(v => v.id);
        const res = await api.batchDeleteVouchers({ ids, reason: deleteReason });
        showNotification(`Successfully deleted ${res.deletedCount} voucher(s) matching current filter.`);
      }

      setIsBatchDeleteModalOpen(false);
      setSingleVoucherToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to complete deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'id',
      'code',
      'status',
      'purchaseId',
      'customerReference',
      'voucherType',
      'value',
      'currency',
      'createdAt',
      'expiresAt',
      'redeemedAt',
      'redeemedBy',
      'createdBy',
      'redemptionLocation',
      'notes',
      'hash'
    ];

    const rows = filteredVouchers.map(v => {
      const vStatus = getNormStatus(v.status);
      const vType = v.voucherType || v.type || 'fixed_amount';
      const cashierStr = typeof v.redeemedBy === 'object' && v.redeemedBy ? JSON.stringify(v.redeemedBy) : (v.redeemedBy || '');
      const locStr = typeof v.redemptionLocation === 'object' && v.redemptionLocation ? JSON.stringify(v.redemptionLocation) : (v.redemptionLocation || '');

      return [
        v.id,
        v.code,
        vStatus,
        v.purchaseId || v.orderId || '',
        `"${(v.customerReference || v.customerName || '').replace(/"/g, '""')}"`,
        vType,
        v.value,
        v.currency || 'USD',
        v.createdAt,
        v.expiresAt,
        v.redeemedAt || '',
        `"${String(cashierStr).replace(/"/g, '""')}"`,
        v.createdBy || 'admin',
        `"${String(locStr).replace(/"/g, '""')}"`,
        `"${(v.notes || v.description || '').replace(/"/g, '""')}"`,
        v.hash || ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `firestore_vouchers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredVouchers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `firestore_vouchers_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isAllVisibleSelected = filteredVouchers.length > 0 && selectedIds.size === filteredVouchers.length;

  return (
    <div className="space-y-6">
      
      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-white/70 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Header & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Firestore Voucher Document Registry</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Cloud Firestore</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live ledger of vouchers with multi-criteria filtering, single and batch deletion, and cryptographic audit records.
            </p>
          </div>

          {/* Export, Refresh & Bulk Delete buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Bulk Delete Button */}
            <button
              id="bulk-delete-by-filter-btn"
              onClick={() => handleOpenBatchDelete()}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition cursor-pointer shadow-2xs"
              title="Delete multiple entries by status filter or selection"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete by Filter / Selection</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
              title="Refresh vouchers"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={exportJSON}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Main Ledger vs. Dedicated Redemption History */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => { setActiveView('all'); setStatusFilter('all'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Master Registry ({vouchers.length})</span>
          </button>

          <button
            id="tab-redemption-history-btn"
            onClick={() => { setActiveView('redemption_history'); setStatusFilter('all'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeView === 'redemption_history'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Redemption History ({redeemedCount})</span>
          </button>
        </div>

        {/* Status Quick Filter Chips */}
        {activeView === 'all' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Statuses ({vouchers.length})
            </button>
            <button
              id="filter-active-vouchers-btn"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                statusFilter.toUpperCase() === 'ACTIVE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>ACTIVE ({activeCount})</span>
            </button>
            <button
              id="filter-redeemed-vouchers-btn"
              onClick={() => setStatusFilter('REDEEMED')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                statusFilter.toUpperCase() === 'REDEEMED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>REDEEMED ({redeemedCount})</span>
            </button>
            <button
              id="filter-expired-vouchers-btn"
              onClick={() => setStatusFilter('EXPIRED')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                statusFilter.toUpperCase() === 'EXPIRED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>EXPIRED ({expiredCount})</span>
            </button>
            <button
              id="filter-cancelled-vouchers-btn"
              onClick={() => setStatusFilter('CANCELLED')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                statusFilter.toUpperCase() === 'CANCELLED'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>CANCELLED ({cancelledCount})</span>
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          
          {/* Search Box */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              id="registry-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search code, title, customer reference, order ID, cashier, terminal..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-4">
            <select
              id="registry-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Voucher Types</option>
              <option value="fixed_amount">Fixed Amount ($)</option>
              <option value="percentage">Percentage (%)</option>
              <option value="gift_card">Store Gift Card</option>
              <option value="free_item">Free Item / Pass</option>
            </select>
          </div>

        </div>

      </div>

      {/* Floating / Sticky Batch Action Bar when items are selected */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">
              voucher{selectedIds.size > 1 ? 's' : ''} selected in registry
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Deselect All
            </button>
            <button
              id="delete-selected-batch-btn"
              onClick={() => handleOpenBatchDelete('selected')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                {/* Checkbox column */}
                <th className="px-3.5 py-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={isAllVisibleSelected ? 'Deselect all' : 'Select all visible'}
                  >
                    {isAllVisibleSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">code</th>
                <th className="px-4 py-3.5">Title & voucherType</th>
                <th className="px-4 py-3.5">value</th>
                <th className="px-4 py-3.5">customerReference & purchaseId</th>
                {activeView === 'redemption_history' ? (
                  <>
                    <th className="px-4 py-3.5">redeemedAt</th>
                    <th className="px-4 py-3.5">redeemedBy & Location</th>
                    <th className="px-4 py-3.5">Receipt Ref</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3.5">expiresAt</th>
                    <th className="px-4 py-3.5">status</th>
                  </>
                )}
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    No vouchers found matching the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const vStatus = getNormStatus(v.status);
                  const vType = v.voucherType || v.type || 'fixed_amount';
                  const cashier = typeof v.redeemedBy === 'object' ? v.redeemedBy?.cashierName : (typeof v.redeemedBy === 'string' ? v.redeemedBy : 'Cashier');
                  const termId = typeof v.redemptionLocation === 'object' ? v.redemptionLocation?.terminalId : (typeof v.redeemedBy === 'object' ? v.redeemedBy?.terminalId : 'POS');
                  const locName = typeof v.redemptionLocation === 'object' ? v.redemptionLocation?.location : (typeof v.redeemedBy === 'object' ? v.redeemedBy?.location : '');
                  const isSelected = selectedIds.has(v.id);

                  return (
                    <tr 
                      key={v.id} 
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      
                      {/* Checkbox */}
                      <td className="px-3.5 py-4 text-center">
                        <button
                          onClick={() => handleToggleSelect(v.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Code & Quick Copy */}
                      <td className="px-4 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-900 border border-slate-200 font-bold">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedCode === v.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Title & Type */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 max-w-xs truncate">{v.title || `${v.value} ${v.currency || 'USD'} Voucher`}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
                          {vType.replace('_', ' ')}
                        </div>
                      </td>

                      {/* Value */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 font-mono text-sm">
                          {vType === 'percentage' ? `${v.value}% OFF` : `$${v.value.toFixed(2)}`}
                        </div>
                        {v.minSpend ? (
                          <div className="text-[10px] text-slate-400">Min. ${v.minSpend}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400">No min spend</div>
                        )}
                      </td>

                      {/* Customer / Order */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-semibold text-slate-800 truncate max-w-[180px]" title={v.customerReference}>
                            {v.customerReference || v.customerName || 'General Customer'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {v.purchaseId || v.orderId || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Columns for Redemption History view vs Regular view */}
                      {activeView === 'redemption_history' ? (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-[11px] text-slate-800 font-medium">
                            {v.redeemedAt ? new Date(v.redeemedAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{cashier}</div>
                            <div className="text-[10px] text-slate-400">{termId}{locName ? ` • ${locName}` : ''}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-slate-700">
                            {typeof v.redeemedBy === 'object' ? v.redeemedBy?.orderReference || 'N/A' : 'N/A'}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Expiry */}
                          <td className="px-4 py-4 whitespace-nowrap text-[11px] text-slate-600">
                            <div className="font-semibold text-slate-800">{new Date(v.expiresAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Issued: {new Date(v.createdAt).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {vStatus === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                ACTIVE
                              </span>
                            )}
                            {vStatus === 'REDEEMED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                REDEEMED
                              </span>
                            )}
                            {vStatus === 'EXPIRED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                EXPIRED
                              </span>
                            )}
                            {vStatus === 'CANCELLED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full border border-red-200">
                                <XCircle className="w-3 h-3 text-red-600" />
                                CANCELLED
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* QR Pass */}
                          <button
                            onClick={() => setSelectedVoucherForPass(v)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="View Customer QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Full Details Modal */}
                          <button
                            onClick={() => setSelectedVoucherForDetails(v)}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="View Full Firestore Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* POS Redeem Shortcut */}
                          {vStatus === 'ACTIVE' && (
                            <button
                              onClick={() => onSelectForRedeem(v.code)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="Redeem on POS Terminal"
                            >
                              <span>Redeem</span>
                            </button>
                          )}

                          {/* Cancel / Void Action (Active only) */}
                          {vStatus === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setVoucherToRevoke(v);
                                setRevocationReason('Customer requested cancellation');
                              }}
                              className="px-2 py-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="Cancel / Void this Voucher"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden xl:inline">Cancel</span>
                            </button>
                          )}

                          {/* Permanent Delete Action */}
                          <button
                            onClick={() => handlePromptSingleDelete(v)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Permanently Delete Voucher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800 font-semibold">{filteredVouchers.length}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{vouchers.length}</strong> total Firestore documents
            {selectedIds.size > 0 && (
              <span className="ml-2 font-semibold text-emerald-700">({selectedIds.size} selected)</span>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Collection: <span className="text-emerald-700 font-semibold">/vouchers</span> • Firestore v9 SDK
          </div>
        </div>

      </div>

      {/* Digital Pass Modal */}
      {selectedVoucherForPass && (
        <VoucherPassModal
          voucher={selectedVoucherForPass}
          onClose={() => setSelectedVoucherForPass(null)}
        />
      )}

      {/* Full Details Modal */}
      {selectedVoucherForDetails && (
        <VoucherDetailsModal
          voucher={selectedVoucherForDetails}
          onClose={() => setSelectedVoucherForDetails(null)}
          onRefresh={onRefresh}
          onSelectForRedeem={onSelectForRedeem}
        />
      )}

      {/* Revocation Confirmation Dialog */}
      {voucherToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cancel / Void Voucher</h3>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel voucher <span className="font-mono font-bold text-slate-900">{voucherToRevoke.code}</span>? Once cancelled, its status becomes <strong className="text-red-700">CANCELLED</strong> and single-use redemption will be blocked.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Cancellation Reason</label>
              <input
                type="text"
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                placeholder="Reason for cancellation (e.g. refund issued)"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVoucherToRevoke(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                id="confirm-revoke-btn"
                onClick={handleRevokeConfirm}
                disabled={isRevoking}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isRevoking ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH / FILTER DELETE DIALOG */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {deleteMode === 'single' ? 'Permanently Delete Voucher' : 'Delete Vouchers by Filter'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Purge records from Cloud Firestore ledger and audit logs
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Mode Selector (if not single item delete) */}
            {deleteMode !== 'single' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Select Filter Criteria to Delete:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  
                  {/* Redeemed */}
                  <button
                    type="button"
                    onClick={() => setDeleteMode('redeemed')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      deleteMode === 'redeemed'
                        ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>REDEEMED Vouchers</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {redeemedCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Already used at POS / Store</span>
                  </button>

                  {/* Expired */}
                  <button
                    type="button"
                    onClick={() => setDeleteMode('expired')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      deleteMode === 'expired'
                        ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>EXPIRED Vouchers</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {expiredCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Past validity expiration date</span>
                  </button>

                  {/* Cancelled */}
                  <button
                    type="button"
                    onClick={() => setDeleteMode('cancelled')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      deleteMode === 'cancelled'
                        ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>CANCELLED Vouchers</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {cancelledCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Revoked or voided orders</span>
                  </button>

                  {/* All Inactive */}
                  <button
                    type="button"
                    onClick={() => setDeleteMode('inactive_all')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      deleteMode === 'inactive_all'
                        ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        <span>All Inactive Records</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {inactiveCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">Redeemed + Expired + Cancelled</span>
                  </button>

                  {/* Selected items */}
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setDeleteMode('selected')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between sm:col-span-2 ${
                        deleteMode === 'selected'
                          ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Checked / Selected Rows</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 font-bold text-emerald-800">
                          {selectedIds.size} selected
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">Delete only the items currently checked in the table</span>
                    </button>
                  )}

                  {/* Current Active Filter Results */}
                  <button
                    type="button"
                    onClick={() => setDeleteMode('filtered')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between sm:col-span-2 ${
                      deleteMode === 'filtered'
                        ? 'border-red-500 bg-red-50/70 text-red-950 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Current Search & Filter View</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {filteredVouchers.length} matches
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      Status: {statusFilter.toUpperCase()}, Type: {typeFilter}, Search: "{searchTerm || 'all'}"
                    </span>
                  </button>

                </div>
              </div>
            )}

            {/* Target Breakdown & Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  Permanent Deletion Impact: {targetVouchers.length} voucher{targetVouchers.length === 1 ? '' : 's'} will be deleted
                </span>
              </div>
              <p className="text-[11px] text-red-700 leading-relaxed">
                This action permanently deletes {targetVouchers.length} record{targetVouchers.length === 1 ? '' : 's'} from the Firestore <code className="font-mono text-xs bg-red-100 px-1 rounded">/vouchers</code> database collection. This operation cannot be undone.
              </p>
              
              {targetVouchers.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {targetVouchers.slice(0, 10).map(v => (
                    <span key={v.id} className="text-[10px] font-mono bg-white/80 border border-red-200 text-red-900 px-2 py-0.5 rounded font-bold">
                      {v.code}
                    </span>
                  ))}
                  {targetVouchers.length > 10 && (
                    <span className="text-[10px] font-mono bg-white/80 border border-red-200 text-red-900 px-2 py-0.5 rounded font-bold">
                      +{targetVouchers.length - 10} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Audit Reason Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Audit Trail Reason</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Audit log reason (e.g. Purge expired test records)"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setIsBatchDeleteModalOpen(false); setSingleVoucherToDelete(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                id="execute-batch-delete-btn"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || targetVouchers.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeleting
                    ? 'Deleting...'
                    : `Permanently Delete (${targetVouchers.length})`}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
