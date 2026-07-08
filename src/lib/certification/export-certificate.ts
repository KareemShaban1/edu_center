import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import type { CertificateDesignConfig } from './types';

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'certificate';
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => {
      if (!result) reject(new Error('Failed to export image'));
      else resolve(result);
    }, 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function captureCertificateElement(
  element: HTMLElement,
  scale = 2,
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    onclone: (_doc, cloned) => {
      const target = cloned.querySelector('[data-certificate-export]') as HTMLElement | null;
      if (target) {
        target.style.maxWidth = 'none';
        target.style.width = target.getAttribute('data-export-width') ?? '1120px';
      }
    },
  });
}

export async function certificateElementToPngBytes(element: HTMLElement): Promise<Uint8Array> {
  const canvas = await captureCertificateElement(element);
  return canvasToPngBytes(canvas);
}

export async function certificateElementToPdfBytes(element: HTMLElement): Promise<Uint8Array> {
  const canvas = await captureCertificateElement(element);
  const pngBytes = await canvasToPngBytes(canvas);
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedPng(pngBytes);
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });
  return pdfDoc.save();
}

export async function downloadCertificateAsPng(
  element: HTMLElement,
  title: string,
): Promise<void> {
  const canvas = await captureCertificateElement(element);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => {
      if (!result) reject(new Error('Failed to export image'));
      else resolve(result);
    }, 'image/png');
  });
  downloadBlob(blob, `${sanitizeFilename(title)}.png`);
}

export async function downloadCertificateAsPdf(
  element: HTMLElement,
  title: string,
): Promise<void> {
  const bytes = await certificateElementToPdfBytes(element);
  downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${sanitizeFilename(title)}.pdf`);
}

/** Fixed pixel width used for high-quality export renders. */
export const CERTIFICATE_EXPORT_WIDTH = 1120;

export type { CertificateDesignConfig };
