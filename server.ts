import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Support up to 50MB for high-resolution scanned paper forms & multi-page PDFs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Shared Gemini client with telemetry header
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health and environment status
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      timestamp: new Date().toISOString(),
    });
  });

  // Serve sample PDF brochure information and base64
  app.get('/api/sample-pdf', (_req: Request, res: Response) => {
    try {
      const pdfPath = path.resolve(__dirname, 'public/assets/aistudio/new_screening_brosher_0427c618.pdf');
      if (fs.existsSync(pdfPath)) {
        const fileBuffer = fs.readFileSync(pdfPath);
        const base64 = fileBuffer.toString('base64');
        res.json({
          success: true,
          fileName: 'new_screening_brosher_0427c618.pdf',
          title: 'Onco Digital / Harikrishna Cancer Foundation Screening Brochure',
          mimeType: 'application/pdf',
          sizeBytes: fileBuffer.length,
          base64,
          dataUrl: `data:application/pdf;base64,${base64}`,
          targetPage: 2,
          description: 'Official 2-page Gujarati cancer awareness brochure and 13-question self-screening questionnaire with ના (0) and હા (1/4) columns.',
        });
      } else {
        res.status(404).json({ success: false, message: 'Sample PDF not found on disk' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: message });
    }
  });

  // AI Multimodal Form Scanning API
  app.post('/api/scan-form', async (req: Request, res: Response): Promise<void> => {
    const { imageBase64, mimeType = 'image/jpeg', questions = [], targetPage } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 in request body.' });
      return;
    }

    const ai = getGeminiClient();

    // Build question guidance prompt
    const questionListText = questions
      .map(
        (q: { code: string; rowNumber: number; textEn: string; textGu?: string; scoreYes: number }) =>
          `Row ${q.rowNumber || ''} | Code: ${q.code} | YES Score: ${q.scoreYes} | Prompt: ${q.textEn} ${q.textGu ? `(Gujarati: ${q.textGu})` : ''}`
      )
      .join('\n');

    const promptText = `
You are an expert clinical form reader specialized in physical paper cancer self-screening questionnaires.
Analyze this photo or PDF of a filled cancer screening form.

QUESTION SPECIFICATIONS FOR THIS FORM:
${questionListText}

LAYOUT & MARK RECOGNITION RULES:
1. Forms may be formatted in:
   - English standard with fixed codes (Que-1, Que-2...) and 'YES' and 'NO' boxes.
   - Or Gujarati/regional clinical format (e.g., Harikrishna Cancer Foundation / Onco Digital) with Row Numbers (1 to 13), where the 'NO' column is labeled 'ના' with score '0', and the 'YES' column is labeled 'હા' with score '1' or '4'.
2. The user has filled this form with a pen, pencil, or marker by placing a tick mark (✓), check, cross (X), dot, circle around the number, or filled box.
3. For each question listed above:
   - 'yes': If there is a clear mark in the YES / 'હા' / '1' or '4' column.
   - 'no': If there is a clear mark in the NO / 'ના' / '0' column.
   - 'unclear': If both columns are marked, neither column is marked, a mark is crossed out/corrected, or it is smudged/indistinguishable.
4. Confidence scoring:
   - Rate confidence strictly from 0.0 to 1.0.
   - If the checkmark is crisp and unambiguous, assign 0.85 to 0.99.
   - If faint, handwritten between borders, ambiguous, or questionable, assign under 0.60 so clinical staff can verify.
5. Patient ID & QR Code detection:
   - Check the top header, stamp box, or barcode/QR code area for any Patient ID (e.g., 'CAMP-1042', 'PATIENT ID: ...', QR data, or handwritten ID).
   - If located, extract it into detectedPatientId.
6. If targetPage was requested (${targetPage || 'any'}), focus specifically on the screening table page.
`;

    // If Gemini API Key is configured, make real call
    if (ai) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                results: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: { type: Type.STRING },
                      rowNumber: { type: Type.INTEGER },
                      answer: { type: Type.STRING },
                      confidence: { type: Type.NUMBER },
                      notes: { type: Type.STRING },
                    },
                    required: ['code', 'rowNumber', 'answer', 'confidence'],
                  },
                },
                detectedPatientId: { type: Type.STRING },
                detectedFormType: { type: Type.STRING },
                overallScanQuality: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ['results'],
            },
          },
        });

        const rawJson = response.text || '{}';
        const parsed = JSON.parse(rawJson);

        // Normalize and ensure all requested questions are mapped
        const recognizedResults = (parsed.results || []).map((item: { code: string; rowNumber?: number; answer: string; confidence: number; notes?: string }) => {
          let ans: 'yes' | 'no' | 'unclear' = 'unclear';
          const lower = (item.answer || '').toLowerCase();
          if (lower === 'yes' || lower === 'ha' || lower === '1' || lower === '4') ans = 'yes';
          else if (lower === 'no' || lower === 'na' || lower === '0') ans = 'no';
          else ans = 'unclear';

          return {
            code: item.code,
            rowNumber: item.rowNumber,
            answer: ans,
            confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
            notes: item.notes || '',
          };
        });

        // Compute estimated API token usage & cost (typical Gemini 3.8 Flash model ~$0.00015 USD ≈ ₹0.013 INR)
        const estimatedCostUsd = 0.00015;
        const estimatedCostInr = 0.013; // 1.3 paise INR

        res.json({
          success: true,
          modelUsed: 'gemini-3.8-flash',
          results: recognizedResults,
          detectedPatientId: parsed.detectedPatientId || null,
          detectedFormType: parsed.detectedFormType || 'Physical Paper Questionnaire',
          overallScanQuality: parsed.overallScanQuality || 'Good',
          estimatedCostUsd,
          estimatedCostInr,
          isSimulated: false,
        });
        return;
      } catch (err: unknown) {
        console.error('Error invoking Gemini Vision API:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);

        // If API fails due to quota or invalid key, inform client or fallback gracefully
        res.status(502).json({
          success: false,
          error: errorMessage,
          message: 'Gemini vision interpretation failed. Please verify API key in Settings > Secrets or check connection.',
        });
        return;
      }
    } else {
      // API Key is not configured in local environment; simulate high-fidelity clinical vision reading
      // so testing remains fully interactive
      console.warn('GEMINI_API_KEY not configured. Running clinical vision recognition simulator.');

      const simulatedResults = questions.map((q: { code: string; rowNumber: number; scoreYes: number }) => {
        let answer: 'yes' | 'no' | 'unclear' = 'no';
        let confidence = 0.94;
        let notes = 'Clear pen mark in NO / ના column';

        if (q.rowNumber === 1 || q.code === 'Que-1') {
          answer = 'yes';
          confidence = 0.92;
          notes = 'Checkmark detected in YES / હા column';
        } else if (q.rowNumber === 2 || q.code === 'Que-2') {
          answer = 'yes';
          confidence = 0.96;
          notes = 'Handwritten tick in YES / હા box';
        } else if (q.rowNumber === 7 || q.code === 'Que-7') {
          answer = 'unclear';
          confidence = 0.42;
          notes = 'Ambiguous pen stroke or smudge between ના and હા columns; human review required';
        }

        return {
          code: q.code,
          rowNumber: q.rowNumber,
          answer,
          confidence,
          notes,
        };
      });

      res.json({
        success: true,
        modelUsed: 'gemini-3.8-flash-simulated',
        results: simulatedResults,
        detectedPatientId: 'CAMP-MEHSANA-4091',
        detectedFormType: 'Onco Digital Gujarat 13-Question Form',
        overallScanQuality: 'Acceptable',
        estimatedCostUsd: 0.00015,
        estimatedCostInr: 0.013,
        isSimulated: true,
        notice: 'Simulated vision recognition active because GEMINI_API_KEY is not set.',
      });
      return;
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} [mode: ${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
