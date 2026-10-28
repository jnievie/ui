# Interactive Farm Facility Operations Suite

Comprehensive interactive operations suite for AgriStock OS, introducing an interactive 2D farm facility map with clickable bins, a direct drag-and-drop / guided grain transfer simulator between silos and haulage trucks, and a step-by-step truck scale weigh-in and dock receiving terminal with automated moisture shrinkage calculation.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following operational capabilities have been prioritized based on your preferences:

- **Interactive 2D Farm Facility Map**: High-clarity vector layout of the grain complex (Silos 1–4, Fertilizer Shed, Climate Bunker, Receiving Pit, Scale House) with clickable buildings, live fill bars, status badges, and quick inspection popovers.
- **Drag-and-Drop / Guided Grain Transfer Dock**: Direct interactive transfer mechanism to route metric tons of grain between storage silos, aeration drying bins, or outgoing transport trucks with live pump rate simulation, progress animations, and auto-generated stock movements.
- **Step-by-Step Truck Scale & Intake Dock**: Multi-step weighing terminal (Gross weight in -> Moisture probe sample & dockage deduction calculation -> Tare weight out -> Net metric tons -> Auto-intake ledger entry).
- **Interactivity Style**: Interactive simulation controls with real-time feedback, tabular numerals, and instant ledger synchronization.

---

## 1. Overview & Core Concept

### What It Delivers
This update expands AgriStock OS from a monitoring dashboard into a fully interactive operational command station:
1. **Interactive Facility Schematic Map**: Visual SVG bird's-eye layout of the facility grounds with interactive zone hovering, real-time silo level gauges, ambient aeration status, and quick-dispatch shortcuts.
2. **Transfer Dock & Auger Simulator**: Operators can select source and destination (e.g. Silo 01 Corn -> Transport Semi-Truck A or Silo 02 -> Drying Bin), set pump transfer rate (MT/hr), trigger the transfer animation, and watch the physical inventory levels dynamically balance with audio/visual feedback.
3. **Truck Scale Intake Receiver (Scale House)**: A realistic weighbridge simulation where incoming grain trucks stop on the digital scale, receive automated moisture & foreign material dockage deductions (e.g., standard 14% base with test weight adjustments), and produce a signed electronic scale ticket automatically committed to the stock ledger.

### Target Audience & Persona
- **Elevator Operators & Facility Managers**: Need fast spatial awareness of which bins have capacity and which augers are currently flowing.
- **Scale House Clerks & Field Dispatchers**: Need a streamlined truck weigh-in/weigh-out workflow with moisture shrink formulas and instant lot tracking.

---

## 2. User Experience & Visual Design

### Key User Flows

#### Flow A: 2D Facility Map Navigation
1. Operator clicks the **Facility Map** view tab in the top navigation.
2. The user sees an architectural aerial map of the agricultural depot with styled zones:
   - **Grain Silo Battery** (Silos 01–04 with cylindrical elevation gauges).
   - **Scale House & Weighbridge** (interactive truck pad with weight sensor).
   - **Unloading Pit & Bucket Elevator Leg** (animated intake hopper).
   - **Dry Chemical & Fertilizer Warehouse** (palette rack storage).
   - **Seed & Climate Vault** (hermetic cold storage).
3. Clicking any facility zone opens an interactive drawer/sheet showing detailed sensor readings, contents, and quick actions ("Initiate Transfer", "Schedule Aeration", "View Batch History").

#### Flow B: Drag-and-Drop / Guided Grain Transfer Dock
1. Operator opens the **Transfer Dock** subview or drawer.
2. Operator drags a source bin or selects from an interactive visual selector (e.g. Silo 01: Hard Red Wheat, 3,200 MT available) and drops/links it to a destination (e.g. Outbound Grain Hopper Truck #42).
3. Operator enters or slides the transfer quantity (e.g., 28.5 MT).
4. Operator clicks **Start Auger Transfer**:
   - Live visual flow animation shows grain moving through the conveyance pipe.
   - Fill meters update dynamically in real time.
   - Upon completion, the ledger records an `internal_transfer` or `dispatch_sale` movement and updates the inventory balance.

#### Flow C: Truck Scale Weigh-in & Moisture Dockage Terminal
1. Scale operator initiates a new truck intake:
   - **Step 1: Gross Weigh-In**: Enter truck ID/license plate and select crop (e.g. Yellow Dent Corn). Scale simulator reads gross weight (e.g. 38,400 kg).
   - **Step 2: Moisture & Foreign Material Sampling**: Enter moisture reading (e.g. 16.2%) and test dockage (e.g. 1.2%). The system calculates standard commercial shrink:
     $$\text{Deduction \%} = (\text{Moisture} - 14.0\%) \times 1.25 + \text{Foreign Material \%}$$
   - **Step 3: Tare Weigh-Out**: Truck unloads at Pit #1 and returns to the scale empty (tare weight e.g. 14,200 kg).
   - **Step 4: Ticket Generation & Ledger Post**: Net metric tons calculated and automatically posted to the selected destination silo and stock ledger.

### Visual Identity & Theme
- **Theme Consistency**: Seamless support for Day Light Mode and Night Operations Mode.
- **Palette Tokens**: Deep forest emeralds (`emerald-800`), amber warning accents (`amber-600`), and industrial slate foundations (`slate-900` / `slate-50`).
- **Data Display**: Tabular numeric figures (`font-mono tabular-nums`) across all scale readings, moisture gauges, and transfer rates.
- **Clean Anti-Slop Discipline**: Zero static pills; clean inline dividers (`·`, `/`); responsive touch-friendly control sliders.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native SVG / Canvas 2D Map vs. External Heavy GIS Map**
  - *Chosen Approach*: Clean interactive SVG/HTML5 vector architectural layout with zoom/pan controls, clickable building footprints, and SVG animated flow lines.
  - *Why*: Instant loading, zero API key requirements, ultra-responsive in dark and light modes, and guaranteed offline reliability.
- **Decision 2: Dual Interaction for Grain Transfers (Drag-and-Drop + Click-to-Connect)**
  - *Chosen Approach*: Support both direct HTML5/pointer drag-and-drop between silo/truck cards and an accessible point-and-click picker.
  - *Why*: Accommodates both desktop mouse drag-and-drop and tablet/mobile touch interactions without layout breakage.
- **Decision 3: Integrated Scale House Ticket Workflow**
  - *Chosen Approach*: Realistic 4-step wizard that exports printable/copyable digital scale tickets while directly feeding the live `stockItems`, `silos`, and `movements` state.
  - *Why*: Bridges the gap between silo telemetry and real-world farm logistics.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              AgriStock OS                              │
├────────────────────────────────────────────────────────────────────────┤
│ Header: Navigation | Telemetry Auto-Poll (60s) | Night/Day Mode Toggle │
├────────────────────────────────────────────────────────────────────────┤
│ Active View Navigation                                                 │
│  ├─ Dashboard (Overview KPI, Critical Reorder, 30-Day Recharts)        │
│  ├─ Facility Map [NEW] (Interactive 2D Grounds, Clickable Bins)       │
│  ├─ Transfer Dock [NEW] (Auger Simulator, Drag & Drop Routing)         │
│  ├─ Truck Scale [NEW] (4-Step Weigh-In, Moisture Shrink Calculator)   │
│  ├─ Inventory Ledger & Silo Telemetry (Probes, Aeration Controls)      │
│  └─ Stock Movements Log & Python Architecture Specs                    │
├────────────────────────────────────────────────────────────────────────┤
│ Unified State Management (localStorage synchronized)                  │
│  ├─ stockItems: StockItem[]                                            │
│  ├─ silos: SiloTelemetry[]                                             │
│  ├─ movements: StockMovement[]                                         │
│  ├─ activeTransfers: ActiveAugerTransfer[]                             │
│  └─ scaleTickets: ScaleTicket[]                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### State Extensions
- `ScaleTicket`: Tracks `ticketNumber`, `truckId`, `driverName`, `crop`, `grossKg`, `tareKg`, `moisturePercent`, `dockagePercent`, `netCleanMT`, `destinationSiloId`, `timestamp`.
- `AugerTransferSession`: Tracks `sourceId`, `destId`, `crop`, `totalMT`, `transferredMT`, `rateMTPerSec`, `status: 'idle' | 'running' | 'completed'`.

### Working Handlers & Interactions
- `handleStartTransfer(sourceId, destId, quantityMT)`: Animates auger pipe grain flow, decrements source, increments destination, and records movement log on completion.
- `handleCompleteScaleIntake(scaleTicket)`: Posts gross/tare calculation, generates printable receipt, and commits inventory intake.
- `handleFacilityBuildingSelect(buildingId)`: Highlights map zone, loads real-time probe telemetry into inspection drawer.
