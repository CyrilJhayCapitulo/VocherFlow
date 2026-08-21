import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ValidationResult, PublicVoucher } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
import { CodeVisualizer } from './CodeVisualizer';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  QrCode, 
  Camera, 
  CameraOff, 
  Upload, 
  ArrowRight, 
  Sparkles, 
  Check, 
  FileText, 
  Lock, 
  UserX,
  RefreshCw,
  Zap,
  DollarSign,
  Percent,
  Gift
} from 'lucide-react';

interface Props {
  onRedemptionSuccess?: () => void;
}

export const CustomerCheck: React.FC<Props> = ({ onRedemptionSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  
  // QR Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [qrFileError, setQrFileError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'customer-qr-reader-video-region';

  // Redemption State
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState<PublicVoucher | null>(null);
  const [staffName, setStaffName] = useState('Store POS Staff');
  const [location, setLocation] = useState('Main Store Counter');
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

  const handleValidate = async (targetCode: string) => {
    const cleanCode = targetCode.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setResult(null);
    setRedemptionSuccess(null);
    setRedeemError(null);

    try {
      const res = await api.publicValidate(cleanCode);
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        statusCode: 'NOT_FOUND',
        message: err.message || 'Unable to verify voucher with registry',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidate(code);
  };

  // Start Live Camera Scanning
  const startCameraScanner = async () => {
    setScanError(null);
    setQrFileError(null);
    setIsScanning(true);

    try {
      // Small timeout to allow container element to render in DOM
      setTimeout(async () => {
        try {
          if (qrScannerRef.current) {
            await qrScannerRef.current.stop().catch(() => {});
          }

          const html5QrCode = new Html5Qrcode(qrRegionId);
          qrScannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Extract potential voucher code format VF-XXXX-XXXX-XXXX
              let extracted = decodedText.trim();
              const match = extracted.match(/VF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
              if (match) {
                extracted = match[0].toUpperCase();
              }
              setCode(extracted);
              stopCameraScanner();
              handleValidate(extracted);
            },
            () => {
              // Ignore frame scan failures
            }
          );
        } catch (err: any) {
          console.error('Camera QR Scan Error:', err);
          setScanError('Could not access device camera. Please grant camera permission or upload a QR image.');
          setIsScanning(false);
        }
      }, 100);
    } catch (err: any) {
      setScanError(err.message || 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch {}
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  // File QR scan upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrFileError(null);
    try {
      const html5QrCode = new Html5Qrcode('temp-qr-hidden-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      let extracted = decodedText.trim();
      const match = extracted.match(/VF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
      if (match) {
        extracted = match[0].toUpperCase();
      }
      setCode(extracted);
      handleValidate(extracted);
    } catch (err: any) {
      setQrFileError('No QR code detected in the uploaded image. Please try another image or enter the code manually.');
    }
  };

  // Authorised Public / Staff Redemption
  const handleRedeem = async () => {
    const targetCode = result?.publicVoucher?.code || code.trim().toUpperCase();
    if (!targetCode) return;

    setRedeeming(true);
    setRedeemError(null);

    try {
      const res = await api.publicRedeem(targetCode, staffName, location);
      if (res.success && res.publicVoucher) {
        setRedemptionSuccess(res.publicVoucher);
        // Refresh validation state
        setResult(prev => prev ? {
          ...prev,
          valid: false,
          statusCode: 'ALREADY_REDEEMED',
          message: 'Voucher was successfully redeemed! Single-use policy now strictly enforced.',
          publicVoucher: res.publicVoucher,
        } : null);
        if (onRedemptionSuccess) onRedemptionSuccess();
      } else {
        setRedeemError(res.error || 'Redemption was rejected by the server.');
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Redemption failed unexpectedly');
    } finally {
      setRedeeming(false);
    }
  };

  const activeVoucher = result?.publicVoucher;

  return (
    <div id="customer-redemption-portal" className="max-w-3xl mx-auto space-y-6">
      
      {/* Hidden container for image QR reader */}
      <div id="temp-qr-hidden-reader" className="hidden" />

      {/* Role Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Customer & Staff Redemption Terminal</span>
              <span className="bg-emerald-400/20 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                No Account Needed
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Voucher Verification & POS Redemption
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Instantly check validity, remaining credit, or redeem digital vouchers. Customer personal privacy is cryptographically safeguarded.
            </p>
          </div>
        </div>
      </div>

      {/* Verification & Scanning Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        {/* Input Methods: Manual & QR Code */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="customer-voucher-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Enter Voucher Code or Scan QR
            </label>
            <div className="flex items-center gap-2">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scan Camera QR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <CameraOff className="w-3.5 h-3.5 text-red-600" />
                  <span>Close Scanner</span>
                </button>
              )}

              {/* Upload QR file */}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload QR</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Camera Scanner Viewfinder */}
          {isScanning && (
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-300 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Point camera at customer digital pass QR code
                </span>
                <button
                  onClick={stopCameraScanner}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  Cancel
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-black min-h-[260px] flex items-center justify-center">
                <div id={qrRegionId} className="w-full max-w-[320px]" />
              </div>
            </div>
          )}

          {scanError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {qrFileError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{qrFileError}</span>
            </div>
          )}

          {/* Manual Code Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="relative">
              <input
                id="customer-voucher-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VF-XXXX-XXXX-XXXX"
                className="w-full pl-4 pr-32 py-3.5 font-mono text-base sm:text-lg tracking-wider font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 uppercase"
              />
              <button
                id="customer-verify-btn"
                type="submit"
                disabled={loading || !code.trim()}
                className="absolute right-2 top-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Validate Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Format: Standard 16-character alphanumeric voucher code with non-ambiguous characters.
            </p>
          </form>
        </div>

        {/* Validation Result Box */}
        {result && (
          <div className="pt-5 border-t border-slate-100 space-y-5 animate-fadeIn">
            
            {/* Status Alert Banner */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
              result.statusCode === 'VALID'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : result.statusCode === 'ALREADY_REDEEMED'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950'
                : result.statusCode === 'EXPIRED'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-red-50/90 border-red-300 text-red-950'
            }`}>
              {result.statusCode === 'VALID' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
              {result.statusCode === 'ALREADY_REDEEMED' && <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />}
              {result.statusCode === 'EXPIRED' && <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />}
              {result.statusCode !== 'VALID' && result.statusCode !== 'ALREADY_REDEEMED' && result.statusCode !== 'EXPIRED' && (
                <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}

              <div className="space-y-1">
                <div className="font-extrabold text-base">
                  {result.statusCode === 'VALID' && 'Voucher is VALID & Authorized for Single-Use'}
                  {result.statusCode === 'ALREADY_REDEEMED' && 'This Voucher Has Already Been Redeemed'}
                  {result.statusCode === 'EXPIRED' && 'This Voucher Has Expired'}
                  {result.statusCode === 'REVOKED' && 'This Voucher Has Been Voided / Revoked'}
                  {result.statusCode === 'NOT_FOUND' && 'Invalid Voucher Code — Not Found'}
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  {result.message}
                </div>
              </div>
            </div>

            {/* Public Sanitized Voucher Card */}
            {activeVoucher && (
              <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
                
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Voucher Pass</span>
                    <h3 className="text-lg font-bold text-slate-900">{activeVoucher.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      {activeVoucher.type === 'percentage'
                        ? `${activeVoucher.value}% OFF`
                        : `$${activeVoucher.value.toFixed(2)}`
                      }
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Code:</span>
                    <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">{activeVoucher.code}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expiration Date:</span>
                    <span className="font-semibold text-slate-800">{new Date(activeVoucher.expiresAt).toLocaleDateString()}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Minimum Spend:</span>
                    <span className="font-semibold text-slate-800">
                      {activeVoucher.minSpend ? `$${activeVoucher.minSpend.toFixed(2)}` : 'None required'}
                    </span>
                  </div>

                  {activeVoucher.maskedCustomerName && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Authorized Bearer:</span>
                      <span className="font-semibold text-slate-800 font-mono">{activeVoucher.maskedCustomerName}</span>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Voucher Type:</span>
                    <span className="font-semibold text-slate-800 capitalize">{activeVoucher.type.replace('_', ' ')}</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Single-Use Status:</span>
                    <span className={`font-bold capitalize ${activeVoucher.status === 'active' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {activeVoucher.status}
                    </span>
                  </div>
                </div>

                {/* QR Code and Barcode Visualizer */}
                <CodeVisualizer code={activeVoucher.code} showCodeText={true} />

                {/* Privacy Badge Guarantee */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Customer Privacy Protected:</strong> Customer email addresses and internal order references are masked from public validation.
                  </span>
                </div>

                {/* REDEEM ACTION SECTION (When Valid) */}
                {result.statusCode === 'VALID' && (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Authorised Redemption Trigger</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Instant Atomic Lock
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="staff-name-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Redeeming Staff / Operator (Optional)
                        </label>
                        <input
                          id="staff-name-input"
                          type="text"
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="e.g. Counter Staff"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="staff-location-input" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Store Location / Counter (Optional)
                        </label>
                        <input
                          id="staff-location-input"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Downtown Register 1"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {redeemError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{redeemError}</span>
                      </div>
                    )}

                    <button
                      id="customer-redeem-action-btn"
                      type="button"
                      onClick={handleRedeem}
                      disabled={redeeming}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-700/15"
                    >
                      {redeeming ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Acquiring Atomic Lock & Redeeming...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Redeem Voucher Now (Enforce Single-Use)</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Redemption Success Receipt */}
                {redemptionSuccess && (
                  <div className="p-4 bg-emerald-100/80 border border-emerald-300 rounded-2xl text-emerald-950 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>Redemption Completed Successfully!</span>
                    </div>
                    <p className="text-xs text-emerald-900">
                      Voucher <strong className="font-mono">{redemptionSuccess.code}</strong> has been marked as <strong>REDEEMED</strong>. The single-use lock prevents any future redemptions.
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
