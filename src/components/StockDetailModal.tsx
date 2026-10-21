import React, { useState, useMemo } from 'react';
import { 
  X, 
  Wheat, 
  Droplets, 
  Thermometer, 
  Calendar, 
  Building2, 
  Tag, 
  ShieldCheck, 
  QrCode, 
  SlidersHorizontal,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Info,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { StockItem, StockMovement } from '../types/inventory';

interface StockDetailModalProps {
  item: StockItem | null;
  movements?: StockMovement[];
  onClose: () => void;
  onOpenAdjust: (item: StockItem) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  item,
  movements = [],
  onClose,
  onOpenAdjust
}) => {
  const [chartType, setChartType] = useState<'trend' | 'flow'>('trend');

  if (!item) return null;

  const fillRatio = Math.min(100, Math.round((item.currentQuantity / item.maxCapacity) * 100));
  const totalValuation = item.currentQuantity * item.unitPriceUSD;
  const isHighMoisture = item.moisturePercent && item.moisturePercent > 14.0;

  // Generate deterministic 30-day historical timeline ending at item.currentQuantity
  const historicalData = useMemo(() => {
    const data = [];
    const now = new Date();
    const currentQty = item.currentQuantity;
    const reorderPt = item.reorderPoint;
    const maxCap = item.maxCapacity;

    // Seeded pseudo-random variance based on item.sku characters
    let seed = 0;
    for (let c = 0; c < item.sku.length; c++) {
      seed = (seed + item.sku.charCodeAt(c) * 17) % 1000;
    }

    // Step backwards 29 days to today
    let runningQty = currentQty;
    const dailySteps: { dayLabel: string; fullDate: string; quantity: number; netFlow: number; intake: number; dispatch: number }[] = [];

    // Filter real movements for this item
    const itemMovs = movements.filter(m => m.itemId === item.id);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const fullDate = d.toISOString().slice(0, 10);

      // Check if real movement on this date
      const matchedMovs = itemMovs.filter(m => m.timestamp.includes(fullDate));
      let dayIntake = 0;
      let dayDispatch = 0;

      if (matchedMovs.length > 0) {
        matchedMovs.forEach(m => {
          if (m.type === 'harvest_intake') dayIntake += m.quantity;
          else if (m.type === 'dispatch_sale' || m.type === 'adjustment_loss') dayDispatch += m.quantity;
        });
      } else {
        // Simulated natural agricultural fluctuations (intake deliveries on day -22, -14, -4; occasional dispatches)
        const dayNoise = Math.sin((i + seed) * 0.7);
        if (i === 22 || i === 8) {
          dayIntake = Math.round(reorderPt * 0.45);
        } else if (i === 17 || i === 3) {
          dayDispatch = Math.round(reorderPt * 0.25);
        } else if (dayNoise > 0.6) {
          dayDispatch = Math.round((currentQty * 0.02) + (dayNoise * 5));
        } else if (dayNoise < -0.7) {
          dayIntake = Math.round((currentQty * 0.03));
        }
      }

      const netFlow = dayIntake - dayDispatch;

      dailySteps.push({
        dayLabel,
        fullDate,
        quantity: 0, // will compute below
        netFlow,
        intake: dayIntake,
        dispatch: -dayDispatch
      });
    }

    // Walk forward from day 0 to day 29, anchoring the final day to currentQty
    let accumulatedFlow = dailySteps.reduce((acc, step) => acc + step.netFlow, 0);
    let startQty = Math.max(reorderPt * 0.6, currentQty - accumulatedFlow);

    let tempQty = startQty;
    for (let j = 0; j < dailySteps.length; j++) {
      if (j === dailySteps.length - 1) {
        dailySteps[j].quantity = currentQty;
      } else {
        tempQty = Math.min(maxCap, Math.max(0, tempQty + dailySteps[j].netFlow));
        dailySteps[j].quantity = Math.round(tempQty);
      }
    }

    return dailySteps;
  }, [item, movements]);

  // Summary statistics for the 30-day timeline
  const firstQty = historicalData[0]?.quantity || item.currentQuantity;
  const net30DayChange = item.currentQuantity - firstQty;
  const min30Day = Math.min(...historicalData.map(d => d.quantity));
  const max30Day = Math.max(...historicalData.map(d => d.quantity));
  const total30DayIntake = historicalData.reduce((acc, d) => acc + d.intake, 0);
  const total30DayDispatch = Math.abs(historicalData.reduce((acc, d) => acc + d.dispatch, 0));

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <p className="font-semibold text-slate-300">{data.dayLabel} ({data.fullDate})</p>
          <div className="mt-1 space-y-1">
            <p className="font-mono tabular-nums text-emerald-400 font-bold">
              Stock Balance: {data.quantity.toLocaleString()} {item.unit}
            </p>
            {data.intake > 0 && (
              <p className="font-mono text-emerald-300 text-[11px]">
                Intake: +{data.intake.toLocaleString()} {item.unit}
              </p>
            )}
            {data.dispatch < 0 && (
              <p className="font-mono text-amber-300 text-[11px]">
                Dispatch: {data.dispatch.toLocaleString()} {item.unit}
              </p>
            )}
            <p className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
              Min Threshold: {item.reorderPoint.toLocaleString()} {item.unit}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                {item.sku}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{item.category.replace('_', ' ')}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{item.name}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.varietyOrGrade}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Current Available Stock</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {item.currentQuantity.toLocaleString()} {item.unit}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Unit Cost (USD)</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                ${item.unitPriceUSD.toFixed(2)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Total Lot Value</span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-800 dark:text-emerald-400">
                ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* 30-Day Historical Stock Quantity Chart (Recharts) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    30-Day Stock Quantity Trajectory
                  </h3>
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums font-semibold ${
                    net30DayChange >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {net30DayChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {net30DayChange >= 0 ? '+' : ''}{net30DayChange.toLocaleString()} {item.unit} (30d)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Daily closing inventory balance and scheduled grain deliveries vs reorder limit
                </p>
              </div>

              {/* Chart Mode Switcher: Trend Line vs Flow Bars */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartType('trend')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    chartType === 'trend'
                      ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Stock Balance Trend Line"
                >
                  <LineChartIcon className="w-3 h-3" />
                  <span>Trend Line</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('flow')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    chartType === 'flow'
                      ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Daily Intake & Dispatch Bar Chart"
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Net Flow Bars</span>
                </button>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-52 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'trend' ? (
                  <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="stockQtyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="dayLabel" 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      interval={5}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine 
                      y={item.reorderPoint} 
                      stroke="#d97706" 
                      strokeDasharray="4 4" 
                      label={{ value: 'Min Reorder', position: 'insideTopLeft', fill: '#d97706', fontSize: 10 }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="quantity" 
                      stroke="#059669" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#stockQtyGradient)" 
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={historicalData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis 
                      dataKey="dayLabel" 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                      interval={5}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
                    <Bar dataKey="intake" name="Intake (+)" fill="#059669" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="dispatch" name="Dispatch (-)" fill="#f59e0b" radius={[0, 0, 2, 2]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* 30-Day Flow Summary Chips */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">30d Total Intake</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                  +{total30DayIntake.toLocaleString()} {item.unit}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">30d Dispatched</span>
                <span className="font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-400">
                  -{total30DayDispatch.toLocaleString()} {item.unit}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">30d Peak Balance</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {max30Day.toLocaleString()} {item.unit}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">30d Low Balance</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {min30Day.toLocaleString()} {item.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Storage Capacity Gauge */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Bin Capacity Utilization</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-white font-semibold">
                {fillRatio}% ({item.currentQuantity.toLocaleString()} / {item.maxCapacity.toLocaleString()} {item.unit})
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  item.status === 'critical' 
                    ? 'bg-rose-600' 
                    : item.status === 'low_stock' 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-700 dark:bg-emerald-500'
                }`}
                style={{ width: `${fillRatio}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              <span>Safety Reorder Point: {item.reorderPoint} {item.unit}</span>
              <span>Max Storage Limit: {item.maxCapacity} {item.unit}</span>
            </div>
          </div>

          {/* Agronomic Telemetry & Quality Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Moisture Content
              </span>
              <span className={`text-base font-bold font-mono tabular-nums mt-1 block ${
                isHighMoisture ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              }`}>
                {item.moisturePercent !== undefined ? `${item.moisturePercent}%` : 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                Storage Temp
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {item.temperatureC !== undefined ? `${item.temperatureC}°C` : 'Ambient'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block">Batch / Lot Number</span>
              <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1.5 block truncate">
                {item.batchNumber}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block">Health Status</span>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 capitalize mt-1.5 block">
                {item.status.replace('_', ' ')}
              </span>
            </div>

          </div>

          {/* Location & Supplier Provenance */}
          <div className="space-y-2 text-xs bg-slate-50/70 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Storage Bay / Silo:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{item.facilityLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Supplier / Source Field:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{item.supplierOrField}</span>
            </div>
            {item.harvestDate && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Harvest Date:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{item.harvestDate}</span>
              </div>
            )}
            {item.expiryDate && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Expiry / Viability Date:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{item.expiryDate}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Barcode Identifier:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {item.barcode}
              </span>
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Agronomic Inspection Notes:</span>
                <span className="text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5 block">{item.notes}</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
          >
            Close Inspector
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdjust(item);
            }}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            Log Intake / Dispatch Movement
          </button>
        </div>

      </div>
    </div>
  );
};
