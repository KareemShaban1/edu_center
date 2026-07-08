import { useRef, useState } from 'react';
import { FileImage, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import CertificatePreview from '@/components/certification/CertificatePreview';
import type { CertificateDesignConfig } from '@/lib/certification/types';
import {
  CERTIFICATE_EXPORT_WIDTH,
  downloadCertificateAsPdf,
  downloadCertificateAsPng,
} from '@/lib/certification/export-certificate';

interface CertificateDownloadActionsProps {
  design: CertificateDesignConfig;
  title: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function CertificateDownloadActions({
  design,
  title,
  variant = 'default',
  className,
}: CertificateDownloadActionsProps) {
  const { t } = useLocale();
  const exportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);

  const runExport = async (format: 'png' | 'pdf') => {
    const element = exportRef.current;
    if (!element) return;

    setBusy(format);
    try {
      if (format === 'png') {
        await downloadCertificateAsPng(element, title);
      } else {
        await downloadCertificateAsPdf(element, title);
      }
      toast({ title: t('certification.downloadSuccess'), description: title });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('certification.downloadFailed');
      toast({ title: t('certification.downloadFailed'), description: message, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={className}>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy !== null}
            title={t('certification.downloadPng')}
            onClick={e => {
              e.stopPropagation();
              void runExport('png');
            }}
          >
            {busy === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy !== null}
            title={t('certification.downloadPdf')}
            onClick={e => {
              e.stopPropagation();
              void runExport('pdf');
            }}
          >
            {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          </Button>
        </div>
        <div
          aria-hidden
          className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
          style={{ width: CERTIFICATE_EXPORT_WIDTH }}
        >
          <div ref={exportRef} data-certificate-export data-export-width={`${CERTIFICATE_EXPORT_WIDTH}px`}>
            <CertificatePreview design={design} className="max-w-none w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={busy !== null}
          onClick={() => runExport('png')}
        >
          {busy === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
          {busy === 'png' ? t('certification.downloading') : t('certification.downloadPng')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={busy !== null}
          onClick={() => runExport('pdf')}
        >
          {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {busy === 'pdf' ? t('certification.downloading') : t('certification.downloadPdf')}
        </Button>
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed left-[-9999px] top-0 opacity-0"
        style={{ width: CERTIFICATE_EXPORT_WIDTH }}
      >
        <div ref={exportRef} data-certificate-export data-export-width={`${CERTIFICATE_EXPORT_WIDTH}px`}>
          <CertificatePreview design={design} className="max-w-none w-full" />
        </div>
      </div>
    </div>
  );
}
