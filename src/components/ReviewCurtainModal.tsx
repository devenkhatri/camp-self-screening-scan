import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Languages,
  User,
  MapPin,
  ClipboardCheck,
  ShieldAlert,
  QrCode,
  Sparkles,
  Brain,
  Filter,
  Info,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import {
  ScannedAnswer,
  ScreeningRecord,
  RiskBand,
  RegisteredPatient,
  MedicalCamp,
  FormSummary,
  RespondentHeaderInfo,
} from '../types/screening';
import { calculateScreeningScore } from '../data/screeningData';
import { recordHumanCorrection, getLearnedCorrections } from '../utils/activeLearning';

interface ReviewCurtainModalProps {
  sourceImageUrl: string;
  sourceFileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileName: string;
  imageHash?: string;
  initialAnswers: ScannedAnswer[];
  detectedPatientId?: string;
  matchedPatient?: RegisteredPatient;
  activeCamp?: MedicalCamp;
  initialRespondent?: RespondentHeaderInfo;
  formSummary?: FormSummary;
  onConfirmSave: (record: ScreeningRecord) => void;
  onCancel: () => void;
}

export const ReviewCurtainModal: React.FC<ReviewCurtainModalProps> = ({
  sourceImageUrl,
  sourceFileType,
  fileName,
  imageHash,
  initialAnswers,
  detectedPatientId,
  matchedPatient,
  activeCamp,
  initialRespondent,
  formSummary,
  onConfirmSave,
  onCancel,
}) => {
  const [answers, setAnswers] = useState<ScannedAnswer[]>(initialAnswers);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGujarati, setShowGujarati] = useState<boolean>(true);
  const [mobilePane, setMobilePane] = useState<'form' | 'image'>('form');

  // Patient / Camp metadata - pre-filled from active camp, QR code detection, matched roster, or prompt-reference extraction
  const [patientName, setPatientName] = useState<string>(
    matchedPatient?.name ||
      initialRespondent?.name ||
      (detectedPatientId && !detectedPatientId.startsWith('CAMP-') ? detectedPatientId : '') ||
      'Ramilaben Patel'
  );
  const [patientId, setPatientId] = useState<string>(
    matchedPatient?.patientId ||
      detectedPatientId ||
      (initialRespondent?.phone ? `P-${initialRespondent.phone}` : `CAMP-${Math.floor(1000 + Math.random() * 9000)}`)
  );
  const [patientAge, setPatientAge] = useState<number>(
    matchedPatient?.age || (initialRespondent?.age ? Number(initialRespondent.age) : 54)
  );
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(
    matchedPatient?.gender ||
      (initialRespondent?.gender === 'Female' ? 'Female' : initialRespondent?.gender === 'Male' ? 'Male' : initialRespondent?.gender === 'Other' ? 'Other' : 'Female')
  );
  const [campLocation, setCampLocation] = useState<string>(
    matchedPatient?.campLocation || initialRespondent?.camp_location || activeCamp?.location || 'Mehsana Community Camp'
  );
  const [reviewedBy, setReviewedBy] = useState<string>(
    activeCamp?.doctorInCharge || 'Dr. S. Shah (Oncology Triage)'
  );
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const [activeFilter, setActiveFilter] = useState<'all' | 'flagged' | 'corrected'>('all');
  const [learningNotification, setLearningNotification] = useState<{ message: string; code: string } | null>(null);
  const [isPatientInfoExpanded, setIsPatientInfoExpanded] = useState<boolean>(false);

  // Update answer state & learn on mistake whenever human corrects AI
  const handleAnswerToggle = (code: string, newAnswer: 'yes' | 'no' | 'unclear') => {
    const originalItem = answers.find((item) => item.code === code);
    const wasDifferent = originalItem && originalItem.answer !== newAnswer;

    if (wasDifferent && originalItem) {
      // Record this human correction in the continuous active learning engine
      recordHumanCorrection({
        code: originalItem.code,
        rowNumber: originalItem.rowNumber,
        originalAnswer: originalItem.answer,
        correctedAnswer: newAnswer,
        originalConfidence: originalItem.confidence,
        notes: `Clinician manually corrected ${originalItem.code} to ${newAnswer.toUpperCase()} (e.g. verified physical ink/tick mark)`,
      });

      setLearningNotification({
        code: originalItem.code,
        message: `Active Learning Saved: AI registered your correction for ${originalItem.code} as ${newAnswer.toUpperCase()}. This will calibrate future scans!`,
      });

      setTimeout(() => {
        setLearningNotification(null);
      }, 5000);
    }

    setAnswers((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          return {
            ...item,
            answer: newAnswer,
            isOverridden: true,
            // Once human manually sets it, confidence is 1.0 (verified)
            confidence: 1.0,
            notes: `Manually confirmed by clinician as ${newAnswer.toUpperCase()} (Learned)`,
          };
        }
        return item;
      })
    );
  };

  // Real-time calculation of risk score
  const { totalScore, riskBand, guidance } = calculateScreeningScore(answers);

  // Stats for confidence and reviews
  const flaggedCount = answers.filter((a) => !a.isOverridden && (a.answer === 'unclear' || a.confidence < 0.65)).length;
  const overriddenCount = answers.filter((a) => a.isOverridden).length;
  const highCertaintyCount = answers.filter((a) => !a.isOverridden && a.confidence >= 0.85).length;

  const filteredAnswers = answers.filter((item) => {
    if (activeFilter === 'flagged') {
      return !item.isOverridden && (item.answer === 'unclear' || item.confidence < 0.65);
    }
    if (activeFilter === 'corrected') {
      return item.isOverridden;
    }
    return true;
  });

  const handleSave = () => {
    const aiConfidenceAvg =
      answers.reduce((acc, curr) => acc + curr.confidence, 0) / (answers.length || 1);

    const record: ScreeningRecord = {
      id: `scr-${Date.now()}`,
      campId: activeCamp?.id,
      campName: activeCamp?.name,
      patientId,
      patientName,
      patientAge,
      patientGender,
      campLocation,
      timestamp: new Date().toISOString(),
      sourceImageUrl,
      imageHash,
      fileName,
      fileType: sourceFileType,
      answers,
      totalScore,
      riskBand,
      clinicalAdvice: guidance.actionAdvice,
      suggestedTests: guidance.suggestedTests,
      reviewedBy,
      reviewNotes,
      aiConfidenceAvg,
      unclearCount: answers.filter((a) => a.answer === 'unclear').length,
      cameFromScan: true,
    };

    onConfirmSave(record);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col sm:items-center sm:justify-center sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl w-full max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  Review Curtain
                </h2>
                <span className="text-xs text-slate-400 hidden sm:inline">·</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Human-in-the-loop verification
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-none">
                Verify AI detected marks against paper sheet before saving.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {flaggedCount > 0 ? (
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-md text-[11px] sm:text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{flaggedCount} flagged</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md text-[11px] sm:text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">All marks verified</span>
                <span className="sm:hidden">Verified</span>
              </div>
            )}

            <button
              onClick={onCancel}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Visible on mobile only) */}
        <div className="lg:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5 shrink-0 text-xs gap-1.5">
          <button
            type="button"
            onClick={() => setMobilePane('form')}
            className={`flex-1 py-2 font-bold text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mobilePane === 'form'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Audit Answers ({answers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('image')}
            className={`flex-1 py-2 font-bold text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mobilePane === 'image'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Physical Photo</span>
          </button>
        </div>

        {/* Modal Main Body: Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* Left Pane: Original Scanned Image / PDF Viewer (5 cols) */}
          <div
            className={`lg:col-span-5 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col flex-1 min-h-0 ${
              mobilePane === 'image' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Viewer Controls */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {fileName}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono-tabular px-1.5 text-slate-600 dark:text-slate-400">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Surface */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
              {sourceFileType === 'application/pdf' ? (
                <div className="w-full h-full min-h-[450px] bg-white rounded-lg shadow-xs overflow-hidden border border-slate-200 dark:border-slate-800">
                  <iframe
                    src={`${sourceImageUrl}#page=2&view=FitH`}
                    className="w-full h-full border-none"
                    title="Scanned PDF preview"
                  />
                </div>
              ) : (
                <div
                  className="transition-transform duration-150 origin-center bg-white p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={sourceImageUrl}
                    alt="Physical questionnaire scanned source"
                    className="max-w-full max-h-[600px] object-contain rounded"
                  />
                </div>
              )}
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Original physical document view</span>
              <span>Zoom & scroll to compare handwritten ticks</span>
            </div>
          </div>

          {/* Right Pane: AI Recognition Checklist & Verification (7 cols) */}
          <div
            className={`lg:col-span-7 flex flex-col overflow-hidden bg-white dark:bg-slate-900 min-h-0 flex-1 ${
              mobilePane === 'form' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Patient Header Strip (Responsive: compact with toggle on mobile, full grid on desktop) */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
              {/* Mobile Compact Patient Bar */}
              <div className="flex sm:hidden items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {patientName || 'Participant'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 truncate">
                    · {patientId}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    · {patientAge}y/{patientGender[0]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPatientInfoExpanded(!isPatientInfoExpanded)}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  {isPatientInfoExpanded ? 'Hide' : 'Edit'}
                </button>
              </div>

              {/* Detailed Form (Always visible on sm+, expandable on mobile) */}
              <div className={`${isPatientInfoExpanded ? 'block mt-2 pt-2 border-t border-slate-200 dark:border-slate-700' : 'hidden sm:block'}`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Patient Name
                      </label>
                      {matchedPatient ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Match
                        </span>
                      ) : initialRespondent?.name ? (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> Form Header
                        </span>
                      ) : null}
                    </div>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Patient / Form ID
                      </label>
                      {detectedPatientId && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <QrCode className="w-3 h-3" /> QR
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-mono-tabular bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Age / Gender
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 font-mono-tabular bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 text-center"
                      />
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value as any)}
                        className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Camp / Location
                      </label>
                      {activeCamp && (
                        <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold truncate max-w-[120px]" title={activeCamp.name}>
                          {activeCamp.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={campLocation}
                      onChange={(e) => setCampLocation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Active Learning Fast-Triage Toolbar */}
            <div className="px-3 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  All ({answers.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('flagged')}
                  className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeFilter === 'flagged'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : flaggedCount > 0
                      ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Needs Review ({flaggedCount})</span>
                </button>

                {overriddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('corrected')}
                    className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeFilter === 'corrected'
                        ? 'bg-purple-600 text-white font-bold shadow-xs'
                        : 'text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/60 font-semibold'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Corrected ({overriddenCount})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowGujarati(!showGujarati)}
                  className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Languages className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{showGujarati ? 'EN' : 'ગુજરાતી'}</span>
                </button>
              </div>
            </div>

            {/* Extracted Form Pattern & Summary from prompt-reference.md */}
            {formSummary && (
              <div className="mx-3 sm:mx-4 mt-2 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Extracted Form Pattern:
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {formSummary.form_pattern === 'all_yes'
                      ? 'All Affirmative (All YES)'
                      : formSummary.form_pattern === 'none_marked'
                      ? 'No Marks Detected (Blank Form)'
                      : formSummary.form_pattern === 'all_no_marked'
                      ? 'All Negative (All NO)'
                      : formSummary.form_pattern === 'yes_only_marked'
                      ? 'YES-Only Checked (Negative Baseline)'
                      : 'Mixed Marking'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                  <span>Rows: {formSummary.question_count || answers.length}</span>
                  <span>·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    YES: {formSummary.yes_count ?? answers.filter((a) => a.answer === 'yes').length}
                  </span>
                  <span>·</span>
                  <span>
                    NO: {formSummary.no_count ?? answers.filter((a) => a.answer === 'no').length}
                  </span>
                  {(formSummary.blank_count ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span>Blank: {formSummary.blank_count}</span>
                    </>
                  )}
                  {(formSummary.not_applicable_count ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <span>N/A: {formSummary.not_applicable_count}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Active Learning Notification Banner */}
            {learningNotification && (
              <div className="mx-6 mt-3 p-3 bg-purple-50 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700 rounded-xl flex items-center justify-between gap-3 text-xs text-purple-900 dark:text-purple-200 animate-in fade-in duration-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block text-purple-950 dark:text-purple-100">
                      Continual Active Learning Updated
                    </span>
                    <span className="text-[11px] text-purple-800 dark:text-purple-300">
                      {learningNotification.message}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLearningNotification(null)}
                  className="p-1 hover:bg-purple-200 dark:hover:bg-purple-900 rounded text-purple-700 dark:text-purple-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Scrollable Questions List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 px-4 py-2">
              {filteredAnswers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold">No questions in this filter.</p>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold underline cursor-pointer"
                  >
                    View All Questions
                  </button>
                </div>
              ) : (
                filteredAnswers.map((item) => {
                  const isFlagged = !item.isOverridden && (item.answer === 'unclear' || item.confidence < 0.65);
                  const confidencePct = Math.round(item.confidence * 100);

                  return (
                    <div
                      key={item.code}
                      className={`p-4 transition-all rounded-xl my-1.5 ${
                        item.isOverridden
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 shadow-xs'
                          : isFlagged
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 shadow-xs'
                          : item.answer === 'yes'
                          ? 'bg-rose-50/30 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left: Code, Category, Question text, and Diagnostic notes */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono-tabular font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                              {item.code}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              Row {item.rowNumber}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {item.category}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                              YES = +{item.scoreYes} pt{item.scoreYes > 1 ? 's' : ''}
                            </span>
                            {item.appliesTo && item.appliesTo !== 'all' && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {item.appliesTo === 'male' ? 'Men Only (પુરુષ)' : 'Women Only (મહિલા)'}
                                </span>
                              </>
                            )}
                            {item.rawAnswer && (item.rawAnswer === 'NOT_APPLICABLE' || item.rawAnswer === 'BLANK' || item.rawAnswer === 'BOTH' || item.rawAnswer === 'UNCLEAR') && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                                  {item.rawAnswer}
                                </span>
                              </>
                            )}
                            {item.writtenText && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-medium truncate max-w-[200px]" title={item.writtenText}>
                                  "{item.writtenText}"
                                </span>
                              </>
                            )}
                          </div>

                          <p
                            className={`text-sm text-slate-800 dark:text-slate-200 leading-snug font-medium ${
                              showGujarati ? 'font-gujarati' : ''
                            }`}
                          >
                            {showGujarati && item.questionTextGu ? item.questionTextGu : item.questionText}
                          </p>

                          {/* Optical Diagnostic Notes / Active Learning Hint */}
                          {item.notes && (
                            <div className={`text-xs flex items-center gap-1.5 pt-0.5 ${
                              item.isOverridden
                                ? 'text-purple-700 dark:text-purple-300 font-medium'
                                : isFlagged
                                ? 'text-amber-800 dark:text-amber-300 font-medium'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {item.isOverridden ? (
                                <Brain className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                              ) : isFlagged ? (
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              )}
                              <span>{item.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Color-Coded Confidence Indicator & 3-Way Toggle Buttons */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                          {/* Visual Color-Coded Confidence Score Badge & Progress Meter */}
                          <div className="flex flex-col items-start sm:items-end text-left sm:text-right shrink-0">
                            {item.isOverridden ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-xs">
                                <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                <span>100% Verified</span>
                                <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300 px-1 py-0.2 rounded font-mono font-semibold">
                                  Learned
                                </span>
                              </div>
                            ) : confidencePct >= 85 ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{confidencePct}% High Certainty</span>
                              </div>
                            ) : confidencePct >= 65 ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shadow-xs">
                                <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                <span>{confidencePct}% Moderate</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 animate-pulse shadow-sm">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{confidencePct}% Low Certainty</span>
                              </div>
                            )}

                            {/* Mini Visual Meter Bar */}
                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.isOverridden
                                    ? 'bg-purple-600'
                                    : confidencePct >= 85
                                    ? 'bg-emerald-500'
                                    : confidencePct >= 65
                                    ? 'bg-sky-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${item.isOverridden ? 100 : confidencePct}%` }}
                              />
                            </div>
                          </div>

                          {/* 3-Way Toggle Buttons */}
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleAnswerToggle(item.code, 'no')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                item.answer === 'no'
                                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-300 dark:ring-slate-600'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              NO (ના/0)
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAnswerToggle(item.code, 'yes')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                item.answer === 'yes'
                                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-500'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              YES (હા/+{item.scoreYes})
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAnswerToggle(item.code, 'unclear')}
                              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                item.answer === 'unclear'
                                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-400'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                              title="Mark as unreadable / unclear"
                            >
                              ?
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Reviewer & Save Section (Sticky, always visible on mobile) */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 shadow-lg z-20 safe-area-bottom">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
                {/* Real-time score & risk band */}
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 sm:block shrink-0">
                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Score
                    </span>
                    <span className="text-base sm:text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                      {totalScore} <span className="text-[10px] sm:text-xs font-normal text-slate-500">pts</span>
                    </span>
                  </div>

                  <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-left flex-1 sm:flex-initial ${guidance.badgeBg}`}>
                    <span className="text-[9px] sm:text-[11px] font-medium block uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Triage Risk Result
                    </span>
                    <span className={`text-xs sm:text-sm font-bold truncate block ${guidance.colorClass}`}>
                      {guidance.label}
                    </span>
                  </div>
                </div>

                {/* Final Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={onCancel}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 text-center cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex-2 sm:flex-initial px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
