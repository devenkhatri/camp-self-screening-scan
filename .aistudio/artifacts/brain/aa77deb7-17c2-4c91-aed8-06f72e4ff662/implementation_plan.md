# Medical Camp Management & Persistent Screening Session Architecture

This architecture integrates first-class **Medical Camp Management** and **Persistent Active Camp Sessions** into the Camp Self-Screening Scan platform. Every paper form scan and clinical record will be linked to a verified medical camp, with an active session bar that remembers the selected camp across subsequent scans and provides streamlined camp-level reporting and rosters.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Decisions from Phase 1 Interactive Clarification**:
> - **Active Camp Selector Placement**: A dedicated, prominent **Sticky Camp Session Bar** positioned at the top of the Scanner page (and accessible via the global header on mobile) with quick 1-click camp switching.
> - **Medical Camp Entity Schema**: Each medical camp record will track:
>   1. **Camp Name** (e.g. *"Mehsana Community Oncology Drive 2025"*)
>   2. **Location / City** (e.g. *"Mehsana Civil Hospital Grounds, Gujarat"*)
>   3. **Camp Date** (e.g. *"2025-05-15"*)
>   4. **Organizer NGO / Foundation** (e.g. *"Harikrishna Cancer Foundation / Rotary Club"*)
>   5. **Doctor / Lead Oncologist** (e.g. *"Dr. S. Shah, MS (Surgical Oncology)"*)
>   6. *Status*: `Active`, `Upcoming`, or `Completed`
> - **Persistent State Mechanism**: The last selected active camp is persisted in browser storage (`camp_active_session_id`) and automatically loaded across browser sessions, tabs, and page reloads.

---

## 1. Overview & Core Concept

- **What It Does**: Provides an administrative camp registry and operational screening session workflow. Health teams can define upcoming or ongoing screening camps, set the current "Active Camp", and immediately begin scanning paper questionnaires. Every scanned form inherits the active camp's identity, location, and attending doctor without requiring clinicians to re-type or manually edit camp details for each individual patient.
- **Target Audience / Persona**: Community health workers, camp coordinators, and screening oncologists operating mobile cancer detection drives in rural clinics, industrial hubs, and community centers.
- **Key Value**: Eliminates repetitive data entry, prevents mismatched camp records, enables camp-specific epidemiology and risk stratification analytics, and supports multi-camp operations seamlessly.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Active Camp Session Bar (Sticky at Top of Scanner)**:
   - Positioned prominently above the form upload/camera dropzone on the Scanner tab.
   - Displays:
     - Active Camp Badge with icon (`Building2` or `TentTree`)
     - **Camp Name & Date** (e.g. *"Mehsana Community Oncology Drive · 15 May 2025"*)
     - **Organizer NGO & Lead Doctor** (e.g. *"Org: Harikrishna Cancer Foundation · Lead: Dr. S. Shah"*)
     - Quick **"Switch Camp"** dropdown selector to easily toggle between camps.
     - **"+ New Camp"** fast-action button opening the creation modal without navigating away from the scanner.

2. **Automated Inheritance & Review Curtain Auto-Population**:
   - When a physical form photo is processed, the system automatically tags the record with the Active Camp ID and its metadata (`campId`, `campName`, `campLocation`, `reviewedBy`).
   - If an imported patient roster is loaded for that specific camp, the QR code validator verifies against that camp's roster first.
   - In the **Pre-Save Review Curtain (`ReviewCurtainModal.tsx`)**, the Camp Location and Attending Doctor fields are pre-filled from the active camp, with a clean indicator badge: `✓ Linked to Active Camp: [Camp Name]`.

3. **Camp Management Console (`Admin -> Camps Tab`)**:
   - A dedicated tab alongside Questions and Patient Roster in the Admin module.
   - **Camp Directory Cards & Table View**:
     - Lists all camps with screening statistics (Total Screened, High Risk count, Low Risk count).
     - Status indicators: `Active Session`, `Upcoming`, `Completed`.
     - Action buttons: `Set as Active Session`, `Edit Details`, `Export Camp Audit CSV`, `Delete`.
   - **Camp Creation & Editing Modal**:
     - Clean form with Camp Name, Venue/City, Date, Organizer NGO, and Lead Oncologist.
     - "Set as Active Session immediately upon saving" checkbox (default: checked).
   - Pre-loaded with realistic Gujarat community screening camps for immediate demonstration.

4. **Camp-Specific Filtering in History & Analytics (`ScreeningHistoryLog.tsx`)**:
   - Adds a **"Filter by Camp"** dropdown in the Screening Log toolbar.
   - Clinicians can filter the summary dashboard and Recharts trends (Volume by Risk Band, Cohort Risk Distribution) for a specific camp or view all camps combined.
   - CSV export dynamically exports either the selected camp's roster or all camps combined.

### Visual Identity & Theme

- **Palette**: Follows the established clinical Slate (`bg-slate-50` / `dark:bg-slate-950`) with surgical whites and flat 1px hairline borders (`border-slate-200` / `dark:border-slate-800`).
- **Session Bar Accent**: Subtle deep navy/indigo panel (`bg-slate-900 text-white dark:bg-slate-800`) or clean clinical border with emerald active session badge (`bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400`).
- **Typography**: Clean display sans (`Plus Jakarta Sans`), tabular numerals (`font-mono tabular-nums`) for dates, IDs, and participant counts.
- **Mobile Touch Layout**: Compact session badge on mobile screens with bottom-sheet or dropdown camp switcher, compliant with touch target standards ($\ge 44\text{px}$).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Global Active Session vs. Per-Scan Selection**
  - *Chosen Approach*: Maintain a single authoritative "Active Camp Session" that persists in `localStorage` across scans, while still allowing the clinician to change or override it in the Review Curtain if an anomalous form is scanned.
  - *Why*: Field workers process 50–200 forms consecutively at the same location. Forcing camp selection per scan introduces unnecessary friction, while a sticky persistent session eliminates 100% of redundant inputs.
  - *Alternatives Considered*: Modal prompt on every scan (rejected as disruptive to high-speed batch scanning).

- **Decision 2: Camp-Specific Roster Integration**
  - *Chosen Approach*: Associate registered patient CSV imports with specific camps (or allow global patients).
  - *Why*: Large health drives register participants under specific camp tokens (e.g. `CAMP-MH-xxxx` for Mehsana, `CAMP-AH-xxxx` for Ahmedabad).

- **Decision 3: Fallback & Default Camps**
  - *Chosen Approach*: Provide 3 pre-seeded default camps in the system (`Mehsana Community Oncology Drive`, `Ahmedabad Rural Health Camp`, `Surat Diamond Workers Health Drive`), with the latest set as default active session on first launch.
  - *Why*: Ensures the application works out-of-the-box on first launch without requiring the user to fill out a setup form before testing.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌───────────────────────┐             ┌─────────────────────────────────┐  │
│  │   Camp Management     │             │     Sticky Camp Session Bar     │  │
│  │ (Create / Edit / List)│             │ (Active Camp Badge & Dropdown)  │  │
│  └──────────┬────────────┘             └────────────────┬────────────────┘  │
│             │                                           │                   │
│             ▼                                           ▼                   │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     LocalStorage Persistence Layer                    │  │
│  │  - camps: MedicalCamp[]                                               │  │
│  │  - activeCampId: string  (Last selected camp, restored on reload)     │  │
│  │  - registeredPatients: RegisteredPatient[]                            │  │
│  │  - screeningRecords: ScreeningRecord[] (tagged with campId)           │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│             ┌───────────────────────┴───────────────────────┐               │
│             ▼                                               ▼               │
│  ┌───────────────────────┐                     ┌─────────────────────────┐  │
│  │     ScannerUpload     │                     │   ScreeningHistoryLog   │  │
│  │  - Inherits Active ID │                     │  - Camp-Level Filter    │  │
│  │  - Auto-tags scans    │                     │  - Recharts by Camp     │  │
│  │  - Pre-fills Review   │                     │  - Camp CSV Export      │  │
│  └───────────────────────┘                     └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model Definitions (`src/types/screening.ts`)

```typescript
export interface MedicalCamp {
  id: string; // e.g. "camp-mehsana-2025"
  name: string; // "Mehsana Community Oncology Screening Camp"
  location: string; // "Civil Hospital Grounds, Mehsana"
  date: string; // "2025-05-15"
  organizer: string; // "Harikrishna Cancer Foundation"
  doctorInCharge: string; // "Dr. S. Shah, MS (Surgical Oncology)"
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

// Updated ScreeningRecord to link directly to camp:
export interface ScreeningRecord {
  // ... existing fields ...
  campId?: string; // Foreign key linking to MedicalCamp
  campLocation?: string; // Denormalized location string
  campName?: string; // Denormalized camp name
  // ...
}
```

### Component State & Interaction Strategy

1. **`App.tsx` State Management**:
   - `camps: MedicalCamp[]` (initialized with `DEFAULT_MEDICAL_CAMPS` and synced with `localStorage`).
   - `activeCampId: string` (persisted as `paper_scan_active_camp_id`).
   - Helper function `getActiveCamp(): MedicalCamp`.
   - Propagates `camps`, `activeCamp`, `onSelectActiveCamp`, and `onSaveCamp` to child components.

2. **`CampSessionBar.tsx` (New Component)**:
   - Rendered at the top of the Scanner tab.
   - Shows active camp summary with quick dropdown menu to switch to any other camp.
   - Direct button to create a new camp on the fly.

3. **`CampManagementAdmin.tsx` (or integrated into `QuestionBankAdmin.tsx`)**:
   - Added as a dedicated sub-tab in the Admin section (`[Questions]`, `[Camp Registry]`, `[Patient Roster]`).
   - Comprehensive card and table interface to add, edit, activate, or archive camps.

4. **`ReviewCurtainModal.tsx`**:
   - Auto-fills the `campLocation` and `reviewedBy` from `activeCamp` unless overridden.

5. **`ScreeningHistoryLog.tsx`**:
   - Top-level camp selector filter (`All Camps` vs individual camps).
   - Dynamically filters the Recharts trends and table rows based on the selected camp.
