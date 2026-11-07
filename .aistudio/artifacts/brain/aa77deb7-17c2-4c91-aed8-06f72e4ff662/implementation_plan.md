# Paper Self-Screening Scan System

A production-grade, standalone clinical paper-form scanning and oncology risk assessment platform. Upgraded to seamlessly handle both **standard coded forms** (English `Que-X` / `YES-NO`) and **real-world regional brochures/field forms** (such as the attached 2-page Onco Digital Gujarati screening brochure with `ના (0)` / `હા (1/4)` columns and 13 clinical oncology questions).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Capabilities Confirmed & Upgraded for the Attached Brochure (`new_screening_brosher_0427c618.pdf`)**:
> - **Multi-Page & PDF Direct Ingestion**: Gemini 3.8 Flash natively accepts `application/pdf` and multi-page documents. The system allows uploading JPG, PNG, and multi-page PDFs directly, with an integrated page-picker / multi-page analyzer that targets the screening questionnaire (Page 2 of the Onco Digital brochure).
> - **Flexible Code & Language Matching**: In addition to standard English `Que-1` / `YES / NO` forms, the AI vision engine is configured to recognize:
>   - Row numbering (`1` through `13`) mapped directly to fixed codes (`Que-1` .. `Que-13`).
>   - Regional column headings: Gujarati `ના` / `0` (NO) and `હા` / `1 or 4` (YES), Hindi `नहीं` / `हाँ`, and English `NO` / `YES`.
>   - Checkmarks, pen ticks, circular marks, or filled score boxes (`0` vs `1` or `4`).
> - **Pre-loaded Onco Digital 13-Question Clinical Protocol**: Pre-configured with the exact 13 questions from the Harikrishna Cancer Foundation / Onco Digital screening protocol (Bilingual English + Gujarati), with exact score weights (Questions 1–3 = 1 point; Questions 4–13 = 4 points) and matching risk tiers:
>   - **Score 0**: No active risk factors (Continue healthy lifestyle and routine surveillance).
>   - **Score 1–3**: Low risk (Recommended screening tests to confirm health).
>   - **Score $\ge 4$**: High risk (Immediate oncologist consultation, biopsy / CT scan / endoscopy / mammography / PSA workup).
> - **Built-in Sample Form Studio**: Includes the attached sample brochure (`new_screening_brosher_0427c618.pdf`) pre-loaded as an immediate one-click test scan, alongside generated printable templates.

---

## 1. Overview & Core Concept

- **What It Does**: Provides automated, high-accuracy paper questionnaire scanning for oncology outreach camps and clinics. It accepts photos, scans, and multi-page PDFs of filled paper forms in English or regional languages (Gujarati, Hindi, etc.). It reads checked rows by row number or fixed code, flags any ambiguous or low-confidence marks for human review, and instantly calculates the verified clinical risk score, risk band, and recommended diagnostic pathway.
- **Target Audience / Persona**: Community health workers, camp organizers, triage nurses, clinic staff, and oncologists conducting mass cancer screening drives in rural and urban clinics.
- **Key Value**: Bridges field reality (where organizations already print brochures in local languages with localized column headers like `ના` / `હા`) with digital clinic records, requiring zero special scanner hardware.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Screening Questionnaire Engine (`Admin -> Screening`)**:
   - 13 pre-loaded clinical oncology questions based on the Onco Digital standard:
     1. Family history of cancer (blood relatives) [Score: 1]
     2. Addictions (tobacco chewing, bidi/cigarette smoking, gutkha, alcohol) [Score: 1]
     3. Lifestyle factors (obesity, sedentary lifestyle, high-risk sexual contact) [Score: 1]
     4. Rapid unexplained weight loss (5–7 kg in 1–2 months) [Score: 4]
     5. Vocal cord (Laryngeal) cancer symptoms: Voice hoarseness [Score: 4]
     6. Esophageal cancer symptoms: Difficulty swallowing, hematemesis [Score: 4]
     7. Oral cancer symptoms: White/red patches, non-healing ulcer, mouth lump, restricted opening [Score: 4]
     8. Colorectal cancer symptoms: Blood in stool, chronic bowel changes, abdominal lump [Score: 4]
     9. Prostate cancer (men): Urinary hesitancy, weak stream, straining [Score: 4]
     10. Breast cancer (women): Breast/armpit lump, nipple discharge/blood, skin dimpling [Score: 4]
     11. Cervical cancer (women): Foul discharge, irregular or post-menopausal bleeding [Score: 4]
     12. Lung cancer: Persistent cough with hemoptysis, chest pain [Score: 4]
     13. Blood cancer: Recurrent fever, persistent body aches, abnormal bleeding [Score: 4]
   - Shows question code, English text, Gujarati text, score weight, and clinical test recommendation.

2. **Upload & Multi-Format Ingestion**:
   - **Supported Formats**: JPG, PNG, and multi-page PDF documents.
   - **One-Click Sample Test**: Instant "Load Sample Brochure (Onco Digital Gujarat)" button that loads `new_screening_brosher_0427c618.pdf` so the user can test the scanner immediately.
   - **PDF Page Inspector**: For multi-page brochures, previews pages and targets the questionnaire page (Page 2) or analyzes both pages.
   - **Image Hygiene**: Client-side canvas normalization (strips EXIF, normalizes contrast, checks resolution).

3. **Multimodal AI Vision Service (`/api/scan-form`)**:
   - Sends image/PDF buffer to `gemini-3.8-flash` with strict schema:
     `{ results: [{ code: "Que-1", rowNumber: 1, answer: "yes"|"no"|"unclear", confidence: number, rawMarkDescription: string }] }`.
   - Trained to detect ticks, crosses, circled values, or pen marks in either the `YES` / `હા` / `1 or 4` column or `NO` / `ના` / `0` column.

4. **Split-Screen Verification Review Curtain (Mandatory Pre-Save)**:
   - **Left Pane**: Zoomable, pannable inspection viewer showing the scanned physical page.
   - **Right Pane**: Interactive checklist pre-filled by the AI.
   - **Amber Highlights**: Any question where `answer === 'unclear'` or `confidence < 0.60` is flagged in amber with a "Check mark on row X" alert.
   - **Clinician Override**: Clinician clicks `NO (0)` or `YES (1 or 4)` to verify or correct.
   - **Patient Details**: Optional field for Patient Name, Age, Gender, Camp Location, and Form ID / Phone number.

5. **Scoring, Risk Stratification & Clinical Guidance**:
   - **Calculated Total Score**: Sum of YES answers ($0$ to $43$).
   - **Risk Bands**:
     - **Score 0**: No Risk (Healthy lifestyle reinforcement, annual check).
     - **Score 1–3**: Low Risk (Community screening tests: Oral visual exam, clinical breast exam, lifestyle counseling).
     - **Score $\ge 4$**: High Risk (Immediate oncology referral: Mammography, Pap smear, Endoscopy, Chest X-ray, PSA, Stool occult blood, Biopsy).
   - Direct matching with the attached brochure's recommendations.

6. **Screening Log & Audit Trail**:
   - Complete audit trail of scanned records with timestamp, reviewer notes, original image thumbnail, and risk band.
   - Export report as CSV or printable clinical summary.
   - Screening camp cost and daily volume tracker (tracking AI requests and monthly quota).

### Visual Identity & Theme

- **Palette**: Clean clinical Slate (`bg-slate-50` / `dark:bg-slate-950`), surgical whites, hairline borders (`border-slate-200` / `dark:border-slate-800`).
- **Status Accents**:
  - Emerald (`#16A34A`): No risk / confirmed clear.
  - Amber (`#D97706`): Review required / low confidence mark / Low Risk band (1–3).
  - Crimson (`#DC2626`): High Risk band ($\ge 4$) / Red-flag symptom.
  - Deep Indigo/Navy (`#1E293B`): Primary clinical header.
- **Typography**: Clean display sans (`Plus Jakarta Sans`), tabular figures (`font-mono tabular-nums`) for scores and codes, and clear Gujarati font rendering support (`Noto Sans Gujarati` fallback).

---

## 3. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌─────────────────────────┐  ┌───────────────────────┐  ┌───────────────┐  │
│  │   Question Bank Admin   │  │  Form Print Studio    │  │ Screening Log │  │
│  │   - 13 Onco Questions   │  │  - Printable templates│  │ - History     │  │
│  │   - English + Gujarati  │  │  - Sample PDF preview │  │ - Risk bands  │  │
│  └────────────┬────────────┘  └───────────┬───────────┘  └───────▲───────┘  │
│               │                           │                      │          │
│               ▼                           ▼                      │          │
│  ┌─────────────────────────────────────────────────────────┐     │          │
│  │             Upload & Ingestion Pipeline                 │     │          │
│  │  - JPG/PNG/PDF direct upload                            │     │          │
│  │  - "Test with Sample Brochure" one-click button         │     │          │
│  │  - Multi-page selector (target Page 2: Screening table) │     │          │
│  │  - Client canvas EXIF scrub & contrast optimizer        │     │          │
│  └────────────────────────────┬────────────────────────────┘     │          │
│                               │ base64 data                      │          │
│                               ▼                                  │          │
│  ┌─────────────────────────────────────────────────────────┐     │          │
│  │         Split-Screen Human Review Curtain               │     │          │
│  │  - Original PDF/Image viewer with zoom & pan controls   │     │          │
│  │  - Pre-filled AI answers with confidence indicators     │     │          │
│  │  - Amber flag for unclear / low confidence rows         │─────┘          │
│  │  - Human confirms -> Computes risk score & persists     │ (Commit Record)│
│  └────────────────────────────▲────────────────────────────┘                │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │ POST /api/scan-form
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NODE.JS SERVER (PORT 3000)                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  POST /api/scan-form Endpoint                                         │  │
│  │  - Receives image or PDF base64 payload                               │  │
│  │  - Multimodal Gemini prompt adapted for English & Gujarati forms      │  │
│  │  - Recognizes columns: YES/NO, ના/હા, 0/1/4                           │  │
│  │  - GoogleGenAI SDK (`gemini-3.8-flash`) with structured responseSchema│  │
│  │  - Returns array of { code, rowNumber, answer, confidence }           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Pre-Loaded Screening Questions Data Matrix

| Code | Row | Category | Question (English) | Question (Gujarati) | YES Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Que-1` | 1 | General / Hereditary | Family history of cancer (first-degree blood relatives) | ફેમિલીમાં કોઇને કેન્સર થયેલું છે? | 1 |
| `Que-2` | 2 | Lifestyle / Addiction | Substance addiction (tobacco, bidi, pan-masala, gutkha, alcohol) | તમને કોઇ વ્યસન છે? (તમાકુ, સિગરેટ, ગુટખા...) | 1 |
| `Que-3` | 3 | Lifestyle / General | High-risk factors (obesity, sedentary lifestyle, multiple partners) | ખૂબ જાડા હોવું / બેઠાળુ જીવન / અસુરક્ષિત સેક્સ | 1 |
| `Que-4` | 4 | Systemic Red Flag | Rapid unexplained weight loss of 5–7 kg in 1–2 months | છેલ્લા 1–2 મહિનામાં 5 થી 7 કિલો વજન ઉતર્યું છે? | 4 |
| `Que-5` | 5 | Vocal Cord / Larynx | Persistent change or hoarseness in voice | સ્વર પેટીનું કેન્સર: અવાજમાં ફેરફાર છે? | 4 |
| `Que-6` | 6 | Esophagus | Difficulty swallowing food or vomiting blood | અન્નનળી: ખોરાક ગળવામાં તકલીફ અથવા ઉલ્ટીમાં લોહી | 4 |
| `Que-7` | 7 | Oral Cavity | White/red patches, non-healing ulcer, mouth lump, restricted opening | મોઢાનું કેન્સર: સફેદ-લાલ ડાઘ, છાલું, ગાંઠ, મોઢું ઓછું ખુલવું | 4 |
| `Que-8` | 8 | Colorectal | Blood in stool, persistent constipation/diarrhea, abdominal lump | આંતરડાનું કેન્સર: સંડાસમાં લોહી, લાંબી કબજિયાત/ઝાડા | 4 |
| `Que-9` | 9 | Prostate (Men) | Urinary hesitancy, straining, weak interrupted stream | પ્રોસ્ટેટ કેન્સર: પેશાબ અટકતો આવે કે વધુ જોર લગાડવું પડે | 4 |
| `Que-10` | 10 | Breast (Women) | Breast/axillary lump, bloody discharge, skin dimpling, inverted nipple | સ્તન કેન્સર: સ્તન કે બગલમાં ગાંઠ, નિપલમાંથી લોહી, સોજો | 4 |
| `Que-11` | 11 | Cervix (Women) | Foul vaginal discharge, abnormal bleeding between cycles/post-menopause | ગર્ભાશય (સર્વિક્સ): દુર્ગંધ મારતો સ્ત્રાવ, અસામાન્ય બ્લીડિંગ | 4 |
| `Que-12` | 12 | Lung | Chronic persistent cough with hemoptysis (blood in phlegm), chest pain | ફેફસાનું કેન્સર: ખૂબ ખાંસી સાથે ગળફામાં લોહી, છાતીમાં દુખાવો | 4 |
| `Que-13` | 13 | Blood / Hematologic | Recurrent unexplained fever, body aches, persistent uncoagulated bleeding | લોહીનું કેન્સર: વારંવાર તાવ, શરીરમાં કળતર, લોહી બંધ ન થવું | 4 |

---

## 5. Next Steps Upon Plan Approval

1. **Server Setup**: Add Express API endpoint `/api/scan-form` with `@google/genai` (`gemini-3.8-flash`) configured for multimodal image and PDF recognition.
2. **Clinical Engine**: Populate the 13 Onco Digital questions and risk tier rules with bilingual support.
3. **Multi-Format Ingestion**: Implement file uploader for JPG, PNG, and PDF, with pre-configured link to `/public/assets/aistudio/new_screening_brosher_0427c618.pdf`.
4. **Interactive Verification Curtain**: Build split-screen zoomable scan reviewer with amber warning states.
5. **Scoring & Clinical Output**: Implement risk scoring and specific diagnostic recommendations (Mammography, Pap smear, CBC, PSA, Stool Occult Blood, Chest X-ray, Endoscopy).
6. **Camp Audit & Cost Log**: Log scans, confidence metrics, and estimated API usage.
7. **Verification**: Run `compile_applet` and `lint_applet` to verify compilation.
