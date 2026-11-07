import React, { useState } from 'react';
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
} from 'lucide-react';
import { ScreeningQuestion, QuestionCategory } from '../types/screening';

interface QuestionBankAdminProps {
  questions: ScreeningQuestion[];
  setQuestions: React.Dispatch<React.SetStateAction<ScreeningQuestion[]>>;
  onAssignMissingCodes: () => void;
}

export const QuestionBankAdmin: React.FC<QuestionBankAdminProps> = ({
  questions,
  setQuestions,
  onAssignMissingCodes,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form state
  const [formCategory, setFormCategory] = useState<QuestionCategory>('General');
  const [formTextEn, setFormTextEn] = useState<string>('');
  const [formTextGu, setFormTextGu] = useState<string>('');
  const [formScoreYes, setFormScoreYes] = useState<1 | 4>(4);
  const [formTests, setFormTests] = useState<string>('');
  const [formSignificance, setFormSignificance] = useState<string>('');

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
      // Find max code index to assign next Que-N
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

    // Reset
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
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
              onClick={() => {
                setIsAddingNew(false);
                setEditingId(null);
              }}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors shadow-xs"
            >
              Save Question
            </button>
          </div>
        </div>
      )}

      {/* Questions List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Question Inventory ({questions.filter((q) => q.isActive).length}/{questions.length})
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Score 4 = Immediate High Risk Red Flag
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-4 w-16 text-center font-mono">CODE</th>
                <th className="py-3 px-4 w-28">CATEGORY</th>
                <th className="py-3 px-4">QUESTION & GUJARATI TRANSLATION</th>
                <th className="py-3 px-4 w-28 text-center">YES WEIGHT</th>
                <th className="py-3 px-4 w-48">RECOMMENDED TESTS</th>
                <th className="py-3 px-4 w-28 text-center">STATUS</th>
                <th className="py-3 px-4 w-24 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {questions.map((q) => (
                <tr
                  key={q.id}
                  className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                    !q.isActive ? 'opacity-40 bg-slate-50 dark:bg-slate-900/40' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                    {q.code}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {q.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-y-1">
                    <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                      {q.textEn}
                    </div>
                    {q.textGu && (
                      <div className="font-gujarati text-[11px] text-slate-500 dark:text-slate-400">
                        {q.textGu}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold text-xs ${
                        q.scoreYes === 4
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      +{q.scoreYes} pt{q.scoreYes > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 leading-tight">
                    {q.recommendedTests.join(', ') || 'Clinical Evaluation'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(q.id)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                        q.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleStartEdit(q)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                      title="Edit question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
