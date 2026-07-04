export interface AppBranding {
  primary_color: string;
  font_body: string;
  font_display: string;
  font_arabic: string;
  text_scale: string;
  text_scale_ar: string;
  nav_font_scale: string;
  nav_font_scale_ar: string;
  button_font_scale: string;
  button_font_scale_ar: string;
  table_font_scale: string;
  table_font_scale_ar: string;
  landing_text_scale: string;
  landing_text_scale_ar: string;
}

export const BRANDING_STORAGE_KEY = 'edu_app_branding';

export const DEFAULT_APP_BRANDING: AppBranding = {
  primary_color: 'rgb(186, 24, 27)',
  font_body: "'Inter', sans-serif",
  font_display: "'Plus Jakarta Sans', sans-serif",
  font_arabic: "'Hajeen', 'Cairo', sans-serif",
  text_scale: '106.25',
  text_scale_ar: '112.5',
  nav_font_scale: '100',
  nav_font_scale_ar: '100',
  button_font_scale: '100',
  button_font_scale_ar: '100',
  table_font_scale: '100',
  table_font_scale_ar: '100',
  landing_text_scale: '100',
  landing_text_scale_ar: '100',
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
  { value: "'Naveid Arabic', 'Cairo', sans-serif", label: 'Naveid Arabic' },
  { value: "'Tinta Arabic', 'Cairo', sans-serif", label: 'Tinta Arabic' },
  { value: "'Tufuli Arabic', 'Cairo', sans-serif", label: 'Tufuli Arabic' },
  { value: "'Lutfey Arabic', 'Cairo', sans-serif", label: 'Lutfey Arabic' },
  { value: "'Ramis Arabic', 'Cairo', sans-serif", label: 'Ramis Arabic' },
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

const LOCAL_OR_SYSTEM_FONTS = new Set([
  'arial',
  'tahoma',
  'georgia',
  'times new roman',
  'courier new',
  'hajeen',
  'naveid arabic',
  'tinta arabic',
  'tufuli arabic',
  'lutfey arabic',
  'ramis arabic',
  'system-ui',
  'sans-serif',
  'serif',
]);

/** First family name from a CSS font-family stack. */
export function primaryFontName(stack: string): string {
  const first = stack.split(',')[0]?.trim() ?? '';
  return first.replace(/^['"]+|['"]+$/g, '').trim();
}

/** Map a stored stack to the closest known option so selects stay in sync. */
export function resolveFontOption(
  value: string | undefined,
  options: FontOption[],
  fallback: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  const exact = options.find(o => o.value === trimmed);
  if (exact) return exact.value;

  const primary = primaryFontName(trimmed).toLowerCase();
  const byPrimary = options.find(o => primaryFontName(o.value).toLowerCase() === primary);
  if (byPrimary) return byPrimary.value;

  return trimmed;
}

/** Load a Google Font for the primary family in a stack (skips local/system fonts). */
export function ensureFontFaceLoaded(fontStack: string) {
  if (typeof document === 'undefined') return;

  const name = primaryFontName(fontStack);
  if (!name || LOCAL_OR_SYSTEM_FONTS.has(name.toLowerCase())) return;

  const id = `gfont-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

/** @deprecated Use APP_LATIN_FONT_OPTIONS or APP_ARABIC_FONT_OPTIONS */
export const APP_FONT_OPTIONS = [...APP_LATIN_FONT_OPTIONS, ...APP_ARABIC_FONT_OPTIONS];

export type TextScaleOption = { value: string; labelKey: string };

/** Root font-size scale (% of browser default 16px). */
export const APP_TEXT_SCALE_OPTIONS: TextScaleOption[] = [
  { value: '87.5', labelKey: 'platform.settings.textSizeSmall' },
  { value: '100', labelKey: 'platform.settings.textSizeDefault' },
  { value: '106.25', labelKey: 'platform.settings.textSizeMedium' },
  { value: '112.5', labelKey: 'platform.settings.textSizeLarge' },
  { value: '118.75', labelKey: 'platform.settings.textSizeXLarge' },
  { value: '125', labelKey: 'platform.settings.textSizeMaximum' },
];

function normalizeTextScale(value: string | undefined, fallback: string): string {
  const n = Number.parseFloat(value ?? '');
  if (Number.isNaN(n) || n < 80 || n > 150) return fallback;
  return String(n);
}

export function normalizeBranding(input: Partial<AppBranding> | null | undefined): AppBranding {
  return {
    primary_color: input?.primary_color?.trim() || DEFAULT_APP_BRANDING.primary_color,
    font_body: resolveFontOption(input?.font_body, APP_LATIN_FONT_OPTIONS, DEFAULT_APP_BRANDING.font_body),
    font_display: resolveFontOption(input?.font_display, APP_LATIN_FONT_OPTIONS, DEFAULT_APP_BRANDING.font_display),
    font_arabic: resolveFontOption(input?.font_arabic, APP_ARABIC_FONT_OPTIONS, DEFAULT_APP_BRANDING.font_arabic),
    text_scale: normalizeTextScale(input?.text_scale, DEFAULT_APP_BRANDING.text_scale),
    text_scale_ar: normalizeTextScale(input?.text_scale_ar, DEFAULT_APP_BRANDING.text_scale_ar),
    nav_font_scale: normalizeTextScale(input?.nav_font_scale, DEFAULT_APP_BRANDING.nav_font_scale),
    nav_font_scale_ar: normalizeTextScale(input?.nav_font_scale_ar, DEFAULT_APP_BRANDING.nav_font_scale_ar),
    button_font_scale: normalizeTextScale(input?.button_font_scale, DEFAULT_APP_BRANDING.button_font_scale),
    button_font_scale_ar: normalizeTextScale(input?.button_font_scale_ar, DEFAULT_APP_BRANDING.button_font_scale_ar),
    table_font_scale: normalizeTextScale(input?.table_font_scale, DEFAULT_APP_BRANDING.table_font_scale),
    table_font_scale_ar: normalizeTextScale(input?.table_font_scale_ar, DEFAULT_APP_BRANDING.table_font_scale_ar),
    landing_text_scale: normalizeTextScale(input?.landing_text_scale, DEFAULT_APP_BRANDING.landing_text_scale),
    landing_text_scale_ar: normalizeTextScale(input?.landing_text_scale_ar, DEFAULT_APP_BRANDING.landing_text_scale_ar),
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
  const normalized = normalizeBranding(branding);
  ensureFontFaceLoaded(normalized.font_body);
  ensureFontFaceLoaded(normalized.font_display);
  ensureFontFaceLoaded(normalized.font_arabic);

  const root = document.documentElement;
  root.style.setProperty('--primary', normalized.primary_color);
  root.style.setProperty('--sidebar-primary', normalized.primary_color);
  root.style.setProperty('--font-body', normalized.font_body);
  root.style.setProperty('--font-display', normalized.font_display);
  root.style.setProperty('--font-arabic', normalized.font_arabic);
  root.style.setProperty('--app-text-scale', `${normalized.text_scale}%`);
  root.style.setProperty('--app-text-scale-ar', `${normalized.text_scale_ar}%`);
  root.style.setProperty('--app-nav-font-scale', normalized.nav_font_scale);
  root.style.setProperty('--app-nav-font-scale-ar', normalized.nav_font_scale_ar);
  root.style.setProperty('--app-button-font-scale', normalized.button_font_scale);
  root.style.setProperty('--app-button-font-scale-ar', normalized.button_font_scale_ar);
  root.style.setProperty('--app-table-font-scale', normalized.table_font_scale);
  root.style.setProperty('--app-table-font-scale-ar', normalized.table_font_scale_ar);
  root.style.setProperty('--landing-text-scale', normalized.landing_text_scale);
  root.style.setProperty('--landing-text-scale-ar', normalized.landing_text_scale_ar);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', colorInputValue(normalized.primary_color));
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
