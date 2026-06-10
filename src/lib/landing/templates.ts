import type { LandingPage, LandingTemplate } from '@/types/landing';
import type { TeacherSubjectKey } from './constants';
import { SUBJECT_LABELS, TEACHER_SUBJECT_TEMPLATES } from './constants';
import { createDefaultSection, createEmptyPage, lt } from './defaults';

function buildTeacherTemplate(subjectKey: TeacherSubjectKey): LandingTemplate {
  const label = SUBJECT_LABELS[subjectKey];
  const sectionTypes = [
    'hero', 'about_teacher', 'teacher_bio', 'teacher_experience',
    'teacher_certifications', 'teaching_method', 'subject_overview',
    'statistics', 'testimonials', 'success_stories', 'pricing',
    'faq', 'whatsapp_cta', 'contact_form', 'footer',
  ] as const;

  const sections = sectionTypes.map((type, i) => {
    const sec = createDefaultSection(type, i);
    if (type === 'hero') {
      sec.content.headline = lt(
        `Expert ${label.en} — Enroll Today`,
        `${label.ar} خبير — سجّل اليوم`,
      );
      sec.content.subheadline = lt(
        `Personalized ${label.en.toLowerCase()} lessons for every student level`,
        `دروس ${label.ar} مخصصة لكل مستوى`,
      );
    }
    if (type === 'subject_overview') {
      sec.content.title = lt(`${label.en} Curriculum`, `منهج ${label.ar}`);
    }
    return sec;
  });

  const page: LandingPage = createEmptyPage({
    title: label,
    slug: `${subjectKey}-teacher-template`,
    type: 'teacher',
    subjectKey,
    sections,
    templateId: `teacher-${subjectKey}`,
    seo: {
      metaTitle: lt(`${label.en} Landing Page`, `صفحة هبوط ${label.ar}`),
      metaDescription: lt(
        `Professional landing page template for ${label.en.toLowerCase()}s`,
        `قالب صفحة هبوط احترافي ل${label.ar}`,
      ),
      keywords: [subjectKey, 'teacher', 'education'],
      schemaType: 'teacher',
    },
  });

  return {
    id: `teacher-${subjectKey}`,
    name: label,
    description: lt(
      `High-converting template for ${label.en.toLowerCase()}s`,
      `قالب عالي التحويل ل${label.ar}`,
    ),
    category: 'teacher',
    subjectKey,
    page: {
      title: page.title,
      slug: page.slug,
      type: page.type,
      subjectKey: page.subjectKey,
      sections: page.sections,
      theme: page.theme,
      seo: page.seo,
      branding: page.branding,
      templateId: page.templateId,
    },
  };
}

export const LANDING_TEMPLATES: LandingTemplate[] = [
  ...TEACHER_SUBJECT_TEMPLATES.map(buildTeacherTemplate),
  {
    id: 'course-general',
    name: lt('Course Landing Page', 'صفحة هبوط دورة'),
    description: lt('Promote any course or program', 'روّج لأي دورة أو برنامج'),
    category: 'course',
    page: {
      title: lt('Course Landing Page', 'صفحة هبوط دورة'),
      slug: 'course-template',
      type: 'course',
      sections: ['hero', 'course_details', 'course_curriculum', 'pricing', 'testimonials', 'faq', 'lead_form', 'footer'].map((t, i) =>
        createDefaultSection(t as import('@/types/landing').SectionType, i),
      ),
      theme: createEmptyPage().theme,
      seo: createEmptyPage().seo,
      branding: {},
    },
  },
  {
    id: 'event-workshop',
    name: lt('Event / Workshop', 'فعالية / ورشة'),
    description: lt('Promote events and workshops', 'روّج للفعاليات والورش'),
    category: 'event',
    page: {
      title: lt('Workshop Landing Page', 'صفحة هبوط ورشة'),
      slug: 'event-template',
      type: 'event',
      sections: ['hero', 'features', 'countdown', 'pricing', 'contact_form', 'footer'].map((t, i) =>
        createDefaultSection(t as import('@/types/landing').SectionType, i),
      ),
      theme: createEmptyPage().theme,
      seo: { ...createEmptyPage().seo, schemaType: 'event' },
      branding: {},
    },
  },
  {
    id: 'center-branch',
    name: lt('Center / Branch', 'مركز / فرع'),
    description: lt('Showcase your educational center', 'اعرض مركزك التعليمي'),
    category: 'center',
    page: {
      title: lt('Center Landing Page', 'صفحة هبوط المركز'),
      slug: 'center-template',
      type: 'center',
      sections: ['hero', 'about_center', 'branch_locations', 'team', 'statistics', 'gallery', 'contact_form', 'footer'].map((t, i) =>
        createDefaultSection(t as import('@/types/landing').SectionType, i),
      ),
      theme: createEmptyPage().theme,
      seo: { ...createEmptyPage().seo, schemaType: 'organization' },
      branding: {},
    },
  },
  {
    id: 'exam-prep',
    name: lt('Exam Preparation', 'تحضير للامتحانات'),
    description: lt('Exam prep program landing page', 'صفحة هبوط برنامج تحضير امتحانات'),
    category: 'exam_prep',
    page: {
      title: lt('Exam Prep Program', 'برنامج تحضير امتحانات'),
      slug: 'exam-prep-template',
      type: 'exam_prep',
      sections: ['hero', 'benefits', 'course_curriculum', 'student_results', 'pricing', 'countdown', 'lead_form', 'footer'].map((t, i) =>
        createDefaultSection(t as import('@/types/landing').SectionType, i),
      ),
      theme: createEmptyPage().theme,
      seo: createEmptyPage().seo,
      branding: {},
    },
  },
  {
    id: 'summer-course',
    name: lt('Summer Course', 'دورة صيفية'),
    description: lt('Summer program promotion', 'ترويج برنامج صيفي'),
    category: 'summer_course',
    page: {
      title: lt('Summer Course', 'دورة صيفية'),
      slug: 'summer-course-template',
      type: 'summer_course',
      sections: ['hero', 'features', 'course_details', 'gallery', 'pricing', 'countdown', 'contact_form', 'footer'].map((t, i) =>
        createDefaultSection(t as import('@/types/landing').SectionType, i),
      ),
      theme: createEmptyPage().theme,
      seo: createEmptyPage().seo,
      branding: {},
    },
  },
];

export function getTemplateById(id: string): LandingTemplate | undefined {
  return LANDING_TEMPLATES.find(t => t.id === id);
}

export function templateToPage(template: LandingTemplate): LandingPage {
  return createEmptyPage({
    ...template.page,
    templateId: template.id,
    slug: `${template.id}-${Date.now()}`,
    title: template.name,
  });
}
