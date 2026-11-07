import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  FileCode,
  Info,
  RefreshCw,
  Eye,
  FileCheck2,
  QrCode,
  Sun,
  Focus,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';
import { ScreeningQuestion, ScannedAnswer, ScanUsageLog, ImageQualityReport } from '../types/screening';
import { sanitizeAndResizeImage } from '../utils/imageProcessing';

interface ScannerUploadProps {
  questions: ScreeningQuestion[];
  onScanComplete: (params: {
    sourceImageUrl: string;
    sourceFileType: 'image/jpeg' | 'image/png' | 'application/pdf';
    fileName: string;
    imageHash: string;
    scannedAnswers: ScannedAnswer[];
    detectedPatientId?: string;
  }) => void;
  previousHashes: string[];
  onLogUsage: (log: ScanUsageLog) => void;
}

interface PendingInspection {
  file: File;
  sanitized: {
    dataUrl: string;
    base64: string;
    mimeType: string;
    width: number;
    height: number;
    hash: string;
    detectedQr: string | null;
    quality: ImageQualityReport;
  };
  isDuplicate: boolean;
}

export const ScannerUpload: React.FC<ScannerUploadProps> = ({
  questions,
  onScanComplete,
  previousHashes,
  onLogUsage,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client-side Pre-Flight Inspection State
  const [pendingInspection, setPendingInspection] = useState<PendingInspection | null>(null);
  const [isPreviewZoomed, setIsPreviewZoomed] = useState<boolean>(false);
  const [manualPatientId, setManualPatientId] = useState<string>('');

  // Camera modal state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 1: Pre-flight Client-Side Inspection (strips EXIF, checks focus/lighting/QR)
  const handleSelectFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    setProcessingStep('Preparing image & performing client-side quality inspection...');

    try {
      const sanitized = await sanitizeAndResizeImage(file);
      const isDuplicate = previousHashes.includes(sanitized.hash);

      setManualPatientId(sanitized.detectedQr || '');
      setPendingInspection({
        file,
        sanitized,
        isDuplicate,
      });
    } catch (err: unknown) {
      console.error('Pre-flight error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to prepare form: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Step 2: User Confirms Pre-Flight -> Transmit to Gemini 3.8 Flash
  const handleProceedWithAiScan = async () => {
    if (!pendingInspection) return;

    const { file, sanitized, isDuplicate } = pendingInspection;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      setProcessingStep('Sending to Gemini 3.8 Flash multimodal reader...');

      const response = await fetch('/api/scan-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: sanitized.base64,
          mimeType: sanitized.mimeType,
          questions: questions.filter((q) => q.isActive),
          targetPage: 2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Server returned HTTP ${response.status}`);
      }

      const scanResult = await response.json();

      setProcessingStep('Mapping answers to question codes...');

      // Map API results back to our standard questions
      const finalAnswers: ScannedAnswer[] = questions
        .filter((q) => q.isActive)
        .map((q) => {
          const match = (scanResult.results || []).find(
            (r: any) =>
              r.code === q.code ||
              r.rowNumber === q.rowNumber ||
              r.code?.toLowerCase() === q.code?.toLowerCase()
          );

          if (match) {
            return {
              code: q.code,
              rowNumber: q.rowNumber,
              questionText: q.textEn,
              questionTextGu: q.textGu,
              category: q.category,
              scoreYes: q.scoreYes,
              answer: match.answer as 'yes' | 'no' | 'unclear',
              confidence: match.confidence,
              notes: match.notes,
            };
          }

          // Fallback if not recognized
          return {
            code: q.code,
            rowNumber: q.rowNumber,
            questionText: q.textEn,
            questionTextGu: q.textGu,
            category: q.category,
            scoreYes: q.scoreYes,
            answer: 'unclear',
            confidence: 0.3,
            notes: 'Question code not located in image; manual check needed.',
          };
        });

      // Log usage for audit and cost tracking in Indian Rupee
      onLogUsage({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fileName: file.name,
        formType: scanResult.detectedFormType || 'Physical Paper Form',
        isDuplicate,
        tokenCountEstimate: 1850,
        costInrEstimate: scanResult.estimatedCostInr || 0.013,
        status: finalAnswers.some((a) => a.confidence < 0.6) ? 'FLAGGED_REVIEW' : 'SUCCESS',
      });

      // Extract patient ID from manual input fallback, client-side QR decoder, or server AI vision
      const detectedPatientId = manualPatientId.trim() || sanitized.detectedQr || scanResult.detectedPatientId || undefined;

      // Reset preflight inspection & open Review Curtain!
      setPendingInspection(null);
      onScanComplete({
        sourceImageUrl: sanitized.dataUrl,
        sourceFileType: sanitized.mimeType as any,
        fileName: file.name,
        imageHash: sanitized.hash,
        scannedAnswers: finalAnswers,
        detectedPatientId,
      });
    } catch (err: unknown) {
      console.error('Scan processing error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to process form scan: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // One-click Sample PDF (Attached Onco Digital brochure)
  const handleLoadSamplePdf = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStep('Loading official attached sample brochure (PDF)...');

    try {
      const res = await fetch('/api/sample-pdf');
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Sample PDF could not be loaded');
      }

      // Convert base64 to File object
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const sampleFile = new File([blob], data.fileName, { type: 'application/pdf' });

      await handleSelectFile(sampleFile);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Could not load sample brochure: ${msg}`);
      setIsProcessing(false);
    }
  };

  // Generate synthetic sample scan presets with realistic QR code stamps
  const handleLoadSyntheticSample = async (presetType: 'clean' | 'amber' | 'highrisk') => {
    setIsProcessing(true);
    setProcessingStep(`Rendering ${presetType} simulated physical scan...`);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Cream-tinted paper background
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header block
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('CANCER SELF-SCREENING QUESTIONNAIRE (સ્વ-તપાસ)', 60, 90);

      ctx.fillStyle = '#475569';
      ctx.font = '20px sans-serif';
      ctx.fillText('Fixed Question Codes & Physical Pen Tick Marks', 60, 130);

      // Draw Patient ID & QR Code stamp in header
      const samplePatientId = `CAMP-ONCO-${presetType === 'clean' ? '1042' : presetType === 'amber' ? '2875' : '9314'}`;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(960, 25, 180, 140);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(960, 25, 180, 140);

      // QR Finder Corners (3 corners)
      const drawFinder = (fx: number, fy: number) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx, fy, 26, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx + 4, fy + 4, 18, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(fx + 7, fy + 7, 12, 12);
      };
      drawFinder(975, 35);
      drawFinder(1100, 35);
      drawFinder(975, 105);

      // Center dots simulation
      ctx.fillStyle = '#0f172a';
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if ((r * 3 + c * 2) % 3 !== 0) {
            ctx.fillRect(1020 + c * 9, 45 + r * 9, 6, 6);
          }
        }
      }

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(samplePatientId, 1050, 153);
      ctx.textAlign = 'left';

      // Table Header
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(60, 180, 1080, 50);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('CODE', 80, 212);
      ctx.fillText('CLINICAL SYMPTOM / QUESTION', 220, 212);
      ctx.fillText('NO (ના/0)', 860, 212);
      ctx.fillText('YES (હા/1,4)', 990, 212);

      // Draw rows
      let y = 260;
      questions.slice(0, 13).forEach((q, idx) => {
        // Line divider
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, y + 25);
        ctx.lineTo(1140, y + 25);
        ctx.stroke();

        // Code
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(q.code, 80, y + 5);

        // Prompt
        ctx.fillStyle = '#334155';
        ctx.font = '16px sans-serif';
        const label = q.textEn.length > 55 ? q.textEn.slice(0, 52) + '...' : q.textEn;
        ctx.fillText(label, 220, y + 5);

        // Checkboxes
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(880, y - 18, 28, 28); // NO box
        ctx.strokeRect(1020, y - 18, 28, 28); // YES box

        // Simulate pen ink marks based on preset
        ctx.strokeStyle = '#1e3a8a'; // Blue ballpoint pen ink
        ctx.lineWidth = 3;

        let shouldTickYes = false;
        let isSmudged = false;

        if (presetType === 'clean') {
          shouldTickYes = false;
        } else if (presetType === 'amber') {
          if (idx === 0) shouldTickYes = true;
          if (idx === 6) isSmudged = true; // Smudge on row 7
        } else if (presetType === 'highrisk') {
          if (idx === 3 || idx === 6 || idx === 9) shouldTickYes = true;
        }

        if (isSmudged) {
          ctx.beginPath();
          ctx.moveTo(940, y - 5);
          ctx.lineTo(990, y);
          ctx.lineTo(960, y + 10);
          ctx.stroke();
        } else if (shouldTickYes) {
          ctx.beginPath();
          ctx.moveTo(1024, y - 2);
          ctx.lineTo(1032, y + 6);
          ctx.lineTo(1044, y - 14);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(884, y - 2);
          ctx.lineTo(892, y + 6);
          ctx.lineTo(904, y - 14);
          ctx.stroke();
        }

        y += 65;
      });

      // Export canvas to clean File
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Canvas render failed');
        const syntheticFile = new File([blob], `sample_${presetType}_screening.jpg`, {
          type: 'image/jpeg',
        });
        await handleSelectFile(syntheticFile);
      }, 'image/jpeg', 0.9);
    } catch (err: unknown) {
      console.error(err);
      setIsProcessing(false);
      setErrorMsg('Failed to generate synthetic test scan');
    }
  };

  // Live Camera capture
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Unable to access device camera. Please check permissions or use file upload.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        stopCamera();
        if (blob) {
          const file = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
          await handleSelectFile(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hero Intro Header */}
      <div className="text-center max-w-3xl mx-auto pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Upload or Photograph Physical Paper Form
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Multimodal AI reads handwritten checks by fixed code (Que-1, Que-2...) or row numbers. Pre-flight inspector checks focus and lighting before sending to AI (estimated at ₹0.013 INR / scan).
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 dark:text-rose-300">
            <span className="font-semibold block text-sm">Processing Failure</span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* CLIENT-SIDE PRE-FLIGHT QUALITY INSPECTION PANEL */}
      {pendingInspection ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                  Pre-Flight Inspection
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-mono-tabular">
                  {pendingInspection.file.name}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Image Quality & QR Code Assessment
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-mono-tabular">
                Estimated AI Cost: <strong className="text-slate-900 dark:text-slate-100">₹0.013 INR</strong>
              </span>
            </div>
          </div>

          {/* Quality Warning Box if blurry or poor lighting */}
          {pendingInspection.sanitized.quality.warningMessage && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold block text-sm">Quality Warning (Action Recommended)</span>
                {pendingInspection.sanitized.quality.warningMessage}
                <span className="block mt-1 text-slate-600 dark:text-slate-400">
                  You can retake the photo under brighter lighting, or proceed if the checkboxes look readable to your eye.
                </span>
              </div>
            </div>
          )}

          {/* Duplicate Warning Box */}
          {pendingInspection.isDuplicate && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold block text-sm">Duplicate Image Detected</span>
                This exact image hash matches an earlier scan. Proceeding will incur a new AI read charge (~₹0.013).
              </div>
            </div>
          )}

          {/* Main Inspection Grid: Image Preview (Left) vs Quality Indicators (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Image Preview Frame */}
            <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 relative group flex flex-col items-center justify-center">
              {pendingInspection.sanitized.mimeType === 'application/pdf' ? (
                <div className="w-full h-72 bg-white rounded-lg overflow-hidden border border-slate-200">
                  <iframe
                    src={`${pendingInspection.sanitized.dataUrl}#page=2&view=FitH`}
                    className="w-full h-full border-none"
                    title="PDF Pre-flight"
                  />
                </div>
              ) : (
                <div className="relative max-h-80 overflow-hidden rounded-lg bg-white p-1">
                  <img
                    src={pendingInspection.sanitized.dataUrl}
                    alt="Pre-flight scan inspection"
                    className={`max-h-76 w-auto object-contain rounded transition-transform ${
                      isPreviewZoomed ? 'scale-150' : 'scale-100'
                    }`}
                  />
                  <button
                    onClick={() => setIsPreviewZoomed(!isPreviewZoomed)}
                    className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-lg text-xs flex items-center gap-1 shadow-md hover:bg-slate-900"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{isPreviewZoomed ? 'Reset' : 'Zoom'}</span>
                  </button>
                </div>
              )}

              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between w-full px-1">
                <span>
                  {pendingInspection.sanitized.width > 0
                    ? `${pendingInspection.sanitized.width} × ${pendingInspection.sanitized.height}px`
                    : 'PDF Document'}
                </span>
                <span>Camera EXIF scrubbed</span>
              </div>
            </div>

            {/* Right: Quality Telemetry Metrics */}
            <div className="lg:col-span-7 space-y-4">
              {/* Metric 1: Sharpness & Focus */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    pendingInspection.sanitized.quality.isSharp
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  }`}>
                    <Focus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                      Edge Sharpness & Focus
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pendingInspection.sanitized.quality.isSharp
                        ? 'High edge definition. Question codes & checkmarks are crisp.'
                        : 'Low edge gradient. Paper might be blurred or out of focus.'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-sm font-bold font-mono-tabular ${
                    pendingInspection.sanitized.quality.isSharp
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {pendingInspection.sanitized.quality.sharpnessScore}%
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {pendingInspection.sanitized.quality.isSharp ? 'Sharp' : 'Blurry'}
                  </span>
                </div>
              </div>

              {/* Metric 2: Lighting & Exposure */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    pendingInspection.sanitized.quality.isBalancedLighting
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  }`}>
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                      Illumination & Exposure
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pendingInspection.sanitized.quality.isBalancedLighting
                        ? 'Even ambient lighting with good page contrast.'
                        : 'Heavy shadow or glare detected on document.'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-sm font-bold font-mono-tabular ${
                    pendingInspection.sanitized.quality.isBalancedLighting
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {pendingInspection.sanitized.quality.brightnessScore} Luma
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {pendingInspection.sanitized.quality.isBalancedLighting ? 'Balanced' : 'Suboptimal'}
                  </span>
                </div>
              </div>

              {/* Metric 3: Patient ID QR Code Detection & Manual Fallback */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      pendingInspection.sanitized.detectedQr
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                        Header QR Code Scanner
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pendingInspection.sanitized.detectedQr
                          ? `Auto-detected: ${pendingInspection.sanitized.detectedQr}`
                          : 'QR code not detected on paper form header'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {pendingInspection.sanitized.detectedQr ? (
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        Detected
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Not Found
                      </span>
                    )}
                  </div>
                </div>

                {/* Patient ID Manual Fallback Input */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Patient ID {pendingInspection.sanitized.detectedQr ? '(Auto-filled from QR)' : '(Manual Fallback)'}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {pendingInspection.sanitized.detectedQr ? 'Editable override' : 'Optional identifier'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={manualPatientId}
                      onChange={(e) => setManualPatientId(e.target.value)}
                      placeholder="e.g. CAMP-2025-0814 or P-1092"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    {manualPatientId.trim() && (
                      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  {!pendingInspection.sanitized.detectedQr && (
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      No QR code found on the physical sheet. Provide the camp token or registration ID manually to link this scan.
                    </p>
                  )}
                </div>
              </div>

              {/* Interactive Confirm / Retake Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingInspection(null)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake / Choose Another Photo
                </button>

                <button
                  type="button"
                  onClick={handleProceedWithAiScan}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Proceed to AI Vision Scan (₹0.013)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD UPLOAD DROP ZONE */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleSelectFile(file);
          }}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white dark:bg-slate-900 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectFile(file);
            }}
          />

          {isProcessing ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white animate-spin" />
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Inspecting Paper Form...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {processingStep || 'Interpreting pen ticks and fixed codes'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md text-xs font-medium">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Integrated QR Code Patient ID Reader & Quality Inspector</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Drop your filled form photo or PDF here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports JPG, PNG photos, or multi-page PDF documents · Auto-checks image focus & lighting before AI analysis
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-xs flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Select File from Device
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo with Camera
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* One-Click Real-World Test Presets Strip */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              One-Click Test Scan Demos
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Includes QR Code stamps and image quality checks (~₹0.013 INR)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Primary: Attached Brochure PDF */}
          <button
            onClick={handleLoadSamplePdf}
            disabled={isProcessing}
            className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl text-left transition-all hover:shadow-xs group disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                Attached PDF Brochure
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono-tabular">
                Real PDF
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              Onco Digital Gujarat 2-page brochure with 13 questions and ના/હા columns.
            </p>
          </button>

          {/* Test Scan 1: Clean pass */}
          <button
            onClick={() => handleLoadSyntheticSample('clean')}
            disabled={isProcessing}
            className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl text-left transition-all hover:shadow-xs disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
              <span className="truncate">Scan 1: All Clear</span>
              <span className="text-[10px] text-emerald-600 font-mono-tabular">Score 0</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              All 13 questions checked NO. Includes Patient ID QR stamp.
            </p>
          </button>

          {/* Test Scan 2: Ambiguous check with amber flag */}
          <button
            onClick={() => handleLoadSyntheticSample('amber')}
            disabled={isProcessing}
            className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl text-left transition-all hover:shadow-xs disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
              <span className="truncate">Scan 2: Smudged / Amber</span>
              <span className="text-[10px] text-amber-600 font-mono-tabular">Flagged</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              Row 7 has an ambiguous smudge. Demonstrates the amber review flag!
            </p>
          </button>

          {/* Test Scan 3: High Risk */}
          <button
            onClick={() => handleLoadSyntheticSample('highrisk')}
            disabled={isProcessing}
            className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl text-left transition-all hover:shadow-xs disabled:opacity-50"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
              <span className="truncate">Scan 3: Red Flags</span>
              <span className="text-[10px] text-rose-600 font-mono-tabular">Score 12</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              Multiple high-weight red flags checked. Expected: High Risk.
            </p>
          </button>
        </div>
      </div>

      {/* Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto aspect-4/3 object-cover" />

            <div className="absolute inset-0 border-2 border-emerald-400/40 m-6 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-xs text-white/80 bg-black/60 px-3 py-1 rounded">
                Align paper questionnaire within borders
              </span>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-between">
              <button
                onClick={stopCamera}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={capturePhoto}
                className="px-6 py-3 rounded-full bg-white text-slate-900 font-semibold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Camera className="w-4 h-4" />
                Capture Form
              </button>

              <div className="w-12" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
