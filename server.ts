import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// PERSISTENT PREVIEW DATA STORE (Mirrors database.sql + app.py for Live Preview)
// ============================================================================
interface UserRow {
  id: number;
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
}

interface FarmerRow {
  id: number;
  full_name: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  farm_size_ha: number;
  primary_crops: string;
  photo_url: string;
  bio: string;
  created_at: string;
}

interface SupplyRow {
  id: number;
  item_name: string;
  category: string;
  quantity: number;
  reorder_level: number;
  unit: string;
  item_condition: string;
  unit_price: number;
  stock_status: string;
  notes: string;
  created_at: string;
}

interface ListingRow {
  id: number;
  farmer_id: number;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  desired_exchange: string;
  description: string;
  photo_url: string;
  status: string;
  created_at: string;
}

interface TransactionRow {
  id: number;
  transaction_code: string;
  listing_id: number | null;
  item_name: string;
  provider_farmer: string;
  requester_farmer: string;
  quantity: number;
  unit: string;
  exchange_details: string;
  transaction_date: string;
  status: string;
  notes: string;
  created_at: string;
}

interface ActivityRow {
  id: number;
  activity_type: string;
  description: string;
  actor: string;
  created_at: string;
}

interface DaloyStore {
  users: UserRow[];
  farmers: FarmerRow[];
  supplies: SupplyRow[];
  exchange_listings: ListingRow[];
  transactions: TransactionRow[];
  activities: ActivityRow[];
}

const STORE_FILE = '/tmp/daloy_mysql_mirror_v1.json';

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function computeStockStatus(quantity: number, reorderLevel: number): string {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

function createInitialSeed(): DaloyStore {
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@daloyfarm.ph',
        password: 'daloy123',
        full_name: 'Maria Clara Santos',
        role: 'Cooperative Administrator',
      },
      {
        id: 2,
        username: 'elena',
        email: 'elena@daloyfarm.ph',
        password: 'farmer123',
        full_name: 'Elena Reyes',
        role: 'Field Resource Coordinator',
      },
    ],
    farmers: [
      {
        id: 1,
        full_name: 'Elena Reyes',
        category: 'Grain & Rice Grower',
        location: 'Munoz, Nueva Ecija',
        phone: '0917-482-1190',
        email: 'elena.reyes@daloyfarm.ph',
        farm_size_ha: 4.5,
        primary_crops: 'Heirloom Rice, Mungbean',
        photo_url: '/images/farmer_elena_portrait_1793189251653.jpg',
        bio: 'Second-generation rice seed multiplier managing 4.5 hectares of irrigated paddy fields and shared communal seed banks.',
        created_at: '2026-10-14 08:30',
      },
      {
        id: 2,
        full_name: 'Mateo Villanueva',
        category: 'Corn & Upland Crops',
        location: 'Malaybalay, Bukidnon',
        phone: '0918-639-4402',
        email: 'mateo.v@daloyfarm.ph',
        farm_size_ha: 6.2,
        primary_crops: 'Yellow Flint Corn, Sorghum',
        photo_url: '/images/farmer_mateo_portrait_1793189253588.jpg',
        bio: 'Upland grain producer specializing in drought-resilient yellow corn varieties and cooperative post-harvest solar drying.',
        created_at: '2026-10-15 10:15',
      },
      {
        id: 3,
        full_name: 'Tomas Mendoza',
        category: 'Equipment & Tillage',
        location: 'Calamba, Laguna',
        phone: '0920-514-8831',
        email: 'tomas.mendoza@daloyfarm.ph',
        farm_size_ha: 3.8,
        primary_crops: 'Cassava, Mechanized Tillage',
        photo_url: '/images/agri_avatar_manager_1792591350999.jpg',
        bio: 'Agricultural equipment custodian maintaining rotary hand tractors, seeders, and water pumps for neighboring smallholders.',
        created_at: '2026-10-16 14:20',
      },
      {
        id: 4,
        full_name: 'Rosa Alonzo',
        category: 'Root Crops & Vegetables',
        location: 'La Trinidad, Benguet',
        phone: '0919-772-3056',
        email: 'rosa.alonzo@daloyfarm.ph',
        farm_size_ha: 2.4,
        primary_crops: 'Heirloom Sweet Potato, Bush Beans',
        photo_url: '/images/farmer_elena_portrait_1793189251653.jpg',
        bio: 'Terrace root-crop grower practicing vermicompost soil enrichment and seasonal seed exchanges across highland barangays.',
        created_at: '2026-10-19 09:45',
      },
    ],
    supplies: [
      {
        id: 1,
        item_name: 'Barako Heirloom Rice Seeds (NSIC Rc222)',
        category: 'Seeds & Grains',
        quantity: 48,
        reorder_level: 15,
        unit: 'sacks',
        item_condition: 'New',
        unit_price: 1450.0,
        stock_status: 'In Stock',
        notes: 'Certified dry-season seed lot stored in ventilated pallets.',
        created_at: '2026-10-20 08:00',
      },
      {
        id: 2,
        item_name: 'Vermicompost Organic Soil Conditioner',
        category: 'Soil & Fertilizers',
        quantity: 8,
        reorder_level: 20,
        unit: 'bags',
        item_condition: 'New',
        unit_price: 420.0,
        stock_status: 'Low Stock',
        notes: 'Below 20-bag cooperative buffer; restock scheduled with Benguet compost hub.',
        created_at: '2026-10-21 09:20',
      },
      {
        id: 3,
        item_name: 'Rotary Hand Tractor Tiller Blades',
        category: 'Tools & Equipment',
        quantity: 4,
        reorder_level: 6,
        unit: 'units',
        item_condition: 'Good',
        unit_price: 2850.0,
        stock_status: 'Low Stock',
        notes: 'Forged carbon-steel replacement blades for Kubota KRT series.',
        created_at: '2026-10-22 11:10',
      },
      {
        id: 4,
        item_name: 'Golden Sweet Corn Hybrid Seeds',
        category: 'Seeds & Grains',
        quantity: 34,
        reorder_level: 12,
        unit: 'sacks',
        item_condition: 'New',
        unit_price: 1680.0,
        stock_status: 'In Stock',
        notes: '93% germination rate verified prior to storage.',
        created_at: '2026-10-23 13:05',
      },
      {
        id: 5,
        item_name: 'Solar Drip Irrigation Tubing (100m)',
        category: 'Irrigation',
        quantity: 19,
        reorder_level: 8,
        unit: 'rolls',
        item_condition: 'New',
        unit_price: 1950.0,
        stock_status: 'In Stock',
        notes: 'UV-stabilized 16mm mainline rolls with inline emitters.',
        created_at: '2026-10-24 15:40',
      },
      {
        id: 6,
        item_name: 'Woven Jute Harvest Burlap Sacks (50kg)',
        category: 'Packaging & Storage',
        quantity: 120,
        reorder_level: 40,
        unit: 'units',
        item_condition: 'Good',
        unit_price: 45.0,
        stock_status: 'In Stock',
        notes: 'Breathable natural fiber sacks for grain transport and curing.',
        created_at: '2026-10-25 10:00',
      },
      {
        id: 7,
        item_name: 'Fermented Rice Bran Poultry Feed',
        category: 'Livestock Feed',
        quantity: 0,
        reorder_level: 10,
        unit: 'sacks',
        item_condition: 'New',
        unit_price: 890.0,
        stock_status: 'Out of Stock',
        notes: 'Awaiting fresh milling batch from Nueva Ecija cooperative mill.',
        created_at: '2026-10-26 16:30',
      },
    ],
    exchange_listings: [
      {
        id: 1,
        farmer_id: 1,
        item_name: 'Certified Amber Rice Seedlings',
        category: 'Seeds & Grains',
        quantity: 12,
        unit: 'sacks',
        location: 'Munoz, Nueva Ecija',
        desired_exchange: '18 bags of Vermicompost or 2 days Rotary Tiller use',
        description: 'Clean, sun-dried NSIC Rc222 seed paddy with high germination vigor, ready for wet- or dry-season transplanting.',
        photo_url: '/images/resource_seeds_burlap_1793189254613.jpg',
        status: 'Available',
        created_at: '2026-10-22 08:40',
      },
      {
        id: 2,
        farmer_id: 3,
        item_name: 'Kubota KRT65 Rotary Power Tiller (3-Day Share)',
        category: 'Tools & Equipment',
        quantity: 1,
        unit: 'unit',
        location: 'Calamba, Laguna',
        desired_exchange: '8 sacks of Dried Yellow Corn or Harvest Labor Share',
        description: 'Well-maintained 6.5 HP diesel rotary tiller with moldboard plow attachment available for neighboring farm land preparation.',
        photo_url: '/images/resource_tiller_equipment_1793189255258.jpg',
        status: 'Available',
        created_at: '2026-10-24 09:15',
      },
      {
        id: 3,
        farmer_id: 2,
        item_name: 'Sun-Dried Golden Corn Kernels',
        category: 'Seeds & Grains',
        quantity: 25,
        unit: 'sacks',
        location: 'Malaybalay, Bukidnon',
        desired_exchange: '4 rolls of Drip Irrigation Tubing or Organic Potash',
        description: '13.5% moisture shelled yellow corn harvested this month, suitable for livestock feed formulation or seed selection.',
        photo_url: '/images/agri_crop_storage_1792591350481.jpg',
        status: 'Available',
        created_at: '2026-10-25 14:10',
      },
      {
        id: 4,
        farmer_id: 1,
        item_name: 'Dry Barn & Grain Silo Storage Allocation',
        category: 'Packaging & Storage',
        quantity: 5,
        unit: 'tons',
        location: 'Munoz, Nueva Ecija',
        desired_exchange: '60 Woven Burlap Sacks or Seed Winnowing Assistance',
        description: 'Weather-protected, aerated storage bay space available for 30 days during peak harvest curing.',
        photo_url: '/images/agri_hero_silo_1792591351016.jpg',
        status: 'Available',
        created_at: '2026-10-26 11:25',
      },
    ],
    transactions: [
      {
        id: 1,
        transaction_code: 'DL-2026-101',
        listing_id: 1,
        item_name: 'Certified Amber Rice Seedlings',
        provider_farmer: 'Elena Reyes',
        requester_farmer: 'Mateo Villanueva',
        quantity: 6,
        unit: 'sacks',
        exchange_details: 'Exchanged for 10 bags of Vermicompost Soil Conditioner',
        transaction_date: '2026-10-18',
        status: 'Completed',
        notes: 'Inspected and weighed at Central Barn gate.',
        created_at: '2026-10-18 15:00',
      },
      {
        id: 2,
        transaction_code: 'DL-2026-102',
        listing_id: 2,
        item_name: 'Kubota KRT65 Rotary Power Tiller (3-Day Share)',
        provider_farmer: 'Tomas Mendoza',
        requester_farmer: 'Rosa Alonzo',
        quantity: 3,
        unit: 'days',
        exchange_details: 'Exchanged for 6 crates of Highland Sweet Potatoes',
        transaction_date: '2026-10-21',
        status: 'Completed',
        notes: 'Equipment returned cleaned and refueled.',
        created_at: '2026-10-21 17:20',
      },
      {
        id: 3,
        transaction_code: 'DL-2026-103',
        listing_id: 3,
        item_name: 'Solar Drip Irrigation Tubing (100m)',
        provider_farmer: 'Mateo Villanueva',
        requester_farmer: 'Elena Reyes',
        quantity: 4,
        unit: 'rolls',
        exchange_details: 'Exchanged for 5 sacks of NSIC Rc222 Seed Paddy',
        transaction_date: '2026-10-25',
        status: 'Approved',
        notes: 'Scheduled for pickup on Friday morning.',
        created_at: '2026-10-25 11:30',
      },
      {
        id: 4,
        transaction_code: 'DL-2026-104',
        listing_id: 3,
        item_name: 'Sun-Dried Golden Corn Kernels',
        provider_farmer: 'Mateo Villanueva',
        requester_farmer: 'Tomas Mendoza',
        quantity: 10,
        unit: 'sacks',
        exchange_details: 'Offered 2 days disc plow tractor cultivation',
        transaction_date: '2026-10-27',
        status: 'Pending',
        notes: 'Awaiting schedule confirmation from both farms.',
        created_at: '2026-10-27 16:05',
      },
    ],
    activities: [
      {
        id: 1,
        activity_type: 'Transaction',
        description: 'Completed exchange DL-2026-102: Rotary Power Tiller shared between Tomas Mendoza and Rosa Alonzo.',
        actor: 'Maria Clara Santos',
        created_at: '2026-10-21 17:25',
      },
      {
        id: 2,
        activity_type: 'Supply',
        description: 'Low-stock alert triggered for Vermicompost Organic Soil Conditioner (8 bags remaining).',
        actor: 'System Inventory Check',
        created_at: '2026-10-23 09:10',
      },
      {
        id: 3,
        activity_type: 'Listing',
        description: 'Tomas Mendoza posted Kubota KRT65 Rotary Power Tiller (3-Day Share) for cooperative exchange.',
        actor: 'Tomas Mendoza',
        created_at: '2026-10-24 09:15',
      },
      {
        id: 4,
        activity_type: 'Farmer',
        description: 'Registered farmer profile for Rosa Alonzo (La Trinidad, Benguet).',
        actor: 'Maria Clara Santos',
        created_at: '2026-10-25 13:40',
      },
      {
        id: 5,
        activity_type: 'Transaction',
        description: 'New exchange request DL-2026-104 submitted for 10 sacks of Sun-Dried Golden Corn Kernels.',
        actor: 'Tomas Mendoza',
        created_at: '2026-10-27 16:05',
      },
    ],
  };
}

function loadStore(): DaloyStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(raw) as DaloyStore;
    }
  } catch {
    // Fall back to fresh seed
  }
  const initial = createInitialSeed();
  saveStore(initial);
  return initial;
}

function saveStore(store: DaloyStore): void {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only edge environments
  }
}

const dbStore: DaloyStore = loadStore();

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, r) => (r.id > max ? r.id : max), 0) + 1;
}

function logActivity(activityType: string, description: string, actor: string): void {
  dbStore.activities.push({
    id: nextId(dbStore.activities),
    activity_type: activityType,
    description,
    actor,
    created_at: nowTimestamp(),
  });
  saveStore(dbStore);
}

function enrichListing(listing: ListingRow) {
  const farmer = dbStore.farmers.find((f) => f.id === listing.farmer_id);
  return {
    ...listing,
    farmer_name: farmer ? farmer.full_name : 'Cooperative Member',
    farmer_category: farmer ? farmer.category : 'Farmer',
    farmer_phone: farmer ? farmer.phone : '',
  };
}

// ============================================================================
// SESSION MANAGEMENT (Cookie + X-Daloy-Session Header)
// ============================================================================
interface SessionUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthedRequest extends Request {
  daloyUser?: SessionUser;
}

const activeSessions = new Map<string, SessionUser>();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

function resolveSessionUser(req: Request): SessionUser | undefined {
  const headerToken = req.header('X-Daloy-Session');
  if (headerToken && activeSessions.has(headerToken)) {
    return activeSessions.get(headerToken);
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.daloy_sid && activeSessions.has(cookies.daloy_sid)) {
    return activeSessions.get(cookies.daloy_sid);
  }
  return undefined;
}

function requireDaloyAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = resolveSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in first.' });
    return;
  }
  req.daloyUser = user;
  next();
}

// ============================================================================
// EXPRESS SERVER + API ROUTES
// ============================================================================
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. Auth Endpoints
  app.post('/api/login', (req: Request, res: Response) => {
    const identifier = String(req.body?.identifier || '').trim();
    const password = String(req.body?.password || '').trim();

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter both your username/email and password.' });
      return;
    }

    const user = dbStore.users.find(
      (u) =>
        u.username.toLowerCase() === identifier.toLowerCase() ||
        u.email.toLowerCase() === identifier.toLowerCase()
    );

    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    const token = crypto.randomBytes(16).toString('hex');
    activeSessions.set(token, sessionUser);
    res.setHeader('Set-Cookie', `daloy_sid=${token}; Path=/; HttpOnly; SameSite=Lax`);
    res.json({ message: 'Login successful.', user: sessionUser, token });
  });

  app.get('/api/me', (req: Request, res: Response) => {
    const user = resolveSessionUser(req);
    if (user) {
      res.json({ authenticated: true, user });
      return;
    }
    res.json({ authenticated: false, user: null });
  });

  app.post('/api/logout', (req: Request, res: Response) => {
    const headerToken = req.header('X-Daloy-Session');
    if (headerToken) activeSessions.delete(headerToken);
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.daloy_sid) activeSessions.delete(cookies.daloy_sid);
    res.setHeader('Set-Cookie', 'daloy_sid=; Path=/; Max-Age=0');
    res.json({ message: 'Logged out successfully.' });
  });

  // 2. Dashboard Summary
  app.get('/api/dashboard', requireDaloyAuth, (_req: AuthedRequest, res: Response) => {
    const totalSupplies = dbStore.supplies.length;
    const lowStockItems = dbStore.supplies
      .filter((s) => s.quantity <= s.reorder_level)
      .sort((a, b) => a.quantity - b.quantity);
    const activeListings = dbStore.exchange_listings.filter((l) => l.status === 'Available').length;
    const completedExchanges = dbStore.transactions.filter((t) => t.status === 'Completed').length;
    const activities = [...dbStore.activities].sort((a, b) => b.id - a.id).slice(0, 8);

    res.json({
      summary: {
        total_supplies: totalSupplies,
        low_stock: lowStockItems.length,
        exchange_listings: activeListings,
        completed_exchanges: completedExchanges,
      },
      activities,
      low_stock_items: lowStockItems.slice(0, 5),
    });
  });

  // 3. Supplies CRUD
  app.get('/api/supplies', requireDaloyAuth, (_req: AuthedRequest, res: Response) => {
    const rows = [...dbStore.supplies].sort((a, b) => b.id - a.id);
    res.json(rows);
  });

  app.post('/api/supplies', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const item_name = String(req.body?.item_name || '').trim();
    const category = String(req.body?.category || '').trim();
    const unit = String(req.body?.unit || '').trim();
    const item_condition = String(req.body?.item_condition || 'New').trim();
    const notes = String(req.body?.notes || '').trim();
    const quantity = Number(req.body?.quantity);
    const reorder_level = Number(req.body?.reorder_level ?? 10);
    const unit_price = Number(req.body?.unit_price ?? 0);

    if (!item_name || !category || !unit) {
      res.status(400).json({ error: 'Item name, category, and unit are required.' });
      return;
    }
    if (Number.isNaN(quantity) || Number.isNaN(reorder_level) || Number.isNaN(unit_price) || quantity < 0 || reorder_level < 0 || unit_price < 0) {
      res.status(400).json({ error: 'Quantity, reorder level, and price must be valid non-negative numbers.' });
      return;
    }

    const stock_status = computeStockStatus(quantity, reorder_level);
    const created: SupplyRow = {
      id: nextId(dbStore.supplies),
      item_name,
      category,
      quantity,
      reorder_level,
      unit,
      item_condition,
      unit_price,
      stock_status,
      notes,
      created_at: nowTimestamp(),
    };
    dbStore.supplies.push(created);
    logActivity('Supply', `Added supply '${item_name}' (${quantity} ${unit}, ${stock_status}).`, req.daloyUser!.full_name);
    res.status(201).json(created);
  });

  app.put('/api/supplies/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const idx = dbStore.supplies.findIndex((s) => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Supply item not found.' });
      return;
    }

    const item_name = String(req.body?.item_name || '').trim();
    const category = String(req.body?.category || '').trim();
    const unit = String(req.body?.unit || '').trim();
    const item_condition = String(req.body?.item_condition || 'New').trim();
    const notes = String(req.body?.notes || '').trim();
    const quantity = Number(req.body?.quantity);
    const reorder_level = Number(req.body?.reorder_level ?? 10);
    const unit_price = Number(req.body?.unit_price ?? 0);

    if (!item_name || !category || !unit || Number.isNaN(quantity) || quantity < 0 || unit_price < 0) {
      res.status(400).json({ error: 'Please provide valid supply details.' });
      return;
    }

    const stock_status = computeStockStatus(quantity, reorder_level);
    dbStore.supplies[idx] = {
      ...dbStore.supplies[idx],
      item_name,
      category,
      quantity,
      reorder_level,
      unit,
      item_condition,
      unit_price,
      stock_status,
      notes,
    };
    logActivity('Supply', `Updated supply '${item_name}' — now ${quantity} ${unit} (${stock_status}).`, req.daloyUser!.full_name);
    res.json(dbStore.supplies[idx]);
  });

  app.delete('/api/supplies/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = dbStore.supplies.find((s) => s.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Supply item not found.' });
      return;
    }
    dbStore.supplies = dbStore.supplies.filter((s) => s.id !== id);
    logActivity('Supply', `Removed supply '${existing.item_name}' from inventory.`, req.daloyUser!.full_name);
    res.json({ message: 'Supply deleted successfully.' });
  });

  // 4. Farmers CRUD
  app.get('/api/farmers', requireDaloyAuth, (_req: AuthedRequest, res: Response) => {
    const rows = [...dbStore.farmers].sort((a, b) => b.id - a.id);
    res.json(rows);
  });

  app.post('/api/farmers', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const full_name = String(req.body?.full_name || '').trim();
    const category = String(req.body?.category || '').trim();
    const location = String(req.body?.location || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim();
    const primary_crops = String(req.body?.primary_crops || '').trim();
    const photo_url = String(req.body?.photo_url || '/images/farmer_elena_portrait_1793189251653.jpg').trim();
    const bio = String(req.body?.bio || '').trim();
    const farm_size_ha = Number(req.body?.farm_size_ha || 1);

    if (!full_name || !category || !location || !phone) {
      res.status(400).json({ error: 'Farmer name, category, location, and phone are required.' });
      return;
    }

    const created: FarmerRow = {
      id: nextId(dbStore.farmers),
      full_name,
      category,
      location,
      phone,
      email,
      farm_size_ha: Number.isNaN(farm_size_ha) ? 1 : farm_size_ha,
      primary_crops,
      photo_url,
      bio,
      created_at: nowTimestamp(),
    };
    dbStore.farmers.push(created);
    logActivity('Farmer', `Registered farmer profile for ${full_name} (${location}).`, req.daloyUser!.full_name);
    res.status(201).json(created);
  });

  app.put('/api/farmers/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const idx = dbStore.farmers.findIndex((f) => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Farmer record not found.' });
      return;
    }

    const full_name = String(req.body?.full_name || '').trim();
    const category = String(req.body?.category || '').trim();
    const location = String(req.body?.location || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim();
    const primary_crops = String(req.body?.primary_crops || '').trim();
    const photo_url = String(req.body?.photo_url || dbStore.farmers[idx].photo_url).trim();
    const bio = String(req.body?.bio || '').trim();
    const farm_size_ha = Number(req.body?.farm_size_ha || 1);

    if (!full_name || !category || !location || !phone) {
      res.status(400).json({ error: 'Farmer name, category, location, and phone are required.' });
      return;
    }

    dbStore.farmers[idx] = {
      ...dbStore.farmers[idx],
      full_name,
      category,
      location,
      phone,
      email,
      farm_size_ha: Number.isNaN(farm_size_ha) ? 1 : farm_size_ha,
      primary_crops,
      photo_url,
      bio,
    };
    logActivity('Farmer', `Updated farmer profile for ${full_name}.`, req.daloyUser!.full_name);
    res.json(dbStore.farmers[idx]);
  });

  app.delete('/api/farmers/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = dbStore.farmers.find((f) => f.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Farmer record not found.' });
      return;
    }
    dbStore.farmers = dbStore.farmers.filter((f) => f.id !== id);
    dbStore.exchange_listings = dbStore.exchange_listings.filter((l) => l.farmer_id !== id);
    logActivity('Farmer', `Deleted farmer record for ${existing.full_name}.`, req.daloyUser!.full_name);
    res.json({ message: 'Farmer deleted successfully.' });
  });

  // 5. Resource Exchange Listings CRUD & Request Exchange
  app.get('/api/listings', requireDaloyAuth, (_req: AuthedRequest, res: Response) => {
    const rows = [...dbStore.exchange_listings].sort((a, b) => b.id - a.id).map(enrichListing);
    res.json(rows);
  });

  app.post('/api/listings', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const farmer_id = Number(req.body?.farmer_id || 0);
    const item_name = String(req.body?.item_name || '').trim();
    const category = String(req.body?.category || '').trim();
    const quantity = Number(req.body?.quantity || 0);
    const unit = String(req.body?.unit || '').trim();
    const location = String(req.body?.location || '').trim();
    const desired_exchange = String(req.body?.desired_exchange || '').trim();
    const description = String(req.body?.description || '').trim();
    const photo_url = String(req.body?.photo_url || '/images/resource_seeds_burlap_1793189254613.jpg').trim();
    const status = String(req.body?.status || 'Available').trim();

    if (!farmer_id || !item_name || !unit || !location || !desired_exchange || quantity <= 0) {
      res.status(400).json({ error: 'Please complete all required listing fields with a positive quantity.' });
      return;
    }

    const created: ListingRow = {
      id: nextId(dbStore.exchange_listings),
      farmer_id,
      item_name,
      category,
      quantity,
      unit,
      location,
      desired_exchange,
      description,
      photo_url,
      status,
      created_at: nowTimestamp(),
    };
    dbStore.exchange_listings.push(created);
    logActivity('Listing', `Posted exchange listing: ${item_name} (${quantity} ${unit} in ${location}).`, req.daloyUser!.full_name);
    res.status(201).json(enrichListing(created));
  });

  app.put('/api/listings/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const idx = dbStore.exchange_listings.findIndex((l) => l.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const farmer_id = Number(req.body?.farmer_id || dbStore.exchange_listings[idx].farmer_id);
    const item_name = String(req.body?.item_name || '').trim();
    const category = String(req.body?.category || '').trim();
    const quantity = Number(req.body?.quantity || 0);
    const unit = String(req.body?.unit || '').trim();
    const location = String(req.body?.location || '').trim();
    const desired_exchange = String(req.body?.desired_exchange || '').trim();
    const description = String(req.body?.description || '').trim();
    const photo_url = String(req.body?.photo_url || dbStore.exchange_listings[idx].photo_url).trim();
    const status = String(req.body?.status || 'Available').trim();

    if (!farmer_id || !item_name || !unit || !location || !desired_exchange) {
      res.status(400).json({ error: 'Please complete all required listing fields.' });
      return;
    }

    dbStore.exchange_listings[idx] = {
      ...dbStore.exchange_listings[idx],
      farmer_id,
      item_name,
      category,
      quantity,
      unit,
      location,
      desired_exchange,
      description,
      photo_url,
      status,
    };
    logActivity('Listing', `Updated exchange listing '${item_name}' (${status}).`, req.daloyUser!.full_name);
    res.json(enrichListing(dbStore.exchange_listings[idx]));
  });

  app.delete('/api/listings/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = dbStore.exchange_listings.find((l) => l.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    dbStore.exchange_listings = dbStore.exchange_listings.filter((l) => l.id !== id);
    logActivity('Listing', `Removed exchange listing '${existing.item_name}'.`, req.daloyUser!.full_name);
    res.json({ message: 'Listing deleted successfully.' });
  });

  app.post('/api/listings/:id/request', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const listingId = Number(req.params.id);
    const listingIdx = dbStore.exchange_listings.findIndex((l) => l.id === listingId);
    if (listingIdx === -1) {
      res.status(404).json({ error: 'Exchange listing not found.' });
      return;
    }

    const requester_farmer = String(req.body?.requester_farmer || '').trim();
    const exchange_details = String(req.body?.exchange_details || '').trim();
    const notes = String(req.body?.notes || '').trim();
    const transaction_date = String(req.body?.transaction_date || new Date().toISOString().slice(0, 10)).trim();
    const reqQty = Number(req.body?.quantity || 0);

    if (!requester_farmer || !exchange_details || reqQty <= 0) {
      res.status(400).json({ error: 'Requester farmer, offered exchange item, and positive quantity are required.' });
      return;
    }

    const listing = enrichListing(dbStore.exchange_listings[listingIdx]);
    const nextCodeNum = 101 + dbStore.transactions.length;
    const transaction_code = `DL-${new Date().getFullYear()}-${nextCodeNum}`;

    const createdTx: TransactionRow = {
      id: nextId(dbStore.transactions),
      transaction_code,
      listing_id: listingId,
      item_name: listing.item_name,
      provider_farmer: listing.farmer_name,
      requester_farmer,
      quantity: reqQty,
      unit: listing.unit,
      exchange_details,
      transaction_date,
      status: 'Pending',
      notes,
      created_at: nowTimestamp(),
    };
    dbStore.transactions.push(createdTx);

    if (reqQty >= listing.quantity) {
      dbStore.exchange_listings[listingIdx].status = 'Reserved';
    }

    logActivity(
      'Transaction',
      `Exchange request ${transaction_code}: ${requester_farmer} requested ${reqQty} ${listing.unit} of ${listing.item_name}.`,
      req.daloyUser!.full_name
    );
    res.status(201).json(createdTx);
  });

  // 6. Transactions CRUD
  app.get('/api/transactions', requireDaloyAuth, (_req: AuthedRequest, res: Response) => {
    const rows = [...dbStore.transactions].sort((a, b) => b.id - a.id);
    res.json(rows);
  });

  app.post('/api/transactions', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const item_name = String(req.body?.item_name || '').trim();
    const provider_farmer = String(req.body?.provider_farmer || '').trim();
    const requester_farmer = String(req.body?.requester_farmer || '').trim();
    const quantity = Number(req.body?.quantity || 0);
    const unit = String(req.body?.unit || 'units').trim();
    const exchange_details = String(req.body?.exchange_details || '').trim();
    const transaction_date = String(req.body?.transaction_date || new Date().toISOString().slice(0, 10)).trim();
    const status = String(req.body?.status || 'Pending').trim();
    const notes = String(req.body?.notes || '').trim();

    if (!item_name || !provider_farmer || !requester_farmer || !exchange_details || quantity <= 0) {
      res.status(400).json({ error: 'Please fill in all required transaction fields.' });
      return;
    }

    const nextCodeNum = 101 + dbStore.transactions.length;
    const transaction_code = String(req.body?.transaction_code || `DL-${new Date().getFullYear()}-${nextCodeNum}`);

    const created: TransactionRow = {
      id: nextId(dbStore.transactions),
      transaction_code,
      listing_id: null,
      item_name,
      provider_farmer,
      requester_farmer,
      quantity,
      unit,
      exchange_details,
      transaction_date,
      status,
      notes,
      created_at: nowTimestamp(),
    };
    dbStore.transactions.push(created);
    logActivity('Transaction', `Recorded transaction ${transaction_code} (${status}) between ${provider_farmer} and ${requester_farmer}.`, req.daloyUser!.full_name);
    res.status(201).json(created);
  });

  app.put('/api/transactions/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const idx = dbStore.transactions.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Transaction record not found.' });
      return;
    }

    const item_name = String(req.body?.item_name || '').trim();
    const provider_farmer = String(req.body?.provider_farmer || '').trim();
    const requester_farmer = String(req.body?.requester_farmer || '').trim();
    const quantity = Number(req.body?.quantity || 0);
    const unit = String(req.body?.unit || 'units').trim();
    const exchange_details = String(req.body?.exchange_details || '').trim();
    const transaction_date = String(req.body?.transaction_date || dbStore.transactions[idx].transaction_date).trim();
    const status = String(req.body?.status || 'Pending').trim();
    const notes = String(req.body?.notes || '').trim();

    if (!item_name || !provider_farmer || !requester_farmer || !exchange_details || quantity <= 0) {
      res.status(400).json({ error: 'Please fill in all required transaction fields.' });
      return;
    }

    dbStore.transactions[idx] = {
      ...dbStore.transactions[idx],
      item_name,
      provider_farmer,
      requester_farmer,
      quantity,
      unit,
      exchange_details,
      transaction_date,
      status,
      notes,
    };

    const listingId = dbStore.transactions[idx].listing_id;
    if (status === 'Completed' && listingId) {
      const lIdx = dbStore.exchange_listings.findIndex((l) => l.id === listingId);
      if (lIdx !== -1) {
        dbStore.exchange_listings[lIdx].status = 'Exchanged';
      }
    }

    logActivity('Transaction', `Updated transaction ${dbStore.transactions[idx].transaction_code} status to ${status}.`, req.daloyUser!.full_name);
    res.json(dbStore.transactions[idx]);
  });

  app.delete('/api/transactions/:id', requireDaloyAuth, (req: AuthedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = dbStore.transactions.find((t) => t.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Transaction record not found.' });
      return;
    }
    dbStore.transactions = dbStore.transactions.filter((t) => t.id !== id);
    logActivity('Transaction', `Deleted transaction record ${existing.transaction_code}.`, req.daloyUser!.full_name);
    res.json({ message: 'Transaction deleted successfully.' });
  });

  // Serve Vite in dev (tsx server.ts) or built static bundle in production (node server.ts)
  const isDevMode =
    process.env.NODE_ENV === 'development' ||
    process.execArgv.some((arg) => arg.includes('tsx'));
  const distPath = path.join(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (isDevMode || !hasBuiltDist) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DALOY preview server listening on http://localhost:${PORT}`);
  });
}

startServer();
