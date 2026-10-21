import React, { useState, useEffect } from 'react';
import { 
  StockItem, 
  SiloTelemetry, 
  StockMovement, 
  UserProfile 
} from './types/inventory';
import { 
  DEMO_USERS, 
  INITIAL_STOCK_ITEMS, 
  INITIAL_SILOS, 
  INITIAL_MOVEMENTS 
} from './data/mockAgriculturalData';

import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { SilosView } from './components/SilosView';
import { MovementsView } from './components/MovementsView';
import { SystemDesignView } from './components/SystemDesignView';

import { StockDetailModal } from './components/StockDetailModal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { AddItemModal } from './components/AddItemModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';

import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  // Authentication & Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[0]);

  // Night / Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('agristock_night_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agristock_night_mode', String(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Night mode sync failed:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      showToast(next ? 'Night Operations Mode enabled' : 'Day Light Mode enabled', 'info');
      return next;
    });
  };

  // Current View Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core Agricultural State (persisted to localStorage)
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem('agristock_items_v1');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  const [silos, setSilos] = useState<SiloTelemetry[]>(() => {
    try {
      const saved = localStorage.getItem('agristock_silos_v1');
      return saved ? JSON.parse(saved) : INITIAL_SILOS;
    } catch {
      return INITIAL_SILOS;
    }
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem('agristock_movements_v1');
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  // Modal Dialogs State
  const [inspectedItem, setInspectedItem] = useState<StockItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Toast Notification System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agristock_items_v1', JSON.stringify(stockItems));
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [stockItems]);

  useEffect(() => {
    try {
      localStorage.setItem('agristock_silos_v1', JSON.stringify(silos));
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [silos]);

  useEffect(() => {
    try {
      localStorage.setItem('agristock_movements_v1', JSON.stringify(movements));
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [movements]);

  // Handler: Add New Stock
  const handleAddNewStock = (newItemData: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...newItemData,
      id: `stk-${Date.now()}`
    };

    setStockItems(prev => [newItem, ...prev]);

    // Also record an intake movement
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      type: 'harvest_intake',
      itemId: newItem.id,
      itemName: newItem.name,
      batchNumber: newItem.batchNumber,
      quantity: newItem.currentQuantity,
      unit: newItem.unit,
      fromLocation: newItem.supplierOrField,
      toLocation: newItem.facilityLocation,
      performedBy: currentUser.name,
      referenceNo: `INIT-${Math.floor(1000 + Math.random() * 9000)}`,
      reason: 'Initial stock intake into system inventory ledger'
    };

    setMovements(prev => [newMovement, ...prev]);
    showToast(`Added ${newItem.name} (${newItem.currentQuantity} ${newItem.unit}) to inventory`, 'success');
  };

  // Handler: Record Stock Adjustment / Movement
  const handleRecordMovement = (data: {
    itemId: string;
    type: 'harvest_intake' | 'dispatch_sale' | 'internal_transfer' | 'adjustment_loss';
    quantity: number;
    fromLocation: string;
    toLocation: string;
    reason: string;
    referenceNo: string;
  }) => {
    const targetItem = stockItems.find(i => i.id === data.itemId);
    if (!targetItem) return;

    let newQuantity = targetItem.currentQuantity;
    if (data.type === 'harvest_intake') {
      newQuantity += data.quantity;
    } else if (data.type === 'dispatch_sale' || data.type === 'adjustment_loss') {
      newQuantity = Math.max(0, targetItem.currentQuantity - data.quantity);
    } // internal_transfer keeps the total quantity identical but logs movement

    // Calculate new status
    let newStatus = targetItem.status;
    if (newQuantity <= targetItem.reorderPoint * 0.5) {
      newStatus = 'critical';
    } else if (newQuantity <= targetItem.reorderPoint) {
      newStatus = 'low_stock';
    } else if (newQuantity >= targetItem.maxCapacity * 0.95) {
      newStatus = 'surplus';
    } else {
      newStatus = 'optimal';
    }

    // Update item
    setStockItems(prev => prev.map(item => {
      if (item.id === data.itemId) {
        return {
          ...item,
          currentQuantity: newQuantity,
          status: newStatus
        };
      }
      return item;
    }));

    // If item is assigned to a Silo, update Silo currentMT
    if (targetItem.unit === 'MT') {
      setSilos(prev => prev.map(s => {
        if (s.name.includes(targetItem.facilityLocation) || targetItem.facilityLocation.includes(s.name.slice(0, 8))) {
          return {
            ...s,
            currentMT: Math.min(s.capacityMT, Math.max(0, Math.round(newQuantity)))
          };
        }
        return s;
      }));
    }

    // Record movement log
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      type: data.type,
      itemId: targetItem.id,
      itemName: targetItem.name,
      batchNumber: targetItem.batchNumber,
      quantity: data.quantity,
      unit: targetItem.unit,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      performedBy: currentUser.name,
      referenceNo: data.referenceNo,
      reason: data.reason
    };

    setMovements(prev => [newMovement, ...prev]);

    const actionVerb = data.type === 'harvest_intake' ? 'Intake recorded' : data.type === 'dispatch_sale' ? 'Dispatch completed' : 'Movement recorded';
    showToast(`${actionVerb}: ${data.quantity} ${targetItem.unit} of ${targetItem.name}`, 'success');
  };

  // Handler: Silo Aeration fan toggle
  const handleUpdateSiloAeration = (siloId: string, status: 'active' | 'nominal' | 'idle' | 'warning') => {
    setSilos(prev => prev.map(s => {
      if (s.id === siloId) {
        return {
          ...s,
          aerationStatus: status,
          lastInspected: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return s;
    }));

    const silo = silos.find(s => s.id === siloId);
    showToast(`Aeration mode set to "${status.toUpperCase()}" for ${silo?.name || 'Silo'}`, 'info');
  };

  // If user is logged out, render the LoginView
  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          setCurrentTab('dashboard');
          showToast(`Welcome back, ${user.name} (${user.role})`, 'success');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#0b1320] flex flex-col text-slate-900 dark:text-slate-100 transition-colors ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Strict Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
        onUserChange={(usr) => {
          setCurrentUser(usr);
          showToast(`Switched active terminal operator to ${usr.name}`, 'info');
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onLogout={() => {
          setIsAuthenticated(false);
          showToast('Logged out of agricultural terminal', 'info');
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            stockItems={stockItems}
            silos={silos}
            movements={movements}
            currentUser={currentUser}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSelectItem={(item) => setInspectedItem(item)}
            onSelectSilo={() => setCurrentTab('silos')}
            onOpenAdjustModal={(item) => {
              setAdjustItem(item);
              setIsAdjustModalOpen(true);
            }}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            stockItems={stockItems}
            onSelectItem={(item) => setInspectedItem(item)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenAdjustModal={(item) => {
              setAdjustItem(item);
              setIsAdjustModalOpen(true);
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentTab === 'silos' && (
          <SilosView
            silos={silos}
            onUpdateSiloAeration={handleUpdateSiloAeration}
          />
        )}

        {currentTab === 'movements' && (
          <MovementsView
            movements={movements}
            stockItems={stockItems}
            onOpenAdjustModal={(item) => {
              setAdjustItem(item || stockItems[0]);
              setIsAdjustModalOpen(true);
            }}
          />
        )}

        {currentTab === 'system-design' && (
          <SystemDesignView
            stockItems={stockItems}
            silos={silos}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">AgriStock OS</span>
            <span aria-hidden="true">·</span>
            <span>Frontend: HTML5 / Modern CSS</span>
            <span aria-hidden="true">·</span>
            <span>Backend: Python FastAPI / SQLAlchemy</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              {isDarkMode ? 'Night Mode Active' : 'Day Mode Active'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>Terminal: {currentUser.facility}</span>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-emerald-800 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              Sign Out to Login Screen
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {inspectedItem && (
        <StockDetailModal
          item={inspectedItem}
          movements={movements}
          onClose={() => setInspectedItem(null)}
          onOpenAdjust={(item) => {
            setAdjustItem(item);
            setIsAdjustModalOpen(true);
          }}
        />
      )}

      {isAdjustModalOpen && (
        <AdjustStockModal
          initialItem={adjustItem}
          allItems={stockItems}
          currentUser={currentUser}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setAdjustItem(null);
          }}
          onSubmit={handleRecordMovement}
        />
      )}

      {isAddModalOpen && (
        <AddItemModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddNewStock}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal
          stockItems={stockItems}
          onClose={() => setIsScannerOpen(false)}
          onItemScanned={(item) => {
            setInspectedItem(item);
            showToast(`Scanned tag for ${item.name}`, 'info');
          }}
        />
      )}

      {/* Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-800 animate-in slide-in-from-bottom-2 duration-150">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
