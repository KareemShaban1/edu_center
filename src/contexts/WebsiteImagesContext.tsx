import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WEBSITE_IMAGES, WEBSITE_IMAGE_BY_DEFAULT_URL } from '@/config/website-images';
import { resolveAssetUrl } from '@/lib/asset-url';
import { websiteImagesApi, type WebsiteImageOverride } from '@/services/endpoints/website-images';

interface WebsiteImagesContextValue {
  overrides: Record<string, WebsiteImageOverride>;
  loading: boolean;
  resolve: (defaultUrl: string) => string;
}

const WebsiteImagesContext = createContext<WebsiteImagesContextValue>({
  overrides: {},
  loading: true,
  resolve: defaultUrl => defaultUrl,
});

function pathFromUrl(value: string): string {
  try {
    return decodeURIComponent(new URL(value, window.location.origin).pathname);
  } catch {
    return value;
  }
}

export function WebsiteImagesProvider({ children }: { children: ReactNode }) {
  const { data: overrides = {}, isLoading } = useQuery({
    queryKey: ['website-images'],
    queryFn: websiteImagesApi.list,
    staleTime: 60_000,
  });

  const overrideByDefaultUrl = useMemo(() => {
    const result = new Map<string, string>();
    WEBSITE_IMAGES.forEach(image => {
      const replacement = overrides[image.key]?.url;
      if (replacement) result.set(image.defaultUrl, resolveAssetUrl(replacement));
    });
    return result;
  }, [overrides]);

  useEffect(() => {
    const applyOverrides = (root: ParentNode) => {
      const images = [
        ...(root instanceof HTMLImageElement ? [root] : []),
        ...Array.from(root.querySelectorAll?.('img') ?? []),
      ] as HTMLImageElement[];

      images.forEach(image => {
        const original = image.dataset.websiteImageOriginal || pathFromUrl(image.getAttribute('src') || '');
        const definition = WEBSITE_IMAGE_BY_DEFAULT_URL.get(original);
        if (!definition) return;

        image.dataset.websiteImageOriginal = definition.defaultUrl;
        const replacement = overrideByDefaultUrl.get(definition.defaultUrl) || definition.defaultUrl;
        if (pathFromUrl(image.src) !== pathFromUrl(replacement)) image.src = replacement;
      });

      const iconLinks = Array.from(root.querySelectorAll?.<HTMLLinkElement>('link[rel*="icon"]') ?? []);
      iconLinks.forEach(link => {
        const original = link.dataset.websiteImageOriginal || pathFromUrl(link.getAttribute('href') || '');
        const definition = WEBSITE_IMAGE_BY_DEFAULT_URL.get(original);
        if (!definition) return;

        link.dataset.websiteImageOriginal = definition.defaultUrl;
        const replacement = overrideByDefaultUrl.get(definition.defaultUrl) || definition.defaultUrl;
        if (pathFromUrl(link.href) !== pathFromUrl(replacement)) link.href = replacement;
      });

      const elements = [
        ...(root instanceof HTMLElement ? [root] : []),
        ...Array.from(root.querySelectorAll?.<HTMLElement>('[style*="background"]') ?? []),
      ];

      elements.forEach(element => {
        const current = element.style.backgroundImage;
        const original = element.dataset.websiteImageBackground || current;
        const definition = WEBSITE_IMAGES.find(image => original.includes(image.defaultUrl));
        if (!definition) return;

        element.dataset.websiteImageBackground = original;
        const replacement = overrideByDefaultUrl.get(definition.defaultUrl) || definition.defaultUrl;
        const next = original.split(definition.defaultUrl).join(replacement);
        if (current !== next) element.style.backgroundImage = next;
      });
    };

    applyOverrides(document);
    const observer = new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes') {
          applyOverrides(record.target as ParentNode);
          return;
        }
        record.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) applyOverrides(node);
        });
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['src', 'href', 'style'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [overrideByDefaultUrl]);

  const value = useMemo<WebsiteImagesContextValue>(() => ({
    overrides,
    loading: isLoading,
    resolve: defaultUrl => {
      const definition = WEBSITE_IMAGE_BY_DEFAULT_URL.get(defaultUrl);
      if (!definition) return defaultUrl;
      return resolveAssetUrl(overrides[definition.key]?.url) || defaultUrl;
    },
  }), [overrides, isLoading]);

  return (
    <WebsiteImagesContext.Provider value={value}>
      {children}
    </WebsiteImagesContext.Provider>
  );
}
