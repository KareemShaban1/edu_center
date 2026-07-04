import { useLocale } from '@/contexts/LocaleContext';

/** Tailwind font classes that follow platform branding and the active locale. */
export function useAppFontClasses() {
  const { locale } = useLocale();
  if (locale === 'ar') {
    return { body: 'font-arabic', display: 'font-arabic' } as const;
  }
  return { body: 'font-body', display: 'font-display' } as const;
}
