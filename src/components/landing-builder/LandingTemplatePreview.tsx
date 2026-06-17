import { useMemo } from 'react';
import type { LandingPage } from '@/types/landing';
import { LandingPageRenderer } from '@/components/landing-builder/LandingPageRenderer';
import { createEmptyPage } from '@/lib/landing/defaults';
import { getTemplateById } from '@/lib/landing/templates';
import { cn } from '@/lib/utils';

const PREVIEW_WIDTH = 1200;
const PREVIEW_SCALE = 0.24;

interface LandingTemplatePreviewProps {
  templateId: string;
  locale: 'en' | 'ar';
  className?: string;
}

function buildPreviewPage(templateId: string): LandingPage | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return createEmptyPage({
    ...template.page,
    templateId: template.id,
    slug: `${template.id}-preview`,
  });
}

export function LandingTemplatePreview({ templateId, locale, className }: LandingTemplatePreviewProps) {
  const page = useMemo(() => buildPreviewPage(templateId), [templateId]);

  if (!page) return null;

  const scaledHeight = Math.min(320, Math.max(200, page.sections.length * 36));

  return (
    <div
      className={cn(
        'relative mt-3 overflow-hidden rounded-md border bg-slate-100',
        className,
      )}
      style={{ height: scaledHeight }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute left-0 top-0 select-none bg-white shadow-sm"
        style={{
          width: PREVIEW_WIDTH,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        <LandingPageRenderer page={page} locale={locale} className="min-h-0" />
      </div>
    </div>
  );
}

export default LandingTemplatePreview;
