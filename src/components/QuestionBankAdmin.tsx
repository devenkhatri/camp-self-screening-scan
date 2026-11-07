import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Plus,
  Hash,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles,
  Info,
  Users,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  TentTree,
} from 'lucide-react';
import { ScreeningQuestion, QuestionCategory, RegisteredPatient, MedicalCamp, ScreeningRecord } from '../types/screening';
import { DEFAULT_REGISTERED_PATIENTS } from '../data/screeningData';
import { CampManagementAdmin } from './CampManagementAdmin';

interface QuestionBankAdminProps {
  questions: ScreeningQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<ScreeningQuestion[]>>;
  onAssignMissingCodes: () => void;
  registeredPatients: RegisteredPatient[];
  setRegisteredPatients: React.Dispatch<React.SetStateAction<RegisteredPatient[]>>;
  camps: MedicalCamp[];
  setCamps: React.Dispatch<React.SetStateAction<MedicalCamp[]>>;
  activeCampId: string;
  onSelectActiveCamp: (campId: string) => void;
  records: ScreeningRecord[];
  initialTab?: 'questions' | 'camps' | 'patients';
}

export const QuestionBankAdmin: React.FC<QuestionBankAdminProps> = ({
  questions,
  setQuestions,
  onAssignMissingCodes,
  registeredPatients,
  setRegisteredPatients,
  camps,
  setCamps,
  activeCampId,
  onSelectActiveCamp,
  records,
  initialTab = 'camps',
}) => {
  const [adminTab, setAdminTab] = useState<'questions' | 'camps' | 'patients'>(initialTab);

  // Question editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [formCategory, setFormCategory] = useState<QuestionCategory>('General');
  const [formTextEn, setFormTextEn] = useState<string>('');
  const [formTextGu, setFormTextGu] = useState<string>('');
  const [formScoreYes, setFormScoreYes] = useState<1 | 4>(4);
  const [formTests, setFormTests] = useState<string>('');
  const [formSignificance, setFormSignificance] = useState<string>('');

  // Patient Registry State
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleStartEdit = (q: ScreeningQuestion) => {
    setEditingId(q.id);
    setIsAddingNew(false);
    setFormCategory(q.category);
    setFormTextEn(q.textEn);
    setFormTextGu(q.textGu || '');
    setFormScoreYes(q.scoreYes);
    setFormTests(q.recommendedTests.join(', '));
    setFormSignificance(q.clinicalSignificance);
  };

  const handleSaveEdit = () => {
    if (!formTextEn.trim()) return;

    if (isAddingNew) {
      let maxNum = 0;
      questions.forEach((q) => {
        const match = q.code.match(/Que-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const newCode = `Que-${maxNum + 1}`;

      const newQ: ScreeningQuestion = {
        id: `q-${Date.now()}`,
        code: newCode,
        rowNumber: questions.length + 1,
        category: formCategory,
        textEn: formTextEn,
        textGu: formTextGu,
        scoreYes: formScoreYes,
        isActive: true,
        recommendedTests: formTests.split(',').map((s) => s.trim()).filter(Boolean),
        clinicalSignificance: formSignificance,
      };

      setQuestions((prev) => [...prev, newQ]);
      setIsAddingNew(false);
    } else if (editingId) {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === editingId) {
            return {
              ...q,
              category: formCategory,
              textEn: formTextEn,
              textGu: formTextGu,
              scoreYes: formScoreYes,
              recommendedTests: formTests.split(',').map((s) => s.trim()).filter(Boolean),
              clinicalSignificance: formSignificance,
            };
          }
          return q;
        })
      );
      setEditingId(null);
    }

    setFormTextEn('');
    setFormTextGu('');
    setFormTests('');
    setFormSignificance('');
  };

  const handleToggleActive = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isActive: !q.isActive } : q))
    );
  };

  // CSV Parser helper with quote escaping support
  const parseCsvLine = (text: string): string[] => {
    const parts: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    parts.push(cur.trim());
    return parts;
  };

  // Handle CSV file upload
  const handleCsvUpload = async (file: File) => {
    setImportStatus(null);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error('CSV file must contain a header line and at least one patient record row.');
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      // Find column indices
      const idIdx = headers.findIndex((h) => h.includes('patientid') || h.includes('id') || h.includes('token') || h.includes('reg'));
      const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('participant'));
      const ageIdx = headers.findIndex((h) => h.includes('age') || h.includes('year'));
      const genderIdx = headers.findIndex((h) => h.includes('gender') || h.includes('sex'));
      const campIdx = headers.findIndex((h) => h.includes('camp') || h.includes('location') || h.includes('center'));
      const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
      const notesIdx = headers.findIndex((h) => h.includes('note') || h.includes('remark') || h.includes('comment'));

      if (idIdx === -1 && nameIdx === -1) {
        throw new Error('Could not detect "Patient ID" or "Name" columns. Ensure header contains Patient ID and Name.');
      }

      const newPatients: RegisteredPatient[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (row.length === 0 || row.every((c) => !c)) continue;

        const rawId = idIdx !== -1 && row[idIdx] ? row[idIdx] : `CAMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const rawName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : 'Anonymous Participant';
        const rawAge = ageIdx !== -1 && row[ageIdx] ? parseInt(row[ageIdx], 10) : undefined;
        let rawGender: 'Female' | 'Male' | 'Other' | undefined = undefined;
        if (genderIdx !== -1 && row[genderIdx]) {
          const g = row[genderIdx].toUpperCase();
          if (g.startsWith('F')) rawGender = 'Female';
          else if (g.startsWith('M')) rawGender = 'Male';
          else rawGender = 'Other';
        }
        const rawCamp = campIdx !== -1 && row[campIdx] ? row[campIdx] : undefined;
        const rawPhone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : undefined;
        const rawNotes = notesIdx !== -1 && row[notesIdx] ? row[notesIdx] : undefined;

        newPatients.push({
          id: `pat-${Date.now()}-${i}`,
          patientId: rawId,
          name: rawName,
          age: !isNaN(rawAge as number) ? rawAge : undefined,
          gender: rawGender,
          campLocation: rawCamp,
          phone: rawPhone,
          notes: rawNotes,
        });
      }

      if (newPatients.length === 0) {
        throw new Error('No valid patient rows could be parsed from the CSV file.');
      }

      // Merge and deduplicate by patientId
      setRegisteredPatients((prev) => {
        const map = new Map<string, RegisteredPatient>();
        // Add existing first
        prev.forEach((p) => map.set(p.patientId.toLowerCase(), p));
        // Overwrite or append with new
        newPatients.forEach((p) => map.set(p.patientId.toLowerCase(), p));
        return Array.from(map.values());
      });

      setImportStatus({
        type: 'success',
        message: `Successfully imported ${newPatients.length} patient records from ${file.name}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportStatus({ type: 'error', message: msg });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const csvContent =
      'Patient ID,Full Name,Age,Gender,Camp Location,Phone,Notes\r\n' +
      'CAMP-2025-0814,Rameshbhai Patel,54,Male,Mehsana Community Camp,+91 98250 12345,Oral & vocal triage\r\n' +
      'CAMP-2025-0815,Hansaben Prajapati,48,Female,Mehsana Community Camp,+91 98790 67890,Breast & cervical screening\r\n' +
      'CAMP-2025-0816,Dineshbhai Vaghela,62,Male,Ahmedabad Rural Health Camp,+91 94260 45678,Tobacco history\r\n' +
      'CAMP-2025-0817,Gitaben Solanki,42,Female,Ahmedabad Rural Health Camp,+91 99090 98765,Family history\r\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'camp_patients_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter registered patients
  const filteredPatients = registeredPatients.filter(
    (p) =>
      p.patientId.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.campLocation || '').toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Sub-Tabs: Questions vs Patient Registry */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setAdminTab('camps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              adminTab === 'camps'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <TentTree className="w-4 h-4 text-emerald-500" />
            <span>Medical Camps ({camps.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('questions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              adminTab === 'questions'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Screening Questions ({questions.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('patients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              adminTab === 'patients'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Camp Patient Roster ({registeredPatients.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
          {adminTab === 'camps'
            ? 'Medical camp directory & sessions'
            : adminTab === 'questions'
            ? 'Code engine & scoring rules'
            : 'Participant verification list'}
        </span>
      </div>

      {/* TAB: MEDICAL CAMPS */}
      {adminTab === 'camps' && (
        <CampManagementAdmin
          camps={camps}
          setCamps={setCamps}
          activeCampId={activeCampId}
          onSelectActiveCamp={onSelectActiveCamp}
          records={records}
        />
      )}

      {/* TAB 1: QUESTIONS */}
      {adminTab === 'questions' && (
        <div className="space-y-6">
          {/* Admin Action Header */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Screening Question Bank & Code Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Admin configuration. Fixed codes (`Que-1`..`Que-13`) are stable and permanent so forms printed earlier keep working even if reordered.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onAssignMissingCodes}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                title="Automatically fills in any missing Que-X codes sequentially"
              >
                <Hash className="w-4 h-4 text-emerald-600" />
                Assign Codes
              </button>

              <button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingId(null);
                  setFormTextEn('');
                  setFormTextGu('');
                  setFormScoreYes(4);
                  setFormTests('');
                  setFormSignificance('');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add New Question
              </button>
            </div>
          </div>

          {/* Add / Edit Form Drawer */}
          {(isAddingNew || editingId) && (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAddingNew ? 'Create New Screening Question' : 'Edit Question Details'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Clinical Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as QuestionCategory)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="General">General / Hereditary</option>
                    <option value="Addiction">Addiction / Substance</option>
                    <option value="Lifestyle">Lifestyle / Habits</option>
                    <option value="Oral">Oral Cavity</option>
                    <option value="Breast">Breast</option>
                    <option value="Cervical">Cervical</option>
                    <option value="Colorectal">Colorectal</option>
                    <option value="Laryngeal">Laryngeal / Vocal</option>
                    <option value="Esophageal">Esophageal</option>
                    <option value="Prostate">Prostate (Men)</option>
                    <option value="Lung">Lung</option>
                    <option value="Hematologic">Hematologic / Blood</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Score for YES Answer
                  </label>
                  <select
                    value={formScoreYes}
                    onChange={(e) => setFormScoreYes(Number(e.target.value) as 1 | 4)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value={1}>1 Point (Background risk / Addiction / Family)</option>
                    <option value={4}>4 Points (Organ-specific Red Flag Symptom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Recommended Clinical Tests (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Endoscopy, Biopsy, CT Scan"
                    value={formTests}
                    onChange={(e) => setFormTests(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Question Text (English)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter clinical question in English..."
                    value={formTextEn}
                    onChange={(e) => setFormTextEn(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Question Text (Gujarati translation)
                  </label>
                  <input
                    type="text"
                    placeholder="ગુજરાતીમાં પ્રશ્ન દાખલ કરો..."
                    value={formTextGu}
                    onChange={(e) => setFormTextGu(e.target.value)}
                    className="w-full px-3 py-2 font-gujarati bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </div>
          )}

          {/* Question List Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Active Oncology Screening Questionnaire ({questions.filter((q) => q.isActive).length} active rows)
              </span>
              <span>Matched strictly by code (Que-X)</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    !q.isActive ? 'opacity-50 bg-slate-50/50 dark:bg-slate-950/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center">
                      <span className="px-2.5 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono text-xs font-bold rounded-md">
                        {q.code || 'NO-CODE'}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">Row {q.rowNumber}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            q.scoreYes === 4
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          +{q.scoreYes} pts for YES
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {q.textEn}
                      </p>

                      {q.textGu && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-gujarati">
                          {q.textGu}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(q.id)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        q.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {q.isActive ? 'Active in Scan' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => handleStartEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Edit question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT ROSTER (CSV IMPORT & VALIDATION) */}
      {adminTab === 'patients' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Camp Participant Master Registry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Import CSV patient rosters from camp registration desks. When paper forms are scanned, Patient IDs (from QR codes or manual entry) are cross-referenced to verify identity and auto-link demographics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                title="Download formatted CSV template"
              >
                <Download className="w-3.5 h-3.5" />
                CSV Template
              </button>

              <button
                onClick={() => setRegisteredPatients(DEFAULT_REGISTERED_PATIENTS)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                title="Load sample patients for testing"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                Reset Sample Roster
              </button>
            </div>
          </div>

          {/* Import Dropzone Card */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Import Registered Patients from CSV
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Accepts `.csv` files with columns: Patient ID, Full Name, Age, Gender, Camp Location, Phone
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvUpload(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload CSV File</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {importStatus && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">
                  {importStatus.type === 'success' ? 'Import Successful' : 'Import Warning'}
                </span>
                {importStatus.message}
              </div>
            </div>
          )}

          {/* Search & Actions Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient name, ID, camp..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
              <span>Showing {filteredPatients.length} of {registeredPatients.length} participants</span>
              {registeredPatients.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all registered patients?')) {
                      setRegisteredPatients([]);
                    }
                  }}
                  className="text-rose-600 dark:text-rose-400 hover:underline font-medium text-xs"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No registered participants found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Import a CSV or click "Reset Sample Roster" to load test participants for QR validation during form scanning.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-4">PATIENT ID</th>
                      <th className="py-3 px-4">FULL NAME</th>
                      <th className="py-3 px-4">AGE / GENDER</th>
                      <th className="py-3 px-4">CAMP LOCATION</th>
                      <th className="py-3 px-4">CONTACT</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPatients.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {p.patientId}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {p.age ? `${p.age} yrs` : '—'} {p.gender ? `· ${p.gender}` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {p.campLocation || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {p.phone || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setRegisteredPatients((prev) => prev.filter((item) => item.id !== p.id))
                            }
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                            title="Delete patient from roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
