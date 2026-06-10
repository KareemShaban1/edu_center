import { createContext, useContext } from 'react';
import type { LandingPageTheme, LandingSection, TextRole } from '@/types/landing';

export interface TypographyContextValue {
  section: LandingSection;
  theme: LandingPageTheme;
  locale: 'en' | 'ar';
  editMode?: boolean;
  selectedTextKey?: string | null;
  onTextFieldSelect?: (fieldKey: string) => void;
  onContentChange?: (content: Record<string, unknown>) => void;
}

export const TypographyContext = createContext<TypographyContextValue | null>(null);

export function useTypography() {
  return useContext(TypographyContext);
}

export function inferTextRole(tag?: string): TextRole {
  if (tag === 'h1' || tag === 'h2' || tag === 'h3') return 'heading';
  if (tag === 'p') return 'body';
  return 'body';
}
