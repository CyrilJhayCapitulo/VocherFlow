import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Voucher } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Percent, 
  Gift, 
  User, 
  ShoppingBag,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';

interface Props {
  voucher: Voucher;
  onClose: () => void;
  onRedeemNow?: (voucher: Voucher) => void;
}

export const VoucherPassModal: React.FC<Props> = ({ voucher, onClose, onRedeemNow }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    QRCode.toDataURL(voucher.code, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => setQrDataUrl(url)).catch(console.error);

    if (barcodeRef.current && voucher.code) {
      try {
        JsBarcode(barcodeRef.current, voucher.code, {
          format: 'CODE128',
          lineColor: '#ffffff',
          width: 1.5,
          height: 36,
          displayValue: false,
          margin: 0,
          background: 'transparent',
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [voucher.code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isExpired = new Date(voucher.expiresAt) < new Date() || voucher.status === 'expired';

  return (
    <div id="voucher-pass-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide">VoucherFlow Digital Pass</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {voucher.id}</p>
            </div>
          </div>
          <button 
            id="close-pass-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Pass Body */}
        <div className="p-6 space-y-5 print:p-0">
          
          {/* Main Card Ticket */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-slate-700/60 overflow-hidden">
            
            {/* Background watermarks */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Top row */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  {voucher.type.replace('_', ' ')}
                </span>
                <h2 className="text-xl font-bold text-slate-100">{voucher.title}</h2>
                {voucher.description && (
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">{voucher.description}</p>
                )}
              </div>

              <div className="text-right">
                <div className="text-2xl font-black tracking-tight text-white flex items-center justify-end gap-0.5">
                  {voucher.type === 'percentage' ? (
                    <><span>{voucher.value}</span><Percent className="w-5 h-5 text-emerald-400" /></>
                  ) : voucher.type === 'free_item' ? (
                    <Gift className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <><span>${voucher.value.toFixed(2)}</span></>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {voucher.type === 'percentage' ? 'Discount Off Cart' : 'Voucher Credit'}
                </span>
              </div>
            </div>

            {/* Middle Perforated Divider */}
            <div className="relative my-4 flex items-center justify-between">
              <div className="w-full border-t border-dashed border-slate-600/80" />
            </div>

            {/* QR Code and Code display */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 rounded-xl p-3 border border-slate-700/50">
              <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Voucher QR Code" className="w-24 h-24" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 animate-pulse rounded" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="text-xs text-slate-400 mb-1">Single-Use Redemption Code</div>
                <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-emerald-300 select-all break-all">
                  {voucher.code}
                </div>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <button
                    id="copy-code-btn"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-600 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* 1D Barcode Render */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col items-center sm:items-start overflow-hidden">
                  <svg ref={barcodeRef} className="max-w-full" />
                </div>
              </div>
            </div>

            {/* Bottom details */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Expires: {new Date(voucher.expiresAt).toLocaleDateString()}</span>
              </div>
              {voucher.minSpend ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Min. Spend: ${voucher.minSpend}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>No Min. Spend</span>
                </div>
              )}
            </div>

          </div>

          {/* Status & Redemption History Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Status</span>
              <div>
                {voucher.status === 'active' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Active / Usable
                  </span>
                )}
                {voucher.status === 'redeemed' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    Redeemed
                  </span>
                )}
                {voucher.status === 'expired' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Expired
                  </span>
                )}
                {voucher.status === 'revoked' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
                    <X className="w-3.5 h-3.5 text-red-600" />
                    Revoked / Void
                  </span>
                )}
              </div>
            </div>

            {voucher.customerName && (
              <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                <span className="flex items-center gap-1 text-slate-500"><User className="w-3.5 h-3.5" /> Issued To:</span>
                <span className="font-medium text-slate-800">{voucher.customerName} {voucher.customerEmail ? `(${voucher.customerEmail})` : ''}</span>
              </div>
            )}

            {voucher.orderId && (
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 text-slate-500"><FileText className="w-3.5 h-3.5" /> Purchase Order:</span>
                <span className="font-mono text-slate-700">{voucher.orderId}</span>
              </div>
            )}

            {voucher.redeemedAt && voucher.redeemedBy && (
              <div className="mt-2 bg-blue-50 border border-blue-200/80 rounded-lg p-3 text-xs space-y-1.5">
                <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Redemption Audit Record
                </div>
                <div className="text-slate-600 flex items-center justify-between">
                  <span>Timestamp:</span>
                  <span className="font-medium text-slate-800">{new Date(voucher.redeemedAt).toLocaleString()}</span>
                </div>
                <div className="text-slate-600 flex items-center justify-between">
                  <span>Cashier / Terminal:</span>
                  <span className="font-medium text-slate-800">{voucher.redeemedBy.cashierName} ({voucher.redeemedBy.terminalId})</span>
                </div>
                <div className="text-slate-600 flex items-center justify-between">
                  <span>Location:</span>
                  <span className="font-medium text-slate-800">{voucher.redeemedBy.location}</span>
                </div>
                {voucher.redeemedBy.orderReference && (
                  <div className="text-slate-600 flex items-center justify-between">
                    <span>Receipt/Sale Ref:</span>
                    <span className="font-mono text-slate-800">{voucher.redeemedBy.orderReference}</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] text-slate-400 font-mono break-all pt-1">
              HMAC Integrity: {voucher.hash.substring(0, 24)}...
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="print-pass-btn"
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Pass</span>
            </button>

            {voucher.status === 'active' && onRedeemNow && (
              <button
                id="modal-redeem-btn"
                onClick={() => {
                  onClose();
                  onRedeemNow(voucher);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Go to Redeem</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
