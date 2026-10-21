import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCw, 
  AlertOctagon, 
  Search, 
  Plus, 
  Filter, 
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import { StockMovement, StockItem } from '../types/inventory';

interface MovementsViewProps {
  movements: StockMovement[];
  stockItems: StockItem[];
  onOpenAdjustModal: (item?: StockItem) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  stockItems,
  onOpenAdjustModal
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      if (filterType !== 'all' && mov.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          mov.itemName.toLowerCase().includes(q) ||
          mov.referenceNo.toLowerCase().includes(q) ||
          mov.batchNumber.toLowerCase().includes(q) ||
          mov.performedBy.toLowerCase().includes(q) ||
          mov.fromLocation.toLowerCase().includes(q) ||
          mov.toLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [movements, filterType, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Stock Movements & Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable traceability ledger for grain truck intake, railcar dispatches, and warehouse transfers
          </p>
        </div>

        <button
          onClick={() => onOpenAdjustModal()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record New Movement</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference #, grain/seed name, batch, or destination..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-800 dark:focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'harvest_intake', label: 'Inbound Intake' },
            { id: 'dispatch_sale', label: 'Outbound Dispatches' },
            { id: 'internal_transfer', label: 'Transfers' },
            { id: 'adjustment_loss', label: 'Loss & Discards' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Movement Type</th>
                <th className="py-3 px-3">Agricultural Item & Lot</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Origin & Destination</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Reference No</th>
                <th className="py-3 px-4">Agronomic Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    No movement records found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isInbound = mov.type === 'harvest_intake';
                  const isOutbound = mov.type === 'dispatch_sale';
                  const isTransfer = mov.type === 'internal_transfer';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono tabular-nums">
                        {mov.timestamp}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          isInbound
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : isOutbound
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : isTransfer
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {isInbound && <ArrowDownLeft className="w-3 h-3" />}
                          {isOutbound && <ArrowUpRight className="w-3 h-3" />}
                          {isTransfer && <RotateCw className="w-3 h-3" />}
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{mov.itemName}</div>
                        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{mov.batchNumber}</div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono tabular-nums font-bold ${
                          isInbound 
                            ? 'text-emerald-700 dark:text-emerald-400' 
                            : isOutbound 
                            ? 'text-blue-700 dark:text-blue-400' 
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {isInbound ? '+' : isOutbound ? '-' : ''}{mov.quantity.toLocaleString()} {mov.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs">
                        <div className="truncate text-slate-700 dark:text-slate-300">From: {mov.fromLocation}</div>
                        <div className="truncate text-emerald-800 dark:text-emerald-400 font-medium">To: {mov.toLocation}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {mov.performedBy}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {mov.referenceNo}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={mov.reason}>
                        {mov.reason || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
