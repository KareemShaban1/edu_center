import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  Highlighter,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Type,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { renderRemarkLayer } from '@/lib/homework-remark/draw';
import { exportRemarkCorrection } from '@/lib/homework-remark/export-correction';
import { loadRemarkDocument } from '@/lib/homework-remark/load-document';
import type { RemarkSourceType } from '@/lib/homework-remark/document-types';
import {
  REMARK_COLORS,
  REMARK_WIDTHS,
  type Point,
  type RemarkPage,
  type RemarkTool,
  type Stroke,
  type TextMark,
} from '@/lib/homework-remark/types';

type Props = {
  fileUrl: string;
  fileName: string;
  onSubmit: (file: File) => Promise<void>;
  submitting?: boolean;
  labels: {
    pen: string;
    highlighter: string;
    eraser: string;
    text: string;
    undo: string;
    clearPage: string;
    previousPage: string;
    nextPage: string;
    page: string;
    submitCorrection: string;
    loadingDocument: string;
    loadFailed: string;
    addTextPrompt: string;
    noFile: string;
  };
};

function clonePages(pages: RemarkPage[]): RemarkPage[] {
  return pages.map(page => ({
    ...page,
    strokes: page.strokes.map(stroke => ({ ...stroke, points: [...stroke.points] })),
    texts: page.texts.map(text => ({ ...text })),
  }));
}

function getPointerPos(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export default function HomeworkRemarkEditor({
  fileUrl,
  fileName,
  onSubmit,
  submitting = false,
  labels,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pages, setPages] = useState<RemarkPage[]>([]);
  const [sourceType, setSourceType] = useState<RemarkSourceType>('image');
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [tool, setTool] = useState<RemarkTool>('pen');
  const [color, setColor] = useState<string>(REMARK_COLORS[0]);
  const [width, setWidth] = useState<number>(REMARK_WIDTHS[1]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [history, setHistory] = useState<RemarkPage[][]>([]);
  const drawingRef = useRef<{ stroke: Stroke | null }>({ stroke: null });

  const currentPage = pages[pageIndex];

  const pushHistory = useCallback((snapshot: RemarkPage[]) => {
    setHistory(prev => [...prev.slice(-30), clonePages(snapshot)]);
  }, []);

  const redraw = useCallback((page: RemarkPage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderRemarkLayer(ctx, page);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadRemarkDocument(fileUrl, fileName)
      .then(result => {
        if (cancelled) return;
        setPages(result.pages);
        setSourceType(result.sourceType);
        setOriginalBytes(result.originalBytes);
        setPageIndex(0);
        setHistory([]);
      })
      .catch(error => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : labels.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fileUrl, fileName, labels.loadFailed]);

  useEffect(() => {
    if (!currentPage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = currentPage.width;
    canvas.height = currentPage.height;
    redraw(currentPage);
  }, [currentPage, pageIndex, redraw]);

  const updateCurrentPage = (updater: (page: RemarkPage) => RemarkPage) => {
    setPages(prev => {
      pushHistory(prev);
      return prev.map((page, index) => (index === pageIndex ? updater(page) : page));
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentPage || tool === 'text') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPointerPos(event.currentTarget, event);
    const stroke: Stroke = {
      tool: tool === 'eraser' ? 'eraser' : tool === 'highlighter' ? 'highlighter' : 'pen',
      color,
      width: tool === 'highlighter' ? width * 2.5 : tool === 'eraser' ? width * 2 : width,
      points: [point],
    };
    drawingRef.current.stroke = stroke;
    updateCurrentPage(page => ({
      ...page,
      strokes: [...page.strokes, stroke],
    }));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const activeStroke = drawingRef.current.stroke;
    if (!activeStroke || !currentPage) return;
    const point = getPointerPos(event.currentTarget, event);
    activeStroke.points.push(point);

    setPages(prev => prev.map((page, index) => {
      if (index !== pageIndex) return page;
      const strokes = [...page.strokes];
      strokes[strokes.length - 1] = {
        ...activeStroke,
        points: [...activeStroke.points],
      };
      return { ...page, strokes };
    }));

    redraw({
      ...currentPage,
      strokes: [...currentPage.strokes.slice(0, -1), { ...activeStroke, points: [...activeStroke.points] }],
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingRef.current.stroke) {
      drawingRef.current.stroke = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'text' || !currentPage) return;
    const point = getPointerPos(event.currentTarget, event);
    const text = window.prompt(labels.addTextPrompt);
    if (!text?.trim()) return;
    const mark: TextMark = {
      x: point.x,
      y: point.y,
      text: text.trim(),
      color,
      fontSize: 18,
    };
    updateCurrentPage(page => ({
      ...page,
      texts: [...page.texts, mark],
    }));
  };

  const handleUndo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setPages(clonePages(previous));
    setHistory(prev => prev.slice(0, -1));
  };

  const handleClearPage = () => {
    if (!currentPage) return;
    updateCurrentPage(page => ({
      ...page,
      strokes: [],
      texts: [],
    }));
  };

  const handleSubmit = async () => {
    if (!originalBytes) return;
    const file = await exportRemarkCorrection({
      pages,
      sourceType,
      originalBytes,
    });
    await onSubmit(file);
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {labels.loadingDocument}
      </div>
    );
  }

  if (loadError) {
    return <p className="text-destructive">{loadError}</p>;
  }

  if (!currentPage) {
    return <p className="text-muted-foreground">{labels.noFile}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap gap-1">
          <Button type="button" size="sm" variant={tool === 'pen' ? 'default' : 'outline'} onClick={() => setTool('pen')}>
            <Pencil className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {labels.pen}
          </Button>
          <Button type="button" size="sm" variant={tool === 'highlighter' ? 'default' : 'outline'} onClick={() => setTool('highlighter')}>
            <Highlighter className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {labels.highlighter}
          </Button>
          <Button type="button" size="sm" variant={tool === 'eraser' ? 'default' : 'outline'} onClick={() => setTool('eraser')}>
            <Eraser className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {labels.eraser}
          </Button>
          <Button type="button" size="sm" variant={tool === 'text' ? 'default' : 'outline'} onClick={() => setTool('text')}>
            <Type className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {labels.text}
          </Button>
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-2">
          {REMARK_COLORS.map(item => (
            <button
              key={item}
              type="button"
              title={item}
              className={cn(
                'h-7 w-7 rounded-full border-2',
                color === item ? 'border-primary' : 'border-transparent',
              )}
              style={{ backgroundColor: item }}
              onClick={() => setColor(item)}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-2">
          {REMARK_WIDTHS.map(item => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={width === item ? 'default' : 'outline'}
              onClick={() => setWidth(item)}
            >
              {item}px
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 border-l border-border pl-2">
          <Button type="button" size="sm" variant="outline" onClick={handleUndo} disabled={history.length === 0}>
            <Undo2 className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {labels.undo}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleClearPage}>
            <RotateCcw className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {labels.clearPage}
          </Button>
        </div>

        {pages.length > 1 && (
          <div className="flex items-center gap-1 border-l border-border pl-2">
            <Button type="button" size="sm" variant="outline" disabled={pageIndex === 0} onClick={() => setPageIndex(i => i - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[80px] text-center text-sm text-muted-foreground">
              {labels.page} {pageIndex + 1} / {pages.length}
            </span>
            <Button type="button" size="sm" variant="outline" disabled={pageIndex >= pages.length - 1} onClick={() => setPageIndex(i => i + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button type="button" size="sm" className="ltr:ml-auto rtl:mr-auto" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin ltr:mr-1 rtl:ml-1" /> : <Save className="h-4 w-4 ltr:mr-1 rtl:ml-1" />}
          {labels.submitCorrection}
        </Button>
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-muted/20 p-4">
        <div className="relative mx-auto w-fit" style={{ maxWidth: `${currentPage.width}px` }}>
          <img
            src={currentPage.backgroundDataUrl}
            alt=""
            className="block w-full select-none"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className={cn(
              'absolute inset-0 h-full w-full touch-none',
              tool === 'text' ? 'cursor-text' : 'cursor-crosshair',
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleCanvasClick}
          />
        </div>
      </div>
    </div>
  );
}
