export const WHATSAPP_TEMPLATE_TYPES = [
  'general',
  'attendance',
  'exam',
  'quiz',
  'homework',
  'announcement',
  'payment',
] as const;

export type WhatsAppTemplateType = (typeof WHATSAPP_TEMPLATE_TYPES)[number];

export interface WhatsAppVariableDef {
  key: string;
  labelKey: string;
}

const COMMON: WhatsAppVariableDef[] = [
  { key: 'name', labelKey: 'whatsapp.var.name' },
  { key: 'student_name', labelKey: 'whatsapp.var.student_name' },
  { key: 'parent_name', labelKey: 'whatsapp.var.parent_name' },
];

const DATE_SECTION: WhatsAppVariableDef[] = [
  { key: 'date', labelKey: 'whatsapp.var.date' },
  { key: 'section_name', labelKey: 'whatsapp.var.section_name' },
];

export const WHATSAPP_VARIABLES_BY_TYPE: Record<WhatsAppTemplateType, WhatsAppVariableDef[]> = {
  general: [...COMMON, ...DATE_SECTION],
  attendance: [
    ...COMMON,
    ...DATE_SECTION,
    { key: 'status', labelKey: 'whatsapp.var.status' },
    { key: 'notes', labelKey: 'whatsapp.var.notes' },
  ],
  exam: [
    ...COMMON,
    ...DATE_SECTION,
    { key: 'degree', labelKey: 'whatsapp.var.degree' },
    { key: 'assessment_type', labelKey: 'whatsapp.var.assessment_type' },
    { key: 'status', labelKey: 'whatsapp.var.status' },
    { key: 'notes', labelKey: 'whatsapp.var.notes' },
  ],
  quiz: [
    ...COMMON,
    ...DATE_SECTION,
    { key: 'degree', labelKey: 'whatsapp.var.degree' },
    { key: 'assessment_type', labelKey: 'whatsapp.var.assessment_type' },
    { key: 'status', labelKey: 'whatsapp.var.status' },
    { key: 'notes', labelKey: 'whatsapp.var.notes' },
  ],
  homework: [
    ...COMMON,
    ...DATE_SECTION,
    { key: 'title', labelKey: 'whatsapp.var.title' },
    { key: 'due_date', labelKey: 'whatsapp.var.due_date' },
    { key: 'notes', labelKey: 'whatsapp.var.notes' },
  ],
  announcement: [
    ...COMMON,
    ...DATE_SECTION,
    { key: 'title', labelKey: 'whatsapp.var.title' },
    { key: 'content', labelKey: 'whatsapp.var.content' },
  ],
  payment: [
    ...COMMON,
    ...DATE_SECTION,
    { key: 'amount', labelKey: 'whatsapp.var.amount' },
    { key: 'month', labelKey: 'whatsapp.var.month' },
    { key: 'year', labelKey: 'whatsapp.var.year' },
    { key: 'fee_title', labelKey: 'whatsapp.var.fee_title' },
    { key: 'status', labelKey: 'whatsapp.var.status' },
  ],
};

export type WhatsAppMessageLang = 'ar' | 'en';

export const WHATSAPP_TYPE_STARTERS: Record<WhatsAppMessageLang, Record<WhatsAppTemplateType, string>> = {
  ar: {
  general: 'عزيزي ولي أمر {{student_name}}، بخصوص الطالب/ة {{student_name}} في {{section_name}}.',
  attendance: 'عزيزي ولي أمر {{student_name}}، سُجّل حضور {{student_name}} كـ "{{status}}" بتاريخ {{date}} ({{section_name}}). ملاحظات: {{notes}}',
  exam: 'عزيزي ولي أمر {{student_name}}، حصل {{student_name}} على {{degree}} في اختبار بتاريخ {{date}} ({{section_name}}).',
  quiz: 'عزيزي ولي أمر {{student_name}}، حصل {{student_name}} على {{degree}} في كويز بتاريخ {{date}} ({{section_name}}).',
  homework: 'عزيزي ولي أمر {{student_name}}، على {{student_name}} تسليم واجب "{{title}}" بتاريخ {{due_date}} ({{section_name}}).',
  announcement: 'عزيزي ولي أمر {{student_name}}، إعلان خاص بـ {{section_name}}: {{title}}\n{{content}}',
  payment: 'عزيزي ولي أمر {{student_name}}، بخصوص دفعة {{student_name}} — {{fee_title}} لشهر {{month}} {{year}}: {{amount}} ({{status}}).',
},
  en: {
    general: 'Dear {{parent_name}}, regarding {{student_name}} in {{section_name}}.',
    attendance: 'Dear {{parent_name}}, {{student_name}} was {{status}} on {{date}} ({{section_name}}). Notes: {{notes}}',
    exam: 'Dear {{parent_name}}, {{student_name}} scored {{degree}} in {{assessment_type}} on {{date}} ({{section_name}}).',
    quiz: 'Dear {{parent_name}}, {{student_name}} scored {{degree}} in {{assessment_type}} on {{date}} ({{section_name}}).',
    homework: 'Dear {{parent_name}}, {{student_name}} has homework "{{title}}" due {{due_date}} ({{section_name}}).',
    announcement: 'Dear {{parent_name}}, announcement for {{section_name}}: {{title}}\n{{content}}',
    payment: 'Dear {{parent_name}}, payment for {{student_name}} — {{fee_title}} {{month}} {{year}}: {{amount}} ({{status}}).',
  },
};

export const WHATSAPP_PREVIEW_SAMPLES: Record<WhatsAppMessageLang, Record<string, string>> = {
  ar: {
    name: 'أحمد',
    student_name: 'سارة',
    parent_name: 'أحمد',
    date: '2026-08-15',
    section_name: 'المجموعة أ',
    status: 'غائب',
    notes: '—',
    degree: '18',
    assessment_type: 'اختبار',
    title: 'واجب الرياضيات',
    due_date: '2026-08-20',
    content: 'يرجى المتابعة.',
    amount: '500',
    month: 'أغسطس',
    year: '2026',
    fee_title: 'رسوم شهرية',
  },
  en: {
    name: 'Ahmed',
    student_name: 'Sara',
    parent_name: 'Ahmed',
    date: '2026-08-15',
    section_name: 'Group A',
    status: 'absent',
    notes: '—',
    degree: '18',
    assessment_type: 'Exam',
    title: 'Math homework',
    due_date: '2026-08-20',
    content: 'Please follow up.',
    amount: '500',
    month: 'August',
    year: '2026',
    fee_title: 'Monthly fee',
  },
};

export function looksLikeArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function inferWhatsAppMessageLang(text: string): WhatsAppMessageLang {
  return looksLikeArabic(text) ? 'ar' : text.trim() ? 'en' : 'ar';
}

export function isWhatsAppStarter(content: string): boolean {
  const trimmed = content.trim();
  return WHATSAPP_TEMPLATE_TYPES.some(type =>
    (['ar', 'en'] as const).some(lang => WHATSAPP_TYPE_STARTERS[lang][type] === trimmed),
  );
}

export function previewWhatsAppMessage(content: string, extraValues: Record<string, string> = {}, lang?: WhatsAppMessageLang): string {
  const resolvedLang = lang ?? inferWhatsAppMessageLang(content);
  const samples = WHATSAPP_PREVIEW_SAMPLES[resolvedLang];
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const extra = extraValues[key]?.trim();
    if (extra) return extra;
    return samples[key] || `{{${key}}}`;
  });
}

export function isWhatsAppTemplateType(value: string | null | undefined): value is WhatsAppTemplateType {
  return !!value && (WHATSAPP_TEMPLATE_TYPES as readonly string[]).includes(value);
}

export function inferWhatsAppTemplateType(name: string, type?: string | null): WhatsAppTemplateType {
  if (isWhatsAppTemplateType(type)) return type;
  const n = name.toLowerCase();
  if (/(attend|حضور|غياب)/.test(n)) return 'attendance';
  if (/(exam|امتحان)/.test(n)) return 'exam';
  if (/(quiz|اختبار|كويز)/.test(n)) return 'quiz';
  if (/(home.?work|واجب)/.test(n)) return 'homework';
  if (/(announce|إعلان)/.test(n)) return 'announcement';
  if (/(pay|fee|دفع|رسوم)/.test(n)) return 'payment';
  return 'general';
}

export function insertWhatsAppVariable(
  content: string,
  key: string,
  selectionStart: number,
  selectionEnd: number,
): { next: string; cursor: number } {
  const token = `{{${key}}}`;
  const before = content.slice(0, selectionStart);
  const after = content.slice(selectionEnd);
  const needsSpaceBefore = before.length > 0 && !/\s$/.test(before);
  const inserted = `${needsSpaceBefore ? ' ' : ''}${token}`;
  const next = `${before}${inserted}${after}`;
  return { next, cursor: before.length + inserted.length };
}
