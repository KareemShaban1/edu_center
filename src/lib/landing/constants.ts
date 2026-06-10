import type { AnimationType, ComponentType, SectionType } from '@/types/landing';

export const DEFAULT_THEME = {
  primaryColor: '#b91c1c',
  secondaryColor: '#1e293b',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  headingColor: '#1e293b',
  bodyColor: '#475569',
  headingFont: 'Cairo, sans-serif',
  bodyFont: 'Cairo, sans-serif',
  headingSize: 36,
  bodySize: 16,
  headingFontWeight: 700,
  bodyFontWeight: 400,
  lineHeight: 1.5,
  borderRadius: 12,
  shadowIntensity: 2,
};

export const ANIMATION_OPTIONS: { value: AnimationType; labelKey: string }[] = [
  { value: 'none', labelKey: 'landing.anim.none' },
  { value: 'fade-in', labelKey: 'landing.anim.fadeIn' },
  { value: 'slide-up', labelKey: 'landing.anim.slideUp' },
  { value: 'slide-left', labelKey: 'landing.anim.slideLeft' },
  { value: 'slide-right', labelKey: 'landing.anim.slideRight' },
  { value: 'scale', labelKey: 'landing.anim.scale' },
  { value: 'zoom', labelKey: 'landing.anim.zoom' },
  { value: 'float', labelKey: 'landing.anim.float' },
  { value: 'scroll-reveal', labelKey: 'landing.anim.scrollReveal' },
  { value: 'parallax', labelKey: 'landing.anim.parallax' },
];

export const SECTION_CATALOG: { type: SectionType; labelKey: string; icon: string; category: string }[] = [
  { type: 'hero', labelKey: 'landing.section.hero', icon: 'Sparkles', category: 'core' },
  { type: 'about_teacher', labelKey: 'landing.section.aboutTeacher', icon: 'User', category: 'teacher' },
  { type: 'about_center', labelKey: 'landing.section.aboutCenter', icon: 'Building2', category: 'center' },
  { type: 'teacher_bio', labelKey: 'landing.section.teacherBio', icon: 'FileText', category: 'teacher' },
  { type: 'teacher_experience', labelKey: 'landing.section.teacherExperience', icon: 'Briefcase', category: 'teacher' },
  { type: 'teacher_certifications', labelKey: 'landing.section.teacherCertifications', icon: 'Award', category: 'teacher' },
  { type: 'teaching_method', labelKey: 'landing.section.teachingMethod', icon: 'Lightbulb', category: 'teacher' },
  { type: 'subject_overview', labelKey: 'landing.section.subjectOverview', icon: 'BookOpen', category: 'course' },
  { type: 'course_details', labelKey: 'landing.section.courseDetails', icon: 'GraduationCap', category: 'course' },
  { type: 'course_curriculum', labelKey: 'landing.section.courseCurriculum', icon: 'List', category: 'course' },
  { type: 'pricing', labelKey: 'landing.section.pricing', icon: 'DollarSign', category: 'conversion' },
  { type: 'statistics', labelKey: 'landing.section.statistics', icon: 'BarChart3', category: 'social' },
  { type: 'testimonials', labelKey: 'landing.section.testimonials', icon: 'MessageSquare', category: 'social' },
  { type: 'success_stories', labelKey: 'landing.section.successStories', icon: 'Trophy', category: 'social' },
  { type: 'student_results', labelKey: 'landing.section.studentResults', icon: 'TrendingUp', category: 'social' },
  { type: 'gallery', labelKey: 'landing.section.gallery', icon: 'Images', category: 'media' },
  { type: 'video', labelKey: 'landing.section.video', icon: 'Video', category: 'media' },
  { type: 'faq', labelKey: 'landing.section.faq', icon: 'HelpCircle', category: 'conversion' },
  { type: 'features', labelKey: 'landing.section.features', icon: 'Grid3x3', category: 'core' },
  { type: 'benefits', labelKey: 'landing.section.benefits', icon: 'CheckCircle', category: 'core' },
  { type: 'countdown', labelKey: 'landing.section.countdown', icon: 'Timer', category: 'conversion' },
  { type: 'contact_form', labelKey: 'landing.section.contactForm', icon: 'Mail', category: 'conversion' },
  { type: 'whatsapp_cta', labelKey: 'landing.section.whatsappCta', icon: 'Phone', category: 'conversion' },
  { type: 'lead_form', labelKey: 'landing.section.leadForm', icon: 'UserPlus', category: 'conversion' },
  { type: 'google_maps', labelKey: 'landing.section.googleMaps', icon: 'MapPin', category: 'location' },
  { type: 'branch_locations', labelKey: 'landing.section.branchLocations', icon: 'Map', category: 'location' },
  { type: 'team', labelKey: 'landing.section.team', icon: 'Users', category: 'center' },
  { type: 'partners', labelKey: 'landing.section.partners', icon: 'Handshake', category: 'center' },
  { type: 'sponsors', labelKey: 'landing.section.sponsors', icon: 'Star', category: 'center' },
  { type: 'blog', labelKey: 'landing.section.blog', icon: 'Newspaper', category: 'content' },
  { type: 'newsletter', labelKey: 'landing.section.newsletter', icon: 'Send', category: 'conversion' },
  { type: 'footer', labelKey: 'landing.section.footer', icon: 'PanelBottom', category: 'core' },
];

export const COMPONENT_CATALOG: { type: ComponentType; labelKey: string }[] = [
  { type: 'button', labelKey: 'landing.component.button' },
  { type: 'heading', labelKey: 'landing.component.heading' },
  { type: 'paragraph', labelKey: 'landing.component.paragraph' },
  { type: 'card', labelKey: 'landing.component.card' },
  { type: 'icon', labelKey: 'landing.component.icon' },
  { type: 'image', labelKey: 'landing.component.image' },
  { type: 'video', labelKey: 'landing.component.video' },
  { type: 'svg', labelKey: 'landing.component.svg' },
  { type: 'testimonial', labelKey: 'landing.component.testimonial' },
  { type: 'slider', labelKey: 'landing.component.slider' },
  { type: 'carousel', labelKey: 'landing.component.carousel' },
  { type: 'accordion', labelKey: 'landing.component.accordion' },
  { type: 'form', labelKey: 'landing.component.form' },
  { type: 'progress', labelKey: 'landing.component.progress' },
  { type: 'counter', labelKey: 'landing.component.counter' },
  { type: 'timeline', labelKey: 'landing.component.timeline' },
  { type: 'pricing_table', labelKey: 'landing.component.pricingTable' },
  { type: 'badge', labelKey: 'landing.component.badge' },
  { type: 'tag', labelKey: 'landing.component.tag' },
  { type: 'social_links', labelKey: 'landing.component.socialLinks' },
];

export const TEACHER_SUBJECT_TEMPLATES = [
  'arabic', 'english', 'french', 'german', 'math', 'physics',
  'chemistry', 'biology', 'science', 'history',
] as const;

export type TeacherSubjectKey = (typeof TEACHER_SUBJECT_TEMPLATES)[number];

export const SUBJECT_LABELS: Record<TeacherSubjectKey, { en: string; ar: string }> = {
  arabic: { en: 'Arabic Teacher', ar: 'معلم اللغة العربية' },
  english: { en: 'English Teacher', ar: 'معلم اللغة الإنجليزية' },
  french: { en: 'French Teacher', ar: 'معلم اللغة الفرنسية' },
  german: { en: 'German Teacher', ar: 'معلم اللغة الألمانية' },
  math: { en: 'Math Teacher', ar: 'معلم الرياضيات' },
  physics: { en: 'Physics Teacher', ar: 'معلم الفيزياء' },
  chemistry: { en: 'Chemistry Teacher', ar: 'معلم الكيمياء' },
  biology: { en: 'Biology Teacher', ar: 'معلم الأحياء' },
  science: { en: 'Science Teacher', ar: 'معلم العلوم' },
  history: { en: 'History Teacher', ar: 'معلم التاريخ' },
};

export const PREVIEW_WIDTHS: Record<'desktop' | 'tablet' | 'mobile', number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

export const LANDING_STORAGE_KEY = 'edu-landing-pages';
export const LANDING_REVISIONS_KEY = 'edu-landing-revisions';
export const LANDING_MEDIA_KEY = 'edu-landing-media';
export const LANDING_ANALYTICS_KEY = 'edu-landing-analytics';
