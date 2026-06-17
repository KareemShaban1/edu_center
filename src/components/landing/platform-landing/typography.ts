type Breakpoint = 'mobile' | 'tablet' | 'desktop';

type SizeScale = Record<Breakpoint, number>;

/** Pixel sizes per breakpoint: mobile (<640), tablet (640–1023), desktop (≥1024) */
export const LANDING_FONT_SIZES = {
  body: { mobile: 15, tablet: 16, desktop: 18 },
  brand: { mobile: 17, tablet: 19, desktop: 24 },
  nav: { mobile: 14, tablet: 15, desktop: 22 },
  button: { mobile: 14, tablet: 15, desktop: 16 },
  heroTitle: { mobile: 28, tablet: 36, desktop: 52 },
  heroSubtitle: { mobile: 16, tablet: 18, desktop: 20 },
  heroBadge: { mobile: 14, tablet: 16, desktop: 20 },
  heroCta: { mobile: 15, tablet: 17, desktop: 18 },
  heroCtaSub: { mobile: 13, tablet: 15, desktop: 16 },
  sectionTitle: { mobile: 24, tablet: 30, desktop: 36 },
  cardTitle: { mobile: 17, tablet: 19, desktop: 20 },
  cardBody: { mobile: 14, tablet: 15, desktop: 18 },
  roleTitle: { mobile: 16, tablet: 17, desktop: 18 },
  roleItem: { mobile: 14, tablet: 15, desktop: 18 },
  whyUsTitle: { mobile: 16, tablet: 20, desktop: 22 },
  whyUsBody: { mobile: 14, tablet: 16, desktop: 18 },
  ctaTitle: { mobile: 24, tablet: 32, desktop: 48 },
  ctaBody: { mobile: 16, tablet: 18, desktop: 20 },
  ctaTrial: { mobile: 14, tablet: 15, desktop: 16 },
  trustItem: { mobile: 12, tablet: 13, desktop: 14 },
  footerBrand: { mobile: 14, tablet: 15, desktop: 16 },
  footerCopy: { mobile: 12, tablet: 13, desktop: 14 },
} as const satisfies Record<string, SizeScale>;

export type LandingFontKey = keyof typeof LANDING_FONT_SIZES;

export function getLandingBreakpoint(width: number): Breakpoint {
  if (width >= 1024) return 'desktop';
  if (width >= 640) return 'tablet';
  return 'mobile';
}

export function resolveLandingFonts(breakpoint: Breakpoint): Record<LandingFontKey, string> {
  const entries = Object.entries(LANDING_FONT_SIZES) as [LandingFontKey, SizeScale][];
  return Object.fromEntries(
    entries.map(([key, scale]) => [key, `${scale[breakpoint]}px`]),
  ) as Record<LandingFontKey, string>;
}
