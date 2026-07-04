import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { RemarkDocument } from './document-types';
import type { RemarkPage } from './types';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFJS_VERSION = '6.1.200';
const PDF_RENDER_SCALE = 1.75;

const pdfJsBaseOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function canvasToDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL('image/png');
}

async function loadImagePage(blob: Blob, originalBytes: Uint8Array): Promise<RemarkDocument> {
  const dataUrl = await blobToDataUrl(blob);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  return {
    sourceType: 'image',
    originalBytes,
    pages: [{
      width: image.naturalWidth,
      height: image.naturalHeight,
      backgroundDataUrl: dataUrl,
      strokes: [],
      texts: [],
    }],
  };
}

async function loadPdfPages(originalBytes: Uint8Array): Promise<RemarkDocument> {
  const pdf = await pdfjs.getDocument({
    data: originalBytes.slice(),
    ...pdfJsBaseOptions,
  }).promise;
  const pages: RemarkPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    pages.push({
      width: canvas.width,
      height: canvas.height,
      backgroundDataUrl: await canvasToDataUrl(canvas),
      strokes: [],
      texts: [],
    });
  }

  return {
    sourceType: 'pdf',
    originalBytes,
    pages,
  };
}

async function toBytes(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function loadRemarkDocument(fileUrl: string, fileName: string): Promise<RemarkDocument> {
  const resolvedUrl = resolveAssetUrl(fileUrl);
  const response = await fetch(resolvedUrl, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to load document (${response.status})`);
  }

  const blob = await response.blob();
  const originalBytes = await toBytes(blob);
  const lowerName = fileName.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') || blob.type === 'application/pdf';

  if (isPdf) {
    return loadPdfPages(originalBytes);
  }

  return loadImagePage(blob, originalBytes);
}
