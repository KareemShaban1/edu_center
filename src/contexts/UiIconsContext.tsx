import { createContext, useCallback, useContext, useMemo, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { UI_ICON_BY_KEY } from '@/config/ui-icons';
import { navPathIconKey, resolveLucideIcon } from '@/lib/lucide-icons';
import { uiIconsApi } from '@/services/endpoints/ui-icons';

type IconComponent = LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;

interface UiIconsContextValue {
  overrides: Record<string, string>;
  loading: boolean;
  resolveName: (key: string, fallbackName?: string) => string;
  resolveIcon: (key: string, fallback?: IconComponent) => IconComponent;
  resolvePathIcon: (path: string, fallback?: IconComponent) => IconComponent;
}

const UiIconsContext = createContext<UiIconsContextValue>({
  overrides: {},
  loading: true,
  resolveName: (_key, fallbackName) => fallbackName || 'HelpCircle',
  resolveIcon: (_key, fallback) => fallback || HelpCircle,
  resolvePathIcon: (_path, fallback) => fallback || HelpCircle,
});

export function UiIconsProvider({ children }: { children: ReactNode }) {
  const { data: overrides = {}, isLoading } = useQuery({
    queryKey: ['ui-icons'],
    queryFn: uiIconsApi.list,
    staleTime: 60_000,
  });

  const resolveName = useCallback((key: string, fallbackName?: string) => {
    const override = overrides[key];
    if (override) return override;
    if (fallbackName) return fallbackName;
    return UI_ICON_BY_KEY.get(key)?.defaultIcon || 'HelpCircle';
  }, [overrides]);

  const resolveIcon = useCallback((key: string, fallback?: IconComponent) => {
    const override = overrides[key];
    if (override) return resolveLucideIcon(override, HelpCircle);
    if (fallback) return fallback;
    const catalogDefault = UI_ICON_BY_KEY.get(key)?.defaultIcon;
    if (catalogDefault) return resolveLucideIcon(catalogDefault, HelpCircle);
    return HelpCircle;
  }, [overrides]);

  const resolvePathIcon = useCallback((path: string, fallback?: IconComponent) => {
    return resolveIcon(navPathIconKey(path), fallback);
  }, [resolveIcon]);

  const value = useMemo<UiIconsContextValue>(() => ({
    overrides,
    loading: isLoading,
    resolveName,
    resolveIcon,
    resolvePathIcon,
  }), [overrides, isLoading, resolveName, resolveIcon, resolvePathIcon]);

  return <UiIconsContext.Provider value={value}>{children}</UiIconsContext.Provider>;
}

export function useUiIcons() {
  return useContext(UiIconsContext);
}

export function useUiIcon(key: string, fallback?: IconComponent): IconComponent {
  const { resolveIcon } = useUiIcons();
  return resolveIcon(key, fallback);
}

export function useUiIconName(key: string, fallbackName?: string): string {
  const { resolveName } = useUiIcons();
  return resolveName(key, fallbackName);
}
