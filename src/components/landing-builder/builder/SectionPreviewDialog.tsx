import { useLocale } from '@/contexts/LocaleContext';
import type { LandingPage, LandingSection } from '@/types/landing';
import { SECTION_CATALOG } from '@/lib/landing/constants';
import { SectionRenderer } from '../SectionRenderer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SectionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: LandingPage;
  section: LandingSection | null;
  previewLocale: 'en' | 'ar';
}

export function SectionPreviewDialog({
  open,
  onOpenChange,
  page,
  section,
  previewLocale,
}: SectionPreviewDialogProps) {
  const { t } = useLocale();

  if (!section) return null;

  const meta = SECTION_CATALOG.find(s => s.type === section.type);
  const title = meta ? t(meta.labelKey) : section.type;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{t('landing.sectionPreview')}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-4">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
            <SectionRenderer
              section={{ ...section, visible: true }}
              page={page}
              locale={previewLocale}
              editMode={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
