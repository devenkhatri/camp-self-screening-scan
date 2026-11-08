export type QuestionCategory =
  | 'General'
  | 'Addiction'
  | 'Lifestyle'
  | 'Oral'
  | 'Breast'
  | 'Cervical'
  | 'Colorectal'
  | 'Laryngeal'
  | 'Esophageal'
  | 'Prostate'
  | 'Lung'
  | 'Hematologic';

export interface ScreeningQuestion {
  id: string;
  code: string; // e.g. "Que-1", "Que-2"
  rowNumber: number; // 1 to 13
  category: QuestionCategory;
  textEn: string;
  textGu?: string; // Gujarati translation
  scoreYes: 1 | 4; // 1 for moderate/history, 4 for red-flag symptoms
  isActive: boolean;
  recommendedTests: string[];
  clinicalSignificance: string;
}

export type AnswerType = 'yes' | 'no' | 'unclear';

export interface ScannedAnswer {
  code: string;
  rowNumber: number;
  questionText: string;
  questionTextGu?: string;
  category: QuestionCategory;
  scoreYes: number;
  answer: AnswerType;
  confidence: number; // 0.0 to 1.0
  isOverridden?: boolean;
  notes?: string;
}

export type RiskBand = 'NO_RISK' | 'LOW_RISK' | 'HIGH_RISK';

export interface MedicalCamp {
  id: string; // e.g. "camp-mehsana-2025"
  name: string; // e.g. "Mehsana Community Oncology Screening Camp"
  location: string; // e.g. "Civil Hospital Grounds, Mehsana"
  date: string; // e.g. "2025-05-15"
  organizer: string; // e.g. "Harikrishna Cancer Foundation"
  doctorInCharge: string; // e.g. "Dr. S. Shah, MS (Surgical Oncology)"
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface ScreeningRecord {
  id: string;
  campId?: string;
  campName?: string;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: 'Female' | 'Male' | 'Other';
  campLocation?: string;
  timestamp: string;
  sourceImageUrl: string;
  imageHash?: string;
  fileName: string;
  fileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  targetPage?: number;
  answers: ScannedAnswer[];
  totalScore: number;
  riskBand: RiskBand;
  clinicalAdvice: string[];
  suggestedTests: string[];
  reviewedBy: string;
  reviewNotes?: string;
  aiConfidenceAvg: number;
  unclearCount: number;
  cameFromScan: true;
}

export interface ScanUsageLog {
  id: string;
  timestamp: string;
  fileName: string;
  formType: string;
  isDuplicate: boolean;
  modelUsed?: string;
  isLiveApi?: boolean;
  promptTokens?: number;
  candidatesTokens?: number;
  tokenCountEstimate: number; // Total tokens
  costInrEstimate: number; // Actual/calculated cost in INR (₹)
  costUsdEstimate?: number; // Actual/calculated cost in USD ($)
  costPaiseFormatted?: string; // e.g. "1.24 paise"
  status: 'SUCCESS' | 'FLAGGED_REVIEW' | 'FAILED';
}

export interface ImageQualityReport {
  isSharp: boolean;
  sharpnessScore: number; // 0 to 100
  isBalancedLighting: boolean;
  brightnessScore: number; // 0 to 255
  warningMessage?: string;
}

export interface RegisteredPatient {
  id: string;
  patientId: string; // e.g. "CAMP-2025-0814"
  name: string;
  age?: number;
  gender?: 'Female' | 'Male' | 'Other';
  campLocation?: string;
  phone?: string;
  notes?: string;
}

export interface LearnedCorrection {
  id: string;
  code: string;
  rowNumber: number;
  originalAnswer: AnswerType;
  correctedAnswer: AnswerType;
  originalConfidence: number;
  learnedReason?: string;
  timestamp: string;
  appliedCount: number;
}

export interface AppConfiguration {
  monthlyBudgetInr: number; // Camp Monthly Budget & Quota Guard Amount in ₹ INR
  usdToInrRate: number; // INR amount of 1 USD (Exchange Rate)
  quotaWarningThresholdPct: number; // Warning trigger percentage, e.g. 80%
  perScanThresholdMultiplier: number; // Multiplier threshold for per-scan estimate anomaly guard (default 5 for 5x)
  lastUpdated: string;
}

export const DEFAULT_APP_CONFIGURATION: AppConfiguration = {
  monthlyBudgetInr: 2100.0,
  usdToInrRate: 86.50,
  quotaWarningThresholdPct: 80,
  perScanThresholdMultiplier: 5, // 5x threshold on per scan estimate
  lastUpdated: '2026-01-01T00:00:00.000Z',
};
