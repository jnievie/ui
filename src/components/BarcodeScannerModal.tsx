import React, { useState } from 'react';
import { X, QrCode, Scan, Check, AlertCircle, Camera } from 'lucide-react';
import { StockItem } from '../types/inventory';

interface BarcodeScannerModalProps {
  stockItems: StockItem[];
  onClose: () => void;
  onItemScanned: (item: StockItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  stockItems,
  onClose,
  onItemScanned
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScanSample = (item: StockItem) => {
    setIsScanning(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsScanning(false);
      onItemScanned(item);
      onClose();
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const matched = stockItems.find(
      i => i.barcode === manualCode.trim() || i.sku.toLowerCase() === manualCode.trim().toLowerCase()
    );

    if (matched) {
      onItemScanned(matched);
      onClose();
    } else {
      setErrorMessage(`No agricultural item found with barcode / SKU: "${manualCode}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Crop Lot & Barcode Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Simulated Camera Viewfinder */}
          <div className="relative w-full h-48 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
            {/* Viewfinder crosshairs */}
            <div className="w-36 h-28 border-2 border-emerald-500/80 rounded-lg relative flex items-center justify-center">
              {/* Animated laser line */}
              <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
              <div className="absolute top-1 left-2 text-[10px] font-mono text-emerald-400/80">
                AF-LOCK · 60FPS
              </div>
            </div>

            <div className="absolute bottom-2 text-center text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>Align agricultural QR or GS1-128 barcode</span>
            </div>
          </div>

          {/* Quick Preset Samples to simulate instant scan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Simulate Real Agricultural Tag Scan:
            </label>
            <div className="space-y-1.5">
              {stockItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleScanSample(item)}
                  disabled={isScanning}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-slate-800/80 text-xs flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-400 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      Tag: {item.barcode} · {item.batchNumber}
                    </p>
                  </div>
                  <Scan className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Or Key In Barcode / SKU Manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="e.g. 792401890123 or GRN-WHT-2026-01"
                className="flex-1 py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Lookup
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </p>
            )}
          </form>

        </div>

      </div>
    </div>
  );
};
