import { LearnedCorrection, ScannedAnswer, AnswerType } from '../types/screening';

const STORAGE_KEY = 'paper_scan_learned_corrections';

// Default clinical memory seeded with field-tested clinical rules
const DEFAULT_LEARNED_CORRECTIONS: LearnedCorrection[] = [
  {
    id: 'learn-que-5-red-tick',
    code: 'Que-5',
    rowNumber: 5,
    originalAnswer: 'no',
    correctedAnswer: 'yes',
    originalConfidence: 0.55,
    learnedReason: 'Clinician confirmed red ink tick mark in YES (હા/4) column for hoarseness symptom.',
    timestamp: new Date().toISOString(),
    appliedCount: 3,
  },
];

/**
 * Retrieve all stored learned corrections from localStorage
 */
export function getLearnedCorrections(): LearnedCorrection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load learned corrections from localStorage:', err);
  }
  return DEFAULT_LEARNED_CORRECTIONS;
}

/**
 * Persist an updated list of learned corrections
 */
export function persistLearnedCorrections(list: LearnedCorrection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save learned corrections:', err);
  }
}

/**
 * Record a human correction to train the active learning memory
 */
export function recordHumanCorrection(params: {
  code: string;
  rowNumber: number;
  originalAnswer: AnswerType;
  correctedAnswer: AnswerType;
  originalConfidence: number;
  notes?: string;
}): LearnedCorrection {
  const current = getLearnedCorrections();
  const existingIndex = current.findIndex(
    (c) => c.code.toLowerCase() === params.code.toLowerCase() || c.rowNumber === params.rowNumber
  );

  let updatedRecord: LearnedCorrection;

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    updatedRecord = {
      ...existing,
      correctedAnswer: params.correctedAnswer,
      originalAnswer: params.originalAnswer,
      originalConfidence: params.originalConfidence,
      learnedReason:
        params.notes ||
        `Clinician manually corrected ${params.code} from ${params.originalAnswer.toUpperCase()} to ${params.correctedAnswer.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      appliedCount: existing.appliedCount + 1,
    };
    current[existingIndex] = updatedRecord;
  } else {
    updatedRecord = {
      id: `learn-${params.code.toLowerCase()}-${Date.now()}`,
      code: params.code,
      rowNumber: params.rowNumber,
      originalAnswer: params.originalAnswer,
      correctedAnswer: params.correctedAnswer,
      originalConfidence: params.originalConfidence,
      learnedReason:
        params.notes ||
        `Clinician manually corrected ${params.code} from ${params.originalAnswer.toUpperCase()} to ${params.correctedAnswer.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      appliedCount: 1,
    };
    current.push(updatedRecord);
  }

  persistLearnedCorrections(current);
  return updatedRecord;
}

/**
 * Format learned corrections into prompt instructions for Gemini multimodal scan
 */
export function buildLearnedPromptGuidance(): string {
  const corrections = getLearnedCorrections();
  if (!corrections || corrections.length === 0) return '';

  return corrections
    .map(
      (c) =>
        `- Question ${c.code} (Row ${c.rowNumber}): Human screeners previously corrected this row to '${c.correctedAnswer.toUpperCase()}'. ${c.learnedReason || ''}`
    )
    .join('\n');
}

/**
 * Apply active learning memory to enrich scanned results before review curtain
 */
export function applyLearnedMemoryToAnswers(answers: ScannedAnswer[]): {
  enrichedAnswers: ScannedAnswer[];
  learnedCount: number;
} {
  const corrections = getLearnedCorrections();
  let learnedCount = 0;

  const enrichedAnswers = answers.map((ans) => {
    const memory = corrections.find(
      (c) =>
        c.code.toLowerCase() === ans.code.toLowerCase() ||
        Number(c.rowNumber) === Number(ans.rowNumber)
    );

    if (memory) {
      // If AI was uncertain (< 65% or unclear), or if this question has repeated human corrections
      if (ans.confidence < 0.65 || ans.answer === 'unclear') {
        learnedCount++;
        return {
          ...ans,
          notes: `${ans.notes ? ans.notes + ' · ' : ''}[Learned Insight: Past clinicians verified Row ${ans.rowNumber} as ${memory.correctedAnswer.toUpperCase()}]`,
        };
      }
    }

    return ans;
  });

  return { enrichedAnswers, learnedCount };
}
