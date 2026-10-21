import React, { useState } from 'react';
import { Wheat, Lock, Mail, Building2, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types/inventory';
import { DEMO_USERS } from '../data/mockAgriculturalData';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(DEMO_USERS[0]);
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState('••••••••••••');
  const [facility, setFacility] = useState(DEMO_USERS[0].facility);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectDemoUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEmail(user.email);
    setFacility(user.facility);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedUser);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center relative overflow-hidden">
      {/* Background imagery with measured contrast scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/agri_hero_silo_1792591351016.jpg"
          alt="Agricultural Silos and Prairie Farm"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/85 to-slate-900/70" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: System Overview & Agricultural Mission */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-700/50 rounded-md text-emerald-400 text-xs font-medium">
              <Wheat className="w-3.5 h-3.5 text-emerald-400" />
              <span>AgriStock Enterprise Terminal</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Grain, Seed & Fertilizer Stock Logistics
              </h1>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Centralized inventory monitoring for commercial grain elevators, cold storage bays, and bulk agricultural inputs. Built with HTML5/CSS and a high-throughput Python backend.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-lg backdrop-blur-xs">
                <span className="block text-xs text-slate-400">Total Capacity</span>
                <span className="text-lg font-semibold text-white font-mono tabular-nums">18,500 MT</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-lg backdrop-blur-xs">
                <span className="block text-xs text-slate-400">Telemetry Silos</span>
                <span className="text-lg font-semibold text-white font-mono tabular-nums">6 Active</span>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-lg backdrop-blur-xs">
                <span className="block text-xs text-slate-400">Inventory Value</span>
                <span className="text-lg font-semibold text-emerald-400 font-mono tabular-nums">$1.84M</span>
              </div>
            </div>

            {/* Quick Role Profiles */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Operational Role for Fast Sign-In:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_USERS.map((usr) => (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => handleSelectDemoUser(usr)}
                    className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      selectedUser.id === usr.id
                        ? 'bg-emerald-900/60 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-xs font-medium text-white truncate">{usr.name}</p>
                    <p className="text-[11px] text-emerald-400/90 truncate">{usr.role}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Clean Authentication Form */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-200">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Terminal Sign In
                  </h2>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Python API v1.4
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate using your farm operator credentials or switch demo roles above.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Station Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Operator Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all text-slate-900"
                      placeholder="operator@agristock.farm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all text-slate-900 font-mono"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                {/* Storage Facility Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Assigned Farm / Elevator Facility
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all text-slate-900 cursor-pointer"
                    >
                      <option value="Central Grain Terminal - Hub A">Central Grain Terminal - Hub A (6 Silos)</option>
                      <option value="West Prairie Elevator #4">West Prairie Elevator #4 (Grain Elevators)</option>
                      <option value="Green Valley Silos & Research">Green Valley Silos & Research (Seed Bins)</option>
                      <option value="Delta Cold Storage Depot">Delta Cold Storage Depot (Cold Bays)</option>
                    </select>
                  </div>
                </div>

                {/* Remember and Recovery */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberTerminal}
                      onChange={(e) => setRememberTerminal(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>Remember terminal station</span>
                  </label>
                  <span className="text-slate-400">Offline fallback enabled</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In as {selectedUser.name.split(' ')[0]}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>256-Bit Encrypted AgSession</span>
                </span>
                <span>FastAPI + SQLAlchemy Ready</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-slate-400">
        AgriStock OS · Enterprise Agricultural Inventory, Grain Silos & Stock Checking System
      </footer>
    </div>
  );
};
