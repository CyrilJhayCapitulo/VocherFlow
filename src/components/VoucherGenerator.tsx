import React, { useState } from 'react';
import { api } from '../services/api';
import { Voucher, VoucherType, GenerateVoucherPayload } from '../types';
import { 
  Sparkles, 
  Layers, 
  DollarSign, 
  Percent, 
  Gift, 
  Calendar, 
  User, 
  FileText, 
  ShoppingBag, 
  Download, 
  Check, 
  Copy, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Database
} from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  onVoucherCreated?: (vouchers: Voucher[]) => void;
  onNavigateToRedeem?: (code: string) => void;
}

export const VoucherGenerator: React.FC<Props> = ({ onVoucherCreated, onNavigateToRedeem }) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [batchCount, setBatchCount] = useState<number>(5);

  // Form Fields
  const [voucherType, setVoucherType] = useState<VoucherType>('fixed_amount');
  const [value, setValue] = useState<string>('50');
  const [currency, setCurrency] = useState<string>('USD');
  const [title, setTitle] = useState<string>('Special Privilege Voucher');
  const [description, setDescription] = useState<string>('Valid on any in-store purchase.');
  const [notes, setNotes] = useState<string>('Issued via Firestore Admin Portal. Single-use only.');
  const [minSpend, setMinSpend] = useState<string>('100');
  const [maxDiscount, setMaxDiscount] = useState<string>('100');
  const [validDays, setValidDays] = useState<number>(30);
  
  // Customer / Purchase Linkage
  const [customerReference, setCustomerReference] = useState<string>('Sarah Jenkins (CUST-8812)');
  const [purchaseId, setPurchaseId] = useState<string>(`ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`);

  // Submission State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVouchers, setGeneratedVouchers] = useState<Voucher[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const payload: GenerateVoucherPayload = {
        voucherType,
        type: voucherType,
        value: parseFloat(value) || 0,
        currency,
        title: title.trim() || 'Store Voucher',
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        minSpend: minSpend ? parseFloat(minSpend) : 0,
        maxDiscount: voucherType === 'percentage' && maxDiscount ? parseFloat(maxDiscount) : undefined,
        validDays: validDays || 30,
        customerReference: mode === 'single' ? customerReference.trim() || undefined : undefined,
        customerName: mode === 'single' ? customerReference.trim() || undefined : undefined,
        purchaseId: mode === 'single' ? purchaseId.trim() || undefined : undefined,
        orderId: mode === 'single' ? purchaseId.trim() || undefined : undefined,
        count: mode === 'batch' ? batchCount : 1,
      };

      const res = await api.generateVoucher(payload);
      
      let createdList: Voucher[] = [];
      if (res.vouchers) {
        createdList = res.vouchers;
      } else if (res.voucher) {
        createdList = [res.voucher];
      }

      setGeneratedVouchers(createdList);

      if (onVoucherCreated) {
        onVoucherCreated(createdList);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate voucher');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadCSV = () => {
    if (generatedVouchers.length === 0) return;
    
    const headers = ['Voucher Code', 'Type', 'Value', 'Currency', 'Status', 'Expires At', 'Customer Ref', 'Purchase ID', 'Notes'];
    const rows = generatedVouchers.map(v => [
      v.code,
      v.voucherType || v.type,
      v.value,
      v.currency || 'USD',
      (v.status || 'ACTIVE').toUpperCase(),
      v.expiresAt,
      `"${(v.customerReference || v.customerName || 'N/A').replace(/"/g, '""')}"`,
      v.purchaseId || v.orderId || 'N/A',
      `"${(v.notes || v.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Firestore_Vouchers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewExpiryDate = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div id="voucher-generator-section" className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            Firestore Voucher Document Engine
          </div>
          <h2 className="text-xl font-bold text-slate-900">Generate & Provision Vouchers</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create single vouchers or bulk issuance documents with automatic SHA-256 HMAC integrity signatures.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            id="mode-single-btn"
            onClick={() => { setMode('single'); setGeneratedVouchers([]); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Voucher
          </button>
          <button
            type="button"
            id="mode-batch-btn"
            onClick={() => { setMode('batch'); setGeneratedVouchers([]); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'batch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulk Issuance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            
            {/* Voucher Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                1. Voucher Type (voucherType)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'fixed_amount', label: 'Fixed Cash ($)', icon: DollarSign, desc: 'e.g. $50 Off' },
                  { id: 'percentage', label: 'Percentage (%)', icon: Percent, desc: 'e.g. 25% Off' },
                  { id: 'gift_card', label: 'Store Credit', icon: CreditCard, desc: 'Full Balance' },
                  { id: 'free_item', label: 'Gift Pass', icon: Gift, desc: 'Free Product' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = voucherType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVoucherType(item.id as VoucherType)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.label}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Value & Currency & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label htmlFor="voucher-value-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Value (value)
                </label>
                <input
                  id="voucher-value-input"
                  type="number"
                  min="1"
                  max={voucherType === 'percentage' ? 100 : 50000}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="voucher-currency-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency (currency)
                </label>
                <select
                  id="voucher-currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="SGD">SGD ($)</option>
                  <option value="PHP">PHP (₱)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="voucher-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Voucher Title
                </label>
                <input
                  id="voucher-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Privilege Pass"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Purchase Linkage (Single mode) */}
            {mode === 'single' ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  Customer Reference & Purchase ID Linkage
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="customer-ref-input" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Customer Reference (customerReference)
                    </label>
                    <input
                      id="customer-ref-input"
                      type="text"
                      value={customerReference}
                      onChange={(e) => setCustomerReference(e.target.value)}
                      placeholder="e.g. Sarah Jenkins or CUST-8812"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase-id-input" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Purchase Order ID (purchaseId)
                    </label>
                    <input
                      id="purchase-id-input"
                      type="text"
                      value={purchaseId}
                      onChange={(e) => setPurchaseId(e.target.value)}
                      placeholder="e.g. ORD-99120"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-2">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                  Bulk Quantity Issuance
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="batch-quantity-slider"
                    type="range"
                    min="2"
                    max="50"
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <span className="font-bold text-sm text-indigo-950 font-mono w-16 text-right">
                    {batchCount} codes
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Each voucher document will be stored in Firestore with an independent UUID, code, and SHA-256 HMAC integrity digest.
                </p>
              </div>
            )}

            {/* Document Notes & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="voucher-desc-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Terms (description)
                </label>
                <input
                  id="voucher-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Valid on any in-store purchase."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label htmlFor="voucher-notes-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Firestore Notes (notes)
                </label>
                <input
                  id="voucher-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal document audit notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Validity & Constraints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label htmlFor="validity-days-select" className="block text-xs font-semibold text-slate-700 mb-1">
                  Validity Period (expiresAt)
                </label>
                <select
                  id="validity-days-select"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={90}>90 Days (Quarter)</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div>
                <label htmlFor="min-spend-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Spend ($)
                </label>
                <input
                  id="min-spend-input"
                  type="number"
                  min="0"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  placeholder="0 (No minimum)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>

              {voucherType === 'percentage' && (
                <div>
                  <label htmlFor="max-discount-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Discount Cap ($)
                  </label>
                  <input
                    id="max-discount-input"
                    type="number"
                    min="1"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  />
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="generate-voucher-submit-btn"
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning Firestore Document(s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Generate & Save {mode === 'batch' ? `${batchCount} Vouchers to Firestore` : 'Voucher Document'}</span>
                </>
              )}
            </button>

          </form>

        </div>

        {/* Right Column: Live Pass Preview & Generated Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Preview Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span className="font-semibold uppercase tracking-wider text-emerald-400">Live Preview</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono">STATUS: ACTIVE</span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full inline-block mb-1">
                  {voucherType.replace('_', ' ')}
                </span>
                <h3 className="text-lg font-bold text-white">{title || 'Voucher Title'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400">
                  {voucherType === 'percentage' ? `${value}% OFF` : `$${value} ${currency}`}
                </div>
                {minSpend && Number(minSpend) > 0 && (
                  <div className="text-[10px] text-slate-400">Min Spend: ${minSpend}</div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span className="text-[10px] text-slate-500 block">EXPIRES</span>
                <span className="font-medium text-slate-300">{previewExpiryDate}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">CUSTOMER REF</span>
                <span className="font-medium text-slate-300 truncate max-w-[140px] block">
                  {mode === 'single' ? customerReference : 'Batch Pool'}
                </span>
              </div>
            </div>
          </div>

          {/* Generated Vouchers Result Box */}
          {generatedVouchers.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Successfully Provisioned {generatedVouchers.length} Voucher{generatedVouchers.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-xs text-emerald-600 font-medium">Saved to Firestore collection & ready for redemption</p>
                  </div>
                </div>

                {generatedVouchers.length > 1 && (
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                )}
              </div>

              {/* Code List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {generatedVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:bg-emerald-50/50 transition"
                  >
                    <div>
                      <div className="font-mono font-bold text-sm text-slate-900 tracking-wide">{v.code}</div>
                      <div className="text-[11px] text-slate-500 font-mono">ID: {v.id.slice(0, 12)}...</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(v.code)}
                        className="p-2 text-slate-500 hover:text-slate-900 bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                        title="Copy Voucher Code"
                      >
                        {copiedCode === v.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {onNavigateToRedeem && (
                        <button
                          onClick={() => onNavigateToRedeem(v.code)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Redeem</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
