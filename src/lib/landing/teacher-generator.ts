import type { Teacher } from '@/types/models';
import type { LandingPage, LandingSection, LocalizedText } from '@/types/landing';
import type { TeacherSubjectKey } from './constants';
import { SUBJECT_LABELS } from './constants';
import { createDefaultSection, createEmptyPage, lt, uid } from './defaults';

const TEACHER_SECTIONS: LandingSection['type'][] = [
  'hero',
  'about_teacher',
  'teacher_bio',
  'teacher_experience',
  'teacher_certifications',
  'teaching_method',
  'statistics',
  'testimonials',
  'pricing',
  'faq',
  'whatsapp_cta',
  'contact_form',
  'footer',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function fillTeacherSection(section: LandingSection, teacher: Teacher, subject: string, locale?: 'en' | 'ar'): LandingSection {
  const spec = teacher.specialization || subject;
  const content = { ...section.content };

  switch (section.type) {
    case 'hero':
      content.headline = lt(
        `Learn ${spec} with ${teacher.name}`,
        `تعلّم ${spec} مع ${teacher.name}`,
      );
      content.subheadline = lt(
        `Expert ${spec} teacher — personalized lessons for every student`,
        `معلم ${spec} خبير — دروس مخصصة لكل طالب`,
      );
      content.badge = lt(`${spec} Specialist`, `متخصص ${spec}`);
      break;
    case 'about_teacher':
    case 'teacher_bio':
      content.title = lt(`About ${teacher.name}`, `عن ${teacher.name}`);
      content.body = lt(
        `${teacher.name} is an experienced ${spec} teacher dedicated to student success.`,
        `${teacher.name} معلم ${spec} ذو خبرة ملتزم بنجاح الطلاب.`,
      );
      break;
    case 'whatsapp_cta':
      if (teacher.phone) content.phone = teacher.phone;
      break;
    case 'contact_form':
      content.subtitle = lt(`Contact ${teacher.name}`, `تواصل مع ${teacher.name}`);
      break;
    default:
      break;
  }

  return { ...section, content };
}

export function generateTeacherLandingPage(
  teacher: Teacher,
  subjectKey?: TeacherSubjectKey,
  centerName?: LocalizedText,
): LandingPage {
  const subject = subjectKey
    ? SUBJECT_LABELS[subjectKey].en
    : teacher.specialization || 'Subject';
  const slug = `teacher/${slugify(teacher.name)}`;

  const sections = TEACHER_SECTIONS.map((type, i) => {
    const sec = createDefaultSection(type, i);
    return fillTeacherSection(sec, teacher, subject);
  });

  const title = lt(
    `${teacher.name} — ${subject} Teacher`,
    `${teacher.name} — معلم ${subjectKey ? SUBJECT_LABELS[subjectKey].ar : subject}`,
  );

  return createEmptyPage({
    title,
    slug,
    type: 'teacher',
    teacherId: teacher.id,
    subjectKey,
    sections,
    seo: {
      metaTitle: title,
      metaDescription: lt(
        `Book lessons with ${teacher.name}, expert ${subject} teacher`,
        `احجز دروساً مع ${teacher.name}، معلم ${subject} خبير`,
      ),
      keywords: [subject, teacher.name, 'teacher', 'education'],
      schemaType: 'teacher',
    },
    branding: centerName ? { centerName } : {},
    templateId: subjectKey ? `teacher-${subjectKey}` : undefined,
  });
}

export function generateSubjectSlug(subject: string, city?: string): string {
  const base = slugify(`${subject}-teacher`);
  return city ? `${base}-${slugify(city)}` : base;
}

export function duplicatePage(page: LandingPage, newTitle?: LocalizedText): LandingPage {
  const now = new Date().toISOString();
  return {
    ...structuredClone(page),
    id: uid('page'),
    title: newTitle || lt(`${page.title.en} (Copy)`, `${page.title.ar} (نسخة)`),
    slug: `${page.slug}-copy-${Date.now()}`,
    status: 'draft',
    publishedAt: undefined,
    createdAt: now,
    updatedAt: now,
    sections: page.sections.map((s, i) => ({ ...structuredClone(s), id: uid('sec'), order: i })),
  };
}
