import type { ReactNode } from 'react';
import type { LandingPage, LandingSection } from '@/types/landing';
import { TypographyContext } from './TypographyContext';
import {
  HeroSection, ContentBlockSection, FeaturesSection, TestimonialsSection,
  PricingSection, FaqSection, StatisticsSection, WhatsappSection, ContactFormSection,
  CountdownSection, FooterSection, GenericListSection, ExperienceSection, BranchSection,
  NewsletterSection, VideoSection, CurriculumSection, SuccessStoriesSection, LeadFormSection,
  MapsSection, GallerySection, TeachingMethodSection, CertificationsSection, CourseDetailsSection,
  TeamSection, BlogSection, LogosSection, StudentResultsSection, SubjectOverviewSection,
} from './sections/SectionViews';
import { CustomSectionView } from './sections/CustomSectionView';

interface SectionRendererProps {
  section: LandingSection;
  page: LandingPage;
  locale: 'en' | 'ar';
  editMode?: boolean;
  isSelected?: boolean;
  selectedTextKey?: string | null;
  selectedComponentId?: string | null;
  onSelect?: () => void;
  onSelectTextField?: (fieldKey: string) => void;
  onSelectComponent?: (componentId: string) => void;
  onContentChange?: (content: Record<string, unknown>) => void;
}

export function SectionRenderer({
  section,
  page,
  locale,
  editMode,
  isSelected,
  selectedTextKey,
  selectedComponentId,
  onSelect,
  onSelectTextField,
  onSelectComponent,
  onContentChange,
}: SectionRendererProps) {
  if (!section.visible && !editMode) return null;

  const props = {
    section,
    locale,
    theme: page.theme,
    editMode,
    isSelected,
    onSelect,
    onContentChange,
  };

  const wrap = (node: ReactNode) => (
    <TypographyContext.Provider
      value={{
        section,
        theme: page.theme,
        locale,
        editMode,
        selectedTextKey,
        onTextFieldSelect: onSelectTextField,
        onContentChange,
      }}
    >
      {node}
    </TypographyContext.Provider>
  );

  switch (section.type) {
    case 'hero': return wrap(<HeroSection {...props} />);
    case 'about_teacher':
    case 'about_center':
    case 'teacher_bio':
      return wrap(<ContentBlockSection {...props} />);
    case 'teacher_experience': return wrap(<ExperienceSection {...props} />);
    case 'teacher_certifications': return wrap(<CertificationsSection {...props} />);
    case 'teaching_method': return wrap(<TeachingMethodSection {...props} />);
    case 'subject_overview': return wrap(<SubjectOverviewSection {...props} />);
    case 'course_details': return wrap(<CourseDetailsSection {...props} />);
    case 'course_curriculum': return wrap(<CurriculumSection {...props} />);
    case 'pricing': return wrap(<PricingSection {...props} />);
    case 'statistics': return wrap(<StatisticsSection {...props} />);
    case 'testimonials': return wrap(<TestimonialsSection {...props} />);
    case 'success_stories': return wrap(<SuccessStoriesSection {...props} />);
    case 'student_results': return wrap(<StudentResultsSection {...props} />);
    case 'gallery': return wrap(<GallerySection {...props} />);
    case 'video': return wrap(<VideoSection {...props} />);
    case 'faq': return wrap(<FaqSection {...props} />);
    case 'features': return wrap(<FeaturesSection {...props} />);
    case 'benefits': return wrap(<GenericListSection {...props} />);
    case 'countdown': return wrap(<CountdownSection {...props} />);
    case 'contact_form': return wrap(<ContactFormSection {...props} />);
    case 'whatsapp_cta': return wrap(<WhatsappSection {...props} />);
    case 'lead_form': return wrap(<LeadFormSection {...props} />);
    case 'google_maps': return wrap(<MapsSection {...props} />);
    case 'branch_locations': return wrap(<BranchSection {...props} />);
    case 'team': return wrap(<TeamSection {...props} />);
    case 'partners':
    case 'sponsors':
      return wrap(<LogosSection {...props} />);
    case 'blog': return wrap(<BlogSection {...props} />);
    case 'newsletter': return wrap(<NewsletterSection {...props} />);
    case 'footer': return wrap(<FooterSection {...props} />);
    case 'custom':
      return wrap(
        <CustomSectionView
          {...props}
          selectedComponentId={selectedComponentId}
          onSelectComponent={onSelectComponent}
        />,
      );
    default: return null;
  }
}
