import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyBrandingToDocument,
  cacheBranding,
  DEFAULT_APP_BRANDING,
  normalizeBranding,
  readCachedBranding,
  type AppBranding,
} from '@/lib/branding';
import { platformApi } from '@/services/endpoints/platform';

interface BrandingContextValue {
  branding: AppBranding;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (next: AppBranding) => Promise<AppBranding>;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const cached = readCachedBranding();
  const [branding, setBranding] = useState<AppBranding>(cached ?? DEFAULT_APP_BRANDING);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((next: AppBranding) => {
    const normalized = normalizeBranding(next);
    setBranding(normalized);
    cacheBranding(normalized);
    applyBrandingToDocument(normalized);
    return normalized;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const remote = await platformApi.getBranding();
      apply(remote);
    } catch {
      const fallback = readCachedBranding() ?? DEFAULT_APP_BRANDING;
      apply(fallback);
    } finally {
      setLoading(false);
    }
  }, [apply]);

  const save = useCallback(async (next: AppBranding) => {
    const saved = await platformApi.saveBranding(next);
    return apply(saved);
  }, [apply]);

  useEffect(() => {
    if (cached) applyBrandingToDocument(cached);
    void refresh();
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ branding, loading, refresh, save }),
    [branding, loading, refresh, save],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return ctx;
}
