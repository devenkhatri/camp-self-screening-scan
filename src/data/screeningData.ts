import { ScreeningQuestion, RiskBand } from '../types/screening';

export const DEFAULT_SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 'q-1',
    code: 'Que-1',
    rowNumber: 1,
    category: 'General',
    textEn: 'Family history of cancer (first-degree blood relatives: father, mother, sibling, grandparent)?',
    textGu: 'ફેમિલીમાં કોઇને કેન્સર થયેલું છે? (લોહી ના સંબંધ માં: બાપ, ભાઇ, બહેન, દાદા, દાદી..)',
    scoreYes: 1,
    isActive: true,
    recommendedTests: ['Genetic Counseling', 'Annual Comprehensive Screening'],
    clinicalSignificance: 'Hereditary predisposition increases risk of breast, colorectal, or ovarian malignancies.',
  },
  {
    id: 'q-2',
    code: 'Que-2',
    rowNumber: 2,
    category: 'Addiction',
    textEn: 'Any history of addiction (tobacco chewing, bidi, cigarette smoking, pan-masala, gutkha, betel nut, alcohol)?',
    textGu: 'તમને કોઇ વ્યસન છે? (તમાકુ ચાવવું / તમાકુ સ્મોકિંગ બીડી, સિગરેટ / પાન - મસાલા / ગુટખા / સોપારી / દારૂ)',
    scoreYes: 1,
    isActive: true,
    recommendedTests: ['Oral Cavity Visual Exam', 'Tobacco Cessation Counseling'],
    clinicalSignificance: 'Major carcinogenic risk factor for oral cavity, larynx, esophagus, and lung cancers.',
  },
  {
    id: 'q-3',
    code: 'Que-3',
    rowNumber: 3,
    category: 'Lifestyle',
    textEn: 'Any of the following lifestyle factors: severe obesity, sedentary routine, fast food diet, unprotected sex, multiple sexual partners?',
    textGu: 'તમારામાં નીચેનામાંથી કાંઈ છે? (ખૂબ જાડા હોવું / બેઠાળુ જીવન / ફાસ્ટ ફૂડ ખાવું / ઘણા સાથે જાતીય સંબંધ / અસુરક્ષિત સેક્સ / ઓરલ સેક્સ)',
    scoreYes: 1,
    isActive: true,
    recommendedTests: ['Dietary Counseling', 'HPV Vaccination Assessment'],
    clinicalSignificance: 'Obesity and HPV transmission are strong contributors to cervical and metabolic cancers.',
  },
  {
    id: 'q-4',
    code: 'Que-4',
    rowNumber: 4,
    category: 'General',
    textEn: 'Rapid unexplained weight loss of 5 to 7 kg in the last 1–2 months without dieting?',
    textGu: 'શું છેલ્લા 1–2 મહિનામાં 5 થી 7 કિલો વજન ઉતર્યું છે?',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['CBC', 'Whole Abdomen Ultrasound', 'Physician Workup'],
    clinicalSignificance: 'Constitutional red-flag symptom indicative of systemic malignancy or advanced tumor cachexia.',
  },
  {
    id: 'q-5',
    code: 'Que-5',
    rowNumber: 5,
    category: 'Laryngeal',
    textEn: 'Vocal cord cancer symptom: Any persistent change or hoarseness in voice lasting over 3 weeks?',
    textGu: 'સ્વર પેટીનું કેન્સર: તમારા અવાજમાં ફેરફાર છે?',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['ENT Endoscopic Laryngoscopy', 'Neck CT Scan'],
    clinicalSignificance: 'Primary clinical indicator of laryngeal or hypopharyngeal tumor.',
  },
  {
    id: 'q-6',
    code: 'Que-6',
    rowNumber: 6,
    category: 'Esophageal',
    textEn: 'Esophageal cancer symptom: Difficulty swallowing solid food (dysphagia) or vomiting blood?',
    textGu: 'અન્નનળી નું કેન્સર: ખોરાક ગળવામાં તકલીફ અથવા ઉલ્ટીમાં લોહી પડે છે?',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Upper GI Endoscopy', 'Barium Swallow / CT Scan'],
    clinicalSignificance: 'Classic sign of esophageal lumen obstruction or mucosal bleeding.',
  },
  {
    id: 'q-7',
    code: 'Que-7',
    rowNumber: 7,
    category: 'Oral',
    textEn: 'Oral cancer symptom: White or red patch (leukoplakia/erythroplakia), non-healing ulcer, lump in mouth/neck, or reduced mouth opening?',
    textGu: 'મોઢાનું કેન્સર: તમને નીચેનામાંથી કોઈ ચિન્હો છે? (સફેદ-લાલ ડાઘ / અલ્સર કે છાલું / મોઢા કે ગળામાં ગાંઠ / મોઢું ઓછું ખુલવું)',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Oral Oncology Biopsy', 'Head & Neck Examination'],
    clinicalSignificance: 'Pre-cancerous mucosal lesions or malignant transformation in oral mucosa.',
  },
  {
    id: 'q-8',
    code: 'Que-8',
    rowNumber: 8,
    category: 'Colorectal',
    textEn: 'Colorectal cancer symptom: Blood in stool (hematochezia/melena), chronic altered bowel habit (constipation/diarrhea > 4 weeks), or abdominal lump?',
    textGu: 'આંતરડા (કોલો - રેક્ટલ) કેન્સર: તમને નીચેનામાંથી કોઈ છે? (સંડાસમાં લોહી / લાંબા સમય થી કબજિયાત કે ઝાડા / પેટમાં ગાંઠ કે સોજો / ખૂબ વજન ઘટવું)',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Colonoscopy with Biopsy', 'FOBT / FIT Stool Occult Blood'],
    clinicalSignificance: 'Hallmark indicators of colorectal adenocarcinoma or advanced polyps.',
  },
  {
    id: 'q-9',
    code: 'Que-9',
    rowNumber: 9,
    category: 'Prostate',
    textEn: 'Prostate cancer symptom (men): Urinary hesitancy, straining, weak interrupted stream, or nocturia?',
    textGu: 'પ્રોસ્ટેટ કેન્સર (પુરુષ માટે): શું તમને પેશાબ અટકતો આવે કે વધુ જોર લગાડવું પડે છે?',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Serum PSA Test', 'Digital Rectal Examination', 'Prostate Ultrasound'],
    clinicalSignificance: 'Prostatic enlargement or malignancy causing bladder outlet obstruction.',
  },
  {
    id: 'q-10',
    code: 'Que-10',
    rowNumber: 10,
    category: 'Breast',
    textEn: 'Breast cancer symptom (women): Lump in breast or axilla/armpit, bloody nipple discharge, skin dimpling/redness, or newly inverted nipple?',
    textGu: 'સ્તન કેન્સર (મહિલાઓ માટે): તમને નીચેનામાંથી કોઈ ચિન્હો છે? (સ્તન કે બગલમાં ગાંઠ / નિપલમાંથી લોહી / ચામડીમાં સોજો, લાલાશ કે ઉપસવું / એક બાજુનું નિપલ અંદર જતું રહેવું)',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Digital Bilateral Mammography', 'Breast Ultrasound', 'Core Needle Biopsy'],
    clinicalSignificance: 'Classic signs of breast carcinoma requiring urgent triple assessment.',
  },
  {
    id: 'q-11',
    code: 'Que-11',
    rowNumber: 11,
    category: 'Cervical',
    textEn: 'Cervical cancer symptom (women): Foul-smelling vaginal discharge, abnormal bleeding between menstrual periods, post-coital, or post-menopausal bleeding?',
    textGu: 'ગર્ભાશય (સર્વિક્સ) નું કેન્સર: તમને નીચેનામાંથી કોઈ ચિન્હો છે? (યોનિમાંથી દુર્ગંધ મારતો સ્ત્રાવ / અસામાન્ય બ્લીડિંગ જેમ કે: બે માસિક વચ્ચે, સેક્સ પછી, મેનોપોઝ પછી)',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Pap Smear (Liquid-Based)', 'High-Risk HPV DNA Test', 'Colposcopy'],
    clinicalSignificance: 'Critical warning signs of invasive cervical dysplasia or carcinoma.',
  },
  {
    id: 'q-12',
    code: 'Que-12',
    rowNumber: 12,
    category: 'Lung',
    textEn: 'Lung cancer symptom: Severe chronic cough with blood in sputum (hemoptysis) or persistent chest pain?',
    textGu: 'ફેફસાનું કેન્સર: તમને નીચેનામાંથી કોઈ ચિન્હો છે? (ખૂબ ખાંસી સાથે ગળફામાં લોહી, છાતીમાં દુખાવો)',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Chest X-Ray (PA View)', 'High-Resolution Contrast CT Chest'],
    clinicalSignificance: 'Central airway erosion or parenchymal lung neoplasm.',
  },
  {
    id: 'q-13',
    code: 'Que-13',
    rowNumber: 13,
    category: 'Hematologic',
    textEn: 'Blood cancer symptom (leukemia/lymphoma): Recurrent unexplained fever, persistent severe fatigue, or abnormal bleeding/failure of blood to clot?',
    textGu: 'લોહીનું કેન્સર: તમને વારંવાર તાવ, શરીરમાં કળતર, થોડું વાગવાથી લોહીનું બંધ ન થવું આમાંથી કોઈ છે?',
    scoreYes: 4,
    isActive: true,
    recommendedTests: ['Complete Blood Count (CBC) with Peripheral Smear', 'Bone Marrow Biopsy'],
    clinicalSignificance: 'Hematological bone marrow failure or blast cell proliferation.',
  },
];

export interface RiskGuidance {
  band: RiskBand;
  label: string;
  labelGu: string;
  colorClass: string;
  badgeBg: string;
  summary: string;
  summaryGu: string;
  actionAdvice: string[];
  suggestedTests: string[];
}

export const RISK_BANDS_GUIDANCE: Record<RiskBand, RiskGuidance> = {
  NO_RISK: {
    band: 'NO_RISK',
    label: 'No Current Risk Factors (Score 0)',
    labelGu: 'સ્કોર 0: કોઈ જોખમ પરિબળ હાલમાં નથી',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    summary: 'No active clinical cancer symptoms or major risk factors were reported on the questionnaire.',
    summaryGu: 'તમને કેન્સરને લગતા કોઈ જોખમ પરિબળ હાલમાં નથી. સારી જીવનશૈલી ચાલુ રાખો.',
    actionAdvice: [
      'Maintain balanced, nutrient-rich nutrition and regular physical exercise (30 mins/day).',
      'Continue zero tobacco and zero alcohol exposure.',
      'Undergo routine preventive community oncology checks once a year.',
    ],
    suggestedTests: ['Routine Annual Preventive Health Check'],
  },
  LOW_RISK: {
    band: 'LOW_RISK',
    label: 'Low Risk Profile (Score 1–3)',
    labelGu: 'સ્કોર ૧-૩: સ્ક્રીનીંગ ટેસ્ટ કરાવી ચિંતા મુક્ત થાઓ',
    colorClass: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    summary: 'Background risk factors detected (lifestyle, addiction, or hereditary family history) without organ-specific red flag symptoms.',
    summaryGu: 'વ્યસન, જીવનશૈલી અથવા વારસાગત ઈતિહાસને કારણે સામાન્ય જોખમ. સ્ક્રીનીંગ ટેસ્ટ કરાવી ચિંતા મુક્ત થાઓ.',
    actionAdvice: [
      'Enroll in structured tobacco or alcohol cessation support programs immediately.',
      'Consult a primary care doctor for baseline clinical examination within 30 days.',
      'Follow family screening guidelines if a first-degree relative had cancer.',
    ],
    suggestedTests: [
      'Oral cavity visual screening',
      'Complete Blood Count (CBC)',
      'Clinical Breast Examination for women',
    ],
  },
  HIGH_RISK: {
    band: 'HIGH_RISK',
    label: 'High Clinical Risk (Score 4+)',
    labelGu: 'સ્કોર ૪ થી વધુ: ડૉક્ટરને તરત બતાવો અને ટેસ્ટ કરાવો',
    colorClass: 'text-rose-700 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    summary: 'One or more organ-specific cancer red-flag symptoms reported. Urgent specialist oncology evaluation is mandatory.',
    summaryGu: 'કેન્સરના ગંભીર લક્ષણો જણાયા છે. ડૉક્ટરને તાત્કાલિક બતાવો અને જરૂરી ટેસ્ટ કરાવી લો.',
    actionAdvice: [
      'Book an urgent in-person oncology appointment within 48 to 72 hours.',
      'Do not delay diagnostic imaging or endoscopic evaluation.',
      'Bring this completed self-screening audit record to the cancer specialist.',
    ],
    suggestedTests: [
      'Urgent Oncology Specialist Consultation',
      'Targeted Organ Diagnostic Tests (Mammogram, Endoscopy, Biopsy, or CT Scan)',
    ],
  },
};

export function calculateScreeningScore(
  answers: { code: string; answer: 'yes' | 'no' | 'unclear'; scoreYes: number }[]
): { totalScore: number; riskBand: RiskBand; guidance: RiskGuidance } {
  const totalScore = answers.reduce((sum, item) => {
    return item.answer === 'yes' ? sum + item.scoreYes : sum;
  }, 0);

  let riskBand: RiskBand = 'NO_RISK';
  if (totalScore === 0) {
    riskBand = 'NO_RISK';
  } else if (totalScore <= 3) {
    riskBand = 'LOW_RISK';
  } else {
    riskBand = 'HIGH_RISK';
  }

  return {
    totalScore,
    riskBand,
    guidance: RISK_BANDS_GUIDANCE[riskBand],
  };
}
