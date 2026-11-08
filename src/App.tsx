import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerUpload } from './components/ScannerUpload';
import { ReviewCurtainModal } from './components/ReviewCurtainModal';
import { QuestionBankAdmin } from './components/QuestionBankAdmin';
import { ScreeningHistoryLog } from './components/ScreeningHistoryLog';
import { PrintableFormModal } from './components/PrintableFormModal';
import { UsageCostTracker } from './components/UsageCostTracker';
import { AppSettingsConfig } from './components/AppSettingsConfig';
import {
  ScreeningQuestion,
  ScreeningRecord,
  ScanUsageLog,
  ScannedAnswer,
  RegisteredPatient,
  MedicalCamp,
  AppConfiguration,
  DEFAULT_APP_CONFIGURATION,
} from './types/screening';
import {
  DEFAULT_SCREENING_QUESTIONS,
  DEFAULT_REGISTERED_PATIENTS,
  DEFAULT_MEDICAL_CAMPS,
  DEFAULT_SAMPLE_SCREENING_RECORDS,
} from './data/screeningData';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  message: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'questions' | 'print' | 'usage' | 'settings'>('scan');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Financial & Operational Configuration State with LocalStorage persistence
  const [config, setConfig] = useState<AppConfiguration>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_app_config');
      if (saved) {
        return { ...DEFAULT_APP_CONFIGURATION, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_APP_CONFIGURATION;
  });

  const handleUpdateConfig = (newConfig: AppConfiguration) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('paper_scan_app_config', JSON.stringify(newConfig));
    } catch {}
    addToast('Configuration updated! Financial indicators recalculated.', 'success');
  };

  // State with LocalStorage persistence
  const [questions, setQuestions] = useState<ScreeningQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_questions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCREENING_QUESTIONS;
  });

  const [records, setRecords] = useState<ScreeningRecord[]>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SAMPLE_SCREENING_RECORDS;
  });

  const [usageLogs, setUsageLogs] = useState<ScanUsageLog[]>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_usage_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatient[]>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_patients');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REGISTERED_PATIENTS;
  });

  // Medical Camps State with LocalStorage persistence
  const [camps, setCamps] = useState<MedicalCamp[]>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_camps');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MEDICAL_CAMPS;
  });

  const [activeCampId, setActiveCampId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('paper_scan_active_camp_id');
      if (saved) return saved;
    } catch {}
    return DEFAULT_MEDICAL_CAMPS[0]?.id || '';
  });

  // Review Curtain State
  const [reviewCurtainData, setReviewCurtainData] = useState<{
    sourceImageUrl: string;
    sourceFileType: 'image/jpeg' | 'image/png' | 'application/pdf';
    fileName: string;
    imageHash: string;
    scannedAnswers: ScannedAnswer[];
    detectedPatientId?: string;
    matchedPatient?: RegisteredPatient;
    campId?: string;
    campName?: string;
    campLocation?: string;
    doctorInCharge?: string;
  } | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('paper_scan_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('paper_scan_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('paper_scan_usage_logs', JSON.stringify(usageLogs));
  }, [usageLogs]);

  useEffect(() => {
    localStorage.setItem('paper_scan_patients', JSON.stringify(registeredPatients));
  }, [registeredPatients]);

  useEffect(() => {
    localStorage.setItem('paper_scan_camps', JSON.stringify(camps));
  }, [camps]);

  useEffect(() => {
    if (activeCampId) {
      localStorage.setItem('paper_scan_active_camp_id', activeCampId);
    }
  }, [activeCampId]);

  // Active camp derived object
  const activeCamp = camps.find((c) => c.id === activeCampId) || camps[0];

  const handleSelectActiveCamp = (campId: string) => {
    setActiveCampId(campId);
    const chosen = camps.find((c) => c.id === campId);
    if (chosen) {
      addToast(`Switched active screening session to "${chosen.name}" (${chosen.location})`, 'info');
    }
  };

  const handleSaveNewCamp = (campData: Omit<MedicalCamp, 'id' | 'createdAt'>) => {
    const newCamp: MedicalCamp = {
      ...campData,
      id: `camp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCamps((prev) => [newCamp, ...prev]);
    setActiveCampId(newCamp.id);
    addToast(`Medical Camp "${newCamp.name}" created and set as active session`, 'success');
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Assign missing codes logic (Rule 1 from prompt)
  const handleAssignMissingCodes = () => {
    let nextNum = 1;
    const updated = questions.map((q) => {
      if (!q.code || !q.code.trim()) {
        const assignedCode = `Que-${nextNum}`;
        nextNum++;
        return { ...q, code: assignedCode };
      }
      // If code exists, find its number
      const match = q.code.match(/Que-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNum) nextNum = num + 1;
      }
      return q;
    });

    setQuestions(updated);
    addToast('Assigned sequential fixed codes (Que-X) to all questions', 'info');
  };

  // Handle scan complete: open Review Curtain Modal
  const handleScanComplete = (params: {
    sourceImageUrl: string;
    sourceFileType: 'image/jpeg' | 'image/png' | 'application/pdf';
    fileName: string;
    imageHash: string;
    scannedAnswers: ScannedAnswer[];
    detectedPatientId?: string;
    matchedPatient?: RegisteredPatient;
    campId?: string;
    campName?: string;
    campLocation?: string;
    doctorInCharge?: string;
  }) => {
    setReviewCurtainData(params);
  };

  // Confirm and persist verified record
  const handleConfirmSaveRecord = (record: ScreeningRecord) => {
    setRecords((prev) => [record, ...prev]);
    setReviewCurtainData(null);
    setActiveTab('history');
    addToast(
      `Screening record saved for ${record.patientName || 'Participant'} (${record.riskBand})`,
      'success'
    );
  };

  const handleLogUsage = (log: ScanUsageLog) => {
    setUsageLogs((prev) => [log, ...prev]);
  };

  // Array of previous hashes to check duplicates
  const previousHashes = records.map((r) => r.imageHash).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewScanClick={() => {
          setActiveTab('scan');
          setReviewCurtainData(null);
        }}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Viewport Container (mobile-friendly padding with bottom dock safe clearance) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {activeTab === 'scan' && (
          <ScannerUpload
            questions={questions}
            onScanComplete={handleScanComplete}
            previousHashes={previousHashes}
            onLogUsage={handleLogUsage}
            registeredPatients={registeredPatients}
            camps={camps}
            activeCamp={activeCamp}
            onSelectActiveCamp={handleSelectActiveCamp}
            onSaveNewCamp={handleSaveNewCamp}
            onOpenCampAdmin={() => setActiveTab('questions')}
            config={config}
          />
        )}

        {activeTab === 'history' && <ScreeningHistoryLog records={records} camps={camps} defaultTab="log" />}

        {activeTab === 'questions' && (
          <QuestionBankAdmin
            questions={questions}
            setQuestions={setQuestions}
            onAssignMissingCodes={handleAssignMissingCodes}
            registeredPatients={registeredPatients}
            setRegisteredPatients={setRegisteredPatients}
            camps={camps}
            setCamps={setCamps}
            activeCampId={activeCampId}
            onSelectActiveCamp={handleSelectActiveCamp}
            records={records}
          />
        )}

        {activeTab === 'print' && <PrintableFormModal questions={questions} />}

        {activeTab === 'usage' && (
          <UsageCostTracker
            logs={usageLogs}
            config={config}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          <AppSettingsConfig
            config={config}
            onUpdateConfig={handleUpdateConfig}
            logs={usageLogs}
            onNavigateToUsage={() => setActiveTab('usage')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Camp Self-Screening Scan System</span>
            <span>·</span>
            <span>Multimodal Vision Triage</span>
            <span>·</span>
            <span>Harikrishna Cancer Foundation / Onco Digital</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Fixed Code Architecture · Standalone Deployment
          </div>
        </div>
      </footer>

      {/* Human Verification Review Curtain Modal */}
      {reviewCurtainData && (
        <ReviewCurtainModal
          sourceImageUrl={reviewCurtainData.sourceImageUrl}
          sourceFileType={reviewCurtainData.sourceFileType}
          fileName={reviewCurtainData.fileName}
          imageHash={reviewCurtainData.imageHash}
          initialAnswers={reviewCurtainData.scannedAnswers}
          detectedPatientId={reviewCurtainData.detectedPatientId}
          matchedPatient={reviewCurtainData.matchedPatient}
          activeCamp={activeCamp}
          onConfirmSave={handleConfirmSaveRecord}
          onCancel={() => setReviewCurtainData(null)}
        />
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white dark:hover:text-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
