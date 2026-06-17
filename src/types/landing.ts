export type LocaleCode = 'en' | 'ar';

export type LandingPageType =
  | 'teacher'
  | 'subject'
  | 'course'
  | 'event'
  | 'branch'
  | 'online_class'
  | 'summer_course'
  | 'exam_prep'
  | 'center'
  | 'custom';

export type LandingPageStatus = 'draft' | 'published' | 'archived';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export type AnimationType =
  | 'none'
  | 'fade-in'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'zoom'
  | 'float'
  | 'scroll-reveal'
  | 'parallax';

export type SectionType =
  | 'hero'
  | 'about_teacher'
  | 'about_center'
  | 'teacher_bio'
  | 'teacher_experience'
  | 'teacher_certifications'
  | 'teaching_method'
  | 'subject_overview'
  | 'course_details'
  | 'course_curriculum'
  | 'pricing'
  | 'statistics'
  | 'testimonials'
  | 'success_stories'
  | 'student_results'
  | 'gallery'
  | 'video'
  | 'faq'
  | 'features'
  | 'benefits'
  | 'countdown'
  | 'contact_form'
  | 'whatsapp_cta'
  | 'lead_form'
  | 'google_maps'
  | 'branch_locations'
  | 'team'
  | 'partners'
  | 'sponsors'
  | 'blog'
  | 'newsletter'
  | 'footer'
  | 'custom';

export type ComponentType =
  | 'button'
  | 'heading'
  | 'paragraph'
  | 'card'
  | 'icon'
  | 'image'
  | 'video'
  | 'svg'
  | 'testimonial'
  | 'slider'
  | 'carousel'
  | 'accordion'
  | 'form'
  | 'progress'
  | 'counter'
  | 'timeline'
  | 'pricing_table'
  | 'badge'
  | 'tag'
  | 'social_links';

export type MediaType = 'image' | 'video' | 'pdf' | 'svg' | 'logo';

export interface LocalizedText {
  en: string;
  ar: string;
}

export type TextRole = 'heading' | 'body' | 'label' | 'button' | 'stat';

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface SectionStyle {
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  textColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  borderRadius?: number;
  boxShadow?: string;
}

export interface LandingComponent {
  id: string;
  type: ComponentType;
  order: number;
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}

export interface LandingSection {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  animation?: AnimationType;
  style?: SectionStyle;
  textStyles?: Record<string, TextStyle>;
  content: Record<string, unknown>;
  components?: LandingComponent[];
}

export interface LandingPageTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor?: string;
  bodyColor?: string;
  headingFont: string;
  bodyFont: string;
  headingSize: number;
  bodySize: number;
  headingFontWeight?: number;
  bodyFontWeight?: number;
  lineHeight?: number;
  borderRadius: number;
  shadowIntensity: number;
}

export interface LandingPageSEO {
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  keywords: string[];
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  schemaType?: 'teacher' | 'course' | 'organization' | 'event';
  schemaJson?: Record<string, unknown>;
}

export interface LandingPageBranding {
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  centerName?: LocalizedText;
}

export interface LandingPage {
  id: string;
  title: LocalizedText;
  slug: string;
  type: LandingPageType;
  status: LandingPageStatus;
  teacherId?: number;
  subjectKey?: string;
  courseId?: number;
  eventId?: number;
  branchId?: number;
  sections: LandingSection[];
  theme: LandingPageTheme;
  seo: LandingPageSEO;
  branding: LandingPageBranding;
  templateId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageRevision {
  id: string;
  pageId: string;
  snapshot: LandingPage;
  createdAt: string;
  label?: string;
}

export interface LandingPageAnalytics {
  pageId: string;
  visitors: number;
  uniqueVisitors: number;
  conversionRate: number;
  leads: number;
  formSubmissions: number;
  ctaClicks: number;
  deviceStats: { mobile: number; tablet: number; desktop: number };
  trafficSources: { source: string; count: number }[];
  dailyViews: { date: string; views: number }[];
}

export interface LandingTemplate {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  category: LandingPageType;
  subjectKey?: string;
  thumbnail?: string;
  page: Omit<LandingPage, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt'>;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  folder?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface LandingPageListItem {
  id: string;
  title: LocalizedText;
  slug: string;
  type: LandingPageType;
  status: LandingPageStatus;
  teacherId?: number;
  teacherName?: string;
  updatedAt: string;
  publishedAt?: string;
  visitors?: number;
}
