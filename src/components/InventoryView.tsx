import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  Download, 
  ArrowUpDown, 
  AlertTriangle, 
  Wheat, 
  Droplets, 
  SlidersHorizontal,
  ChevronRight,
  Eye,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';
import { StockItem, StockCategory, StockStatus } from '../types/inventory';

interface InventoryViewProps {
  stockItems: StockItem[];
  onSelectItem: (item: StockItem) => void;
  onOpenAddModal: () => void;
  onOpenAdjustModal: (item: StockItem) => void;
  onOpenScanner: () => void;
}

const CATEGORY_TABS: { id: StockCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Inventory' },
  { id: 'grains', label: 'Bulk Grains' },
  { id: 'seeds', label: 'Certified Seeds' },
  { id: 'fertilizers', label: 'Fertilizers & Nutrients' },
  { id: 'crop_protection', label: 'Crop Protection' },
  { id: 'fresh_produce', label: 'Fresh Harvest' },
  { id: 'livestock_feed', label: 'Livestock Feed' },
  { id: 'fuel_supplies', label: 'Fuel & Supplies' },
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  stockItems,
  onSelectItem,
  onOpenAddModal,
  onOpenAdjustModal,
  onOpenScanner
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StockCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'all'>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value' | 'moisture'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract unique facilities
  const facilities = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach(i => set.add(i.facilityLocation));
    return Array.from(set);
  }, [stockItems]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Facility filter
      if (facilityFilter !== 'all' && item.facilityLocation !== facilityFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSku = item.sku.toLowerCase().includes(q);
        const matchesBatch = item.batchNumber.toLowerCase().includes(q);
        const matchesVariety = item.varietyOrGrade.toLowerCase().includes(q);
        const matchesLoc = item.facilityLocation.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBatch && !matchesVariety && !matchesLoc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'quantity') {
        comparison = a.currentQuantity - b.currentQuantity;
      } else if (sortBy === 'value') {
        const valA = a.currentQuantity * a.unitPriceUSD;
        const valB = b.currentQuantity * b.unitPriceUSD;
        comparison = valA - valB;
      } else if (sortBy === 'moisture') {
        comparison = (a.moisturePercent || 0) - (b.moisturePercent || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [stockItems, selectedCategory, statusFilter, facilityFilter, searchQuery, sortBy, sortOrder]);

  // Aggregate stats for filtered view
  const filteredValue = filteredItems.reduce((acc, i) => acc + (i.currentQuantity * i.unitPriceUSD), 0);
  const lowCount = filteredItems.filter(i => i.status === 'low_stock' || i.status === 'critical').length;

  const exportCSV = () => {
    const headers = ['SKU', 'Crop/Product Name', 'Grade/Spec', 'Category', 'Batch Lot', 'Location', 'Quantity', 'Unit', 'Unit Price ($)', 'Total Value ($)', 'Moisture (%)', 'Status'];
    const rows = filteredItems.map(i => [
      i.sku,
      `"${i.name}"`,
      `"${i.varietyOrGrade}"`,
      i.category,
      i.batchNumber,
      `"${i.facilityLocation}"`,
      i.currentQuantity,
      i.unit,
      i.unitPriceUSD,
      (i.currentQuantity * i.unitPriceUSD).toFixed(2),
      i.moisturePercent ?? 'N/A',
      i.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agristock_inventory_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Agricultural Inventory & Stocks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit crop tonnages, seed lots, fertilizers, and chemical reserves across all farm silos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
            <span>Scan Lot Barcode</span>
          </button>
          
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors shadow-2xs cursor-pointer"
            title="Download CSV inventory report"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (Interactive Segmented Control Buttons) */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-lg overflow-x-auto no-scrollbar">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Secondary Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        
        {/* Search Query */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop, variety, SKU, Lot # or location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

        {/* Facility Filter */}
        <div className="sm:col-span-3">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">All Storage Locations</option>
            {facilities.map((fac) => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'all')}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">All Stock Statuses</option>
            <option value="optimal">Optimal</option>
            <option value="low_stock">Low Stock Warning</option>
            <option value="critical">Critical Low / Empty</option>
            <option value="surplus">Surplus / High Moisture</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div className="sm:col-span-2 flex items-center gap-1.5">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="value">Valuation ($)</option>
            <option value="quantity">Stock Quantity</option>
            <option value="name">Crop Name</option>
            <option value="moisture">Moisture %</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Summary Kicker (Unboxed metadata with separators) */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Displaying <strong className="text-slate-800 dark:text-white font-mono tabular-nums">{filteredItems.length}</strong> items</span>
          <span aria-hidden="true">·</span>
          <span>Filtered Value: <strong className="text-slate-800 dark:text-white font-mono tabular-nums">${filteredValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong></span>
          {lowCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-700 dark:text-amber-400 font-medium">{lowCount} items need attention</span>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Showing real-time stock balances from storage probes
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Agricultural Product & Variety</th>
                <th className="py-3 px-3">Batch / Lot #</th>
                <th className="py-3 px-3">Storage Location</th>
                <th className="py-3 px-4 text-right">Available Stock</th>
                <th className="py-3 px-3">Moisture / Quality</th>
                <th className="py-3 px-4 text-right">Valuation (USD)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No agricultural stock records matched your filters.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try broadening your search term or clearing category filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setStatusFilter('all');
                        setFacilityFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 font-medium bg-emerald-50 dark:bg-emerald-950/60 rounded-md"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const fillRatio = Math.min(100, Math.round((item.currentQuantity / item.maxCapacity) * 100));
                  const isLow = item.currentQuantity <= item.reorderPoint;
                  const itemValue = item.currentQuantity * item.unitPriceUSD;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectItem(item)}
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-400">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{item.sku}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-xs">{item.varietyOrGrade}</span>
                        </div>
                      </td>

                      {/* Batch / Lot */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                          {item.batchNumber}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="truncate block max-w-[150px]" title={item.facilityLocation}>
                          {item.facilityLocation}
                        </span>
                      </td>

                      {/* Stock Level & Gauge */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {item.currentQuantity.toLocaleString()} <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px]">{item.unit}</span>
                        </div>
                        
                        {/* Gauge bar */}
                        <div className="w-24 ml-auto mt-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.status === 'critical'
                                ? 'bg-rose-600'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-700 dark:bg-emerald-500'
                            }`}
                            style={{ width: `${fillRatio}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                          {fillRatio}% of {item.maxCapacity.toLocaleString()} {item.unit}
                        </span>
                      </td>

                      {/* Moisture & Quality */}
                      <td className="py-3 px-3">
                        {item.moisturePercent !== undefined ? (
                          <div className="flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                            <Droplets className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span>{item.moisturePercent}%</span>
                            {item.moisturePercent > 14.5 && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-sans font-medium">(Aerating)</span>
                            )}
                          </div>
                        ) : item.germinationPercent !== undefined ? (
                          <div className="font-mono tabular-nums text-emerald-800 dark:text-emerald-400">
                            {item.germinationPercent}% Germ.
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                          ${itemValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                          @ ${item.unitPriceUSD}/{item.unit}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          item.status === 'optimal'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : item.status === 'low_stock'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : item.status === 'critical'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectItem(item)}
                            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Inspect Batch Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => onOpenAdjustModal(item)}
                            className="px-2 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded transition-colors cursor-pointer"
                            title="Log Stock Movement (+/-)"
                          >
                            Adjust
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

        {/* Footer info strip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span>All stocks synchronized with Python backend database schema</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Optimal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Low Stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Critical
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
