# AI Multimodal Physical Paper Cancer Screening & Triage Scanner

An oncology-focused web application engineered for community cancer detection camps (Harikrishna Cancer Foundation / Onco Digital). The platform digitizes physical paper questionnaires and 2-page brochures with high-speed multimodal AI (Gemini 3.8 Flash Vision), providing real-time optical mark recognition, human-in-the-loop verification, and active learning memory.

---

## Key Capabilities

### 1. Optical Multimodal AI Form Reading (Gemini 3.8 Flash Vision)
- **Multi-Color Ink Support (Red Pen / Triage Marker)**: Explicitly optimized for red ballpoint, red gel pen, red marker, blue, black, and pencil graphite. Red checkmarks (✓) and ticks (frequently used by clinical triage screeners to flag positive oncology symptoms) are recognized with high priority.
- **Specific Row 5 Auditing (Que-5 Hoarseness / Vocal Cord Symptom)**: Targeted optical recognition for Row 5 (`Que-5: સ્વર પેટીનું કેન્સર - અવાજમાં ફેરફાર > 3 weeks`), accurately attributing red ticks in the YES (હા/4) or NO (ના/0) columns.
- **Row Boundary Isolation & Parallax Protection**: Evaluates checkmark origins at horizontal row borders to prevent long mark tails from bleeding into adjacent questions.
- **Flexible Marking Styles**: Detects standard ticks (✓), crosses (X), circled printed digits (e.g. circling '0' in the *ના* column or '1'/'4' in the *હા* column), solid dots, and filled boxes.
- **Gender-Aware Context**: Automatically classifies inapplicable gender-specific rows (Que-9 Prostate for females, Que-10 Breast & Que-11 Cervix for males) as negative (`no`) when left blank, preventing false uncertainty flags.

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
- **Cloud Run Gateway Timeout Guard**: Enforces a 16-second timeout race on the server so requests never hit Cloud Run's 30-second gateway limit.
- **Defensive Error Handling**: Guarantees valid JSON HTTP 200 responses with clinical triage fallbacks, eliminating `Unexpected token '<'` syntax crashes.

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
- **Real-Time Token Usage Accounting**: Extracts `promptTokens`, `candidatesTokens`, and `totalTokens` directly from Gemini API response metadata (`usageMetadata`).
- **Official Model Pricing Formula**: Applies Gemini 3.8 Flash benchmark pricing:
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

---

## Technical Stack & Execution

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express on Node.js running via `tsx server.ts` with Vite middleware in development.
- **AI Service**: Google Gen AI SDK (`@google/genai`) using `gemini-3.8-flash`.
- **Client Utilities**: `jsQR` for in-browser QR decoding, HTML5 Canvas for EXIF scrubbing and image sanitization.
- **Port**: Runs on port 3000.


