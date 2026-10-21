import React, { useState } from 'react';
import { X, Wheat, Plus } from 'lucide-react';
import { StockItem, StockCategory } from '../types/inventory';

interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<StockItem, 'id'>) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAdd }) => {
  const [sku, setSku] = useState(`AGR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [varietyOrGrade, setVarietyOrGrade] = useState('');
  const [category, setCategory] = useState<StockCategory>('grains');
  const [batchNumber, setBatchNumber] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [facilityLocation, setFacilityLocation] = useState('Silo #01 - North Tower');
  const [currentQuantity, setCurrentQuantity] = useState<number>(100);
  const [reorderPoint, setReorderPoint] = useState<number>(50);
  const [maxCapacity, setMaxCapacity] = useState<number>(500);
  const [unit, setUnit] = useState('MT');
  const [unitPriceUSD, setUnitPriceUSD] = useState<number>(250);
  const [moisturePercent, setMoisturePercent] = useState<number>(12.5);
  const [supplierOrField, setSupplierOrField] = useState('North Prairie Field #2');
  const [notes, setNotes] = useState('Certified quality standard sample verified.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let status: StockItem['status'] = 'optimal';
    if (currentQuantity <= reorderPoint * 0.5) {
      status = 'critical';
    } else if (currentQuantity <= reorderPoint) {
      status = 'low_stock';
    }

    onAdd({
      sku,
      name,
      varietyOrGrade: varietyOrGrade || 'Commercial Grade',
      category,
      batchNumber,
      facilityLocation,
      currentQuantity,
      reorderPoint,
      maxCapacity,
      unit,
      unitPriceUSD,
      moisturePercent: category === 'grains' || category === 'seeds' ? moisturePercent : undefined,
      supplierOrField,
      status,
      barcode: `7924${Math.floor(10000000 + Math.random() * 90000000)}`,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Register New Agricultural Stock</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Add grain lot, certified seed, fertilizer, or agrochemical</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Stock SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Crop Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StockCategory)}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="grains">Bulk Grains & Cereals</option>
                <option value="seeds">Certified Hybrid Seeds</option>
                <option value="fertilizers">Fertilizers & Nutrients</option>
                <option value="crop_protection">Crop Protection (Chemicals)</option>
                <option value="fresh_produce">Harvested Fresh Produce</option>
                <option value="livestock_feed">Livestock Feed & Forage</option>
                <option value="fuel_supplies">Fuel & Farm Supplies</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Product / Crop Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amber Durum Wheat, Potassium Chloride 0-0-60"
              required
              className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Variety or Quality Grade</label>
              <input
                type="text"
                value={varietyOrGrade}
                onChange={(e) => setVarietyOrGrade(e.target.value)}
                placeholder="e.g. Grade #1 CWAD, 2-Row"
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Batch / Lot Identifier</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Quantity</label>
              <input
                type="number"
                min="0"
                step="any"
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(parseFloat(e.target.value) || 0)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="MT">MT (Metric Tonnes)</option>
                <option value="50kg Bags">50kg Bags</option>
                <option value="Liters">Liters</option>
                <option value="Bushels">Bushels</option>
                <option value="Bales">Bales</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Cost ($ USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPriceUSD}
                onChange={(e) => setUnitPriceUSD(parseFloat(e.target.value) || 0)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reorder Minimum Threshold</label>
              <input
                type="number"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Storage Max Capacity</label>
              <input
                type="number"
                min="1"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseFloat(e.target.value) || 1)}
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Storage Location</label>
              <input
                type="text"
                value={facilityLocation}
                onChange={(e) => setFacilityLocation(e.target.value)}
                placeholder="e.g. Silo #02, Cold Bay 1"
                required
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Moisture Content (%)</label>
              <input
                type="number"
                step="0.1"
                value={moisturePercent}
                onChange={(e) => setMoisturePercent(parseFloat(e.target.value) || 0)}
                className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Provenance: Source Field / Supplier</label>
            <input
              type="text"
              value={supplierOrField}
              onChange={(e) => setSupplierOrField(e.target.value)}
              placeholder="e.g. South Terrace Pivot #1 or Corteva Agriscience"
              required
              className="w-full py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
              Add Stock to System
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
