import { inferWhatsAppMessageLang, previewWhatsAppMessage, type WhatsAppMessageLang } from '@/lib/whatsapp-template-variables';
import { cn } from '@/lib/utils';

export default function WhatsAppMessagePreview({
  content,
  extraValues,
  lang,
  className,
}: {
  content: string;
  extraValues?: Record<string, string>;
  lang?: WhatsAppMessageLang;
  className?: string;
}) {
  const resolvedLang = lang ?? inferWhatsAppMessageLang(content);
  const dir = resolvedLang === 'ar' ? 'rtl' : 'ltr';
  const text = previewWhatsAppMessage(content, extraValues, resolvedLang);

  return (
    <div className={cn('rounded-xl bg-muted/50 p-3', className)}>
      <div
        dir={dir}
        lang={resolvedLang}
        className="ms-auto max-w-[92%] rounded-2xl rounded-es-md border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/40"
      >
        <p className="whitespace-pre-wrap break-words">{text || '…'}</p>
      </div>
    </div>
  );
}
