import { useEffect } from 'react';
import type { LandingPage } from '@/types/landing';
import { SectionRenderer } from './SectionRenderer';
import { SectionImage } from './SectionImage';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { cn } from '@/lib/utils';

interface LandingPageRendererProps {
  page: LandingPage;
  locale: 'en' | 'ar';
  editMode?: boolean;
  selectedSectionId?: string | null;
  selectedTextKey?: string | null;
  onSelectSection?: (id: string) => void;
  onSelectTextField?: (fieldKey: string) => void;
  onSectionContentChange?: (sectionId: string, content: Record<string, unknown>) => void;
  className?: string;
}

export function LandingPageRenderer({
  page,
  locale,
  editMode,
  selectedSectionId,
  selectedTextKey,
  onSelectSection,
  onSelectTextField,
  onSectionContentChange,
  className,
}: LandingPageRendererProps) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (editMode) return;
    document.title = page.seo.metaTitle[locale] || page.title[locale];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', page.seo.metaDescription[locale]);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = page.seo.metaDescription[locale];
      document.head.appendChild(m);
    }
    if (page.seo.ogImage) {
      let og = document.querySelector('meta[property="og:image"]');
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', 'og:image');
        document.head.appendChild(og);
      }
      og.setAttribute('content', page.seo.ogImage);
    }
    if (page.seo.schemaType && page.seo.schemaJson) {
      const scriptId = 'landing-schema';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(page.seo.schemaJson);
    }
  }, [page, locale, editMode]);

  const sorted = [...page.sections].sort((a, b) => a.order - b.order);

  return (
    <div
      dir={dir}
      className={cn('@container landing-page min-h-screen w-full overflow-x-hidden', className)}
      style={{
        fontFamily: page.theme.bodyFont,
        color: page.theme.textColor,
        backgroundColor: page.theme.backgroundColor,
      }}
    >
      {page.branding.logoUrl && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-white/90 backdrop-blur border-b px-4 @sm:px-6 py-2">
          <SectionImage src={page.branding.logoUrl} alt="" className="h-8 object-contain" />
          {!editMode && (
            <PwaInstallButton className="rounded-lg border border-black/10 bg-white/80 shadow-sm hover:bg-white" />
          )}
        </div>
      )}
      {!editMode && !page.branding.logoUrl && (
        <div className="fixed top-3 z-[60] ltr:right-4 rtl:left-4">
          <PwaInstallButton className="rounded-lg border border-black/10 bg-white/90 shadow-md backdrop-blur hover:bg-white" />
        </div>
      )}
      {sorted.map(section => (
        <SectionRenderer
          key={section.id}
          section={section}
          page={page}
          locale={locale}
          editMode={editMode}
          isSelected={selectedSectionId === section.id}
          selectedTextKey={selectedTextKey}
          onSelect={() => onSelectSection?.(section.id)}
          onSelectTextField={onSelectTextField}
          onContentChange={content => onSectionContentChange?.(section.id, content)}
        />
      ))}
    </div>
  );
}
