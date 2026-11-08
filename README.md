# AI Multimodal Physical Paper Cancer Screening & Triage Scanner

An oncology-focused web application engineered for community cancer detection camps (Harikrishna Cancer Foundation / Onco Digital). The platform digitizes physical paper questionnaires and 2-page brochures with high-speed multimodal vision AI, providing real-time optical mark recognition, human-in-the-loop verification, and active learning memory.

---

## Key Capabilities

### 1. Optical Multimodal AI Form Reading (Clinical Vision Engine)
- **Multi-Color Ink & Solid Color Fill Support (Red / Blue / Black / Digital)**: Explicitly optimized for solid filled squares, colored boxes, red swatches `[■]`, red ballpoint, gel pen, marker, pencil, and digital highlights. Solid red box fills in the YES (હા) column are recognized with >= 98% confidence.
- **Physical Mark Primacy**: Honors visual marks present on the paper without overriding physically filled YES boxes based on demographic or gender assumptions.
- **Empty Row Differentiation**: Correctly differentiates between checked boxes and completely blank rows (where both NO and YES boxes are empty outlines `[ ]`), classifying them as standard negative triage baseline.
- **Specific Row 5 Auditing (Que-5 Hoarseness / Vocal Cord Symptom)**: Targeted optical recognition for Row 5 (`Que-5: સ્વર પેટીનું કેન્સર - અવાજમાં ફેરફાર > 3 weeks`), accurately attributing red marks in the YES (હા/4) or NO (ના/0) columns.
- **Row Boundary Isolation & Parallax Protection**: Evaluates checkmark origins at horizontal row borders to prevent long mark tails from bleeding into adjacent questions.
- **Flexible Marking Styles**: Detects standard ticks (✓), crosses (X), circled printed digits (e.g. circling '0' in the *ના* column or '1'/'4' in the *હા* column), solid dots, and solid filled squares.
- **1-Page & 2-Page Document Agnostic**: Intelligently parses single-page A4 test sheets (Page 1) and full 2-page camp brochures (Page 2 table).

### 2. Visual Color-Coded Confidence Scores in Review Curtain
Each scanned field in the **Pre-Save Review Curtain Modal** displays an unmistakable, color-coded visual confidence indicator and mini progress meter:
- **Green Badge ($\ge 85\%$)**: `High Certainty` (crisp checkmark, clear column alignment).
- **Blue / Sky Badge ($65\% - 84\%$)**: `Moderate Certainty`.
- **Amber / Orange Badge ($< 65\%$ or Unclear)**: `Low Certainty · Manual Review Recommended` (pulsating highlight for quick clinician triage).
- **Purple / Violet Badge ($100\%$)**: `100% Clinician Verified · Active Memory Learned`.

### 3. Continual Active Learning Engine
- **Learns from Human Corrections**: When a human screener overrides an AI decision in the Review Curtain (e.g. changing an answer from `no/unclear` to `yes` for a faint red tick), the system immediately records the correction in persistent clinical memory (`paper_scan_learned_corrections`).
- **Closed-Loop Prompt Feedback**: On subsequent scans, stored human corrections are dynamically formatted and injected into the Gemini Vision prompt, training the model not to repeat past mistakes on specific rows.
- **Fast-Triage Filter Tabs**: Allows screeners to filter rows by `All Questions (13)`, `Needs Verification` (low-certainty items only), or `Human Corrected`.

### 4. Resilient Low-Latency Architecture
- **Prompt-Driven JSON Streaming**: Streamlined from heavy nested response schemas down to prompt-driven JSON (`responseMimeType: 'application/json'`), achieving 5–10s response latency.
- **Cloud Run 27-Second Gateway Timeout Protection**: Extended from 16s to 27s to handle high-resolution image uploads and multi-page PDFs without premature fallback aborts.
- **Defensive Error Handling**: Guarantees valid JSON HTTP 200 responses with transparent clinical notices when offline or in diagnostic fallback mode, eliminating misleading notes.

### 5. Medical Camp Roster & Registration
- Integrated camp session manager with live patient roster matching.
- Client-side pre-flight quality check (blur detection, exposure histogram, and EXIF scrubbing).
- Header QR code detection with manual patient ID override.
- Single-page A4 print layout for physical camp paper forms.

---

## Question Architecture (13 Standard Oncology Rows)

| Row | Code | Clinical Category | Symptom Description | Gujarati Translation | YES Weight |
| :---: | :---: | :---: | :--- | :--- | :---: |
| 1 | `Que-1` | General | Family history of cancer (first-degree blood relatives) | ફેમિલીમાં કોઇને કેન્સર થયેલું છે? | 1 pt |
| 2 | `Que-2` | Addiction | Tobacco, bidi, cigarette, gutkha, betel nut, alcohol | તમને કોઇ વ્યસન છે? | 1 pt |
| 3 | `Que-3` | Lifestyle | Severe obesity, sedentary routine, fast food, high-risk | તમારામાં નીચેનામાંથી કાંઈ છે? | 1 pt |
| 4 | `Que-4` | General | Rapid unexplained weight loss (5–7 kg in 1–2 months) | શું છેલ્લા 1–2 મહિનામાં 5 થી 7 કિલો વજન ઉતર્યું છે? | 4 pts |
| 5 | `Que-5` | Laryngeal | Persistent voice change or hoarseness > 3 weeks | સ્વર પેટીનું કેન્સર: તમારા અવાજમાં ફેરફાર છે? | 4 pts |
| 6 | `Que-6` | Esophageal | Dysphagia (difficulty swallowing) or hematemesis | અન્નનળી નું કેન્સર: ખોરાક ગળવામાં તકલીફ / ઉલ્ટીમાં લોહી | 4 pts |
| 7 | `Que-7` | Oral | White/red patch, oral ulcer, neck lump, trismus | મોઢાનું કેન્સર: સફેદ-લાલ ડાઘ / અલ્સર / ગાંઠ / ઓછું ખુલવું | 4 pts |
| 8 | `Que-8` | Colorectal | Blood in stool, chronic altered bowel habit > 4 weeks | આંતરડા (કોલો-રેક્ટલ) કેન્સર: સંડાસમાં લોહી / કબજિયાત | 4 pts |
| 9 | `Que-9` | Prostate | Urinary hesitancy, weak stream, nocturia (Men only) | પ્રોસ્ટેટ કેન્સર (પુરુષ માટે): પેશાબ અટકતો આવે કે જોર | 4 pts |
| 10 | `Que-10` | Breast | Breast/axilla lump, bloody discharge, inversion (Women) | સ્તન કેન્સર (મહિલાઓ માટે): સ્તન કે બગલમાં ગાંઠ | 4 pts |
| 11 | `Que-11` | Cervical | Foul discharge, abnormal bleeding, post-coital (Women) | ગર્ભાશય (સર્વિક્સ) નું કેન્સર: યોનિમાંથી દુર્ગંધ સ્ત્રાવ | 4 pts |
| 12 | `Que-12` | Lung | Chronic cough > 3 weeks, hemoptysis, chest pain | ફેફસાં નું કેન્સર: લાંબો સમય ખાંસી / કફમાં લોહી | 4 pts |
| 13 | `Que-13` | Hematologic | Unexplained persistent fever, fatigue, unusual bruising | સામાન્ય કેન્સર: લાંબા સમય સુધી તાવ / અસામાન્ય બ્લીડિંગ | 4 pts |

---

### 6. Live Token Usage & Actual AI Cost Transparency
- **Real-Time Token Usage Accounting**: Extracts `promptTokens`, `candidatesTokens`, and `totalTokens` directly from multimodal vision API response metadata (`usageMetadata`).
- **Official Model Pricing Formula**: Applies standard multimodal vision benchmark pricing:
  - Input tokens: **$0.075 / 1,000,000 tokens**
  - Output tokens: **$0.30 / 1,000,000 tokens**
  - Currency conversion at ₹86.50 INR / USD.
- **Dual Display in Cost & Usage Tab**: Displays exact scan cost in Indian Rupee paise (`~1.25 paise / scan`) alongside USD (`$0.00014 / scan`), with aggregate lifetime spend and average cost metrics.
- **Audit Breakdown Modal**: Screeners and administrators can click "Exact AI Cost Breakdown" on any logged scan to inspect full token calculations and formula variables.

### 7. Mobile-First Responsive Scan Result & Review Screen Architecture
- **Dynamic Viewport Height Adaptation (`h-[100dvh]`)**: The Review Curtain modal adapts directly to mobile screen dimensions, replacing fixed pixel/vh margins with a seamless edge-to-edge modal container that prevents clipping by iOS/Android browser chrome.
- **Direct Scan-to-Review Flow**: Eliminates intermediate fold barriers so every completed paper scan immediately launches the visual Review Curtain with color-coded certainty indicators.
- **Compact Collapsible Patient Info**: Mobile headers feature a single-line patient token bar with an "Edit Info" toggle, conserving over 120px of vertical space for question checklists.
- **Sticky Real-Time Triage Bottom Dock**: The calculated total score (`pts`), risk stratification badge (`HIGH_RISK`, `LOW_RISK`, `NO_RISK`), and "Confirm & Save" action are permanently anchored to the bottom with `safe-area-bottom` padding, updating dynamically as checkboxes are toggled.
- **Mobile Result Cards for History Log**: Individual patient records in the Screening Log feature responsive mobile cards with touch-friendly triage badges, score counters, and audit detail viewers, avoiding horizontal table scroll issues on small screens.

### 8. Camp Budget, Quota Guard & Exchange Rate Configuration
- **Dynamic Financial Controls**: Dedicated "Config / Settings" management interface providing granular control over operational and financial variables:
  - **Camp Monthly Budget & Quota Guard (₹ INR)**: Set spending caps (default ₹2,100 / month, configurable to any custom amount with quick presets for ₹1,000, ₹2,100, ₹5,000, ₹10,000, ₹25,000).
  - **INR Exchange Rate per 1 USD ($)**: Real-time FX multiplier (default ₹86.50/USD, with presets from ₹84.50 to ₹88.00) used across both the client and Express server.
  - **Quota Warning Threshold**: Configurable safety buffer (default 80%) to warn field teams before AI quotas are exhausted.
  - **Per Scan Estimate 5x Anomaly Threshold Guard**:
    - **Baseline Single Scan Cost**: Standard multimodal vision call consumes ~1,740 prompt tokens + ~260 output tokens = **~1.23 paise ($0.0001425)**.
    - **5x Threshold Multiplier (Configurable)**: Automatically sets a ceiling of **5x (~6.16 paise / ₹0.0616)**. Scans that consume excess tokens (due to oversized images, multi-page questionnaires, or high visual noise) are immediately flagged with a `⚠️ >5x Spike` badge.
    - **Configurable Multiplier in Settings**: Field administrators can tune the threshold multiplier with quick presets (`2x`, `3x`, `5x (Default)`, `8x`, `10x`) or enter any custom multiplier with live preview calculations.
- **Immediate Application-Wide Recalculation**:
  - Updating budget, exchange rate, or per-scan threshold in Settings instantly recalculates all historical scan logs, average cost calculations, lifetime expenses, and quota meters across the entire app.
  - New scans transmit the active exchange rate to `/api/scan-form` so token costs are computed accurately server-side.
- **Capacity & Unit Cost Estimator**:
  - Live projection calculator displaying remaining scans possible within the current month's budget.
  - Instant display of exact cost per 1,000 prompt/candidate tokens in Indian Rupee paise.

### 9. Resilient PDF Generation & Print Engine (Resolved OKLCH Color Parsing)
- **Direct PDF Export with OKLCH Color Sanitization**:
  - Resolves `html2canvas` parser crash `Attempting to parse an unsupported color function "oklch"` caused by Tailwind CSS v4's default color palette.
  - Features an `onclone` DOM sanitization pipeline in `PrintableFormModal` that strips modern CSS color functions (`oklch`, `lab`, `color()`) and resolves computed styles to standard safe sRGB via HTML5 Canvas 2D context before canvas rasterization.
- **Dual Export Strategy**:
  - Direct 1-click PDF download via client-side `jsPDF`.
  - Built-in High-Fidelity Native Browser Print fallback optimized for A4 paper layout (`@media print` clean margins, crisp vector typography, and no-screen-chrome printing).

### 10. Clinical Data-Extraction Engine & `prompt-reference.md` Integration
- **Dynamic File Ingestion (`prompt-reference.md`)**:
  - The AI scanning server dynamically loads `/prompt-reference.md` from the project root at runtime, immediately applying any prompt revisions or clinical rule refinements without requiring code recompilation or server reboots.
- **Dynamic Layout & Question Discovery**:
  - Automatically discovers questions and printed row codes in page order rather than assuming fixed templates. If a form layout has different questions, wording, or count, the application dynamically extracts, maps, and displays all discovered rows.
- **Strict Clinical Decision Rules**:
  - `YES`: Only affirmative box is marked.
  - `NO`: Only negative box is marked.
  - `BOTH`: Both boxes marked with no clear cancellation; automatically flagged for clinician review.
  - `BLANK`: Entire row unmarked (factual recording; negative triage baseline). An empty NO column is normal and BLANK is preserved verbatim.
  - `UNCLEAR`: Ambiguous mark or smudge across boxes.
  - `NOT_APPLICABLE`: Gender-restricted question (e.g. `applies_to: male` for prostate, `applies_to: female` for breast/cervix) left blank. Physically marked rows on gender-inapplicable items are preserved as visual reality and flagged for clinical audit.
- **Form-Level Summary & Pattern Classification**:
  - Generates a real-time `summary` object with exact counts (`yes_count`, `no_count`, `blank_count`, `both_count`, `unclear_count`, `not_applicable_count`, `yes_codes`).
  - Classifies form patterns: `all_yes`, `none_marked`, `all_no_marked`, `yes_only_marked`, or `mixed`, displayed as an interactive summary banner in the Review Curtain.
- **Header Field Validation & Decomposition**:
  - Automatically transcribes `name`, `name_transliterated`, `age`, `gender`, `phone` (with Gujarati digit normalization, `phone_digit_count`, and `phone_is_valid_indian_mobile` flag).
  - Decomposes date and camp location into `day`, `month`, `year`, `date_raw`, and `camp_location`.
  - Reads camp QR codes (e.g. `CAMP-MH-8519`) from the top right header.
  - Pre-fills the **Review Curtain Modal** with extracted participant metadata and matches against registered camp rosters.
- **Unified Active Learning Synthesis**:
  - Dynamically synthesizes the foundational guidelines of `prompt-reference.md` with continuous human clinical verifications from prior screening sessions.

---

## Technical Stack & Execution

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express on Node.js running via `tsx server.ts` with Vite middleware in development.
- **AI Service**: Google Gen AI SDK (`@google/genai`) using `gemini-3.8-flash`.
- **Client Utilities**: `jsQR` for in-browser QR decoding, `jsPDF` + sanitized `html2canvas` for printable A4 generation, HTML5 Canvas for EXIF scrubbing and image sanitization.
- **Port**: Runs on port 3000.


