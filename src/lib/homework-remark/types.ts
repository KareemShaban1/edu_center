export type RemarkTool = 'pen' | 'highlighter' | 'eraser' | 'text';

export type Point = { x: number; y: number };

export type Stroke = {
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  points: Point[];
};

export type TextMark = {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
};

export type RemarkPage = {
  width: number;
  height: number;
  backgroundDataUrl: string;
  strokes: Stroke[];
  texts: TextMark[];
};

export const REMARK_COLORS = ['#ef4444', '#2563eb', '#16a34a', '#111827', '#eab308'] as const;

export const REMARK_WIDTHS = [2, 4, 8] as const;
