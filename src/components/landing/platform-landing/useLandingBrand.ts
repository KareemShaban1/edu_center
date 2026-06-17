import { useMemo } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { buildLandingBrand, type LandingBrand } from '@/lib/branding';
import { BRAND } from './constants';

const STATIC_BRAND: LandingBrand = {
  red: BRAND.red,
  redDark: BRAND.redDark,
  redLight: BRAND.redLight,
  redSoft: `${BRAND.red}22`,
  redMuted: `${BRAND.red}44`,
  text: BRAND.text,
  textMuted: BRAND.textMuted,
  surface: BRAND.surface,
  bg: BRAND.bg,
  border: BRAND.border,
};

export function useLandingBrand(): LandingBrand {
  const { branding } = useBranding();
  return useMemo(
    () => buildLandingBrand(branding.primary_color),
    [branding.primary_color],
  );
}

export { STATIC_BRAND };
