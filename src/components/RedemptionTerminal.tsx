import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Voucher, ValidationResult } from '../types';
import { CodeVisualizer } from './CodeVisualizer';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Printer,
  ShoppingBag,
  ArrowRight,
  User,
  Store,
  CreditCard,
  Hash,
  AlertCircle
} from 'lucide-react';

interface Props {
  initialCode?: string;
  onRedemptionSuccess?: () => void;
}

export const RedemptionTerminal: React.FC<Props> = ({ initialCode = '', onRedemptionSuccess }) => {
  const [code, setCode] = useState(initialCode);
  const [cartSubtotal, setCartSubtotal] = useState<string>('120.00');
  
  // Terminal Operator Settings
  const [cashierName, setCashierName] = useState('Alex Rivera');
  const [terminalId, setTerminalId] = useState('POS-TERM-01');
  const [location, setLocation] = useState('Downtown Flagship Store');
  const [orderReference, setOrderReference] = useState('');
  const [notes, setNotes] = useState('');

  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  // Redemption State
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<Voucher | null>(null);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);
  const [lastTransactionReceipt, setLastTransactionReceipt] = useState<any | null>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleValidate(initialCode);
    }
  }, [initialCode]);

  const handleValidate = async (targetCode?: string) => {
    const codeToTest = targetCode || code;
    if (!codeToTest.trim()) return;

    setIsValidating(true);
    setRedemptionError(null);
    setRedeemedVoucher(null);

    try {
      const subtotalNum = cartSubtotal ? parseFloat(cartSubtotal) : undefined;
      const res = await api.validateVoucher(codeToTest, subtotalNum);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        statusCode: 'NOT_FOUND',
        message: err.message || 'Failed to validate voucher',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) return;

    setIsRedeeming(true);
    setRedemptionError(null);

    try {
      const generatedReceipt = orderReference.trim() || `RCPT-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await api.redeemVoucher({
        code: code.trim(),
        cashierName,
        terminalId,
        location,
        orderReference: generatedReceipt,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.voucher) {
        setRedeemedVoucher(res.voucher);
        setValidationResult(null);
        setLastTransactionReceipt({
          voucher: res.voucher,
          receiptNumber: generatedReceipt,
          timestamp: new Date().toISOString(),
          cashierName,
          terminalId,
          location,
          discountApplied: validationResult?.discountCalculated ?? res.voucher.value,
          cartSubtotal: cartSubtotal ? parseFloat(cartSubtotal) : 0,
        });

        // Trigger confetti
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.65 },
            colors: ['#10b981', '#3b82f6', '#6366f1']
          });
        } catch (e) {}

        if (onRedemptionSuccess) {
          onRedemptionSuccess();
        }
      } else {
        setRedemptionError(res.error || 'Redemption was rejected');
        // Refresh validation to show latest status
        handleValidate(code);
      }
    } catch (err: any) {
      setRedemptionError(err.message || 'An unexpected error occurred during redemption');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setValidationResult(null);
    setRedeemedVoucher(null);
    setRedemptionError(null);
    setLastTransactionReceipt(null);
    setOrderReference('');
  };

  // Quick Preset helper
  const loadPreset = (presetCode: string) => {
    setCode(presetCode);
    handleValidate(presetCode);
  };

  // Discount Calculation Math
  const subtotal = parseFloat(cartSubtotal) || 0;
  let calculatedDiscount = 0;
  let finalTotal = subtotal;

  if (validationResult?.voucher && validationResult.valid) {
    const v = validationResult.voucher;
    if (v.type === 'percentage') {
      calculatedDiscount = (subtotal * v.value) / 100;
      if (v.maxDiscount && calculatedDiscount > v.maxDiscount) {
        calculatedDiscount = v.maxDiscount;
      }
    } else if (v.type === 'gift_card' || v.type === 'fixed_amount') {
      calculatedDiscount = Math.min(v.value, subtotal);
    }
    finalTotal = Math.max(0, subtotal - calculatedDiscount);
  }

  return (
    <div id="redemption-terminal-section" className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Atomic Single-Use POS Terminal
          </div>
          <h2 className="text-xl font-bold text-slate-900">Voucher Validation & Single-Use Redemption</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Validate voucher integrity, calculate order discounts, and atomically redeem passes to prevent double spending.
          </p>
        </div>

        {/* Cashier Terminal Info Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-700 px-2 py-1 bg-white rounded-lg border border-slate-200">
            <Store className="w-3.5 h-3.5 text-indigo-500" />
            <span>{terminalId}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 px-2 py-1 bg-white rounded-lg border border-slate-200">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>{cashierName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Code Entry & Cart Calculator (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Input Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            
            <div>
              <label htmlFor="voucher-code-input" className="block text-sm font-semibold text-slate-800 mb-2">
                Voucher Code
              </label>
              <div className="relative">
                <input
                  id="voucher-code-input"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                  placeholder="e.g. VF-7K9P-4MX2-9J7L"
                  className="w-full pl-4 pr-32 py-3.5 font-mono text-lg tracking-wider font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                />
                
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    id="validate-code-btn"
                    onClick={() => handleValidate()}
                    disabled={!code.trim() || isValidating}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                  >
                    {isValidating ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Check</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Pre-fill Codes */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-xs font-medium text-slate-500 mb-2">Quick Test Presets (Instant Evaluation):</div>
              <div className="flex flex-wrap gap-2">
                <button
                  id="test-active-voucher-btn"
                  onClick={() => loadPreset('VF-7K9P-4MX2-9J7L')}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-md border border-slate-300 hover:border-emerald-300 transition flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active $50 Pass
                </button>
                <button
                  id="test-percentage-voucher-btn"
                  onClick={() => loadPreset('VF-3B8Q-9W1Z-5E4R')}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-md border border-slate-300 hover:border-emerald-300 transition flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  25% OFF Pass
                </button>
                <button
                  id="test-redeemed-voucher-btn"
                  onClick={() => loadPreset('VF-2T5Y-8U0I-3O7P')}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-amber-50 hover:text-amber-700 text-slate-700 rounded-md border border-slate-300 hover:border-amber-300 transition flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Already Redeemed
                </button>
                <button
                  id="test-expired-voucher-btn"
                  onClick={() => loadPreset('VF-8N4M-2X6C-7V1K')}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-md border border-slate-300 hover:border-red-300 transition flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Expired $100 Card
                </button>
              </div>
            </div>

            {/* Cart & Order Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="cart-subtotal-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Cart Subtotal ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                  <input
                    id="cart-subtotal-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cartSubtotal}
                    onChange={(e) => {
                      setCartSubtotal(e.target.value);
                      if (validationResult?.voucher) {
                        handleValidate();
                      }
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="receipt-ref-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Sale Receipt # (Optional)
                </label>
                <input
                  id="receipt-ref-input"
                  type="text"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  placeholder="e.g. RCPT-99231"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Operator Notes */}
            <div>
              <label htmlFor="redemption-notes-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Internal Cashier Notes
              </label>
              <input
                id="redemption-notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. In-store customer presented digital pass"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

          </div>

          {/* POS Bill Preview Breakdown */}
          {validationResult?.valid && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                <span>Point of Sale Calculation</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Live Applied
                </span>
              </div>

              <div className="space-y-2 text-sm pt-1">
                <div className="flex justify-between text-slate-300">
                  <span>Cart Original Subtotal:</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Voucher Discount ({validationResult.voucher?.title}):</span>
                  <span className="font-mono">-${calculatedDiscount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-700/80 pt-2 flex justify-between text-lg font-bold text-white">
                  <span>Final Payable Total:</span>
                  <span className="font-mono text-emerald-300">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* One-Click Atomic Redemption Button */}
              <button
                id="execute-redemption-btn"
                onClick={handleRedeem}
                disabled={isRedeeming}
                className="w-full mt-3 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRedeeming ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    <span>Executing Atomic Single-Use Lock...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                    <span>Redeem Voucher (Single-Use Only)</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Validation Status & Transaction Receipts (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Error / Collision Alert */}
          {redemptionError && (
            <div id="redemption-error-banner" className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-red-900 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Single-Use Policy Enforced / Transaction Blocked</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed font-medium">
                {redemptionError}
              </p>
              <div className="text-[11px] text-red-600 font-mono pt-1">
                Security Engine: Race conditions & duplicate redemptions are strictly rejected.
              </div>
            </div>
          )}

          {/* Validation Result Box */}
          {validationResult && !redeemedVoucher && (
            <div className={`rounded-2xl p-5 border shadow-sm space-y-4 ${
              validationResult.statusCode === 'VALID'
                ? 'bg-emerald-50/70 border-emerald-200'
                : validationResult.statusCode === 'ALREADY_REDEEMED'
                ? 'bg-blue-50/70 border-blue-300'
                : validationResult.statusCode === 'EXPIRED'
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-red-50/70 border-red-300'
            }`}>
              
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {validationResult.statusCode === 'VALID' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {validationResult.statusCode === 'ALREADY_REDEEMED' && (
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  )}
                  {validationResult.statusCode === 'EXPIRED' && (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  {validationResult.statusCode === 'REVOKED' && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {validationResult.statusCode === 'NOT_FOUND' && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}

                  <span className="font-bold text-sm text-slate-900">
                    {validationResult.statusCode === 'VALID' && 'Voucher is Active & Usable'}
                    {validationResult.statusCode === 'ALREADY_REDEEMED' && 'Already Redeemed (Void)'}
                    {validationResult.statusCode === 'EXPIRED' && 'Voucher Expired'}
                    {validationResult.statusCode === 'REVOKED' && 'Voucher Revoked'}
                    {validationResult.statusCode === 'NOT_FOUND' && 'Invalid Code'}
                  </span>
                </div>

                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  validationResult.statusCode === 'VALID' ? 'bg-emerald-200 text-emerald-900' :
                  validationResult.statusCode === 'ALREADY_REDEEMED' ? 'bg-blue-200 text-blue-900' :
                  validationResult.statusCode === 'EXPIRED' ? 'bg-amber-200 text-amber-900' :
                  'bg-red-200 text-red-900'
                }`}>
                  {validationResult.statusCode}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {validationResult.message}
              </p>

              {/* If Voucher Details exist */}
              {validationResult.voucher && (
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-semibold text-slate-800">
                    <span>{validationResult.voucher.title}</span>
                    <span className="font-mono text-emerald-600 text-sm">
                      {validationResult.voucher.type === 'percentage' 
                        ? `${validationResult.voucher.value}% OFF`
                        : `$${validationResult.voucher.value.toFixed(2)} Credit`
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Issued To:</span>
                      <span className="font-medium text-slate-700">{validationResult.voucher.customerName || 'Walk-in Customer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expires On:</span>
                      <span className="font-medium text-slate-700">{new Date(validationResult.voucher.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Prior Redemption Log if already redeemed */}
                  {validationResult.voucher.redeemedAt && (
                    <div className="mt-2 bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-[11px] space-y-1 text-blue-950">
                      <div className="font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-700" />
                        Original Redemption Record:
                      </div>
                      <div>Time: {new Date(validationResult.voucher.redeemedAt).toLocaleString()}</div>
                      <div>Cashier: {validationResult.voucher.redeemedBy?.cashierName} ({validationResult.voucher.redeemedBy?.terminalId})</div>
                      <div>Location: {validationResult.voucher.redeemedBy?.location}</div>
                    </div>
                  )}

                  {/* QR & Barcode Visualizer */}
                  <div className="pt-2">
                    <CodeVisualizer code={validationResult.voucher.code} showCodeText={false} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Transaction Receipt Card */}
          {lastTransactionReceipt && (
            <div id="redemption-success-receipt" className="bg-white rounded-2xl p-6 border-2 border-emerald-500 shadow-md space-y-4 animate-fadeIn">
              
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">Redemption Successful!</h3>
                  <p className="text-xs text-slate-500">Atomic single-use lock saved permanently</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs space-y-2 text-slate-700">
                <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300 text-slate-900">
                  --- VOUCHERFLOW TRANSACTION RECEIPT ---
                </div>
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <span className="font-bold text-slate-900">{lastTransactionReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Voucher Code:</span>
                  <span className="font-bold text-emerald-700">{lastTransactionReceipt.voucher.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount Applied:</span>
                  <span className="font-bold text-slate-900">-${lastTransactionReceipt.discountApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terminal / Cashier:</span>
                  <span>{lastTransactionReceipt.terminalId} / {lastTransactionReceipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timestamp:</span>
                  <span>{new Date(lastTransactionReceipt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-[10px] text-center text-slate-400 pt-2 border-t border-dashed border-slate-300">
                  Status: LOCKED & REDEEMED (Cannot be reused)
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="print-receipt-btn"
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  id="next-transaction-btn"
                  onClick={handleReset}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Transaction</span>
                </button>
              </div>

            </div>
          )}

          {/* Security Information Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Data Integrity & Single-Use Guarantee
            </h4>
            <p className="leading-relaxed">
              Every redemption request passes through an isolated mutex lock. If two cashiers attempt to redeem the identical voucher at the same millisecond, the database executes the first and rejects the second with an immediate collision block.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
