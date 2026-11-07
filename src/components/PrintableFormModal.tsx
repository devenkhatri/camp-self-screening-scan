import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Eye,
  FileText,
  CheckSquare,
  Sparkles,
  QrCode,
  RefreshCw,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ScreeningQuestion } from '../types/screening';

interface PrintableFormModalProps {
  questions: ScreeningQuestion[];
}

export const PrintableFormModal: React.FC<PrintableFormModalProps> = ({ questions }) => {
  const [printLanguage, setPrintLanguage] = useState<'bilingual' | 'english' | 'gujarati'>('bilingual');
  const [clinicName, setClinicName] = useState<string>('Community Oncology Screening Camp');
  const [patientId, setPatientId] = useState<string>(`CAMP-MH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Generate QR code data URL whenever patientId changes
  useEffect(() => {
    if (patientId.trim()) {
      QRCode.toDataURL(patientId.trim(), {
        width: 240,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [patientId]);

  const handleRandomizeId = () => {
    setPatientId(`CAMP-MH-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Direct client-side A4 PDF generation and download
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadSuccessNotice(null);

    try {
      const element = printAreaRef.current;

      // High-resolution canvas snapshot (2x retina scale for crisp print text)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210; // A4 standard width in mm
      const pdfHeight = 297; // A4 standard height in mm

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Scale to fit cleanly on single A4 sheet
        const scale = pdfHeight / imgHeight;
        const scaledWidth = imgWidth * scale;
        const offsetX = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'JPEG', offsetX, 0, scaledWidth, pdfHeight);
      }

      const fileName = `Cancer_Screening_Form_${patientId || 'A4'}.pdf`;
      pdf.save(fileName);

      setDownloadSuccessNotice(`Downloaded ${fileName} successfully! Ready to print and distribute.`);
      setTimeout(() => setDownloadSuccessNotice(null), 6000);
    } catch (err: unknown) {
      console.error('Failed to export PDF directly:', err);
      // Fallback to browser print if available
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Configuration & Action Bar (Hidden when printing) */}
      <div className="no-print p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Printable Paper Form Studio & PDF Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generates downloadable A4 PDF questionnaires with scannable Patient ID QR codes, fixed codes, and YES/NO checkboxes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Patient ID QR Generator Control */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Patient ID:
            </label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-32 px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={handleRandomizeId}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded"
              title="Generate new ID"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setPrintLanguage('bilingual')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                printLanguage === 'bilingual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Bilingual (Eng + Guj)
            </button>
            <button
              onClick={() => setPrintLanguage('english')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                printLanguage === 'english'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              English Only
            </button>
            <button
              onClick={() => setPrintLanguage('gujarati')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                printLanguage === 'gujarati'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ગુજરાતી (Gujarati)
            </button>
          </div>

          {/* Secondary: Browser Print */}
          <button
            onClick={handleBrowserPrint}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            title="Open system print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dialog</span>
          </button>

          {/* Primary: Direct PDF Download */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Form PDF (A4)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {downloadSuccessNotice && (
        <div className="no-print p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{downloadSuccessNotice}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessNotice(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* The Printable Paper Sheet (Captured by html2canvas into PDF) */}
      <div
        ref={printAreaRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl border border-slate-300 shadow-lg max-w-[850px] mx-auto print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Printable Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                COMMUNITY ONCOLOGY PROGRAM · ONCO DIGITAL
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                Cancer Self-Screening Questionnaire (કેન્સર સ્વ-તપાસ)
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Take 5 minutes to complete at home or camp. Check marks are read automatically by AI vision using question codes.
              </p>
            </div>

            {/* QR / Patient ID Stamp Box */}
            <div className="w-28 border-2 border-slate-900 rounded-lg p-1.5 flex flex-col items-center justify-center text-center shrink-0 bg-white">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Patient QR ${patientId}`}
                  className="w-20 h-20 object-contain mx-auto"
                />
              ) : (
                <QrCode className="w-12 h-12 text-slate-800 mb-0.5" />
              )}
              <span className="text-[9px] font-mono font-bold leading-tight uppercase text-slate-900 truncate max-w-[100px] mt-0.5">
                {patientId}
              </span>
              <span className="text-[7px] text-slate-500 uppercase tracking-wider font-semibold">
                SCANNER QR CODE
              </span>
            </div>
          </div>

          {/* Fillable Meta Fields */}
          <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Name / નામ</span>
              <div className="border-b border-slate-400 h-6"></div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Age / Gender (ઉંમર)</span>
              <div className="border-b border-slate-400 h-6"></div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Phone / ફોન નંબર</span>
              <div className="border-b border-slate-400 h-6"></div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Date & Camp Location</span>
              <div className="border-b border-slate-400 h-6"></div>
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="p-2.5 bg-slate-100 rounded-md border border-slate-300 text-xs text-slate-800 mb-4 flex items-center justify-between">
          <span>
            <strong>Instructions:</strong> Use a blue or black pen. Mark a clear tick (✓) in either the <strong>NO</strong> or <strong>YES</strong> box for each row.
          </span>
          <span className="font-gujarati text-[11px] text-slate-700">
            દરેક પ્રશ્ન માટે <strong>ના</strong> અથવા <strong>હા</strong> ના ખાનામાં ખરાની (✓) નિશાની કરો.
          </span>
        </div>

        {/* The Questions Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-300 font-bold text-slate-900">
                <th className="py-2.5 px-3 w-16 text-center font-mono">CODE</th>
                <th className="py-2.5 px-3">QUESTION / CLINICAL SCREENING SYMPTOM</th>
                <th className="py-2.5 px-3 w-24 text-center border-l border-slate-300">
                  NO<br />
                  <span className="font-gujarati font-normal text-[11px]">ના (0)</span>
                </th>
                <th className="py-2.5 px-3 w-28 text-center border-l border-slate-300">
                  YES<br />
                  <span className="font-gujarati font-normal text-[11px]">હા (1/4)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {questions.map((q) => (
                <tr key={q.code} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                    {q.code}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 leading-snug">
                    {printLanguage === 'bilingual' && (
                      <div>
                        <div className="font-gujarati font-medium text-slate-950 mb-0.5">
                          {q.textGu || q.textEn}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {q.textEn}
                        </div>
                      </div>
                    )}
                    {printLanguage === 'english' && (
                      <div className="font-medium text-slate-900">{q.textEn}</div>
                    )}
                    {printLanguage === 'gujarati' && (
                      <div className="font-gujarati font-medium text-slate-950 text-sm">
                        {q.textGu || q.textEn}
                      </div>
                    )}
                  </td>
                  {/* NO Checkbox */}
                  <td className="py-2.5 px-3 text-center border-l border-slate-200">
                    <div className="w-6 h-6 border-2 border-slate-600 rounded mx-auto"></div>
                  </td>
                  {/* YES Checkbox */}
                  <td className="py-2.5 px-3 text-center border-l border-slate-200">
                    <div className="w-6 h-6 border-2 border-slate-600 rounded mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="mt-6 pt-4 border-t border-slate-300 text-[10px] text-slate-500 flex items-center justify-between">
          <span>
            Clinical Risk Tiers: Score 0 = No Risk · Score 1–3 = Low Risk (Screening Test) · Score 4+ = High Risk (Consult Doctor Immediately)
          </span>
          <span className="font-mono">FORM-VER-2026.04</span>
        </div>
      </div>
    </div>
  );
};
