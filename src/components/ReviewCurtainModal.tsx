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
} from 'lucide-react';
import { ScannedAnswer, ScreeningRecord, RiskBand, RegisteredPatient, MedicalCamp } from '../types/screening';
import { calculateScreeningScore } from '../data/screeningData';

interface ReviewCurtainModalProps {
  sourceImageUrl: string;
  sourceFileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileName: string;
  imageHash?: string;
  initialAnswers: ScannedAnswer[];
  detectedPatientId?: string;
  matchedPatient?: RegisteredPatient;
  activeCamp?: MedicalCamp;
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
  onConfirmSave,
  onCancel,
}) => {
  const [answers, setAnswers] = useState<ScannedAnswer[]>(initialAnswers);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGujarati, setShowGujarati] = useState<boolean>(true);
  const [mobilePane, setMobilePane] = useState<'form' | 'image'>('form');

  // Patient / Camp metadata - pre-filled from active camp, QR code detection, or matched camp roster
  const [patientName, setPatientName] = useState<string>(
    matchedPatient?.name || 'Rameshbhai Patel'
  );
  const [patientId, setPatientId] = useState<string>(
    matchedPatient?.patientId || detectedPatientId || `CAMP-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [patientAge, setPatientAge] = useState<number>(matchedPatient?.age || 54);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(
    matchedPatient?.gender || 'Male'
  );
  const [campLocation, setCampLocation] = useState<string>(
    matchedPatient?.campLocation || activeCamp?.location || 'Mehsana Community Camp'
  );
  const [reviewedBy, setReviewedBy] = useState<string>(
    activeCamp?.doctorInCharge || 'Dr. S. Shah (Oncology Triage)'
  );
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Update answer state
  const handleAnswerToggle = (code: string, newAnswer: 'yes' | 'no' | 'unclear') => {
    setAnswers((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          return {
            ...item,
            answer: newAnswer,
            isOverridden: true,
            // Once human manually sets it, confidence is 1.0 (verified)
            confidence: 1.0,
            notes: `Manually confirmed by clinician as ${newAnswer.toUpperCase()}`,
          };
        }
        return item;
      })
    );
  };

  // Real-time calculation of risk score
  const { totalScore, riskBand, guidance } = calculateScreeningScore(answers);

  // Amber warning check: count rows with confidence < 0.60 or answer === 'unclear'
  const flaggedCount = answers.filter((a) => a.answer === 'unclear' || a.confidence < 0.6).length;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-7xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pre-Save Verification Review Curtain
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Human-in-the-loop audit
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect AI recognition against the physical scanned sheet. Flagged marks require verification before record commit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {flaggedCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-md text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{flaggedCount} row{flaggedCount > 1 ? 's' : ''} flagged for review</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>All marks verified</span>
              </div>
            )}

            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Visible on mobile only) */}
        <div className="lg:hidden flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5 shrink-0 text-xs gap-1">
          <button
            type="button"
            onClick={() => setMobilePane('form')}
            className={`flex-1 py-1.5 font-semibold text-center rounded-lg transition-colors ${
              mobilePane === 'form'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Audit Answers ({answers.length})
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('image')}
            className={`flex-1 py-1.5 font-semibold text-center rounded-lg transition-colors ${
              mobilePane === 'image'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Inspect Physical Photo
          </button>
        </div>

        {/* Modal Main Body: Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* Left Pane: Original Scanned Image / PDF Viewer (5 cols) */}
          <div
            className={`lg:col-span-5 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col min-h-[300px] lg:min-h-0 ${
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
            className={`lg:col-span-7 flex flex-col overflow-hidden bg-white dark:bg-slate-900 ${
              mobilePane === 'form' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Patient Header Strip */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Patient Name
                    </label>
                    {matchedPatient && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Roster Match
                      </span>
                    )}
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
                        <QrCode className="w-3 h-3" /> QR Mapped
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

            {/* List Header & Language Switch */}
            <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Questionnaire Rows ({answers.length})
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Click button to correct AI read
                </span>
              </div>

              <button
                onClick={() => setShowGujarati(!showGujarati)}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 transition-colors"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{showGujarati ? 'Show English' : 'Show Gujarati (ગુજરાતી)'}</span>
              </button>
            </div>

            {/* Scrollable Questions List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 px-4 py-2">
              {answers.map((item) => {
                const isFlagged = item.answer === 'unclear' || item.confidence < 0.6;
                const confidencePct = Math.round(item.confidence * 100);

                return (
                  <div
                    key={item.code}
                    className={`p-3.5 transition-colors rounded-lg my-1 ${
                      isFlagged
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80'
                        : item.answer === 'yes'
                        ? 'bg-rose-50/30 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Code, Category, Question text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <span className="font-mono-tabular font-bold text-slate-900 dark:text-slate-100">
                            {item.code}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 dark:text-slate-400">
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

                          {/* Confidence pill/text */}
                          <span className="text-slate-400">·</span>
                          <span
                            className={`font-mono-tabular text-[11px] font-medium ${
                              confidencePct >= 80
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : confidencePct >= 60
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-amber-700 dark:text-amber-400 font-bold'
                            }`}
                          >
                            {confidencePct}% conf.
                          </span>
                        </div>

                        <p
                          className={`text-sm text-slate-800 dark:text-slate-200 leading-snug ${
                            showGujarati ? 'font-gujarati' : ''
                          }`}
                        >
                          {showGujarati && item.questionTextGu ? item.questionTextGu : item.questionText}
                        </p>

                        {/* Note / Alert */}
                        {isFlagged && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                              {item.notes || 'Confidence below 60% or mark unclear. Verify physical paper.'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Interactive 3-way toggle buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAnswerToggle(item.code, 'no')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            item.answer === 'no'
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                        >
                          NO (ના / 0)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAnswerToggle(item.code, 'yes')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            item.answer === 'yes'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                        >
                          YES (હા / +{item.scoreYes})
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAnswerToggle(item.code, 'unclear')}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            item.answer === 'unclear'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                          title="Mark as unreadable / unclear"
                        >
                          ?
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Reviewer & Save Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Real-time score & risk band */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Calculated Total Score
                    </span>
                    <span className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                      {totalScore} <span className="text-xs font-normal text-slate-500">pts</span>
                    </span>
                  </div>

                  <div className={`px-4 py-2 rounded-lg border text-left ${guidance.badgeBg}`}>
                    <span className="text-[11px] font-medium block uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Risk Stratification
                    </span>
                    <span className={`text-sm font-bold ${guidance.colorClass}`}>
                      {guidance.label}
                    </span>
                  </div>
                </div>

                {/* Final Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancel Scan
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Save Clinical Record</span>
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
