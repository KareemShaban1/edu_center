import { PDFDocument } from 'pdf-lib';
import type { RemarkExportInput } from './document-types';
import { createAnnotationCanvas, mergeRemarkPage } from './draw';

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => {
      if (!result) reject(new Error('Failed to export canvas'));
      else resolve(result);
    }, 'image/png');
  });
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

async function exportPdfWithOriginal(input: RemarkExportInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(input.originalBytes);
  const pageCount = Math.min(pdfDoc.getPageCount(), input.pages.length);

  for (let index = 0; index < pageCount; index += 1) {
    const remarkPage = input.pages[index];
    const pdfPage = pdfDoc.getPage(index);
    const { width, height } = pdfPage.getSize();

    const annotationCanvas = createAnnotationCanvas(remarkPage);
    const pngBytes = await canvasToPngBytes(annotationCanvas);
    const overlay = await pdfDoc.embedPng(pngBytes);

    pdfPage.drawImage(overlay, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return pdfDoc.save();
}

async function exportRasterizedPdf(input: RemarkExportInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const page of input.pages) {
    const merged = await mergeRemarkPage(page);
    const pngBytes = await canvasToPngBytes(merged);
    const image = await pdfDoc.embedPng(pngBytes);
    const pdfPage = pdfDoc.addPage([image.width, image.height]);
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return pdfDoc.save();
}

export async function exportRemarkCorrection(input: RemarkExportInput): Promise<File> {
  if (input.pages.length === 0) {
    throw new Error('No pages to export');
  }

  const pdfBytes = input.sourceType === 'pdf'
    ? await exportPdfWithOriginal(input)
    : await exportRasterizedPdf(input);

  return new File([pdfBytes], 'homework-correction.pdf', { type: 'application/pdf' });
}
