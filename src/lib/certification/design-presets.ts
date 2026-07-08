import type { CertificateDesignConfig, CertificateDesignPreset } from './types';

function baseFields(heading: string, subtitle: string, body: string, footer: string) {
  return { heading, subtitle, body, footer };
}

function preset(
  id: string,
  nameKey: string,
  category: CertificateDesignPreset['category'],
  colors: CertificateDesignConfig['colors'],
  borderStyle: CertificateDesignConfig['layout']['borderStyle'],
  fields: CertificateDesignConfig['fields'],
  extra?: Partial<CertificateDesignConfig>,
): CertificateDesignPreset {
  return {
    id,
    nameKey,
    category,
    config: {
      presetId: id,
      orientation: 'landscape',
      colors,
      fonts: { heading: 'Georgia, serif', body: 'Georgia, serif' },
      layout: {
        showLogo: true,
        showSeal: true,
        showBorder: true,
        borderStyle,
        headerAlign: 'center',
      },
      fields,
      ...extra,
    },
  };
}

export const CERTIFICATE_DESIGN_PRESETS: CertificateDesignPreset[] = [
  preset(
    'classic-gold',
    'certDesign.classicGold',
    'classic',
    { primary: '#92400e', secondary: '#b45309', accent: '#d97706', background: '#fffbeb', backgroundEnd: '#fef3c7', text: '#1c1917', border: '#b45309' },
    'classic',
    baseFields('CERTIFICATE OF COMPLETION', 'This is to certify that', '{{student_name}} has successfully completed all requirements for {{section_name}}.', 'Date: {{date}} · {{center_name}}'),
  ),
  preset(
    'classic-navy',
    'certDesign.classicNavy',
    'classic',
    { primary: '#1e3a5f', secondary: '#1e40af', accent: '#3b82f6', background: '#f0f9ff', backgroundEnd: '#e0f2fe', text: '#0f172a', border: '#1e40af' },
    'double',
    baseFields('CERTIFICATE OF ACHIEVEMENT', 'Presented to', '{{student_name}} for outstanding dedication and performance in {{section_name}}.', '{{date}}'),
  ),
  preset(
    'ornate-royal',
    'certDesign.ornateRoyal',
    'elegant',
    { primary: '#581c87', secondary: '#7c3aed', accent: '#a78bfa', background: '#faf5ff', backgroundEnd: '#f3e8ff', text: '#3b0764', border: '#7c3aed' },
    'ornate',
    baseFields('CERTIFICATE OF EXCELLENCE', 'It is our honor to present this certificate to', '{{student_name}} for exceptional academic achievement. Score: {{degree}}', '{{section_name}} · {{date}}'),
  ),
  preset(
    'modern-minimal',
    'certDesign.modernMinimal',
    'modern',
    { primary: '#18181b', secondary: '#52525b', accent: '#71717a', background: '#ffffff', text: '#27272a', border: '#d4d4d8' },
    'minimal',
    baseFields('COMPLETION CERTIFICATE', '', '{{student_name}} completed {{section_name}} on {{date}}.', '{{center_name}}'),
    { fonts: { heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' }, layout: { showLogo: false, showSeal: false, showBorder: true, borderStyle: 'minimal', headerAlign: 'left' } },
  ),
  preset(
    'modern-teal',
    'certDesign.modernTeal',
    'modern',
    { primary: '#0f766e', secondary: '#14b8a6', accent: '#2dd4bf', background: '#f0fdfa', backgroundEnd: '#ccfbf1', text: '#134e4a', border: '#14b8a6' },
    'modern',
    baseFields('CERTIFICATE', 'Awarded to', '{{student_name}} for excellence in {{section_name}}.', '{{date}}'),
    { fonts: { heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' } },
  ),
  preset(
    'elegant-maroon',
    'certDesign.elegantMaroon',
    'elegant',
    { primary: '#7f1d1d', secondary: '#991b1b', accent: '#dc2626', background: '#fef2f2', backgroundEnd: '#fee2e2', text: '#450a0a', border: '#991b1b' },
    'ornate',
    baseFields('CERTIFICATE OF DISTINCTION', 'This certificate is proudly presented to', '{{student_name}} in recognition of superior performance.', '{{section_name}} · {{date}}'),
  ),
  preset(
    'elegant-silver',
    'certDesign.elegantSilver',
    'elegant',
    { primary: '#334155', secondary: '#64748b', accent: '#94a3b8', background: '#f8fafc', backgroundEnd: '#e2e8f0', text: '#1e293b', border: '#64748b' },
    'double',
    baseFields('CERTIFICATE OF MERIT', 'Awarded to', '{{student_name}} for commendable achievement in {{section_name}}.', '{{center_name}} · {{date}}'),
  ),
  preset(
    'academic-scroll',
    'certDesign.academicScroll',
    'academic',
    { primary: '#365314', secondary: '#4d7c0f', accent: '#65a30d', background: '#f7fee7', backgroundEnd: '#ecfccb', text: '#1a2e05', border: '#4d7c0f' },
    'academic',
    baseFields('ACADEMIC CERTIFICATE', 'The administration certifies that', '{{student_name}} has fulfilled all academic requirements for {{section_name}}.', 'Issued on {{date}}'),
  ),
  preset(
    'academic-green',
    'certDesign.academicGreen',
    'academic',
    { primary: '#14532d', secondary: '#166534', accent: '#22c55e', background: '#f0fdf4', backgroundEnd: '#dcfce7', text: '#052e16', border: '#166534' },
    'academic',
    baseFields('HONOR ROLL CERTIFICATE', 'Congratulations to', '{{student_name}} for earning a place on the Honor Roll with a score of {{degree}}.', '{{section_name}} · {{date}}'),
  ),
  preset(
    'ribbon-red',
    'certDesign.ribbonRed',
    'classic',
    { primary: '#9f1239', secondary: '#be123c', accent: '#f43f5e', background: '#fff1f2', backgroundEnd: '#ffe4e6', text: '#881337', border: '#be123c' },
    'ribbon',
    baseFields('CERTIFICATE OF PARTICIPATION', 'This certifies that', '{{student_name}} actively participated in all activities of {{section_name}}.', '{{date}}'),
  ),
  preset(
    'gradient-purple',
    'certDesign.gradientPurple',
    'modern',
    { primary: '#5b21b6', secondary: '#7c3aed', accent: '#8b5cf6', background: '#ede9fe', backgroundEnd: '#ddd6fe', text: '#3b0764', border: '#7c3aed' },
    'gradient',
    baseFields('CERTIFICATE OF EXCELLENCE', 'Presented to', '{{student_name}} for remarkable progress and achievement.', '{{section_name}} · Score: {{degree}} · {{date}}'),
  ),
  preset(
    'gradient-sunset',
    'certDesign.gradientSunset',
    'modern',
    { primary: '#c2410c', secondary: '#ea580c', accent: '#f97316', background: '#fff7ed', backgroundEnd: '#ffedd5', text: '#7c2d12', border: '#ea580c' },
    'gradient',
    baseFields('ACHIEVEMENT CERTIFICATE', 'Awarded to', '{{student_name}} for outstanding effort in {{section_name}}.', '{{date}} · {{center_name}}'),
  ),
  preset(
    'arabic-gold',
    'certDesign.arabicGold',
    'arabic',
    { primary: '#854d0e', secondary: '#a16207', accent: '#ca8a04', background: '#fefce8', backgroundEnd: '#fef9c3', text: '#422006', border: '#a16207' },
    'ornate',
    baseFields('شهادة إتمام', 'تشهد بأن الطالب/ة', '{{student_name}} قد أتم/ت متطلبات {{section_name}} بنجاح.', 'التاريخ: {{date}} · {{center_name}}'),
    { fonts: { heading: 'Tahoma, Arial, sans-serif', body: 'Tahoma, Arial, sans-serif' } },
  ),
  preset(
    'arabic-emerald',
    'certDesign.arabicEmerald',
    'arabic',
    { primary: '#047857', secondary: '#059669', accent: '#10b981', background: '#ecfdf5', backgroundEnd: '#d1fae5', text: '#064e3b', border: '#059669' },
    'ornate',
    baseFields('شهادة تميز', 'تُمنح إلى', '{{student_name}} لتفوقه/ا الأكاديمي في {{section_name}}. الدرجة: {{degree}}', 'التاريخ: {{date}}'),
    { fonts: { heading: 'Tahoma, Arial, sans-serif', body: 'Tahoma, Arial, sans-serif' } },
  ),
  preset(
    'kids-colorful',
    'certDesign.kidsColorful',
    'kids',
    { primary: '#7c3aed', secondary: '#2563eb', accent: '#f59e0b', background: '#fef3c7', backgroundEnd: '#fce7f3', text: '#1e1b4b', border: '#8b5cf6' },
    'ribbon',
    baseFields('SUPER STAR CERTIFICATE', 'Yay! This goes to', '{{student_name}} for being awesome in {{section_name}}!', '{{date}}'),
    { fonts: { heading: 'Comic Sans MS, cursive, sans-serif', body: 'Comic Sans MS, cursive, sans-serif' }, layout: { showLogo: true, showSeal: true, showBorder: true, borderStyle: 'ribbon', headerAlign: 'center' } },
  ),
  preset(
    'professional-blue',
    'certDesign.professionalBlue',
    'modern',
    { primary: '#1d4ed8', secondary: '#2563eb', accent: '#3b82f6', background: '#eff6ff', backgroundEnd: '#dbeafe', text: '#1e3a8a', border: '#2563eb' },
    'modern',
    baseFields('PROFESSIONAL CERTIFICATE', 'This document certifies that', '{{student_name}} has met all professional standards for {{section_name}}.', 'Authorized by {{center_name}} · {{date}}'),
    { fonts: { heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' } },
  ),
  preset(
    'honor-black-gold',
    'certDesign.honorBlackGold',
    'elegant',
    { primary: '#ca8a04', secondary: '#eab308', accent: '#facc15', background: '#18181b', backgroundEnd: '#27272a', text: '#fafafa', border: '#ca8a04' },
    'classic',
    baseFields('HONOR CERTIFICATE', 'With highest distinction awarded to', '{{student_name}} · Score: {{degree}}', '{{section_name}} · {{date}}'),
  ),
  preset(
    'participation-green',
    'certDesign.participationGreen',
    'classic',
    { primary: '#15803d', secondary: '#16a34a', accent: '#4ade80', background: '#f0fdf4', backgroundEnd: '#bbf7d0', text: '#14532d', border: '#16a34a' },
    'classic',
    baseFields('CERTIFICATE OF PARTICIPATION', 'This is to acknowledge that', '{{student_name}} has demonstrated consistent participation in {{section_name}}.', 'Status: {{status}} · {{date}}'),
  ),
  preset(
    'sports-dynamic',
    'certDesign.sportsDynamic',
    'modern',
    { primary: '#dc2626', secondary: '#1d4ed8', accent: '#fbbf24', background: '#ffffff', backgroundEnd: '#f1f5f9', text: '#0f172a', border: '#dc2626' },
    'ribbon',
    baseFields('SPORTS ACHIEVEMENT', 'Presented to', '{{student_name}} for athletic excellence in {{section_name}}.', '{{date}}'),
    { fonts: { heading: 'Impact, Arial Black, sans-serif', body: 'system-ui, sans-serif' } },
  ),
  preset(
    'artistic-creative',
    'certDesign.artisticCreative',
    'kids',
    { primary: '#db2777', secondary: '#9333ea', accent: '#06b6d4', background: '#fdf4ff', backgroundEnd: '#fae8ff', text: '#701a75', border: '#c026d3' },
    'gradient',
    baseFields('CREATIVE ARTS CERTIFICATE', 'Celebrating', '{{student_name}} and their creative achievements in {{section_name}}.', '{{date}} · {{center_name}}'),
  ),
];

export function getDesignPreset(id: string): CertificateDesignPreset | undefined {
  return CERTIFICATE_DESIGN_PRESETS.find(p => p.id === id);
}

export function cloneDesignConfig(config: CertificateDesignConfig): CertificateDesignConfig {
  return structuredClone(config);
}

export function designConfigFromPreset(presetId: string): CertificateDesignConfig {
  const found = getDesignPreset(presetId);
  if (!found) return cloneDesignConfig(CERTIFICATE_DESIGN_PRESETS[0].config);
  return cloneDesignConfig(found.config);
}

export const FONT_OPTIONS = [
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'system-ui, sans-serif', label: 'System Sans' },
  { value: 'Tahoma, Arial, sans-serif', label: 'Tahoma / Arial' },
  { value: 'Comic Sans MS, cursive, sans-serif', label: 'Comic Sans' },
  { value: 'Palatino Linotype, Palatino, serif', label: 'Palatino' },
  { value: 'Impact, Arial Black, sans-serif', label: 'Impact' },
];

export const BORDER_STYLE_OPTIONS: CertificateDesignConfig['layout']['borderStyle'][] = [
  'classic', 'ornate', 'minimal', 'double', 'ribbon', 'gradient', 'academic', 'modern',
];
