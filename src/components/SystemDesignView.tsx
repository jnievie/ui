import React, { useState } from 'react';
import { 
  Palette, 
  Code2, 
  Terminal, 
  Layers, 
  Database, 
  Server, 
  Play, 
  Copy, 
  Check, 
  FileText, 
  Cpu, 
  Wheat, 
  ExternalLink,
  Sliders,
  Sparkles
} from 'lucide-react';
import { StockItem, SiloTelemetry } from '../types/inventory';

interface SystemDesignViewProps {
  stockItems: StockItem[];
  silos: SiloTelemetry[];
}

export const SystemDesignView: React.FC<SystemDesignViewProps> = ({
  stockItems,
  silos
}) => {
  const [activeTab, setActiveTab] = useState<'ui-design' | 'python-backend' | 'api-playground'>('ui-design');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedPythonFile, setSelectedPythonFile] = useState<string>('main.py');
  
  // Interactive API Simulator State
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/v1/inventory/stocks');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiFilterCategory, setApiFilterCategory] = useState<string>('all');
  const [apiExecutionResult, setApiExecutionResult] = useState<any>(null);
  const [isExecutingApi, setIsExecutingApi] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const executeApiSimulation = () => {
    setIsExecutingApi(true);
    setTimeout(() => {
      setIsExecutingApi(false);

      if (apiEndpoint === '/api/v1/inventory/stocks') {
        const filtered = apiFilterCategory === 'all'
          ? stockItems
          : stockItems.filter(i => i.category === apiFilterCategory);
        
        setApiExecutionResult({
          status_code: 200,
          latency_ms: 12.4,
          python_handler: "app.api.v1.inventory.get_stock_inventory()",
          sql_query: `SELECT id, sku, name, variety, current_quantity, unit, moisture_pct, status FROM stocks ${apiFilterCategory !== 'all' ? `WHERE category = '${apiFilterCategory}'` : ''} ORDER BY updated_at DESC LIMIT 50;`,
          data: {
            total_count: filtered.length,
            page: 1,
            page_size: 50,
            facility: "Central Grain Terminal - Hub A",
            items: filtered.map(item => ({
              id: item.id,
              sku: item.sku,
              name: item.name,
              category: item.category,
              batch_number: item.batchNumber,
              current_quantity: item.currentQuantity,
              reorder_point: item.reorderPoint,
              unit: item.unit,
              moisture_pct: item.moisturePercent,
              status: item.status
            }))
          }
        });
      } else if (apiEndpoint === '/api/v1/silos/telemetry') {
        setApiExecutionResult({
          status_code: 200,
          latency_ms: 8.7,
          python_handler: "app.api.v1.silos.get_silo_telemetry()",
          sql_query: "SELECT silos.*, array_agg(probes.temp_c) as probe_temps FROM silos JOIN cable_probes probes ON silos.id = probes.silo_id GROUP BY silos.id;",
          data: {
            facility_id: "FAC-CENTRAL-01",
            active_silos_count: silos.length,
            aggregate_tonnage_mt: silos.reduce((a, b) => a + b.currentMT, 0),
            capacity_utilization_pct: 80.1,
            silos: silos.map(s => ({
              silo_id: s.id,
              name: s.name,
              crop_stored: s.cropStored,
              fill_tonnage_mt: s.currentMT,
              capacity_mt: s.capacityMT,
              moisture_pct: s.moisturePercent,
              optimal_max_moisture: s.optimalMoistureMax,
              aeration_status: s.aerationStatus,
              cable_sensor_probes: s.cableSensorReadings
            }))
          }
        });
      } else if (apiEndpoint === '/api/v1/inventory/reorder-alerts') {
        const alerts = stockItems.filter(i => i.status === 'low_stock' || i.status === 'critical');
        setApiExecutionResult({
          status_code: 200,
          latency_ms: 14.1,
          python_handler: "app.api.v1.inventory.get_reorder_alerts()",
          sql_query: "SELECT * FROM stocks WHERE current_quantity <= reorder_point OR status = 'critical';",
          data: {
            alert_count: alerts.length,
            critical_severity_count: alerts.filter(i => i.status === 'critical').length,
            alerts: alerts.map(i => ({
              sku: i.sku,
              item_name: i.name,
              deficit_quantity: i.reorderPoint - i.currentQuantity,
              unit: i.unit,
              suggested_supplier: i.supplierOrField,
              priority: i.status === 'critical' ? 'HIGH_URGENT' : 'STANDARD_REORDER'
            }))
          }
        });
      }
    }, 280);
  };

  // Color Tokens
  const COLOR_TOKENS = [
    { name: 'Field Pine (Primary Brand)', hex: '#144026', bg: 'bg-[#144026]', text: 'text-white', role: 'Primary buttons, active indicators, brand logo' },
    { name: 'Emerald Canopy (Secondary)', hex: '#166534', bg: 'bg-[#166534]', text: 'text-white', role: 'Sub-headers, optimal status badges, hover accents' },
    { name: 'Prairie Amber (Warning / Moisture)', hex: '#D97706', bg: 'bg-[#D97706]', text: 'text-white', role: 'High grain moisture warning, low stock reorder' },
    { name: 'Grain Rust (Critical Alert)', hex: '#DC2626', bg: 'bg-[#DC2626]', text: 'text-white', role: 'Depleted bins, chemical out-of-stock, safety risks' },
    { name: 'Silo Steel (Structural Neutral)', hex: '#334155', bg: 'bg-[#334155]', text: 'text-white', role: 'Elevator frames, terminal icons, technical labels' },
    { name: 'Soil Loam (Earthy Dark)', hex: '#0F172A', bg: 'bg-[#0F172A]', text: 'text-white', role: 'High contrast text, terminal background, code viewer' },
    { name: 'Wheat Parchment (Surface)', hex: '#F8FAFC', bg: 'bg-[#F8FAFC]', text: 'text-slate-800', role: 'Main canvas, card panels, table alternate stripes' },
  ];

  // Python Code Samples
  const PYTHON_FILES: Record<string, { desc: string; code: string }> = {
    'main.py': {
      desc: 'FastAPI application initialization, CORS middleware, lifespan startup, and API routers mounting',
      code: `"""
AgriStock OS - Enterprise Agriculture Inventory & Silo Telemetry Backend
Framework: FastAPI (Python 3.12+)
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.api.v1.inventory import router as inventory_router
from app.api.v1.silos import router as silos_router
from app.core.database import init_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # Initialize connection pool & verify database schema
    print("🌾 Starting AgriStock OS Python backend...")
    await init_db()
    yield
    print("🚜 Gracefully terminating database connections...")
    await close_db()

app = FastAPI(
    title="AgriStock OS Inventory API",
    description="Backend services for agricultural stock check, grain silos, and harvest logistics",
    version="1.4.0",
    lifespan=lifespan
)

# CORS configuration for HTML/CSS/Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(inventory_router, prefix="/api/v1/inventory", tags=["Agricultural Stocks"])
app.include_router(silos_router, prefix="/api/v1/silos", tags=["Grain Silos & Probes"])

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "agristock-python-core",
        "database": "connected",
        "telemetry_stream": "active"
    }`
    },
    'models/inventory.py': {
      desc: 'SQLAlchemy 2.0 ORM models for agricultural inventory, batches, and movements',
      code: `"""
SQLAlchemy 2.0 ORM Database Models for Agriculture
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import enum

class Base(DeclarativeBase):
    pass

class StockCategoryEnum(str, enum.Enum):
    GRAINS = "grains"
    SEEDS = "seeds"
    FERTILIZERS = "fertilizers"
    CROP_PROTECTION = "crop_protection"
    FRESH_PRODUCE = "fresh_produce"
    LIVESTOCK_FEED = "livestock_feed"
    FUEL_SUPPLIES = "fuel_supplies"

class StockStatusEnum(str, enum.Enum):
    OPTIMAL = "optimal"
    LOW_STOCK = "low_stock"
    CRITICAL = "critical"
    SURPLUS = "surplus"

class AgriculturalStock(Base):
    __tablename__ = "agricultural_stocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    variety_or_grade: Mapped[str] = mapped_column(String(128))
    category: Mapped[StockCategoryEnum] = mapped_column(SQLEnum(StockCategoryEnum))
    batch_number: Mapped[str] = mapped_column(String(64), index=True)
    facility_location: Mapped[str] = mapped_column(String(128))
    
    # Quantities and Thresholds
    current_quantity: Mapped[float] = mapped_column(Float, default=0.0)
    reorder_point: Mapped[float] = mapped_column(Float, default=0.0)
    max_capacity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(32))  # "MT", "50kg Bags", "Liters"
    unit_price_usd: Mapped[float] = mapped_column(Float)
    
    # Agronomic Quality Attributes
    moisture_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    germination_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    storage_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    harvest_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    supplier_or_field: Mapped[str] = mapped_column(String(128))
    barcode: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[StockStatusEnum] = mapped_column(SQLEnum(StockStatusEnum), default=StockStatusEnum.OPTIMAL)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)`
    },
    'schemas/stock.py': {
      desc: 'Pydantic v2 schemas for stock checking, payload validation, and responses',
      code: `"""
Pydantic v2 Data Validation Schemas for Stock & Grain Logistics
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class StockBase(BaseModel):
    sku: str = Field(..., example="GRN-WHT-2026-01")
    name: str = Field(..., example="Hard Red Winter Wheat")
    variety_or_grade: str = Field(..., example="Grade #1 Canadian Western")
    category: str
    facility_location: str
    current_quantity: float = Field(..., ge=0)
    reorder_point: float = Field(..., ge=0)
    max_capacity: float = Field(..., gt=0)
    unit: str = Field(..., example="MT")
    unit_price_usd: float = Field(..., ge=0)
    moisture_percent: Optional[float] = Field(None, ge=0, le=100)

class StockCreate(StockBase):
    batch_number: str
    supplier_or_field: str
    barcode: str
    notes: Optional[str] = None

class StockAdjustmentRequest(BaseModel):
    item_id: str
    movement_type: str = Field(..., pattern="^(harvest_intake|dispatch_sale|internal_transfer|adjustment_loss)$")
    quantity_delta: float = Field(..., gt=0)
    performed_by: str
    from_location: str
    to_location: str
    reason: Optional[str] = None

class StockCheckResponse(StockBase):
    id: str
    batch_number: str
    status: str
    total_valuation_usd: float
    is_low_stock: bool
    is_high_moisture: bool

    model_config = ConfigDict(from_attributes=True)`
    },
    'api/v1/inventory.py': {
      desc: 'FastAPI route controllers for querying stocks, checking inventory, and movements',
      code: `"""
FastAPI REST Endpoints for Agricultural Stock Management
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.inventory import AgriculturalStock, StockStatusEnum
from app.schemas.stock import StockCheckResponse, StockCreate, StockAdjustmentRequest

router = APIRouter()

@router.get("/stocks", response_model=List[StockCheckResponse])
def get_stocks(
    category: Optional[str] = Query(None, description="Filter by crop category"),
    status: Optional[str] = Query(None, description="Filter by stock health status"),
    search: Optional[str] = Query(None, description="Search crop name, SKU, or batch"),
    db: Session = Depends(get_db)
):
    """
    Check current inventory and stock levels across all farm storage bins.
    """
    query = db.query(AgriculturalStock)
    
    if category and category != "all":
        query = query.filter(AgriculturalStock.category == category)
    if status and status != "all":
        query = query.filter(AgriculturalStock.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            AgriculturalStock.name.ilike(search_pattern) |
            AgriculturalStock.sku.ilike(search_pattern) |
            AgriculturalStock.batch_number.ilike(search_pattern)
        )
        
    stocks = query.order_by(AgriculturalStock.updated_at.desc()).all()
    
    # Calculate valuation and flags dynamically
    results = []
    for item in stocks:
        res = StockCheckResponse.model_validate(item)
        res.total_valuation_usd = item.current_quantity * item.unit_price_usd
        res.is_low_stock = item.current_quantity <= item.reorder_point
        res.is_high_moisture = (item.moisture_percent or 0) > 14.0
        results.append(res)
        
    return results

@router.post("/adjust", status_code=status.HTTP_201_CREATED)
def record_stock_movement(
    payload: StockAdjustmentRequest,
    db: Session = Depends(get_db)
):
    """
    Record intake delivery, grain dispatch, or inter-silo transfer.
    """
    stock = db.query(AgriculturalStock).filter(AgriculturalStock.id == payload.item_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock item not found")
        
    if payload.movement_type in ("dispatch_sale", "adjustment_loss"):
        if stock.current_quantity < payload.quantity_delta:
            raise HTTPException(status_code=400, detail="Insufficient stock for dispatch")
        stock.current_quantity -= payload.quantity_delta
    else:
        stock.current_quantity += payload.quantity_delta
        
    # Recalculate status
    if stock.current_quantity <= (stock.reorder_point * 0.5):
        stock.status = StockStatusEnum.CRITICAL
    elif stock.current_quantity <= stock.reorder_point:
        stock.status = StockStatusEnum.LOW_STOCK
    else:
        stock.status = StockStatusEnum.OPTIMAL
        
    db.commit()
    db.refresh(stock)
    return {"message": "Stock balance updated successfully", "new_quantity": stock.current_quantity}`
    },
    'requirements.txt': {
      desc: 'Python dependencies for FastAPI, SQLAlchemy, Pydantic, and database drivers',
      code: `fastapi==0.111.0
uvicorn[standard]==0.30.1
pydantic==2.7.4
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
asyncpg==0.29.0
python-dotenv==1.0.1`
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            UI System Design & Python Backend Architecture
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Design tokens, HTML5/CSS specifications, and full Python FastAPI backend implementation
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('ui-design')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'ui-design'
                ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              UI Design System
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('python-backend')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'python-backend'
                ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              Python Backend Code
            </span>
          </button>

          <button
            onClick={() => setActiveTab('api-playground')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'api-playground'
                ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Interactive API Simulator
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: UI System Design (HTML & CSS Specs) */}
      {activeTab === 'ui-design' && (
        <div className="space-y-6">
          
          {/* Architecture Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Agricultural UI System Design Constitution
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Designed for high-density readability in grain terminals, outdoor farm offices, and tractor tablets. Employs crisp 60-30-10 color discipline, unboxed typographic metadata, tabular figures for metric grain tonnages, and strict single-elevation depth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-transparent dark:border-slate-750">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">HTML5 Semantic Hierarchy</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Accessible tags: &lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, &lt;section&gt;, &lt;table&gt;, &lt;dialog&gt;
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-transparent dark:border-slate-750">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">Typography & Tabular Numerals</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Plus Jakarta Sans for display, JetBrains Mono & tabular-nums for grain metrics
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-transparent dark:border-slate-750">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block">CSS Spatial Mathematics</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 block">
                  Padding: px &ge; py (2:1). Nested radius: r_inner = r_outer - padding.
                </span>
              </div>
            </div>
          </div>

          {/* Color Tokens Palette */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Agricultural Color System & Tokens
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Click any token swatch to copy its hexadecimal code for CSS or design tools
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COLOR_TOKENS.map((token, i) => (
                <div
                  key={i}
                  onClick={() => handleCopy(token.hex, `color-${i}`)}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer bg-white dark:bg-slate-800/80 flex items-start gap-3 group"
                >
                  <div className={`w-10 h-10 rounded-md shrink-0 shadow-xs ${token.bg}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{token.name}</span>
                      {copiedCode === `color-${i}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 shrink-0 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">{token.hex}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-0.5">{token.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component Showcase Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Interactive UI Component Atoms & Molecules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live preview of components used across the inventory system
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Component 1: Silo Level Gauge */}
              <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Atom: Silo Fill Gauge</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-16 bg-slate-200 dark:bg-slate-700 rounded-t-md rounded-b relative overflow-hidden flex flex-col justify-end">
                    <div className="w-full bg-emerald-700 dark:bg-emerald-500 h-[75%]" />
                  </div>
                  <div className="text-xs">
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">75% Fill</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">3,000 / 4,000 MT</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Nominal Moisture</span>
                  </div>
                </div>
              </div>

              {/* Component 2: Stock Health Badges */}
              <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Atom: Health Status Badges</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
                      Optimal (Safe Reserve)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded">
                      Low Stock (Reorder Point)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded">
                      Critical (Stockout Risk)
                    </span>
                  </div>
                </div>
              </div>

              {/* Component 3: Agricultural Batch Tag */}
              <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Molecule: Lot & Origin Tag</span>
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Lot:</span>
                    <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">LOT-HRW-9842</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Moisture:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">12.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Origin:</span>
                    <span className="text-slate-700 dark:text-slate-300">North Prairies #4</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Python Backend Code Architecture */}
      {activeTab === 'python-backend' && (
        <div className="space-y-4">
          
          {/* Architecture Concept Banner */}
          <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl p-5 border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs rounded mb-2 font-mono">
                  <Server className="w-3.5 h-3.5" />
                  <span>Python 3.12 · FastAPI · SQLAlchemy 2.0</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Agricultural Backend Microservices Architecture
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  The Python backend handles atomic stock transactions, grain elevator IoT probe ingestion, automated reorder thresholds, and moisture condition safety alerts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(PYTHON_FILES[selectedPythonFile].code, 'current-file')}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode === 'current-file' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied File</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy {selectedPythonFile}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* File Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(PYTHON_FILES).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedPythonFile(fileName)}
                className={`px-3 py-1.5 text-xs font-mono rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedPythonFile === fileName
                    ? 'bg-slate-950 text-emerald-400 font-semibold border-t-2 border-emerald-500'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{fileName}</span>
              </button>
            ))}
          </div>

          {/* Python Code Display Panel */}
          <div className="bg-slate-950 rounded-b-xl rounded-tr-xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-emerald-400">{selectedPythonFile}</span>
              <span className="text-[11px] text-slate-400">{PYTHON_FILES[selectedPythonFile].desc}</span>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
              <code>{PYTHON_FILES[selectedPythonFile].code}</code>
            </pre>
          </div>

        </div>
      )}

      {/* Tab 3: Interactive Python API Simulator */}
      {activeTab === 'api-playground' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive Python REST API Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Execute live mock calls against the Python FastAPI routes and inspect the generated SQL and payload
                </p>
              </div>

              <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded">
                ASGI Worker Active
              </div>
            </div>

            {/* Request Builder */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">HTTP Method</label>
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="w-full py-1.5 px-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">FastAPI Endpoint</label>
                <select
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                >
                  <option value="/api/v1/inventory/stocks">/api/v1/inventory/stocks (Check Inventory)</option>
                  <option value="/api/v1/silos/telemetry">/api/v1/silos/telemetry (Grain Silos Probes)</option>
                  <option value="/api/v1/inventory/reorder-alerts">/api/v1/inventory/reorder-alerts (Stock Warnings)</option>
                </select>
              </div>

              {apiEndpoint === '/api/v1/inventory/stocks' && (
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Query: Category</label>
                  <select
                    value={apiFilterCategory}
                    onChange={(e) => setApiFilterCategory(e.target.value)}
                    className="w-full py-1.5 px-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">all</option>
                    <option value="grains">grains</option>
                    <option value="seeds">seeds</option>
                    <option value="fertilizers">fertilizers</option>
                    <option value="crop_protection">crop_protection</option>
                  </select>
                </div>
              )}

              <div className={`flex items-end ${apiEndpoint === '/api/v1/inventory/stocks' ? 'sm:col-span-2' : 'sm:col-span-5'}`}>
                <button
                  type="button"
                  onClick={executeApiSimulation}
                  disabled={isExecutingApi}
                  className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-medium rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isExecutingApi ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Execute Call</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Execution Response Inspector */}
          {apiExecutionResult && (
            <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden shadow-lg space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-400 font-mono font-bold rounded">
                    HTTP {apiExecutionResult.status_code} OK
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    Latency: {apiExecutionResult.latency_ms}ms
                  </span>
                  <span className="text-slate-500 font-mono hidden sm:inline">
                    Handler: {apiExecutionResult.python_handler}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(JSON.stringify(apiExecutionResult.data, null, 2), 'api-json')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'api-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy JSON</span>
                </button>
              </div>

              {/* Generated SQL statement preview */}
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-xs font-mono text-amber-300/90">
                <span className="text-slate-500 select-none">// Executed SQLAlchemy Query: </span>
                {apiExecutionResult.sql_query}
              </div>

              {/* Formatted JSON Payload */}
              <pre className="text-xs font-mono text-emerald-300 max-h-96 overflow-y-auto leading-relaxed">
                <code>{JSON.stringify(apiExecutionResult.data, null, 2)}</code>
              </pre>
            </div>
          )}

          {!apiExecutionResult && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
              Select an endpoint above and click "Execute Call" to inspect the Python response payload and executed SQL query.
            </div>
          )}

        </div>
      )}

    </div>
  );
};
