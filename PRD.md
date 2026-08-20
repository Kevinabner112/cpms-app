# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Project Name: Color Panel Monitoring System (CPMS) - PT Far East Seating
## File Name: PRD.md
## Target System: Google Antigravity (AI Coding Agent)
## Target Tech Stack: Next.js (App Router) / React + Tailwind CSS + Lucide Icons + SQLite/Supabase + Zustand

---

### 1. SYSTEM OVERVIEW & OBJECTIVES

PT Far East Seating memerlukan sistem pemantauan panel warna (color panel) terintegrasi untuk mencegah terjadinya bottleneck pada proses finishing kursi. 

- **Problem Statement**: Proses finishing kursi terhenti (bottleneck) jika panel warna fisik tidak ditemukan, belum diperbarui, atau sudah kadaluwarsa (expired).
- **Core Objective**: Memonitor status keberadaan, tanggal pembaruan terakhir, dan masa berlaku (expiration date) panel warna berbasis kode item secara real-time.
- **Key Outcome**: Mencegah item masuk ke lini finishing jika panel warna tidak berstatus `VALID`.

---

### 2. DATABASE SCHEMA & DATA MODELS

#### 2.1 Table: `items` (Master Data Kursi)
- `item_code`: STRING (PK, Unique, e.g., 'FEC-501-BLK')
- `item_name`: STRING (e.g., 'Executive Mesh Office Chair')
- `category`: STRING (e.g., 'Office Chair', 'Dining Chair', 'Lounge')
- `color_code`: STRING (e.g., 'CL-WALNUT-02')
- `color_name`: STRING (e.g., 'Walnut Brown Matte')
- `created_at`: TIMESTAMP

#### 2.2 Table: `color_panels` (Master Panel Warna)
- `panel_id`: STRING (PK, Unique, Format: 'PNL-YYYYMMDD-XXX')
- `item_code`: STRING (FK -> items.item_code)
- `rack_location`: STRING (e.g., 'Rak A-02', 'Laci Finishing 1')
- `last_updated_date`: DATE (Tanggal terakhir panel fisik diperbarui/disetujui QA)
- `validity_period_months`: INTEGER (Default: 6 atau 12 bulan)
- `expiration_date`: DATE (Auto-calculated: last_updated_date + validity_period_months)
- `status`: STRING (Enum: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING')
- `photo_url`: STRING (Foto bukti fisik panel warna)
- `qa_inspector_name`: STRING (Nama petugas QA yang menyetujui)
- `notes`: STRING (Optional)
- `created_at`: TIMESTAMP

#### 2.3 Table: `panel_update_logs` (Riwayat Pembaruan & Pemeriksaan)
- `log_id`: STRING (PK)
- `panel_id`: STRING (FK -> color_panels.panel_id)
- `action_type`: STRING (Enum: 'NEW_PANEL', 'RENEWAL', 'PHYSICAL_CHECK', 'MARKED_MISSING')
- `previous_expiration_date`: DATE (Nullable)
- `new_expiration_date`: DATE (Nullable)
- `actor_name`: STRING
- `notes`: STRING
- `timestamp`: TIMESTAMP

---

### 3. BUSINESS LOGIC & HARD VALIDATION RULES

1. **Status Calculation Logic (Auto Triggered)**:
   - `VALID`: Expiration Date > (Current Date + 30 Days) AND Panel is physically present.
   - `EXPIRING_SOON`: Current Date <= Expiration Date <= (Current Date + 30 Days).
   - `EXPIRED`: Expiration Date < Current Date.
   - `MISSING`: Panel flagged manually as missing from storage rack.

2. **Finishing Readiness Blocker (CRITICAL)**:
   - When a user inputs an `item_code` to check finishing readiness:
     - IF Panel Status == `VALID` -> Return **GREEN LIGHT (Ready for Finishing)**.
     - IF Panel Status == `EXPIRING_SOON` -> Return **YELLOW LIGHT (Proceed with Caution, Renewal Needed)**.
     - IF Panel Status == `EXPIRED` OR `MISSING` -> Return **RED LIGHT (BLOCK FINISHING - Bottleneck Risk)**.

3. **Renewal Logic**:
   - Updating a panel resets `last_updated_date` to today's date, recalculates `expiration_date`, and logs the action into `panel_update_logs`.

---

### 4. SCREEN & FEATURE SPECIFICATIONS

#### Screen 1: Executive Dashboard (`/`)
- **KPI Summary Cards**:
  - Total Active Items: Number
  - Valid Panels: Number (Green)
  - Expiring Soon (<30 Days): Number (Yellow)
  - Expired / Missing (Bottleneck Alerts): Number (Red)
- **Bottleneck Risk Table**: Highlighting items scheduled for finishing that have Expired/Missing panels.
- **Quick Item Checker Bar**: Input/Scan `item_code` to immediately display Finishing Readiness Status.

#### Screen 2: Color Panel Inventory (`/panels`)
- Filterable & Searchable Table by: `item_code`, `color_name`, `rack_location`, and `status`.
- Color Status Badges (Green for Valid, Amber for Expiring Soon, Red for Expired, Gray/Red Dark for Missing).
- Quick Action Buttons: `Renew Panel`, `Report Missing`, `Edit Details`.

#### Screen 3: New Panel / Renewal Form (`/panels/new`)
- Dropdown/Search for `item_code` (auto-fills color name and code).
- Date Picker for `last_updated_date`.
- Select `validity_period_months` (3, 6, 12 months).
- Image Upload slot for physical panel photo.
- Inspector Name field.

#### Screen 4: Finishing Readiness Checker (`/check`)
- Mobile-friendly interface designed for shop-floor operators.
- QR/Barcode scanner simulation or manual `item_code` search.
- Full-screen Status Banner:
  - **PASS (Green)**: Panel is valid until [Date].
  - **BLOCKED (Red)**: Panel is EXPIRED / MISSING. Display message: "Dilarang Finishing! Hubungi Tim QA untuk Pembaruan Panel Warna."

#### Screen 5: Audit & History Logs (`/logs`)
- Timeline view of panel renewals, QA sign-offs, and status changes.

---

### 5. ANTIGRAVITY EXECUTION INSTRUCTIONS

Dear Antigravity Agent, execute this project sequentially:

1. **STEP 1: Schema & Data Layer Setup**
   - Create data models based on Section 2 using Drizzle ORM or Local Zustand State Store.
   - Seed sample data with realistic PT Far East Seating items (e.g., Office Chairs, Dining Chairs, Walnut/Oak/Black finishes) with a mix of VALID, EXPIRING_SOON, and EXPIRED statuses.

2. **STEP 2: Core Logic Implementation**
   - Implement automatic status calculation algorithms (`VALID`, `EXPIRING_SOON`, `EXPIRED`, `MISSING`).
   - Implement the Finishing Readiness Blocker rule.

3. **STEP 3: UI & Screen Components**
   - Build Dashboard with KPI cards and Finishing Readiness Checker.
   - Build Panel Inventory Table with status filters and search bar.
   - Build Renewal/Update Modal and History Log view.

4. **STEP 4: Verification & Testing**
   - Test scanning/searching an item code with an expired panel to verify the Red Light Blocker message.
   - Test renewing an expired panel and verify its status immediately changes to VALID.