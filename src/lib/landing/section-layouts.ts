import type { LandingSection, SectionType } from '@/types/landing';

export interface SectionLayoutOption {
  value: string;
  labelKey: string;
}

export const SECTION_LAYOUTS: Partial<Record<SectionType, SectionLayoutOption[]>> = {
  hero: [
    { value: 'split', labelKey: 'landing.layout.hero.split' },
    { value: 'split-reverse', labelKey: 'landing.layout.hero.splitReverse' },
    { value: 'centered', labelKey: 'landing.layout.hero.centered' },
    { value: 'image-top', labelKey: 'landing.layout.hero.imageTop' },
    { value: 'image-bottom', labelKey: 'landing.layout.hero.imageBottom' },
    { value: 'background', labelKey: 'landing.layout.hero.background' },
    { value: 'minimal', labelKey: 'landing.layout.hero.minimal' },
    { value: 'stats-row', labelKey: 'landing.layout.hero.statsRow' },
  ],
  features: [ 
    {value:'grid-6', labelKey: 'landing.layout.features.grid6'},
    {value:'grid-5', labelKey: 'landing.layout.features.grid5'},
    { value:'grid-4', labelKey: 'landing.layout.features.grid4'},
    { value: 'grid-3', labelKey: 'landing.layout.features.grid3' },
    { value: 'grid-2', labelKey: 'landing.layout.features.grid2' },
    { value: 'list', labelKey: 'landing.layout.features.list' },
  ],
  about_teacher: [
    { value: 'split-right', labelKey: 'landing.layout.content.splitRight' },
    { value: 'split-left', labelKey: 'landing.layout.content.splitLeft' },
    { value: 'centered', labelKey: 'landing.layout.content.centered' },
  ],
  about_center: [
    { value: 'split-right', labelKey: 'landing.layout.content.splitRight' },
    { value: 'split-left', labelKey: 'landing.layout.content.splitLeft' },
    { value: 'centered', labelKey: 'landing.layout.content.centered' },
  ],
  teacher_bio: [
    { value: 'centered', labelKey: 'landing.layout.content.centered' },
    { value: 'split-right', labelKey: 'landing.layout.content.splitRight' },
    { value: 'split-left', labelKey: 'landing.layout.content.splitLeft' },
  ],
  testimonials: [
    { value: 'grid-2', labelKey: 'landing.layout.testimonials.grid2' },
    { value: 'stacked', labelKey: 'landing.layout.testimonials.stacked' },
    { value: 'featured', labelKey: 'landing.layout.testimonials.featured' },
  ],
  pricing: [
    { value: 'cards-3', labelKey: 'landing.layout.pricing.cards3' },
    { value: 'cards-2', labelKey: 'landing.layout.pricing.cards2' },
    { value: 'horizontal', labelKey: 'landing.layout.pricing.horizontal' },
  ],
  statistics: [
    { value: 'grid-4', labelKey: 'landing.layout.statistics.grid4' },
    { value: 'inline', labelKey: 'landing.layout.statistics.inline' },
    { value: 'cards', labelKey: 'landing.layout.statistics.cards' },
  ],
  gallery: [
    { value: 'grid-4', labelKey: 'landing.layout.gallery.grid4' },
    { value: 'grid-3', labelKey: 'landing.layout.gallery.grid3' },
    { value: 'featured', labelKey: 'landing.layout.gallery.featured' },
  ],
  benefits: [
    { value: 'list', labelKey: 'landing.layout.benefits.list' },
    { value: 'cards', labelKey: 'landing.layout.benefits.cards' },
    { value: 'columns-2', labelKey: 'landing.layout.benefits.columns2' },
  ],
  faq: [
    { value: 'accordion', labelKey: 'landing.layout.faq.accordion' },
    { value: 'two-column', labelKey: 'landing.layout.faq.twoColumn' },
  ],
  team: [
    { value: 'grid-3', labelKey: 'landing.layout.team.grid3' },
    { value: 'grid-4', labelKey: 'landing.layout.team.grid4' },
    { value: 'list', labelKey: 'landing.layout.team.list' },
  ],
  custom: [
    { value: 'stack', labelKey: 'landing.layout.custom.stack' },
    { value: 'two-column', labelKey: 'landing.layout.custom.twoColumn' },
    { value: 'three-column', labelKey: 'landing.layout.custom.threeColumn' },
  ],
};

export function getSectionLayouts(type: SectionType): SectionLayoutOption[] {
  return SECTION_LAYOUTS[type] ?? [];
}

export function resolveSectionLayout(section: Pick<LandingSection, 'type' | 'content'>): string {
  const options = getSectionLayouts(section.type);
  if (options.length === 0) return 'default';
  const layout = section.content.layout as string | undefined;
  if (layout && options.some(o => o.value === layout)) return layout;
  return options[0].value;
}
