export type CertificateBorderStyle =
  | 'classic'
  | 'ornate'
  | 'minimal'
  | 'double'
  | 'ribbon'
  | 'gradient'
  | 'academic'
  | 'modern';

export type CertificateOrientation = 'landscape' | 'portrait';

export type CertificateCategory = 'classic' | 'modern' | 'academic' | 'elegant' | 'arabic' | 'kids';

export interface CertificateDesignFields {
  heading: string;
  subtitle: string;
  body: string;
  footer: string;
}

export interface CertificateDesignConfig {
  presetId: string;
  orientation: CertificateOrientation;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundEnd?: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: {
    showLogo: boolean;
    showSeal: boolean;
    showBorder: boolean;
    borderStyle: CertificateBorderStyle;
    headerAlign: 'center' | 'left';
  };
  fields: CertificateDesignFields;
  logoUrl?: string | null;
}

export interface CertificateDesignPreset {
  id: string;
  nameKey: string;
  category: CertificateCategory;
  config: CertificateDesignConfig;
}

export const BUILTIN_VARIABLES = [
  'student_name',
  'section_name',
  'date',
  'issue_date',
  'degree',
  'center_name',
  'parent_name',
  'status',
  'notes',
  'assessment_type',
] as const;

export const SAMPLE_CERT_VARIABLES: Record<string, string> = {
  student_name: 'Ahmed Mohamed',
  section_name: 'Grade 10 — Class A — Group 1',
  date: '2026-07-06',
  issue_date: '2026-07-06',
  degree: '95',
  center_name: 'Education Center',
  parent_name: 'Mohamed Ali',
  status: 'Present',
  notes: '—',
  assessment_type: 'Exam',
};
