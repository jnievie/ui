import React from 'react';
import { 
  Wheat, 
  AlertTriangle, 
  TrendingUp, 
  Warehouse, 
  Droplets, 
  Thermometer, 
  Wind, 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  Plus, 
  Search,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { StockItem, SiloTelemetry, StockMovement, UserProfile } from '../types/inventory';

interface DashboardViewProps {
  stockItems: StockItem[];
  silos: SiloTelemetry[];
  movements: StockMovement[];
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onOpenAddModal: () => void;
  onOpenScanner: () => void;
  onSelectItem: (item: StockItem) => void;
  onSelectSilo: (silo: SiloTelemetry) => void;
  onOpenAdjustModal: (item: StockItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stockItems,
  silos,
  movements,
  currentUser,
  onNavigate,
  onOpenAddModal,
  onOpenScanner,
  onSelectItem,
  onSelectSilo,
  onOpenAdjustModal
}) => {
  // Aggregate Metrics
  const totalStockValue = stockItems.reduce((acc, item) => acc + (item.currentQuantity * item.unitPriceUSD), 0);
  const totalSiloCapacity = silos.reduce((acc, s) => acc + s.capacityMT, 0);
  const totalSiloCurrent = silos.reduce((acc, s) => acc + s.currentMT, 0);
  const siloUtilizationPercent = ((totalSiloCurrent / totalSiloCapacity) * 100).toFixed(1);

  const lowStockItems = stockItems.filter(i => i.status === 'low_stock' || i.status === 'critical');
  const moistureWatchItems = silos.filter(s => s.moisturePercent > s.optimalMoistureMax || s.aerationStatus === 'warning');

  return (
    <div className="space-y-6">
      
      {/* Welcome & Facility Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operations & Stock Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time telemetry and grain elevator status for <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.facility}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
            <span>Scan Crop Lot</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Intake Delivery</span>
          </button>
        </div>
      </div>

      {/* KPI 4-Card Strip with tabular figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Inventory Valuation */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Stock Valuation</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +3.4%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              ${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">USD</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{stockItems.length} active SKUs across 4 storage facilities</span>
          </div>
        </div>

        {/* Card 2: Silo Tonnage Capacity */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Bulk Storage Fill Level</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300 font-semibold">{siloUtilizationPercent}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalSiloCurrent.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">/ {totalSiloCapacity.toLocaleString()} MT</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-700 dark:bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${siloUtilizationPercent}%` }}
            />
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Stock Reorder Warnings</span>
            <span className="text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-[11px]">
              Attention
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums">
              {lowStockItems.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Items below minimum</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            {lowStockItems.length > 0 ? (
              <span>E.g. {lowStockItems[0].name} ({lowStockItems[0].currentQuantity} {lowStockItems[0].unit})</span>
            ) : (
              <span>All inventory within safe levels</span>
            )}
          </div>
        </div>

        {/* Card 4: Moisture & Spoilage Watch */}
        <div 
          onClick={() => onNavigate('silos')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-rose-400 dark:hover:border-rose-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Moisture & Aeration Watch</span>
            <span className={`font-medium px-1.5 py-0.5 rounded text-[11px] ${
              moistureWatchItems.length > 0 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' 
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}>
              {moistureWatchItems.length > 0 ? 'High Humidity' : 'Optimal'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${moistureWatchItems.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {moistureWatchItems.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Silos requiring aeration</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            {moistureWatchItems.length > 0 ? (
              <span>Silo #03 Dent Corn at 14.9% moisture</span>
            ) : (
              <span>All grain bins at target moisture</span>
            )}
          </div>
        </div>

      </div>

      {/* Silo & Grain Bin Telemetry Array */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Grain Silos & Storage Facility Telemetry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated sensor feeds from grain cables, aeration drying fans, and climate vaults
            </p>
          </div>
          <button
            onClick={() => onNavigate('silos')}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Facility Schematics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {silos.map((silo) => {
            const fillRatio = Math.round((silo.currentMT / silo.capacityMT) * 100);
            const isHighMoisture = silo.moisturePercent > silo.optimalMoistureMax;

            return (
              <div
                key={silo.id}
                onClick={() => onSelectSilo(silo)}
                className="border border-slate-200 dark:border-slate-800 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-lg p-4 transition-all hover:shadow-xs cursor-pointer bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                      {silo.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                      {silo.cropStored}
                    </span>
                  </div>

                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                    silo.aerationStatus === 'warning'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                      : silo.aerationStatus === 'active'
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {silo.aerationStatus === 'active' ? 'Aeration On' : silo.aerationStatus}
                  </span>
                </div>

                {/* Graphic Silo Tank Tank Representation */}
                <div className="mt-3.5 flex items-center gap-3">
                  <div className="w-12 h-20 bg-slate-200 dark:bg-slate-700 rounded-t-lg rounded-b-md relative overflow-hidden border border-slate-300 dark:border-slate-600 flex flex-col justify-end shrink-0">
                    <div 
                      className={`w-full transition-all duration-700 ${
                        isHighMoisture ? 'bg-amber-600' : 'bg-emerald-700 dark:bg-emerald-500'
                      }`}
                      style={{ height: `${fillRatio}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-mono font-bold text-white drop-shadow-xs">
                        {fillRatio}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Current / Max:</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {silo.currentMT.toLocaleString()} / {silo.capacityMT.toLocaleString()} MT
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        Moisture:
                      </span>
                      <span className={`font-mono tabular-nums font-semibold ${isHighMoisture ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {silo.moisturePercent}% {isHighMoisture && '(High)'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-slate-400" />
                        Core Temp:
                      </span>
                      <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {silo.internalTempC}°C
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Last inspected: {silo.lastInspected.split(' ')[1]}</span>
                  <span className="text-emerald-800 dark:text-emerald-400 font-medium hover:underline">
                    Cable Probes →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Column Layout: Urgent Stock Checking & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Urgent Stock Actions & Critical Low Stock (7 Cols) */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Critical Inventory & Reorder Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agricultural inputs approaching safety threshold
              </p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 cursor-pointer"
            >
              All Stock Items ({stockItems.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lowStockItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{item.facilityLocation}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      Current: <strong className="text-rose-700 dark:text-rose-400">{item.currentQuantity} {item.unit}</strong> (Min: {item.reorderPoint} {item.unit})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectItem(item)}
                    className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => onOpenAdjustModal(item)}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded transition-colors cursor-pointer"
                  >
                    Restock
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Agriculture Inventory Shortcuts */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onNavigate('inventory')}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Wheat className="w-4 h-4 text-emerald-800 dark:text-emerald-400 mb-1" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Check Grain Stock</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Wheat, Corn, Barley</p>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-800 dark:text-emerald-400 mb-1" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Check Fertilizers</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Urea, DAP, Potash</p>
            </button>

            <button
              onClick={() => onNavigate('system-design')}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Warehouse className="w-4 h-4 text-emerald-800 dark:text-emerald-400 mb-1" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Python Backend API</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">FastAPI Architecture</p>
            </button>
          </div>
        </section>

        {/* Right Column: Recent Harvest & Dispatch Movements (5 Cols) */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Stock Movements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logistics intake and outbound shipments
              </p>
            </div>
            <button
              onClick={() => onNavigate('movements')}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 cursor-pointer"
            >
              Movement Log →
            </button>
          </div>

          <div className="space-y-3">
            {movements.slice(0, 4).map((mov) => {
              const isInbound = mov.type === 'harvest_intake';
              const isOutbound = mov.type === 'dispatch_sale';

              return (
                <div key={mov.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {mov.itemName}
                    </span>
                    <span className={`font-mono tabular-nums font-bold ${
                      isInbound 
                        ? 'text-emerald-700 dark:text-emerald-400' 
                        : isOutbound 
                        ? 'text-blue-700 dark:text-blue-400' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {isInbound ? '+' : isOutbound ? '-' : ''}{mov.quantity} {mov.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1 text-[11px]">
                    <span className="capitalize">{mov.type.replace('_', ' ')}</span>
                    <span aria-hidden="true">·</span>
                    <span>Ref: {mov.referenceNo}</span>
                  </div>

                  <div className="mt-1 text-slate-600 dark:text-slate-300 text-[11px] truncate">
                    {mov.fromLocation} → {mov.toLocation}
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span>By {mov.performedBy}</span>
                    <span>{mov.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

    </div>
  );
};
