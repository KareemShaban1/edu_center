import type { ComponentType, LandingComponent, LocalizedText } from '@/types/landing';
import { EDUCATION_EGYPT_IMAGES } from '@/lib/education-assets';

let componentCounter = 0;

function cmpUid(prefix = 'cmp'): string {
  componentCounter += 1;
  return `${prefix}_${Date.now()}_${componentCounter}`;
}

function lt(en: string, ar: string): LocalizedText {
  return { en, ar };
}

export const BUILDER_COMPONENT_TYPES: ComponentType[] = [
  'heading',
  'paragraph',
  'button',
  'image',
  'video',
  'badge',
  'tag',
  'icon',
  'card',
  'counter',
  'testimonial',
  'accordion',
  'form',
  'progress',
  'timeline',
  'pricing_table',
  'social_links',
];

export function createDefaultComponent(type: ComponentType, order: number): LandingComponent {
  const base = { id: cmpUid('cmp'), type, order, content: {} as Record<string, unknown> };

  switch (type) {
    case 'heading':
      return {
        ...base,
        content: {
          text: lt('Section Heading', 'عنوان القسم'),
          level: 'h2',
          align: 'center',
        },
      };
    case 'paragraph':
      return {
        ...base,
        content: {
          text: lt('Add your content here. Describe your offering, benefits, or story.', 'أضف محتواك هنا. صف عرضك أو فوائدك أو قصتك.'),
          align: 'center',
        },
      };
    case 'button':
      return {
        ...base,
        content: {
          label: lt('Get Started', 'ابدأ الآن'),
          url: '#',
          variant: 'primary',
          align: 'center',
        },
      };
    case 'image':
      return {
        ...base,
        content: { url: EDUCATION_EGYPT_IMAGES.libraryBooks, alt: lt('Image', 'صورة'), width: 'full', align: 'center' },
      };
    case 'video':
      return {
        ...base,
        content: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', align: 'center' },
      };
    case 'badge':
      return {
        ...base,
        content: { text: lt('New', 'جديد'), align: 'center' },
      };
    case 'tag':
      return {
        ...base,
        content: { text: lt('Featured', 'مميز'), align: 'center' },
      };
    case 'icon':
      return {
        ...base,
        content: {
          icon: 'BookOpen',
          label: lt('Quality Education', 'تعليم عالي الجودة'),
          align: 'center',
        },
      };
    case 'card':
      return {
        ...base,
        content: {
          title: lt('Card Title', 'عنوان البطاقة'),
          body: lt('Short description for this card.', 'وصف قصير لهذه البطاقة.'),
          imageUrl: EDUCATION_EGYPT_IMAGES.studentLearning,
        },
      };
    case 'counter':
      return {
        ...base,
        content: { value: '100+', label: lt('Happy Students', 'طلاب سعداء'), align: 'center' },
      };
    case 'testimonial':
      return {
        ...base,
        content: {
          name: 'Sarah M.',
          role: lt('Parent', 'ولي أمر'),
          text: lt('Excellent teaching and great results for my child.', 'تعليم ممتاز ونتائج رائعة لابني.'),
          rating: 5,
        },
      };
    case 'accordion':
      return {
        ...base,
        content: {
          items: [
            { q: lt('What do you offer?', 'ماذا تقدمون؟'), a: lt('We offer personalized lessons for all levels.', 'نقدم دروساً مخصصة لجميع المستويات.') },
            { q: lt('How do I register?', 'كيف أسجل؟'), a: lt('Contact us via the form or WhatsApp.', 'تواصل معنا عبر النموذج أو واتساب.') },
          ],
        },
      };
    case 'form':
      return {
        ...base,
        content: {
          title: lt('Contact Us', 'تواصل معنا'),
          submitLabel: lt('Send Message', 'إرسال الرسالة'),
        },
      };
    case 'progress':
      return {
        ...base,
        content: { value: 75, label: lt('Course Progress', 'تقدم الدورة'), align: 'center' },
      };
    case 'timeline':
      return {
        ...base,
        content: {
          items: [
            { year: '2024', title: lt('Launch', 'الانطلاق'), desc: lt('Center opened', 'افتتاح المركز') },
            { year: '2025', title: lt('Growth', 'النمو'), desc: lt('500+ students', '500+ طالب') },
          ],
        },
      };
    case 'pricing_table':
      return {
        ...base,
        content: {
          plans: [
            {
              name: lt('Basic', 'أساسي'),
              price: '500 EGP',
              period: lt('/month', '/شهر'),
              features: [lt('2 sessions/week', 'جلستان/أسبوع')],
            },
            {
              name: lt('Pro', 'احترافي'),
              price: '900 EGP',
              period: lt('/month', '/شهر'),
              featured: true,
              features: [lt('4 sessions/week', '4 جلسات/أسبوع'), lt('Materials included', 'المواد مشمولة')],
            },
          ],
        },
      };
    case 'social_links':
      return {
        ...base,
        content: {
          facebook: '',
          instagram: '',
          whatsapp: '',
          twitter: '',
          align: 'center',
        },
      };
    default:
      return {
        ...base,
        content: { text: lt('Component', 'مكوّن') },
      };
  }
}

export function cloneComponents(components: LandingComponent[] | undefined): LandingComponent[] {
  if (!components?.length) return [];
  return components.map((c, i) => ({
    ...structuredClone(c),
    id: cmpUid('cmp'),
    order: i,
  }));
}

export function componentText(content: Record<string, unknown>, key: string, locale: 'en' | 'ar'): string {
  const val = content[key];
  if (val && typeof val === 'object' && 'en' in val && 'ar' in val) {
    return (val as LocalizedText)[locale] || (val as LocalizedText).en;
  }
  if (typeof val === 'string') return val;
  return '';
}
