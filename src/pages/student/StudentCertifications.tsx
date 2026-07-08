import { useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import CertificatePreview from '@/components/certification/CertificatePreview';
import CertificateDownloadActions from '@/components/certification/CertificateDownloadActions';
import { designConfigFromPreset } from '@/lib/certification/design-presets';
import type { CertificateDesignConfig } from '@/lib/certification/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CertRow {
  id: number;
  title: string;
  content: string;
  design?: CertificateDesignConfig | null;
  context: string;
  context_date?: string | null;
  issued_at?: string | null;
  is_custom?: boolean;
}

function resolveCertDesign(row: CertRow): CertificateDesignConfig {
  if (row.design) return row.design;
  return {
    ...designConfigFromPreset('classic-gold'),
    fields: {
      heading: row.title,
      subtitle: '',
      body: row.content,
      footer: row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '',
    },
  };
}

function downloadTitle(row: CertRow): string {
  const date = row.issued_at ? new Date(row.issued_at).toISOString().split('T')[0] : 'certificate';
  return `${row.title}-${date}`;
}

export default function StudentCertifications() {
  const { t } = useLocale();
  const { data } = useStudentBootstrap();
  const rows = (data?.certifications || []) as CertRow[];
  const [viewItem, setViewItem] = useState<CertRow | null>(null);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b.issued_at ?? '').localeCompare(a.issued_at ?? '')),
    [rows],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Award className="h-6 w-6 text-amber-600" />
          {t('nav.certifications')}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('certification.studentDesc')}</p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          {t('certification.noCertsYet')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map(item => {
            const design = resolveCertDesign(item);
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm transition hover:border-amber-300 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setViewItem(item)}
                  className="w-full text-start"
                >
                  <div className="border-b bg-slate-50 p-2 dark:bg-slate-900/30">
                    <CertificatePreview design={design} compact />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.issued_at ? new Date(item.issued_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </button>
                <div className="flex items-center justify-between border-t px-4 py-2">
                  <span className="text-xs text-muted-foreground">{t('certification.downloadAs')}</span>
                  <CertificateDownloadActions
                    design={design}
                    title={downloadTitle(item)}
                    variant="compact"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                {viewItem.title}
              </DialogTitle>
            </DialogHeader>
            <CertificatePreview design={resolveCertDesign(viewItem)} />
            <CertificateDownloadActions
              design={resolveCertDesign(viewItem)}
              title={downloadTitle(viewItem)}
            />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewItem(null)}>
                {t('misc.close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
