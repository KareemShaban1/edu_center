import { useEffect, useMemo, useState } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { useLocale } from '@/contexts/LocaleContext';
import {
  getLandingBreakpoint,
  resolveLandingFonts,
  type LandingFontKey,
} from './typography';

export function usePlatformLandingFonts() {
  const { branding } = useBranding();
  const { locale } = useLocale();
  const scale = useMemo(() => {
    const raw = locale === 'ar' ? branding.landing_text_scale_ar : branding.landing_text_scale;
    const n = Number.parseFloat(raw);
    return Number.isNaN(n) ? 100 : n;
  }, [branding.landing_text_scale, branding.landing_text_scale_ar, locale]);

  const [breakpoint, setBreakpoint] = useState(() =>
    getLandingBreakpoint(typeof window !== 'undefined' ? window.innerWidth : 1024),
  );

  useEffect(() => {
    const update = () => setBreakpoint(getLandingBreakpoint(window.innerWidth));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  const fonts = useMemo(
    () => resolveLandingFonts(breakpoint, scale),
    [breakpoint, scale],
  );

  const size = (key: LandingFontKey) => fonts[key];

  return { fonts, size, scale, breakpoint };
}
