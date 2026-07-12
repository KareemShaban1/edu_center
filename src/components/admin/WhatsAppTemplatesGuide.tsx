import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { adminWhatsAppApi } from '@/services/endpoints/admin-whatsapp';
import { useState } from 'react';

const BUILTIN_VARIABLES = ['name', 'student_name', 'parent_name'] as const;

const SECTION_VARIABLES = [
  'date',
  'section_name',
  'status',
  'notes',
  'degree',
  'assessment_type',
] as const;

const EXAMPLE_TEMPLATE =
  'Dear {{parent_name}}, your child {{student_name}} was {{status}} on {{date}} ({{section_name}}). Notes: {{notes}}';

function WhatsAppTemplatesGuideContent({ automaticAvailable }: { automaticAvailable: boolean }) {
  const { t } = useLocale();

  return (
    <Accordion type="multiple" defaultValue={['what', 'create']} className="w-full">
      <AccordionItem value="what" className="border-border/60">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          {t('whatsapp.guideWhatTitle')}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 text-sm text-muted-foreground">
          <p>{t('whatsapp.guideWhatDesc')}</p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground">
            {EXAMPLE_TEMPLATE}
          </div>
          <p className="text-xs">{t('whatsapp.guideExampleNote')}</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="create" className="border-border/60">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          {t('whatsapp.guideCreateTitle')}
        </AccordionTrigger>
        <AccordionContent>
          <ol className="list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
            <li>{t('whatsapp.guideCreateStep1')}</li>
            <li>{t('whatsapp.guideCreateStep2')}</li>
            <li>{t('whatsapp.guideCreateStep3')}</li>
            <li>{t('whatsapp.guideCreateStep4')}</li>
          </ol>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="variables" className="border-border/60">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          {t('whatsapp.guideVariablesTitle')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 text-sm">
          <div>
            <p className="mb-2 font-medium text-foreground">{t('whatsapp.guideBuiltinTitle')}</p>
            <p className="mb-2 text-muted-foreground">{t('whatsapp.guideBuiltinDesc')}</p>
            <div className="flex flex-wrap gap-1.5">
              {BUILTIN_VARIABLES.map(variable => (
                <code key={variable} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {`{{${variable}}}`}
                </code>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-foreground">{t('whatsapp.guideSectionTitle')}</p>
            <p className="mb-2 text-muted-foreground">{t('whatsapp.guideSectionDesc')}</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_VARIABLES.map(variable => (
                <code key={variable} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {`{{${variable}}}`}
                </code>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{t('whatsapp.guidePhoneNote')}</p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="how" className="border-border/60">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          {t('whatsapp.guideHowTitle')}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 ps-5">
            <li>{t('whatsapp.guideHowStep1')}</li>
            <li>{t('whatsapp.guideHowStep2')}</li>
            <li>{t('whatsapp.guideHowStep3')}</li>
          </ol>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs">
            <p className="font-medium text-foreground">{t('whatsapp.guideModeTitle')}</p>
            <p className="mt-1">
              {automaticAvailable ? t('whatsapp.guideModeAutomatic') : t('whatsapp.guideModeManual')}
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="where" className="border-border/60">
        <AccordionTrigger className="text-sm font-medium hover:no-underline">
          {t('whatsapp.guideWhereTitle')}
        </AccordionTrigger>
        <AccordionContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1.5 ps-5">
            <li>
              <Link to="/admin/whatsapp" className="font-medium text-primary hover:underline">
                {t('whatsapp.sendTitle')}
              </Link>
              {' — '}
              {t('whatsapp.guideWhereSend')}
            </li>
            <li>{t('whatsapp.guideWhereAttendance')}</li>
            <li>{t('whatsapp.guideWhereExams')}</li>
            <li>{t('whatsapp.guideWhereQuizzes')}</li>
          </ul>
          <p className="flex items-center gap-1.5 pt-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            {t('whatsapp.guideWhereHint')}
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function WhatsAppTemplatesGuide() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const { data: whatsappStatus } = useQuery({
    queryKey: ['admin-whatsapp-status'],
    queryFn: () => adminWhatsAppApi.status(),
    enabled: open,
  });

  const automaticAvailable = whatsappStatus?.automatic_available ?? false;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-4 w-4" />
        {t('whatsapp.guideButton')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{t('whatsapp.guideTitle')}</DialogTitle>
            <DialogDescription>{t('whatsapp.guideDesc')}</DialogDescription>
          </DialogHeader>

          <WhatsAppTemplatesGuideContent automaticAvailable={automaticAvailable} />
        </DialogContent>
      </Dialog>
    </>
  );
}
