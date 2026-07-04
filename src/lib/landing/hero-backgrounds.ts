import type { LandingPageTheme, SectionStyle } from '@/types/landing';

export interface HeroBackgroundPreset {
  id: string;
  labelKey: string;
  style: Partial<SectionStyle>;
}

export const HERO_BACKGROUND_PRESETS: HeroBackgroundPreset[] = [
  {
    id: 'default',
    labelKey: 'landing.heroBg.default',
    style: {
      backgroundColor: undefined,
      backgroundGradient: undefined,
      backgroundImage: undefined,
      textColor: undefined,
    },
  },
  {
    id: 'navy',
    labelKey: 'landing.heroBg.navy',
    style: {
      backgroundColor: '#0f2847',
      backgroundGradient: 'linear-gradient(160deg, #0f2847 0%, #1a3a5c 55%, #0f2847 100%)',
      textColor: '#f8fafc',
    },
  },
  {
    id: 'gold-navy',
    labelKey: 'landing.heroBg.goldNavy',
    style: {
      backgroundGradient: 'linear-gradient(135deg, #0f2847 0%, #1a3a5c 40%, #3d2e0a 100%)',
      textColor: '#fefce8',
    },
  },
  {
    id: 'light',
    labelKey: 'landing.heroBg.light',
    style: {
      backgroundColor: '#f8fafc',
      backgroundGradient: undefined,
      backgroundImage: undefined,
      textColor: '#0f2847',
    },
  },
  {
    id: 'warm',
    labelKey: 'landing.heroBg.warm',
    style: {
      backgroundGradient: 'linear-gradient(145deg, #fff7ed 0%, #fef3c7 50%, #ffffff 100%)',
      textColor: '#1e293b',
    },
  },
];

export function heroThemeGradient(theme: LandingPageTheme): Partial<SectionStyle> {
  return {
    backgroundGradient: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
    textColor: '#ffffff',
  };
}

export function applyHeroBackgroundPreset(
  presetId: string,
  theme: LandingPageTheme,
): Partial<SectionStyle> {
  if (presetId === 'theme') return heroThemeGradient(theme);
  const preset = HERO_BACKGROUND_PRESETS.find(p => p.id === presetId);
  if (!preset) return {};
  if (preset.id === 'default') {
    return {
      backgroundColor: undefined,
      backgroundGradient: undefined,
      backgroundImage: undefined,
      textColor: undefined,
    };
  }
  return { ...preset.style };
}
