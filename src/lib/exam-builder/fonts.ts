import { APP_ARABIC_FONT_OPTIONS, APP_LATIN_FONT_OPTIONS, type FontOption } from '@/lib/branding';

export const EXAM_DEFAULT_FONT = "'Hajeen', 'Cairo', sans-serif";

export const EXAM_ARABIC_FONT_OPTIONS: FontOption[] = APP_ARABIC_FONT_OPTIONS;

export const EXAM_LATIN_FONT_OPTIONS: FontOption[] = [
  ...APP_LATIN_FONT_OPTIONS.filter(option => !['Inter', 'Plus Jakarta Sans'].includes(option.label)),
  { value: 'DejaVu Sans', label: 'DejaVu Sans' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
];
