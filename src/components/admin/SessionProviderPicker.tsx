import { Info } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { SessionOnlineProvider } from '@/services/endpoints/session-types';

export type SessionProviderValue = SessionOnlineProvider | 'offline';

type ProviderDef = {
  value: SessionProviderValue;
  guideKey: string;
  freeMembers: number | null;
  freeMembersKey?: 'varies' | 'room';
  proCount: number;
  conCount: number;
};

const PROVIDERS: ProviderDef[] = [
  { value: 'jitsi', guideKey: 'jitsi', freeMembers: 100, proCount: 3, conCount: 2 },
  { value: 'livekit', guideKey: 'livekit', freeMembers: 100, proCount: 3, conCount: 2 },
  { value: 'external', guideKey: 'external', freeMembers: null, freeMembersKey: 'varies', proCount: 2, conCount: 2 },
  { value: 'offline', guideKey: 'offline', freeMembers: null, freeMembersKey: 'room', proCount: 2, conCount: 2 },
  { value: 'zoom', guideKey: 'zoom', freeMembers: 100, proCount: 3, conCount: 2 },
  { value: 'microsoft_teams', guideKey: 'teams', freeMembers: 100, proCount: 2, conCount: 2 },
  { value: 'google_meet', guideKey: 'gmeet', freeMembers: 100, proCount: 2, conCount: 2 },
];

function ProviderGuideCard({ guideKey, proCount, conCount, t }: {
  guideKey: string;
  proCount: number;
  conCount: number;
  t: (key: string) => string;
}) {
  const pros = Array.from({ length: proCount }, (_, i) =>
    t(`provider.guide.${guideKey}.pro.${i + 1}`),
  ).filter(line => !line.startsWith('provider.guide.'));

  const cons = Array.from({ length: conCount }, (_, i) =>
    t(`provider.guide.${guideKey}.con.${i + 1}`),
  ).filter(line => !line.startsWith('provider.guide.'));

  return (
    <div className="space-y-3 text-xs">
      <p className="font-semibold text-sm">{t(`provider.guide.${guideKey}.title`)}</p>
      {pros.length > 0 ? (
        <div>
          <p className="mb-1 font-medium text-success">{t('provider.guide.prosTitle')}</p>
          <ul className="list-disc space-y-0.5 ps-4 text-muted-foreground">
            {pros.map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {cons.length > 0 ? (
        <div>
          <p className="mb-1 font-medium text-destructive">{t('provider.guide.consTitle')}</p>
          <ul className="list-disc space-y-0.5 ps-4 text-muted-foreground">
            {cons.map(line => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function freeMembersLabel(provider: ProviderDef, t: (key: string) => string) {
  if (provider.freeMembersKey === 'varies') return t('provider.guide.freeMembersVaries');
  if (provider.freeMembersKey === 'room') return t('provider.guide.freeMembersRoom');
  if (provider.freeMembers != null) {
    return t('provider.guide.freeMembers').replace('{count}', String(provider.freeMembers));
  }
  return '—';
}

interface SessionProviderPickerProps {
  value: SessionProviderValue;
  onChange: (value: SessionProviderValue) => void;
  id?: string;
}

export default function SessionProviderPicker({ value, onChange, id }: SessionProviderPickerProps) {
  const { t } = useLocale();

  return (
    <div id={id} className="space-y-1.5 rounded-lg border border-border bg-muted/15 p-2" role="radiogroup">
      {PROVIDERS.map(provider => {
        const selected = value === provider.value;
        const membersLabel = freeMembersLabel(provider, t);

        return (
          <div
            key={provider.value}
            className={cn(
              'flex items-center gap-2 rounded-md border px-2 py-2 transition-colors',
              selected ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/40',
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={selected ? 'true' : 'false'}
              onClick={() => onChange(provider.value)}
              className="flex min-w-0 flex-1 items-center gap-2 text-start text-sm"
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-primary' : 'border-muted-foreground/40',
                )}
              >
                {selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
              </span>
              <span className="min-w-0 flex-1 font-medium leading-tight">
                {t(`provider.guide.${provider.guideKey}.title`)}
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground sm:text-xs">
                {membersLabel}
              </span>
            </button>
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`${t('provider.guide.infoAria')} — ${t(`provider.guide.${provider.guideKey}.title`)}`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-72 sm:w-80" align="start">
                <ProviderGuideCard
                  guideKey={provider.guideKey}
                  proCount={provider.proCount}
                  conCount={provider.conCount}
                  t={t}
                />
              </HoverCardContent>
            </HoverCard>
          </div>
        );
      })}
    </div>
  );
}
