import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, RotateCw, AlertOctagon, Check } from 'lucide-react';
import { StockItem, StockMovement, UserProfile } from '../types/inventory';

interface AdjustStockModalProps {
  initialItem?: StockItem | null;
  allItems: StockItem[];
  currentUser: UserProfile;
  onClose: () => void;
  onSubmit: (data: {
    itemId: string;
    type: 'harvest_intake' | 'dispatch_sale' | 'internal_transfer' | 'adjustment_loss';
    quantity: number;
    fromLocation: string;
    toLocation: string;
    reason: string;
    referenceNo: string;
  }) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  initialItem,
  allItems,
  currentUser,
  onClose,
  onSubmit
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem ? initialItem.id : (allItems[0]?.id || '')
  );
  const [type, setType] = useState<'harvest_intake' | 'dispatch_sale' | 'internal_transfer' | 'adjustment_loss'>('harvest_intake');
  const [quantity, setQuantity] = useState<number>(25);
  const [fromLocation, setFromLocation] = useState<string>('Delivery Truck / Field');
  const [toLocation, setToLocation] = useState<string>(initialItem ? initialItem.facilityLocation : 'Silo #01 - North Tower');
  const [referenceNo, setReferenceNo] = useState<string>(`MOV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reason, setReason] = useState<string>('Scheduled autumn stock replenishment');

  const selectedItem = allItems.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    onSubmit({
      itemId: selectedItemId,
      type,
      quantity,
      fromLocation,
      toLocation,
      reason,
      referenceNo
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Record Stock Movement</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log incoming delivery, grain dispatch, or transfer</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Item Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Agricultural Stock Item
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const item = allItems.find(i => i.id === e.target.value);
                if (item) setToLocation(item.facilityLocation);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-800 text-slate-900 dark:text-white"
            >
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentQuantity} {item.unit} available) — {item.batchNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Radio Strip */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Movement Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setType('harvest_intake');
                  setFromLocation('Harvester Truck #08');
                  if (selectedItem) setToLocation(selectedItem.facilityLocation);
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                  type === 'harvest_intake'
                    ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Harvest Intake (+)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('dispatch_sale');
                  if (selectedItem) setFromLocation(selectedItem.facilityLocation);
                  setToLocation('Railcar / Grain Elevator Tender');
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                  type === 'dispatch_sale'
                    ? 'border-blue-700 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Dispatch / Sale (-)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('internal_transfer');
                  if (selectedItem) setFromLocation(selectedItem.facilityLocation);
                  setToLocation('Secondary Silo Complex');
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                  type === 'internal_transfer'
                    ? 'border-purple-700 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <RotateCw className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span>Internal Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('adjustment_loss');
                  if (selectedItem) setFromLocation(selectedItem.facilityLocation);
                  setToLocation('Screening / Waste Bin');
                }}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-2 ${
                  type === 'adjustment_loss'
                    ? 'border-rose-700 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <AlertOctagon className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                <span>Loss / Screening (-)</span>
              </button>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transaction Quantity
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-800 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
              <input
                type="text"
                disabled
                value={selectedItem?.unit || 'MT'}
                className="w-full py-1.5 px-3 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Origin Location</label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Location</label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Reference & Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bill of Lading / Ref #</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Logistics Operator</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full py-1.5 px-3 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Agronomic / Inspection Reason</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              placeholder="e.g. Grain moisture test passed, dispatched to processor..."
            />
          </div>

          {/* Footer CTA */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Commit Movement & Update Stock
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
