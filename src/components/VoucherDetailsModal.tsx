import React, { useState } from 'react';
import { Voucher } from '../types';
import { api } from '../services/api';
import { 
  X, 
  ShieldCheck, 
  User, 
  ShoppingBag, 
  Calendar, 
  Key, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  QrCode, 
  MapPin, 
  FileText,
  Trash2,
  ShieldAlert,
  Cpu,
  Fingerprint,
  Database
} from 'lucide-react';
import { VoucherPassModal } from './VoucherPassModal';
import { CodeVisualizer } from './CodeVisualizer';

interface Props {
  voucher: Voucher;
  onClose: () => void;
  onRefresh: () => void;
  onSelectForRedeem: (code: string) => void;
}

export const VoucherDetailsModal: React.FC<Props> = ({ voucher, onClose, onRefresh, onSelectForRedeem }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeReason, setRevokeReason] = useState('Admin voided voucher');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Manual deletion from Document Details');
  const [isDeleting, setIsDeleting] = useState(false);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const normStatus = (voucher.status || 'ACTIVE').toUpperCase();
  const vType = voucher.voucherType || voucher.type || 'fixed_amount';

  const handleManualRedeem = async () => {
    setIsRedeeming(true);
    setRedeemError(null);
    try {
      const res = await api.redeemVoucher({
        code: voucher.code,
        cashierName: 'Admin (Manual Override)',
        terminalId: 'ADM-CONSOLE-01',
        location: 'Admin Command Center',
        orderReference: `ADM-MAN-${Date.now().toString(36).toUpperCase()}`,
        notes: 'Manual redemption initiated by Administrator.',
      });
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        setRedeemError(res.error || 'Failed to manually redeem voucher');
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Redemption failed');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await api.revokeVoucher(voucher.id, revokeReason);
      onRefresh();
      onClose();
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to cancel voucher');
    } finally {
      setIsRevoking(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteVoucher(voucher.id, deleteReason);
      onRefresh();
      onClose();
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to permanently delete voucher');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Firestore Voucher Document</h3>
                <p className="text-[11px] text-slate-400 font-mono">Document ID: {voucher.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPassModal(true)}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-300" />
                <span>Digital Pass & QR</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            
            {/* Status & Code Hero */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Voucher Code</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-slate-900 tracking-wide">{voucher.code}</span>
                  <button
                    onClick={() => copyToClipboard(voucher.code, 'code')}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                  >
                    {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Status</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    normStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : normStatus === 'REDEEMED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : normStatus === 'EXPIRED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {normStatus}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Value</span>
                  <span className="font-mono text-lg font-black text-emerald-600">
                    {vType === 'percentage' ? `${voucher.value}% OFF` : `$${voucher.value.toFixed(2)} ${voucher.currency || 'USD'}`}
                  </span>
                </div>
              </div>
            </div>

            {/* QR & Barcode Section */}
            <CodeVisualizer code={voucher.code} showCodeText={false} />

            {/* Core Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Customer Info Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Customer & Purchase Attribution</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">customerReference:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={voucher.customerReference}>
                      {voucher.customerReference || voucher.customerName || 'General Customer'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">purchaseId:</span>
                    <span className="font-mono font-semibold text-slate-900">{voucher.purchaseId || voucher.orderId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">voucherType:</span>
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                      {vType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">createdBy:</span>
                    <span className="font-mono text-slate-700">{voucher.createdBy || 'system'}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Validity */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Validity & Timestamps</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">createdAt:</span>
                    <span className="font-medium text-slate-800">{new Date(voucher.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">expiresAt:</span>
                    <span className="font-medium text-slate-800">{new Date(voucher.expiresAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">minSpend:</span>
                    <span className="font-medium text-slate-800">{voucher.minSpend ? `$${voucher.minSpend}` : 'None'}</span>
                  </div>
                  {voucher.maxDiscount && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">maxDiscount:</span>
                      <span className="font-medium text-slate-800">${voucher.maxDiscount}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Notes & Description Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Document Notes (notes)</span>
              </div>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {voucher.notes || voucher.description || 'No document notes recorded.'}
              </p>
            </div>

            {/* Redemption History Record (if redeemed) */}
            {normStatus === 'REDEEMED' && (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2.5">
                <div className="font-bold text-blue-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Single-Use Redemption Record (redeemedAt & redeemedBy)</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-slate-700 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">redeemedAt:</span>
                    <span className="font-semibold text-slate-800">{voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">redeemedBy:</span>
                    <span className="font-semibold text-slate-800">
                      {typeof voucher.redeemedBy === 'object' && voucher.redeemedBy?.cashierName 
                        ? voucher.redeemedBy.cashierName 
                        : (typeof voucher.redeemedBy === 'string' ? voucher.redeemedBy : 'Cashier')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">receiptReference:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {typeof voucher.redeemedBy === 'object' ? voucher.redeemedBy?.orderReference || 'N/A' : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Device & Location Information */}
                <div className="mt-2 pt-2 border-t border-blue-100">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>Redemption Location & Device Information (redemptionLocation)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-blue-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Terminal ID:</span>
                      <span className="font-semibold text-slate-800">
                        {typeof voucher.redemptionLocation === 'object' ? voucher.redemptionLocation?.terminalId || 'POS-01' : (typeof voucher.redeemedBy === 'object' ? voucher.redeemedBy?.terminalId : 'POS-01')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Branch / Location:</span>
                      <span className="font-semibold text-slate-800">
                        {typeof voucher.redemptionLocation === 'object' ? voucher.redemptionLocation?.location || 'Store Main Floor' : (typeof voucher.redeemedBy === 'object' ? voucher.redeemedBy?.location : 'Main Floor')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Device IP / Agent:</span>
                      <span className="font-mono text-[10px] text-slate-600 truncate block">
                        {typeof voucher.redemptionLocation === 'object' ? voucher.redemptionLocation?.deviceIp || '127.0.0.1' : 'Local Terminal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cryptographic Integrity Details */}
            <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  SHA-256 HMAC Cryptographic Integrity Signature (hash)
                </span>
                <span className="font-mono text-[10px] text-slate-400">Lock Version: v{voucher.version || 1}</span>
              </div>
              <div className="font-mono text-[10px] text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-200">
                {voucher.hash}
              </div>
            </div>

            {redeemError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{redeemError}</span>
              </div>
            )}

            {/* Revoke / Cancel Form if initiated */}
            {showRevokeConfirm && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-fadeIn">
                <div className="font-bold text-amber-900 text-xs">Confirm Voucher Status Cancellation (Void)</div>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Reason for cancelling voucher"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleRevoke}
                    disabled={isRevoking}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    {isRevoking ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                  <button
                    onClick={() => setShowRevokeConfirm(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Permanent Delete Form if initiated */}
            {showDeleteConfirm && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-fadeIn">
                <div className="font-bold text-red-900 text-xs">Permanently Delete from Firestore & Ledger</div>
                <p className="text-[11px] text-red-700">
                  This document will be permanently purged from the database and cannot be recovered.
                </p>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Audit reason for deletion"
                  className="w-full px-3 py-1.5 bg-white border border-red-300 rounded-lg text-xs"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handlePermanentDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {normStatus === 'ACTIVE' && !showRevokeConfirm && !showDeleteConfirm && (
                <button
                  onClick={() => { setShowRevokeConfirm(true); setShowDeleteConfirm(false); }}
                  className="px-3 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-100/60 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Cancel Voucher</span>
                </button>
              )}

              {!showDeleteConfirm && !showRevokeConfirm && (
                <button
                  onClick={() => { setShowDeleteConfirm(true); setShowRevokeConfirm(false); }}
                  className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Document</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {normStatus === 'ACTIVE' && (
                <button
                  id="admin-manual-redeem-btn"
                  onClick={handleManualRedeem}
                  disabled={isRedeeming}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRedeeming ? 'Redeeming...' : 'Manually Redeem Voucher'}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>

        </div>
      </div>

      {showPassModal && (
        <VoucherPassModal
          voucher={voucher}
          onClose={() => setShowPassModal(false)}
        />
      )}
    </>
  );
};
