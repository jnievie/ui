export type StockCategory = 
  | 'grains'          // Bulk Grains & Cereals (Wheat, Corn, Barley, Canola)
  | 'seeds'           // Certified Hybrid & Seed Lots
  | 'fertilizers'     // Fertilizers & Soil Nutrients (Urea, DAP, Potash)
  | 'crop_protection' // Herbicides, Fungicides, Insecticides
  | 'fresh_produce'   // Harvested Root Crops, Apples, Produce
  | 'livestock_feed'  // Cattle Mash, Hay Bales, Silage Pellets
  | 'fuel_supplies';  // Agri Diesel, DEF, Silage Wrap, Twine

export type StockStatus = 'optimal' | 'low_stock' | 'critical' | 'surplus';

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  varietyOrGrade: string;
  category: StockCategory;
  batchNumber: string;
  facilityLocation: string; // e.g. "Silo Complex 01", "Cold Bay 02", "Pallet Rack C-14"
  currentQuantity: number;
  reorderPoint: number;
  maxCapacity: number;
  unit: string; // e.g. "MT", "50kg Bags", "Liters", "Bushels"
  unitPriceUSD: number;
  moisturePercent?: number; // Crucial agricultural metric for grains & seeds
  germinationPercent?: number; // Crucial for certified seeds
  temperatureC?: number; // Storage temp
  expiryDate?: string;
  harvestDate?: string;
  supplierOrField: string;
  status: StockStatus;
  notes?: string;
  barcode: string;
}

export interface SiloTelemetry {
  id: string;
  name: string;
  facility: string;
  cropStored: string;
  capacityMT: number;
  currentMT: number;
  moisturePercent: number;
  optimalMoistureMax: number;
  internalTempC: number;
  aerationStatus: 'active' | 'nominal' | 'idle' | 'warning';
  cableSensorReadings: { depthMeters: number; tempC: number }[];
  lastInspected: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  type: 'harvest_intake' | 'dispatch_sale' | 'internal_transfer' | 'adjustment_loss';
  itemId: string;
  itemName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  performedBy: string;
  referenceNo: string;
  reason?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Operations Manager' | 'Silo Logistics Lead' | 'Senior Agronomist';
  facility: string;
  avatarUrl: string;
}
