import type { RemarkPage, Stroke, TextMark } from './types';

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.width;

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = stroke.color;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i += 1) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, mark: TextMark) {
  ctx.save();
  ctx.fillStyle = mark.color;
  ctx.font = `${mark.fontSize}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(mark.text, mark.x, mark.y);
  ctx.restore();
}

export function renderRemarkLayer(
  ctx: CanvasRenderingContext2D,
  page: Pick<RemarkPage, 'width' | 'height' | 'strokes' | 'texts'>,
) {
  ctx.clearRect(0, 0, page.width, page.height);
  page.strokes.forEach(stroke => drawStroke(ctx, stroke));
  page.texts.forEach(text => drawText(ctx, text));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function createAnnotationCanvas(page: RemarkPage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }
  renderRemarkLayer(ctx, page);
  return canvas;
}

export async function mergeRemarkPage(page: RemarkPage): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }

  const background = await loadImage(page.backgroundDataUrl);
  ctx.drawImage(background, 0, 0, page.width, page.height);

  const annotationCanvas = createAnnotationCanvas(page);
  ctx.drawImage(annotationCanvas, 0, 0);

  return canvas;
}
