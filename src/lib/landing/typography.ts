import type { CSSProperties } from 'react';
import type { LandingPageTheme, LandingSection, SectionType, TextRole, TextStyle } from '@/types/landing';

export type { TextRole, TextStyle };

export const FONT_FAMILIES = [
  { value: 'Cairo, sans-serif', label: 'Cairo' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
];

export const FONT_WEIGHTS = [
  { value: 300, label: 'Light (300)' },
  { value: 400, label: 'Regular (400)' },
  { value: 500, label: 'Medium (500)' },
  { value: 600, label: 'Semi Bold (600)' },
  { value: 700, label: 'Bold (700)' },
  { value: 800, label: 'Extra Bold (800)' },
];

export const TEXT_TRANSFORMS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
] as const;

export const TEXT_ALIGNS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' },
] as const;

export interface SectionTextField {
  key: string;
  labelKey: string;
  role: TextRole;
}

export const SECTION_TEXT_FIELDS: Partial<Record<SectionType, SectionTextField[]>> = {
  hero: [
    { key: 'badge', labelKey: 'landing.text.badge', role: 'label' },
    { key: 'headline', labelKey: 'landing.text.headline', role: 'heading' },
    { key: 'subheadline', labelKey: 'landing.text.subheadline', role: 'body' },
    { key: 'ctaPrimary', labelKey: 'landing.text.ctaPrimary', role: 'button' },
    { key: 'ctaSecondary', labelKey: 'landing.text.ctaSecondary', role: 'button' },
  ],
  about_teacher: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'body', labelKey: 'landing.text.body', role: 'body' },
  ],
  about_center: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'body', labelKey: 'landing.text.body', role: 'body' },
  ],
  teacher_bio: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'body', labelKey: 'landing.text.body', role: 'body' },
  ],
  teacher_experience: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  teacher_certifications: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  teaching_method: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  subject_overview: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'body', labelKey: 'landing.text.body', role: 'body' },
  ],
  course_details: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'body', labelKey: 'landing.text.body', role: 'body' },
    { key: 'duration', labelKey: 'landing.text.duration', role: 'label' },
    { key: 'level', labelKey: 'landing.text.level', role: 'label' },
    { key: 'format', labelKey: 'landing.text.format', role: 'label' },
  ],
  course_curriculum: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  pricing: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  statistics: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  testimonials: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  success_stories: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  student_results: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  gallery: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  video: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'caption', labelKey: 'landing.text.caption', role: 'body' },
  ],
  faq: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  features: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  benefits: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  countdown: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'cta', labelKey: 'landing.text.cta', role: 'button' },
  ],
  contact_form: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'subtitle', labelKey: 'landing.text.subtitle', role: 'body' },
    { key: 'submitLabel', labelKey: 'landing.text.submit', role: 'button' },
  ],
  whatsapp_cta: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'message', labelKey: 'landing.text.body', role: 'body' },
    { key: 'buttonLabel', labelKey: 'landing.text.cta', role: 'button' },
  ],
  lead_form: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'submitLabel', labelKey: 'landing.text.submit', role: 'button' },
  ],
  google_maps: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'address', labelKey: 'landing.text.address', role: 'body' },
  ],
  branch_locations: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  team: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  partners: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  sponsors: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  blog: [{ key: 'title', labelKey: 'landing.text.title', role: 'heading' }],
  newsletter: [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'subtitle', labelKey: 'landing.text.subtitle', role: 'body' },
    { key: 'placeholder', labelKey: 'landing.text.placeholder', role: 'label' },
    { key: 'buttonLabel', labelKey: 'landing.text.cta', role: 'button' },
  ],
  footer: [{ key: 'copyright', labelKey: 'landing.text.copyright', role: 'body' }],
};

export function getSectionTextFields(type: SectionType): SectionTextField[] {
  return SECTION_TEXT_FIELDS[type] ?? [
    { key: 'title', labelKey: 'landing.text.title', role: 'heading' },
    { key: 'body', labelKey: 'landing.text.body', role: 'body' },
  ];
}

function roleDefaults(theme: LandingPageTheme, role: TextRole): TextStyle {
  switch (role) {
    case 'heading':
      return {
        fontFamily: theme.headingFont,
        fontSize: theme.headingSize,
        fontWeight: theme.headingFontWeight ?? 700,
        color: theme.headingColor ?? theme.textColor,
        lineHeight: theme.lineHeight ?? 1.2,
      };
    case 'button':
      return {
        fontFamily: theme.bodyFont,
        fontSize: theme.bodySize,
        fontWeight: theme.bodyFontWeight ?? 600,
        color: '#ffffff',
        lineHeight: theme.lineHeight ?? 1.4,
      };
    case 'label':
      return {
        fontFamily: theme.bodyFont,
        fontSize: Math.max(12, theme.bodySize - 2),
        fontWeight: theme.bodyFontWeight ?? 500,
        color: theme.bodyColor ?? theme.textColor,
        lineHeight: theme.lineHeight ?? 1.4,
      };
    case 'stat':
      return {
        fontFamily: theme.headingFont,
        fontSize: theme.headingSize - 8,
        fontWeight: theme.headingFontWeight ?? 700,
        color: theme.primaryColor,
        lineHeight: 1.1,
      };
    case 'body':
    default:
      return {
        fontFamily: theme.bodyFont,
        fontSize: theme.bodySize,
        fontWeight: theme.bodyFontWeight ?? 400,
        color: theme.bodyColor ?? theme.textColor,
        lineHeight: theme.lineHeight ?? 1.6,
      };
  }
}

function toResponsiveFontSize(px: number): string {
  const min = Math.max(12, Math.round(px * 0.65));
  return `clamp(${min}px, ${(px / 16).toFixed(2)}rem + 1.5vw, ${px}px)`;
}

export function resolveTextStyle(
  fieldKey: string,
  section: LandingSection,
  theme: LandingPageTheme,
  role: TextRole = 'body',
): CSSProperties {
  const override = section.textStyles?.[fieldKey];
  const defaults = roleDefaults(theme, role);

  const fontSize = override?.fontSize ?? defaults.fontSize;
  const letterSpacing = override?.letterSpacing;

  return {
    fontFamily: override?.fontFamily ?? defaults.fontFamily,
    fontSize: fontSize !== undefined ? toResponsiveFontSize(fontSize) : undefined,
    fontWeight: override?.fontWeight ?? defaults.fontWeight,
    color: override?.color ?? defaults.color,
    lineHeight: override?.lineHeight ?? defaults.lineHeight,
    letterSpacing: letterSpacing !== undefined ? `${letterSpacing}px` : undefined,
    textAlign: override?.textAlign,
    textTransform: override?.textTransform,
    fontStyle: override?.fontStyle,
    textDecoration: override?.textDecoration,
  };
}

export function mergeTextStyle(
  current: TextStyle | undefined,
  patch: Partial<TextStyle>,
): TextStyle {
  return { ...current, ...patch };
}
