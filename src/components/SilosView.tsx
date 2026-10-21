import React, { useState } from 'react';
import { 
  Building2, 
  Droplets, 
  Thermometer, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Power,
  RotateCcw,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { SiloTelemetry } from '../types/inventory';

interface SilosViewProps {
  silos: SiloTelemetry[];
  onUpdateSiloAeration: (siloId: string, status: 'active' | 'nominal' | 'idle' | 'warning') => void;
}

export const SilosView: React.FC<SilosViewProps> = ({ silos, onUpdateSiloAeration }) => {
  const [selectedSiloId, setSelectedSiloId] = useState<string>(silos[0]?.id || '');
  const selectedSilo = silos.find(s => s.id === selectedSiloId) || silos[0];

  const totalCapacity = silos.reduce((a, b) => a + b.capacityMT, 0);
  const totalOccupied = silos.reduce((a, b) => a + b.currentMT, 0);
  const totalFree = totalCapacity - totalOccupied;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Grain Silos & Bulk Storage Facilities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aeration fan management, multi-depth temperature cable sensor telemetry, and grain moisture monitoring
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400">Total Facility Load: </span>
            <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{totalOccupied.toLocaleString()} MT</strong>
            <span className="text-slate-400 dark:text-slate-500"> ({((totalOccupied / totalCapacity) * 100).toFixed(1)}%)</span>
          </div>
          <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400">Available Headroom: </span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">{totalFree.toLocaleString()} MT</strong>
          </div>
        </div>
      </div>

      {/* Silos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {silos.map((silo) => {
          const fillRatio = Math.round((silo.currentMT / silo.capacityMT) * 100);
          const isHighMoisture = silo.moisturePercent > silo.optimalMoistureMax;
          const isSelected = silo.id === selectedSilo.id;

          return (
            <div
              key={silo.id}
              onClick={() => setSelectedSiloId(silo.id)}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 transition-all shadow-2xs cursor-pointer ${
                isSelected
                  ? 'border-emerald-700 dark:border-emerald-500 ring-2 ring-emerald-700/20 dark:ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{silo.name}</h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium mt-0.5">{silo.cropStored}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                  silo.aerationStatus === 'warning'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                    : silo.aerationStatus === 'active'
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {silo.aerationStatus}
                </span>
              </div>

              {/* Graphic Silo Tank Tank Representation */}
              <div className="mt-4 flex items-center gap-4">
                <div className="w-16 h-28 bg-slate-100 dark:bg-slate-800 rounded-t-xl rounded-b-lg border border-slate-300 dark:border-slate-700 relative overflow-hidden flex flex-col justify-end shrink-0 shadow-inner">
                  <div
                    className={`w-full transition-all duration-700 ${
                      isHighMoisture ? 'bg-amber-600' : 'bg-emerald-700 dark:bg-emerald-500'
                    }`}
                    style={{ height: `${fillRatio}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-mono font-bold text-white drop-shadow-md">
                      {fillRatio}%
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Current Stored:</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                      {silo.currentMT.toLocaleString()} <span className="font-normal text-xs text-slate-500 dark:text-slate-400">/ {silo.capacityMT.toLocaleString()} MT</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      Moisture:
                    </span>
                    <span className={`font-mono tabular-nums font-semibold ${isHighMoisture ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {silo.moisturePercent}% <span className="text-[10px] text-slate-400 dark:text-slate-500">(Max: {silo.optimalMoistureMax}%)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                      Avg Core Temp:
                    </span>
                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {silo.internalTempC}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Aeration Toggle Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {silo.cableSensorReadings.length} sensor probes active
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus = silo.aerationStatus === 'active' ? 'idle' : 'active';
                    onUpdateSiloAeration(silo.id, nextStatus);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
                    silo.aerationStatus === 'active'
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Wind className="w-3 h-3" />
                  <span>{silo.aerationStatus === 'active' ? 'Stop Fan' : 'Start Aeration'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Silo Detailed Telemetry & Cable Probes Inspector */}
      {selectedSilo && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedSilo.name} — Sensor Telemetry & Aeration Suite
                </h2>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                  {selectedSilo.facility}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Monitoring biological respiration, insect hotspot risks, and aeration fan static pressure
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSiloAeration(selectedSilo.id, 'active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedSilo.aerationStatus === 'active'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Force Active Drying
              </button>
              <button
                onClick={() => onUpdateSiloAeration(selectedSilo.id, 'nominal')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedSilo.aerationStatus === 'nominal'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Auto Ventilation
              </button>
              <button
                onClick={() => onUpdateSiloAeration(selectedSilo.id, 'idle')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedSilo.aerationStatus === 'idle'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Fan Idle
              </button>
            </div>
          </div>

          {/* Cable Sensors Across Depths */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Vertical Temperature Probes Cable Array (Down to Silo Cone)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedSilo.cableSensorReadings.map((probe, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>Probe Node #{idx + 1}</span>
                    <span className="font-mono tabular-nums">{probe.depthMeters}m depth</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Grain Temp:</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {probe.tempC}°C
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Thermal gradient normal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agricultural Moisture Safety Standards Reference */}
          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Agronomic Storage Invariants: </span>
            Hard Red Wheat & Malt Barley safe storage limit is $\le 13.5\%$. Yellow Dent Corn requires active conditioning when $\gt 14.0\%$. Canola oilseed safe bin threshold is $10.0\%$.
          </div>
        </div>
      )}

    </div>
  );
};
