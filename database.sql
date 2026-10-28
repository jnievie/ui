-- ============================================================================
-- DALOY — Farm Resources in Motion
-- MySQL Database Schema & Realistic Agricultural Seed Data
-- Compatible with MySQL 8.0+ / MariaDB 10.4+ (XAMPP / MySQL Workbench)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS daloy_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE daloy_db;

-- Drop tables in reverse dependency order for clean re-imports
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS exchange_listings;
DROP TABLE IF EXISTS supplies;
DROP TABLE IF EXISTS farmers;
DROP TABLE IF EXISTS users;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Login Authentication)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(60) NOT NULL DEFAULT 'Cooperative Coordinator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. FARMERS TABLE (Farmers Management)
-- ----------------------------------------------------------------------------
CREATE TABLE farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  category VARCHAR(60) NOT NULL,
  location VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(100) DEFAULT '',
  farm_size_ha DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
  primary_crops VARCHAR(160) NOT NULL DEFAULT '',
  photo_url VARCHAR(255) DEFAULT '',
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. SUPPLIES TABLE (Inventory Management with Low-Stock Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE supplies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  reorder_level DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  unit VARCHAR(30) NOT NULL,
  item_condition VARCHAR(40) NOT NULL DEFAULT 'New',
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock_status VARCHAR(30) NOT NULL DEFAULT 'In Stock',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. EXCHANGE LISTINGS TABLE (Farmer-to-Farmer Resource Exchange)
-- ----------------------------------------------------------------------------
CREATE TABLE exchange_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  item_name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  location VARCHAR(120) NOT NULL,
  desired_exchange VARCHAR(180) NOT NULL,
  description TEXT,
  photo_url VARCHAR(255) DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_farmer
    FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. TRANSACTIONS TABLE (Exchange Records & Status Management)
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_code VARCHAR(30) NOT NULL UNIQUE,
  listing_id INT DEFAULT NULL,
  item_name VARCHAR(120) NOT NULL,
  provider_farmer VARCHAR(100) NOT NULL,
  requester_farmer VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  exchange_details VARCHAR(220) NOT NULL,
  transaction_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction_listing
    FOREIGN KEY (listing_id) REFERENCES exchange_listings(id)
    ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 6. ACTIVITIES TABLE (Dashboard Recent Activities Log)
-- ----------------------------------------------------------------------------
CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_type VARCHAR(40) NOT NULL,
  description VARCHAR(255) NOT NULL,
  actor VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SAMPLE DATA FOR DEMONSTRATION
-- ============================================================================

INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@daloyfarm.ph', 'daloy123', 'Maria Clara Santos', 'Cooperative Administrator'),
('elena', 'elena@daloyfarm.ph', 'farmer123', 'Elena Reyes', 'Field Resource Coordinator');

INSERT INTO farmers (full_name, category, location, phone, email, farm_size_ha, primary_crops, photo_url, bio) VALUES
(
  'Elena Reyes',
  'Grain & Rice Grower',
  'Munoz, Nueva Ecija',
  '0917-482-1190',
  'elena.reyes@daloyfarm.ph',
  4.50,
  'Heirloom Rice, Mungbean',
  '/images/farmer_elena_portrait_1793189251653.jpg',
  'Second-generation rice seed multiplier managing 4.5 hectares of irrigated paddy fields and shared communal seed banks.'
),
(
  'Mateo Villanueva',
  'Corn & Upland Crops',
  'Malaybalay, Bukidnon',
  '0918-639-4402',
  'mateo.v@daloyfarm.ph',
  6.20,
  'Yellow Flint Corn, Sorghum',
  '/images/farmer_mateo_portrait_1793189253588.jpg',
  'Upland grain producer specializing in drought-resilient yellow corn varieties and cooperative post-harvest solar drying.'
),
(
  'Tomas Mendoza',
  'Equipment & Tillage',
  'Calamba, Laguna',
  '0920-514-8831',
  'tomas.mendoza@daloyfarm.ph',
  3.80,
  'Cassava, Mechanized Tillage',
  '/images/agri_avatar_manager_1792591350999.jpg',
  'Agricultural equipment custodian maintaining rotary hand tractors, seeders, and water pumps for neighboring smallholders.'
),
(
  'Rosa Alonzo',
  'Root Crops & Vegetables',
  'La Trinidad, Benguet',
  '0919-772-3056',
  'rosa.alonzo@daloyfarm.ph',
  2.40,
  'Heirloom Sweet Potato, Bush Beans',
  '/images/farmer_elena_portrait_1793189251653.jpg',
  'Terrace root-crop grower practicing vermicompost soil enrichment and seasonal seed exchanges across highland barangays.'
);

INSERT INTO supplies (item_name, category, quantity, reorder_level, unit, item_condition, unit_price, stock_status, notes) VALUES
('Barako Heirloom Rice Seeds (NSIC Rc222)', 'Seeds & Grains', 48, 15, 'sacks', 'New', 1450.00, 'In Stock', 'Certified dry-season seed lot stored in ventilated pallets.'),
('Vermicompost Organic Soil Conditioner', 'Soil & Fertilizers', 8, 20, 'bags', 'New', 420.00, 'Low Stock', 'Below 20-bag cooperative buffer; restock scheduled with Benguet compost hub.'),
('Rotary Hand Tractor Tiller Blades', 'Tools & Equipment', 4, 6, 'units', 'Good', 2850.00, 'Low Stock', 'Forged carbon-steel replacement blades for Kubota KRT series.'),
('Golden Sweet Corn Hybrid Seeds', 'Seeds & Grains', 34, 12, 'sacks', 'New', 1680.00, 'In Stock', '93% germination rate verified prior to storage.'),
('Solar Drip Irrigation Tubing (100m)', 'Irrigation', 19, 8, 'rolls', 'New', 1950.00, 'In Stock', 'UV-stabilized 16mm mainline rolls with inline emitters.'),
('Woven Jute Harvest Burlap Sacks (50kg)', 'Packaging & Storage', 120, 40, 'units', 'Good', 45.00, 'In Stock', 'Breathable natural fiber sacks for grain transport and curing.'),
('Fermented Rice Bran Poultry Feed', 'Livestock Feed', 0, 10, 'sacks', 'New', 890.00, 'Out of Stock', 'Awaiting fresh milling batch from Nueva Ecija cooperative mill.');

INSERT INTO exchange_listings (farmer_id, item_name, category, quantity, unit, location, desired_exchange, description, photo_url, status) VALUES
(
  1,
  'Certified Amber Rice Seedlings',
  'Seeds & Grains',
  12,
  'sacks',
  'Munoz, Nueva Ecija',
  '18 bags of Vermicompost or 2 days Rotary Tiller use',
  'Clean, sun-dried NSIC Rc222 seed paddy with high germination vigor, ready for wet- or dry-season transplanting.',
  '/images/resource_seeds_burlap_1793189254613.jpg',
  'Available'
),
(
  3,
  'Kubota KRT65 Rotary Power Tiller (3-Day Share)',
  'Tools & Equipment',
  1,
  'unit',
  'Calamba, Laguna',
  '8 sacks of Dried Yellow Corn or Harvest Labor Share',
  'Well-maintained 6.5 HP diesel rotary tiller with moldboard plow attachment available for neighboring farm land preparation.',
  '/images/resource_tiller_equipment_1793189255258.jpg',
  'Available'
),
(
  2,
  'Sun-Dried Golden Corn Kernels',
  'Seeds & Grains',
  25,
  'sacks',
  'Malaybalay, Bukidnon',
  '4 rolls of Drip Irrigation Tubing or Organic Potash',
  '13.5% moisture shelled yellow corn harvested this month, suitable for livestock feed formulation or seed selection.',
  '/images/agri_crop_storage_1792591350481.jpg',
  'Available'
),
(
  1,
  'Dry Barn & Grain Silo Storage Allocation',
  'Packaging & Storage',
  5,
  'tons',
  'Munoz, Nueva Ecija',
  '60 Woven Burlap Sacks or Seed Winnowing Assistance',
  'Weather-protected, aerated storage bay space available for 30 days during peak harvest curing.',
  '/images/agri_hero_silo_1792591351016.jpg',
  'Available'
);

INSERT INTO transactions (transaction_code, listing_id, item_name, provider_farmer, requester_farmer, quantity, unit, exchange_details, transaction_date, status, notes) VALUES
(
  'DL-2026-101',
  1,
  'Certified Amber Rice Seedlings',
  'Elena Reyes',
  'Mateo Villanueva',
  6,
  'sacks',
  'Exchanged for 10 bags of Vermicompost Soil Conditioner',
  '2026-10-18',
  'Completed',
  'Inspected and weighed at Central Barn gate.'
),
(
  'DL-2026-102',
  2,
  'Kubota KRT65 Rotary Power Tiller (3-Day Share)',
  'Tomas Mendoza',
  'Rosa Alonzo',
  3,
  'days',
  'Exchanged for 6 crates of Highland Sweet Potatoes',
  '2026-10-21',
  'Completed',
  'Equipment returned cleaned and refueled.'
),
(
  'DL-2026-103',
  3,
  'Solar Drip Irrigation Tubing (100m)',
  'Mateo Villanueva',
  'Elena Reyes',
  4,
  'rolls',
  'Exchanged for 5 sacks of NSIC Rc222 Seed Paddy',
  '2026-10-25',
  'Approved',
  'Scheduled for pickup on Friday morning.'
),
(
  'DL-2026-104',
  3,
  'Sun-Dried Golden Corn Kernels',
  'Mateo Villanueva',
  'Tomas Mendoza',
  10,
  'sacks',
  'Offered 2 days disc plow tractor cultivation',
  '2026-10-27',
  'Pending',
  'Awaiting schedule confirmation from both farms.'
);

INSERT INTO activities (activity_type, description, actor) VALUES
('Transaction', 'Completed exchange DL-2026-102: Rotary Power Tiller shared between Tomas Mendoza and Rosa Alonzo.', 'Maria Clara Santos'),
('Supply', 'Low-stock alert triggered for Vermicompost Organic Soil Conditioner (8 bags remaining).', 'System Inventory Check'),
('Listing', 'Tomas Mendoza posted Kubota KRT65 Rotary Power Tiller (3-Day Share) for cooperative exchange.', 'Tomas Mendoza'),
('Farmer', 'Registered farmer profile for Rosa Alonzo (La Trinidad, Benguet).', 'Maria Clara Santos'),
('Transaction', 'New exchange request DL-2026-104 submitted for 10 sacks of Sun-Dried Golden Corn Kernels.', 'Tomas Mendoza');
