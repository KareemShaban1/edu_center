import type { LandingSection, LandingTemplate } from '@/types/landing';
import { EDUCATION_EGYPT_GALLERY, EDUCATION_EGYPT_IMAGES } from '@/lib/education-assets';
import { createDefaultSection, createEmptyPage, lt, uid } from '../defaults';

const PREMIUM_THEME = {
  primaryColor: '#c9a227',
  secondaryColor: '#0f2847',
  accentColor: '#d4af37',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingColor: '#0f2847',
  bodyColor: '#475569',
  headingFont: 'Cairo, sans-serif',
  bodyFont: 'Cairo, sans-serif',
  headingSize: 38,
  bodySize: 16,
  headingFontWeight: 700,
  bodyFontWeight: 400,
  lineHeight: 1.6,
  borderRadius: 14,
  shadowIntensity: 3,
};

const NAVY_SECTION = {
  backgroundGradient: 'linear-gradient(160deg, #0f2847 0%, #1a3a5c 55%, #0f2847 100%)',
  textColor: '#f8fafc',
  paddingTop: 56,
  paddingBottom: 56,
};

const THUMBNAIL = '/images/landing-templates/arabic-teacher-premium.png';

function buildSection(
  type: LandingSection['type'],
  order: number,
  content: Record<string, unknown>,
  options?: { style?: LandingSection['style']; animation?: LandingSection['animation']; layout?: string },
): LandingSection {
  const base = createDefaultSection(type, order);
  return {
    ...base,
    animation: options?.animation ?? 'scroll-reveal',
    style: options?.style,
    content: {
      ...base.content,
      ...content,
      ...(options?.layout ? { layout: options.layout } : {}),
    },
  };
}

function buildSections(): LandingSection[] {
  return [
    buildSection('hero', 0, {
      layout: 'split',
      badge: lt('Mr. Ahmed Salah — Arabic Teacher', 'أ/ أحمد صلاح — معلم اللغة العربية'),
      headline: lt(
        'Master Arabic and excel in your studies',
        'اتقن اللغة العربية وتفوق في دراستك',
      ),
      subheadline: lt(
        'Clear, organized lessons for every school level — with ongoing follow-up and periodic reports for parents.',
        'شرح مبسط ومنظم لجميع المراحل الدراسية مع متابعة مستمرة وتقارير دورية لأولياء الأمور',
      ),
      ctaPrimary: lt('Book a free trial session', 'احجز حصة تجريبية مجانية'),
      ctaSecondary: lt('Contact via WhatsApp', 'تواصل عبر واتساب'),
      imageUrl: EDUCATION_EGYPT_IMAGES.teacherLesson,
      showStats: true,
      stats: [
        { value: '+2500', label: lt('Students', 'طالب') },
        { value: '+10', label: lt('Years of experience', 'سنوات خبرة') },
        { value: '95%', label: lt('Success rate', 'نسبة النجاح') },
        { value: '+1500', label: lt('Positive reviews', 'تقييم إيجابي') },
      ],
    }, { style: NAVY_SECTION, animation: 'fade-in' }),

    buildSection('features', 1, {
      layout: 'grid-3',
      title: lt('Why choose me?', 'لماذا تختارني؟'),
      items: [
        { icon: 'MessageSquare', title: lt('Always available', 'دعم مستمر'), desc: lt('Answer questions outside class hours', 'الإجابة على الأسئلة خارج الحصة') },
        { icon: 'BookOpen', title: lt('Final reviews', 'مراجعات نهائية'), desc: lt('Intensive revision before exams', 'مراجعة مكثفة قبل الامتحانات') },
        { icon: 'Users', title: lt('Small groups', 'مجموعات صغيرة'), desc: lt('Personal attention for every student', 'اهتمام شخصي بكل طالب') },
        { icon: 'ClipboardList', title: lt('Homework follow-up', 'متابعة الواجبات'), desc: lt('Correct and explain assignments', 'تصحيح وشرح الواجبات') },
        { icon: 'ClipboardCheck', title: lt('Periodic tests', 'اختبارات دورية'), desc: lt('Measure progress every month', 'قياس التقدم كل شهر') },
        { icon: 'Lightbulb', title: lt('Simple explanation', 'شرح مبسط'), desc: lt('Complex rules made easy', 'قواعد صعبة بأسلوب سهل') },
      ],
    }),

    buildSection('course_curriculum', 2, {
      title: lt('Educational levels', 'المراحل الدراسية'),
      modules: [
        { title: lt('Primary stage', 'المرحلة الابتدائية'), lessons: 6 },
        { title: lt('Preparatory stage', 'المرحلة الإعدادية'), lessons: 3 },
        { title: lt('Secondary stage', 'المرحلة الثانوية'), lessons: 3 },
        { title: lt('Al-Azhar classes', 'صفوف الأزهر'), lessons: 4 },
      ],
    }),

    buildSection('subject_overview', 3, {
      title: lt('Subjects we cover', 'المواد التي أقوم بتدريسها'),
      body: lt(
        'Comprehensive Arabic curriculum across grammar, literature, and expression.',
        'منهج عربي متكامل يشمل النحو والأدب والتعبير والقراءة.',
      ),
      topics: [
        lt('Grammar', 'النحو'),
        lt('Rhetoric', 'البلاغة'),
        lt('Reading', 'القراءة'),
        lt('Expression', 'التعبير'),
        lt('Literature', 'الأدب'),
        lt('Dictation', 'الإملاء'),
      ],
    }),

    buildSection('student_results', 4, {
      title: lt('Student results', 'نتائج الطلاب'),
      leftColumnLabel: lt('Value', 'القيمة'),
      rightColumnLabel: lt('Detail', 'التفاصيل'),
      results: [
        { year: lt('Level improvement', 'تحسن المستوى'), passRate: '90%', topScore: lt('avg. gain', 'متوسط التحسن') },
        { year: lt('Top students', 'من الأوائل'), passRate: '25', topScore: lt('students', 'طالب') },
        { year: lt('Exam success', 'نجاح الامتحانات'), passRate: '95%', topScore: lt('pass rate', 'نسبة النجاح') },
        { year: lt('Parent satisfaction', 'رضا أولياء الأمور'), passRate: '98%', topScore: lt('satisfaction', 'رضا') },
      ],
    }, { style: NAVY_SECTION }),

    buildSection('testimonials', 5, {
      layout: 'grid-2',
      title: lt('What students & parents say', 'آراء الطلاب وأولياء الأمور'),
      items: [
        {
          name: lt('Youssef — Grade 9', 'يوسف — الصف الثالث الإعدادي'),
          role: lt('Student', 'طالب'),
          text: lt('My grades improved from 65% to 92% in one term.', 'درجاتي تحسنت من 65% إلى 92% في ترم واحد.'),
          rating: 5,
        },
        {
          name: lt('Nour — Grade 12', 'نور — الصف الثالث الثانوي'),
          role: lt('Student', 'طالب'),
          text: lt('The explanation is clear and the follow-up is excellent.', 'الشرح واضح والمتابعة ممتازة.'),
          rating: 5,
        },
        {
          name: lt('Mrs. Hanan', 'أ. حنان'),
          role: lt('Parent', 'ولي أمر'),
          text: lt('Periodic reports helped us track our son\'s progress.', 'التقارير الدورية ساعدتنا على متابعة مستوى ابننا.'),
          rating: 5,
        },
      ],
    }),

    buildSection('teaching_method', 6, {
      title: lt('Teaching method', 'أسلوب التدريس'),
      steps: [
        { title: lt('Level assessment', 'تحديد المستوى'), desc: lt('Diagnostic test and interview', 'اختبار تشخيصي ومقابلة') },
        { title: lt('Learning plan', 'خطة تعليمية'), desc: lt('Custom path for each student', 'مسار مخصص لكل طالب') },
        { title: lt('Continuous follow-up', 'متابعة مستمرة'), desc: lt('Homework, tests, and reports', 'واجبات واختبارات وتقارير') },
        { title: lt('Measure results', 'قياس النتائج'), desc: lt('Track improvement over time', 'متابعة التحسن بمرور الوقت') },
      ],
    }),

    buildSection('gallery', 7, {
      layout: 'grid-4',
      title: lt('Photos from our classes', 'صور من حصصنا'),
      images: [...EDUCATION_EGYPT_GALLERY],
    }),

    buildSection('lead_form', 8, {
      title: lt('Book your seat now', 'احجز مقعدك الآن'),
      subtitle: lt('Fill the form and we will contact you within 24 hours', 'املأ النموذج وسنتواصل معك خلال 24 ساعة'),
      fields: ['name', 'phone', 'grade', 'message'],
      submitLabel: lt('Book now', 'احجز الآن'),
    }, { style: NAVY_SECTION }),

    buildSection('whatsapp_cta', 9, {
      title: lt('Prefer WhatsApp?', 'تفضل واتساب؟'),
      message: lt('Message us for instant answers about schedules and fees.', 'راسلنا للحصول على إجابات فورية عن المواعيد والرسوم.'),
      phone: '+201000000000',
      buttonLabel: lt('Chat on WhatsApp', 'تواصل عبر واتساب'),
    }),

    buildSection('faq', 10, {
      layout: 'accordion',
      title: lt('Frequently asked questions', 'الأسئلة الشائعة'),
      items: [
        { q: lt('How do I book a session?', 'كيف أحجز حصة؟'), a: lt('Use the form above or WhatsApp.', 'استخدم النموذج أعلاه أو واتساب.') },
        { q: lt('Are online sessions available?', 'هل الحصص أونلاين متاحة؟'), a: lt('Yes — online and in-person options.', 'نعم — حصص أونلاين وحضورية.') },
        { q: lt('Do you send reports to parents?', 'هل ترسلون تقارير لأولياء الأمور؟'), a: lt('Yes, periodic progress reports every month.', 'نعم، تقارير دورية كل شهر.') },
        { q: lt('What are the fees?', 'ما هي الرسوم؟'), a: lt('Fees depend on level and group size — contact us for details.', 'الرسوم حسب المستوى وحجم المجموعة — تواصل معنا للتفاصيل.') },
      ],
    }),

    buildSection('footer', 11, {
      copyright: lt(
        '© 2024 Ahmed Salah — Arabic Language Teacher. All rights reserved.',
        '© 2024 أحمد صلاح — معلم اللغة العربية. جميع الحقوق محفوظة.',
      ),
      links: [
        { label: lt('Privacy', 'الخصوصية'), url: '#' },
        { label: lt('Terms', 'الشروط'), url: '#' },
      ],
      social: { facebook: '#', instagram: '#', whatsapp: '+201000000000' },
    }),
  ];
}

export const ARABIC_TEACHER_PREMIUM_TEMPLATE: LandingTemplate = {
  id: 'teacher-arabic-premium',
  name: lt('Arabic Teacher — Premium', 'معلم العربية — تصميم احترافي'),
  description: lt(
    'Full landing page inspired by high-converting Arabic teacher pages: navy & gold theme, stats, levels, testimonials, and booking form.',
    'صفحة هبوط كاملة مستوحاة من تصاميم معلمي العربية الاحترافية: ألوان كحلي وذهبي، إحصائيات، مراحل، شهادات، ونموذج حجز.',
  ),
  category: 'teacher',
  subjectKey: 'arabic',
  thumbnail: THUMBNAIL,
  page: {
    title: lt('Mr. Ahmed Salah — Arabic', 'أ/ أحمد صلاح — اللغة العربية'),
    slug: 'arabic-teacher-premium',
    type: 'teacher',
    subjectKey: 'arabic',
    templateId: 'teacher-arabic-premium',
    sections: buildSections(),
    theme: PREMIUM_THEME,
    seo: {
      metaTitle: lt('Arabic Teacher Landing Page', 'صفحة هبوط معلم اللغة العربية'),
      metaDescription: lt(
        'Professional Arabic lessons for all school levels in Egypt.',
        'دروس لغة عربية احترافية لجميع المراحل الدراسية في مصر.',
      ),
      keywords: ['arabic', 'teacher', 'egypt', 'education', 'ahmed salah'],
      schemaType: 'teacher',
    },
    branding: {
      logoUrl: '',
    },
  },
};

/** Standalone page factory (used by template registry). */
export function createArabicTeacherPremiumPage() {
  return createEmptyPage({
    ...ARABIC_TEACHER_PREMIUM_TEMPLATE.page,
    id: uid('page'),
    templateId: ARABIC_TEACHER_PREMIUM_TEMPLATE.id,
  });
}
