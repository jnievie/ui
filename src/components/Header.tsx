import React, { useState } from 'react';
import { 
  Wheat, 
  User, 
  LogOut, 
  Plus, 
  ChevronDown, 
  Check, 
  Building2, 
  Moon, 
  Sun 
} from 'lucide-react';
import { UserProfile } from '../types/inventory';
import { DEMO_USERS } from '../data/mockAgriculturalData';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  onOpenAddModal: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onUserChange,
  onOpenAddModal,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Strict Top Bar Contract: Zone 1 (Brand) — Zone 2 (4-5 Nav Links) — Zone 3 (1 Primary Action / Profile & Controls) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single-element brand wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Wheat className="w-4 h-4 text-emerald-100" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            AgriStock<span className="text-emerald-700 dark:text-emerald-400 font-semibold ml-1">OS</span>
          </span>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold border-b-2 border-emerald-800 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('inventory')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'inventory'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold border-b-2 border-emerald-800 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inventory & Stocks
          </button>
          <button
            onClick={() => onTabChange('silos')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'silos'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold border-b-2 border-emerald-800 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Silos & Storage
          </button>
          <button
            onClick={() => onTabChange('movements')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'movements'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold border-b-2 border-emerald-800 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Stock Movements
          </button>
          <button
            onClick={() => onTabChange('system-design')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'system-design'
                ? 'text-emerald-800 dark:text-emerald-400 font-semibold border-b-2 border-emerald-800 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            UI System & Python API
          </button>
        </nav>

        {/* Zone 3: Primary action + Night Toggle + User profile trigger */}
        <div className="flex items-center gap-2.5 shrink-0 relative">
          
          {/* Night / Day Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center border border-transparent dark:border-slate-800"
            title={isDarkMode ? 'Switch to Day Light Mode' : 'Switch to Night Operations Mode (Harvest / Control Room)'}
            aria-label="Toggle Night Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in zoom-in-75 duration-150" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-in zoom-in-75 duration-150" />
            )}
          </button>

          <button
            onClick={onOpenAddModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-md transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Intake Stock</span>
          </button>

          {/* User profile button */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              title="User Account & Switch Role"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <span className="hidden lg:block text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile & Switcher Dropdown */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{currentUser.role}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.facility}</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </div>

                {DEMO_USERS.map((usr) => (
                  <button
                    key={usr.id}
                    onClick={() => {
                      onUserChange(usr);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      usr.id === currentUser.id 
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-medium' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{usr.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{usr.role}</p>
                    </div>
                    {usr.id === currentUser.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out to Login Screen</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-slate-800 gap-3 text-xs font-medium text-slate-600 dark:text-slate-400 no-scrollbar">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${currentTab === 'dashboard' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('inventory')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${currentTab === 'inventory' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Inventory & Stocks
        </button>
        <button
          onClick={() => onTabChange('silos')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${currentTab === 'silos' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Silos
        </button>
        <button
          onClick={() => onTabChange('movements')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${currentTab === 'movements' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Movements
        </button>
        <button
          onClick={() => onTabChange('system-design')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${currentTab === 'system-design' ? 'bg-emerald-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          UI & Python
        </button>
      </div>
    </header>
  );
};
