export interface AppBranding {
  primary_color: string;
  font_body: string;
  font_display: string;
  font_arabic: string;
}

export const BRANDING_STORAGE_KEY = 'edu_app_branding';

export const DEFAULT_APP_BRANDING: AppBranding = {
  primary_color: 'rgb(186, 24, 27)',
  font_body: "'Inter', sans-serif",
  font_display: "'Plus Jakarta Sans', sans-serif",
  font_arabic: "'Hajeen', 'Cairo', 'Noto Sans Arabic', sans-serif",
};

export type FontOption = { value: string; label: string };

export const APP_LATIN_FONT_OPTIONS: FontOption[] = [
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta Sans' },
  { value: "'Arial', sans-serif", label: 'Arial' },
  { value: "'Tahoma', sans-serif", label: 'Tahoma' },
  { value: "'Georgia', serif", label: 'Georgia' },
];

/** Arabic / bilingual fonts — includes self-hosted Hajeen + Google Fonts */
export const APP_ARABIC_FONT_OPTIONS: FontOption[] = [
  { value: "'Hajeen', 'Cairo', sans-serif", label: 'Hajeen' },
  { value: "'Cairo', sans-serif", label: 'Cairo' },
  { value: "'Tajawal', sans-serif", label: 'Tajawal' },
  { value: "'Noto Sans Arabic', sans-serif", label: 'Noto Sans Arabic' },
  { value: "'Noto Naskh Arabic', serif", label: 'Noto Naskh Arabic' },
  { value: "'IBM Plex Sans Arabic', sans-serif", label: 'IBM Plex Sans Arabic' },
  { value: "'Almarai', sans-serif", label: 'Almarai' },
  { value: "'Amiri', serif", label: 'Amiri' },
  { value: "'Scheherazade New', serif", label: 'Scheherazade New' },
  { value: "'El Messiri', sans-serif", label: 'El Messiri' },
  { value: "'Changa', sans-serif", label: 'Changa' },
  { value: "'Reem Kufi', sans-serif", label: 'Reem Kufi' },
  { value: "'Lemonada', cursive", label: 'Lemonada' },
  { value: "'Markazi Text', serif", label: 'Markazi Text' },
  { value: "'Mada', sans-serif", label: 'Mada' },
  { value: "'Katibeh', serif", label: 'Katibeh' },
  { value: "'Readex Pro', sans-serif", label: 'Readex Pro' },
  { value: "'Harmattan', sans-serif", label: 'Harmattan' },
  { value: "'Aref Ruqaa', serif", label: 'Aref Ruqaa' },
  { value: "'Mirza', cursive", label: 'Mirza' },
  { value: "'Ruwudu', serif", label: 'Ruwudu' },
  { value: "'Gulzar', serif", label: 'Gulzar' },
  { value: "'Kufam', sans-serif", label: 'Kufam' },
  { value: "'Vibes', cursive", label: 'Vibes' },
  { value: "'Rubik', sans-serif", label: 'Rubik (Arabic)' },
  { value: "'Lateef', serif", label: 'Lateef' },
  { value: "'Jomhuria', cursive", label: 'Jomhuria' },
  { value: "'Rakkas', cursive", label: 'Rakkas' },
  { value: "'Beiruti', sans-serif", label: 'Beiruti' },
  { value: "'Handjet', sans-serif", label: 'Handjet' },
];

/** @deprecated Use APP_LATIN_FONT_OPTIONS or APP_ARABIC_FONT_OPTIONS */
export const APP_FONT_OPTIONS = [...APP_LATIN_FONT_OPTIONS, ...APP_ARABIC_FONT_OPTIONS];

export function normalizeBranding(input: Partial<AppBranding> | null | undefined): AppBranding {
  return {
    primary_color: input?.primary_color?.trim() || DEFAULT_APP_BRANDING.primary_color,
    font_body: input?.font_body?.trim() || DEFAULT_APP_BRANDING.font_body,
    font_display: input?.font_display?.trim() || DEFAULT_APP_BRANDING.font_display,
    font_arabic: input?.font_arabic?.trim() || DEFAULT_APP_BRANDING.font_arabic,
  };
}

export function readCachedBranding(): AppBranding | null {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return null;
    return normalizeBranding(JSON.parse(raw) as Partial<AppBranding>);
  } catch {
    return null;
  }
}

export function cacheBranding(branding: AppBranding) {
  localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
}

export function applyBrandingToDocument(branding: AppBranding) {
  const root = document.documentElement;
  root.style.setProperty('--primary', branding.primary_color);
  root.style.setProperty('--sidebar-primary', branding.primary_color);
  root.style.setProperty('--font-body', branding.font_body);
  root.style.setProperty('--font-display', branding.font_display);
  root.style.setProperty('--font-arabic', branding.font_arabic);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', colorInputValue(branding.primary_color));
  }
}

export function colorInputValue(color: string): string {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) return trimmed.slice(0, 7);
  const rgbMatch = trimmed.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
    return `#${hex(rgbMatch[1])}${hex(rgbMatch[2])}${hex(rgbMatch[3])}`;
  }
  return '#ba181b';
}

export function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return DEFAULT_APP_BRANDING.primary_color;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = colorInputValue(hex).replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHexWithWhite(hex: string, whiteWeight: number): string {
  const normalized = colorInputValue(hex).replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const w = Math.min(1, Math.max(0, whiteWeight));
  const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
  const toHex = (n: number) => mix(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darkenHex(hex: string, amount: number): string {
  const normalized = colorInputValue(hex).replace('#', '');
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(normalized.slice(0, 2), 16) - amount);
  const g = clamp(parseInt(normalized.slice(2, 4), 16) - amount);
  const b = clamp(parseInt(normalized.slice(4, 6), 16) - amount);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface LandingBrand {
  red: string;
  redDark: string;
  redLight: string;
  redSoft: string;
  redMuted: string;
  text: string;
  textMuted: string;
  surface: string;
  bg: string;
  border: string;
}

export function buildLandingBrand(primaryColor: string): LandingBrand {
  const red = colorInputValue(primaryColor);
  return {
    red,
    redDark: darkenHex(red, 28),
    redLight: mixHexWithWhite(red, 0.92),
    redSoft: `${red}22`,
    redMuted: `${red}44`,
    text: '#1F2937',
    textMuted: '#6B7280',
    surface: '#FFFFFF',
    bg: '#FAFAFA',
    border: '#E5E7EB',
  };
}
