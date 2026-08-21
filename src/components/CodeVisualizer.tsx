import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface Props {
  code: string;
  className?: string;
  showCodeText?: boolean;
}

export const CodeVisualizer: React.FC<Props> = ({ code, className = '', showCodeText = true }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!code) return;

    // Render Barcode (CODE128)
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, code, {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 1.5,
          height: 48,
          displayValue: false, // We render our own styled code text
          margin: 0,
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }

    // Render QR Code
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, code, {
        width: 120,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch(console.error);
    }
  }, [code]);

  if (!code) return null;

  return (
    <div className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Digital Pass Identifiers
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          QR & 1D Barcode
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* QR Code Canvas */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
          <canvas ref={qrCanvasRef} className="rounded-lg shadow-xs" />
          <span className="text-[10px] font-semibold text-slate-500 mt-1">2D QR Code</span>
        </div>

        {/* Barcode SVG & Code */}
        <div className="sm:col-span-8 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 overflow-hidden">
          <div className="w-full flex justify-center overflow-x-auto py-1">
            <svg ref={barcodeRef} className="max-w-full" />
          </div>
          {showCodeText && (
            <div className="text-center">
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900 tracking-wider">
                {code}
              </span>
              <span className="text-[10px] text-slate-400 block">Standard CODE-128 Barcode</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
