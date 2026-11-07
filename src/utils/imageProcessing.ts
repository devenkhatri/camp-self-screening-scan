import { ImageQualityReport } from '../types/screening';
import jsQR from 'jsqr';

/**
 * Resizes an image file to max 1920px on the longest edge,
 * strips EXIF metadata through canvas redraw, detects any printed/stamped QR code,
 * and outputs clean JPEG base64 and data URL.
 */
export async function sanitizeAndResizeImage(
  file: File
): Promise<{
  dataUrl: string;
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  hash: string;
  detectedQr: string | null;
  quality: ImageQualityReport;
}> {
  return new Promise((resolve, reject) => {
    // If it's a PDF, we cannot decode directly into an Image object without PDF canvas
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        // Fast hash for PDF
        const hash = generateStringHash(base64.slice(0, 5000));
        resolve({
          dataUrl: result,
          base64,
          mimeType: 'application/pdf',
          width: 0,
          height: 0,
          hash,
          detectedQr: null,
          quality: { isSharp: true, sharpnessScore: 95, isBalancedLighting: true, brightnessScore: 210 },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);

      const maxDim = 1920;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      // Fill white background in case of transparent PNG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Extract clean JPEG without EXIF
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      const base64 = dataUrl.split(',')[1];
      const hash = computePerceptualHash(canvas);

      // Assess image sharpness and lighting quality
      const quality = analyzeImageQuality(canvas);

      // Detect QR code from the scanned image (Patient ID)
      const detectedQr = await detectQrCodeFromCanvas(canvas);

      resolve({
        dataUrl,
        base64,
        mimeType: 'image/jpeg',
        width,
        height,
        hash,
        detectedQr,
        quality,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for scanning'));
    };

    img.src = objectUrl;
  });
}

/**
 * Computes a fast 16x16 perceptual grayscale block hash to detect duplicate uploads.
 */
function computePerceptualHash(sourceCanvas: HTMLCanvasElement): string {
  try {
    const hashCanvas = document.createElement('canvas');
    hashCanvas.width = 16;
    hashCanvas.height = 16;
    const ctx = hashCanvas.getContext('2d');
    if (!ctx) return String(Date.now());

    ctx.drawImage(sourceCanvas, 0, 0, 16, 16);
    const imgData = ctx.getImageData(0, 0, 16, 16).data;

    let totalLuma = 0;
    const lumas: number[] = [];

    for (let i = 0; i < imgData.length; i += 4) {
      const luma = Math.round(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
      lumas.push(luma);
      totalLuma += luma;
    }

    const avgLuma = totalLuma / lumas.length;
    let hashBinary = '';
    for (const luma of lumas) {
      hashBinary += luma >= avgLuma ? '1' : '0';
    }

    // Convert binary string to hex
    let hex = '';
    for (let i = 0; i < hashBinary.length; i += 4) {
      hex += parseInt(hashBinary.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return String(Date.now());
  }
}

function generateStringHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Fast client-side sharpness and lighting quality assessment.
 */
export function analyzeImageQuality(canvasOrImg: HTMLCanvasElement): ImageQualityReport {
  try {
    const ctx = canvasOrImg.getContext('2d');
    if (!ctx) {
      return { isSharp: true, sharpnessScore: 85, isBalancedLighting: true, brightnessScore: 180 };
    }

    // Sample a 200x200 patch in center to evaluate sharpness
    const sampleSize = Math.min(200, canvasOrImg.width, canvasOrImg.height);
    const startX = Math.floor((canvasOrImg.width - sampleSize) / 2);
    const startY = Math.floor((canvasOrImg.height - sampleSize) / 2);

    const imgData = ctx.getImageData(startX, startY, sampleSize, sampleSize).data;
    let totalBrightness = 0;
    let gradientSum = 0;
    let pixelCount = imgData.length / 4;

    for (let i = 0; i < imgData.length - 4; i += 4) {
      const b1 = (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
      const b2 = (imgData[i + 4] + imgData[i + 5] + imgData[i + 6]) / 3;
      totalBrightness += b1;
      gradientSum += Math.abs(b1 - b2);
    }

    const avgBrightness = Math.round(totalBrightness / pixelCount);
    const avgGradient = gradientSum / pixelCount;

    // Normal printed paper with black ink typically produces high edge gradients
    const sharpnessScore = Math.min(100, Math.round(avgGradient * 3.5));
    const isSharp = sharpnessScore >= 20;
    const isBalancedLighting = avgBrightness >= 50 && avgBrightness <= 245;

    let warningMessage: string | undefined;
    if (!isSharp && !isBalancedLighting) {
      warningMessage = 'Photo appears blurry and poorly lit. Retaking in bright even light is recommended.';
    } else if (!isSharp) {
      warningMessage = 'Photo may be slightly out of focus. Ensure question codes and checkboxes are crisp.';
    } else if (avgBrightness < 50) {
      warningMessage = 'Photo appears very dark or shadowed. Better lighting improves reading accuracy.';
    }

    return {
      isSharp,
      sharpnessScore,
      isBalancedLighting,
      brightnessScore: avgBrightness,
      warningMessage,
    };
  } catch {
    return { isSharp: true, sharpnessScore: 85, isBalancedLighting: true, brightnessScore: 180 };
  }
}

/**
 * Detects and decodes any QR code present on the canvas using:
 * 1. Native window.BarcodeDetector API (modern Chromium / Android)
 * 2. jsQR software fallback across full canvas and top-third header region
 */
export async function detectQrCodeFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  // 1. Try native BarcodeDetector if supported by the browser
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39'] });
      const barcodes = await barcodeDetector.detect(canvas);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch (e) {
      // Continue to jsQR fallback
    }
  }

  // 2. Fallback to jsQR across canvas
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Scan full canvas
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (code && code.data && code.data.trim()) {
      return code.data.trim();
    }

    // If not found in full canvas, inspect top 35% header area where Patient ID QR boxes are printed
    const headerHeight = Math.floor(canvas.height * 0.35);
    if (headerHeight > 100) {
      const headerData = ctx.getImageData(0, 0, canvas.width, headerHeight);
      const headerCode = jsQR(headerData.data, headerData.width, headerData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (headerCode && headerCode.data && headerCode.data.trim()) {
        return headerCode.data.trim();
      }
    }
  } catch (err) {
    console.warn('QR code decode error:', err);
  }

  return null;
}

