import type { LandingPage, LandingSection, LocalizedText, SectionType } from '@/types/landing';
import { DEFAULT_THEME } from './constants';

let sectionCounter = 0;

export function uid(prefix = 'sec'): string {
  sectionCounter += 1;
  return `${prefix}_${Date.now()}_${sectionCounter}`;
}

export function lt(en: string, ar: string): LocalizedText {
  return { en, ar };
}

export function createDefaultSection(type: SectionType, order: number): LandingSection {
  const id = uid('sec');
  const base = { id, type, order, visible: true, animation: 'fade-in' as const, content: {} };

  switch (type) {
    case 'hero':
      return {
        ...base,
        content: {
          badge: lt('Expert Teacher', 'معلم خبير'),
          headline: lt('Transform Your Learning Journey', 'حوّل رحلتك التعليمية'),
          subheadline: lt('Personalized lessons designed for your success', 'دروس مخصصة مصممة لنجاحك'),
          ctaPrimary: lt('Book Free Trial', 'احجز تجربة مجانية'),
          ctaSecondary: lt('Learn More', 'اعرف المزيد'),
          imageUrl: '',
          showStats: true,
          stats: [
            { value: '500+', label: lt('Students', 'طالب') },
            { value: '10+', label: lt('Years Experience', 'سنوات خبرة') },
            { value: '98%', label: lt('Success Rate', 'نسبة النجاح') },
          ],
        },
      };
    case 'about_teacher':
      return {
        ...base,
        content: {
          title: lt('About the Teacher', 'عن المعلم'),
          body: lt(
            'Dedicated educator with a passion for helping students achieve their full potential.',
            'م educator متفاني شغوف بمساعدة الطلاب على تحقيق إمكاناتهم الكاملة.',
          ),
          imageUrl: '',
          highlights: [
            lt('Personalized approach', 'نهج شخصي'),
            lt('Proven results', 'نتائج مثبتة'),
            lt('Flexible scheduling', 'جدول مرن'),
          ],
        },
      };
    case 'about_center':
      return {
        ...base,
        content: {
          title: lt('About Our Center', 'عن مركزنا'),
          body: lt('Leading educational center committed to excellence.', 'مركز تعليمي رائد ملتزم بالتميز.'),
          imageUrl: '',
        },
      };
    case 'teacher_bio':
      return {
        ...base,
        content: {
          title: lt('Biography', 'السيرة الذاتية'),
          body: lt('Experienced teacher with a track record of student success.', 'معلم ذو خبرة مع سجل حافل بنجاح الطلاب.'),
        },
      };
    case 'teacher_experience':
      return {
        ...base,
        content: {
          title: lt('Experience', 'الخبرة'),
          items: [
            { year: '2020–Present', title: lt('Senior Teacher', 'معلم أول'), org: lt('Education Center', 'مركز تعليمي') },
            { year: '2015–2020', title: lt('Teacher', 'معلم'), org: lt('International School', 'مدرسة دولية') },
          ],
        },
      };
    case 'teacher_certifications':
      return {
        ...base,
        content: {
          title: lt('Certifications', 'الشهادات'),
          items: [
            { name: lt('Teaching Certificate', 'شهادة تدريس'), issuer: lt('Ministry of Education', 'وزارة التربية') },
            { name: lt('Subject Specialist', 'متخصص في المادة'), issuer: lt('Professional Board', 'هيئة مهنية') },
          ],
        },
      };
    case 'teaching_method':
      return {
        ...base,
        content: {
          title: lt('Teaching Method', 'أسلوب التدريس'),
          steps: [
            { title: lt('Assessment', 'التقييم'), desc: lt('Identify strengths and gaps', 'تحديد نقاط القوة والفجوات') },
            { title: lt('Plan', 'التخطيط'), desc: lt('Custom learning path', 'مسار تعلم مخصص') },
            { title: lt('Deliver', 'التنفيذ'), desc: lt('Interactive sessions', 'جلسات تفاعلية') },
            { title: lt('Review', 'المراجعة'), desc: lt('Track progress', 'متابعة التقدم') },
          ],
        },
      };
    case 'subject_overview':
      return {
        ...base,
        content: {
          title: lt('Subject Overview', 'نظرة على المادة'),
          body: lt('Comprehensive curriculum covering all key topics.', 'منهج شامل يغطي جميع المو topics الرئيسية.'),
          topics: [lt('Fundamentals', 'الأساسيات'), lt('Advanced Topics', 'مواضيع متقدمة'), lt('Exam Prep', 'تحضير للامتحان')],
        },
      };
    case 'course_details':
      return {
        ...base,
        content: {
          title: lt('Course Details', 'تفاصيل الدورة'),
          duration: lt('12 weeks', '12 أسبوع'),
          level: lt('All levels', 'جميع المستويات'),
          format: lt('Online & In-person', 'أونلاين وحضوري'),
          body: lt('Structured program with weekly sessions and homework support.', 'برنامج منظم مع جلسات أسبوعية ودعم واجبات.'),
        },
      };
    case 'course_curriculum':
      return {
        ...base,
        content: {
          title: lt('Curriculum', 'المنهج'),
          modules: [
            { title: lt('Module 1: Foundations', 'الوحدة 1: الأساسيات'), lessons: 8 },
            { title: lt('Module 2: Core Skills', 'الوحدة 2: الم skills الأساسية'), lessons: 10 },
            { title: lt('Module 3: Mastery', 'الوحدة 3: الإتقان'), lessons: 12 },
          ],
        },
      };
    case 'pricing':
      return {
        ...base,
        content: {
          title: lt('Pricing Plans', 'خطط الأسعار'),
          plans: [
            { name: lt('Basic', 'أساسي'), price: '500', period: lt('/month', '/شهر'), features: [lt('4 sessions', '4 جلسات'), lt('Homework help', 'مساعدة واجبات')] },
            { name: lt('Standard', 'قياسي'), price: '800', period: lt('/month', '/شهر'), featured: true, features: [lt('8 sessions', '8 جلسات'), lt('Exam prep', 'تحضير امتحان'), lt('WhatsApp support', 'دعم واتساب')] },
            { name: lt('Premium', 'مميز'), price: '1200', period: lt('/month', '/شهر'), features: [lt('Unlimited sessions', 'جلسات غير محدودة'), lt('1-on-1 mentoring', 'إرشاد فردي')] },
          ],
        },
      };
    case 'statistics':
      return {
        ...base,
        content: {
          title: lt('Our Impact', 'تأثيرنا'),
          stats: [
            { value: '1000+', label: lt('Students Taught', 'طلاب تم تدريسهم') },
            { value: '95%', label: lt('Pass Rate', 'نسبة النجاح') },
            { value: '15+', label: lt('Years', 'سنوات') },
            { value: '50+', label: lt('Awards', 'جوائز') },
          ],
        },
      };
    case 'testimonials':
      return {
        ...base,
        content: {
          title: lt('What Students Say', 'ماذا يقول الطلاب'),
          items: [
            { name: 'Ahmed M.', role: lt('Grade 12 Student', 'طالب صف 12'), text: lt('Best teacher ever! Improved my grades significantly.', 'أفضل معلم! حسّن درجاتي بشكل كبير.'), rating: 5 },
            { name: 'Sara K.', role: lt('Parent', 'ولي أمر'), text: lt('Professional and caring approach.', 'نهج احترافي ومهتم.'), rating: 5 },
          ],
        },
      };
    case 'success_stories':
      return {
        ...base,
        content: {
          title: lt('Success Stories', 'قصص النجاح'),
          stories: [
            { student: lt('Omar', 'عمر'), before: '60%', after: '95%', subject: lt('Math', 'رياضيات') },
            { student: lt('Layla', 'ليلى'), before: '55%', after: '92%', subject: lt('Physics', 'فيزياء') },
          ],
        },
      };
    case 'student_results':
      return {
        ...base,
        content: {
          title: lt('Student Results', 'نتائج الطلاب'),
          results: [
            { year: '2024', passRate: '96%', topScore: '100%' },
            { year: '2023', passRate: '94%', topScore: '98%' },
          ],
        },
      };
    case 'gallery':
      return {
        ...base,
        content: {
          title: lt('Gallery', 'معرض الصور'),
          images: [],
        },
      };
    case 'video':
      return {
        ...base,
        content: {
          title: lt('Watch Introduction', 'شاهد المقدمة'),
          videoUrl: '',
          caption: lt('Learn about our teaching approach', 'تعرف على أسلوبنا في التدريس'),
        },
      };
    case 'faq':
      return {
        ...base,
        content: {
          title: lt('Frequently Asked Questions', 'الأسئلة الشائعة'),
          items: [
            { q: lt('How do I book a session?', 'كيف أحجز جلسة؟'), a: lt('Contact us via WhatsApp or the form below.', 'تواصل معنا عبر واتساب أو النموذج أدناه.') },
            { q: lt('What are the fees?', 'ما هي الرسوم؟'), a: lt('See our pricing section for details.', 'راجع قسم الأسعار للتفاصيل.') },
          ],
        },
      };
    case 'features':
      return {
        ...base,
        content: {
          title: lt('Features', 'المميزات'),
          items: [
            { icon: 'BookOpen', title: lt('Expert Curriculum', 'منهج متخصص'), desc: lt('Aligned with national standards', 'متوافق مع المعايير الوطنية') },
            { icon: 'Users', title: lt('Small Groups', 'مجموعات صغيرة'), desc: lt('Personal attention', 'اهتمام شخصي') },
            { icon: 'Clock', title: lt('Flexible Hours', 'ساعات مرنة'), desc: lt('Evening & weekend slots', 'مواعيد مسائية ونهاية الأسبوع') },
          ],
        },
      };
    case 'benefits':
      return {
        ...base,
        content: {
          title: lt('Why Choose Us', 'لماذا تختارنا'),
          items: [
            lt('Proven track record', 'سجل حافل مثبت'),
            lt('Personalized learning', 'تعلم م personalized'),
            lt('Affordable pricing', 'أسعار مناسبة'),
            lt('Online & offline options', 'خيارات أونلاين وحضوري'),
          ],
        },
      };
    case 'countdown':
      return {
        ...base,
        content: {
          title: lt('Limited Time Offer', 'عرض لفترة محدودة'),
          targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          cta: lt('Enroll Now', 'سجّل الآن'),
        },
      };
    case 'contact_form':
      return {
        ...base,
        content: {
          title: lt('Contact Us', 'تواصل معنا'),
          subtitle: lt('We will respond within 24 hours', 'سنرد خلال 24 ساعة'),
          fields: ['name', 'email', 'phone', 'message'],
          submitLabel: lt('Send Message', 'إرسال'),
        },
      };
    case 'whatsapp_cta':
      return {
        ...base,
        content: {
          title: lt('Chat on WhatsApp', 'تواصل عبر واتساب'),
          message: lt('Get instant answers to your questions', 'احصل على إجابات فورية لأسئلتك'),
          phone: '+201000000000',
          buttonLabel: lt('Start Chat', 'ابدأ المحادثة'),
        },
      };
    case 'lead_form':
      return {
        ...base,
        content: {
          title: lt('Get Free Consultation', 'احصل على استشارة مجانية'),
          fields: ['name', 'phone', 'grade', 'subject'],
          submitLabel: lt('Request Callback', 'اطلب اتصال'),
        },
      };
    case 'google_maps':
      return {
        ...base,
        content: {
          title: lt('Find Us', 'موقعنا'),
          embedUrl: '',
          address: lt('123 Education Street, Cairo', '123 شارع التعليم، القاهرة'),
        },
      };
    case 'branch_locations':
      return {
        ...base,
        content: {
          title: lt('Our Branches', 'فروعنا'),
          branches: [
            { name: lt('Main Branch', 'الفرع الرئيسي'), address: lt('Cairo', 'القاهرة'), phone: '+201000000001' },
            { name: lt('Alexandria Branch', 'فرع الإسكندرية'), address: lt('Alexandria', 'الإسكندرية'), phone: '+201000000002' },
          ],
        },
      };
    case 'team':
      return {
        ...base,
        content: {
          title: lt('Our Team', 'فريقنا'),
          members: [
            { name: lt('Teacher Name', 'اسم المعلم'), role: lt('Subject Lead', 'رئيس المادة'), imageUrl: '' },
          ],
        },
      };
    case 'partners':
      return {
        ...base,
        content: { title: lt('Partners', 'شركاؤنا'), logos: [] },
      };
    case 'sponsors':
      return {
        ...base,
        content: { title: lt('Sponsors', 'الرعاة'), logos: [] },
      };
    case 'blog':
      return {
        ...base,
        content: {
          title: lt('Latest Articles', 'أحدث المقالات'),
          posts: [
            { title: lt('Study Tips for Exams', 'ن tips للامتحانات'), excerpt: lt('Prepare effectively...', 'استعد بفعالية...'), date: '2024-03-01' },
          ],
        },
      };
    case 'newsletter':
      return {
        ...base,
        content: {
          title: lt('Subscribe to Newsletter', 'اشترك في النشرة'),
          subtitle: lt('Get tips and updates', 'احصل على نصائح وتحديثات'),
          placeholder: lt('Your email', 'بريدك الإلكتروني'),
          buttonLabel: lt('Subscribe', 'اشتراك'),
        },
      };
    case 'footer':
      return {
        ...base,
        content: {
          copyright: lt('© 2024 Education Center. All rights reserved.', '© 2024 مركز التعليم. جميع الحقوق محفوظة.'),
          links: [
            { label: lt('Privacy', 'الخصوصية'), url: '#' },
            { label: lt('Terms', 'الشروط'), url: '#' },
          ],
          social: { facebook: '', instagram: '', whatsapp: '' },
        },
      };
    default:
      return base;
  }
}

export function createEmptyPage(overrides?: Partial<LandingPage>): LandingPage {
  const now = new Date().toISOString();
  const hero = createDefaultSection('hero', 0);
  const footer = createDefaultSection('footer', 1);
  return {
    id: uid('page'),
    title: lt('New Landing Page', 'صفحة هبوط جديدة'),
    slug: `page-${Date.now()}`,
    type: 'custom',
    status: 'draft',
    sections: [hero, footer],
    theme: { ...DEFAULT_THEME },
    seo: {
      metaTitle: lt('Landing Page', 'صفحة هبوط'),
      metaDescription: lt('Welcome to our educational center', 'مرحباً بكم في مركزنا التعليمي'),
      keywords: [],
    },
    branding: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Ensures API/partial payloads always have required builder fields. */
export function normalizeLandingPage(page: Partial<LandingPage> & { id?: string }): LandingPage {
  const base = createEmptyPage();
  const title = page.title && typeof page.title === 'object' && 'en' in page.title
    ? page.title
    : base.title;

  return {
    ...base,
    ...page,
    id: page.id ?? base.id,
    title,
    slug: page.slug ?? base.slug,
    type: page.type ?? base.type,
    status: page.status ?? base.status,
    sections: Array.isArray(page.sections) && page.sections.length > 0 ? page.sections : base.sections,
    theme: page.theme && typeof page.theme === 'object' ? { ...base.theme, ...page.theme } : base.theme,
    seo: page.seo && typeof page.seo === 'object' ? { ...base.seo, ...page.seo } : base.seo,
    branding: page.branding && typeof page.branding === 'object' ? page.branding : base.branding,
    createdAt: page.createdAt ?? base.createdAt,
    updatedAt: page.updatedAt ?? base.updatedAt,
  };
}

export function localized(content: Record<string, unknown>, key: string, locale: 'en' | 'ar'): string {
  const val = content[key];
  if (val && typeof val === 'object' && 'en' in val && 'ar' in val) {
    return (val as LocalizedText)[locale] || (val as LocalizedText).en;
  }
  if (typeof val === 'string') return val;
  return '';
}

export function localizedArray<T extends Record<string, unknown>>(
  items: T[] | undefined,
  locale: 'en' | 'ar',
): T[] {
  if (!items) return [];
  return items.map(item => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(item)) {
      if (v && typeof v === 'object' && 'en' in v && 'ar' in v) {
        out[k] = (v as LocalizedText)[locale] || (v as LocalizedText).en;
      } else {
        out[k] = v;
      }
    }
    return out as T;
  });
}
