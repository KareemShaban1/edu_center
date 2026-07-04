import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import { ParentHeroIllustration } from '@/components/dashboard/DashboardStatDecor';
import type { ParentDashboardLink, ParentDashboardLinkGroup } from '@/config/parent-dashboard-links';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface ParentDashboardHeroProps {
  userName?: string;
  mainLinks: ParentDashboardLink[];
  linkGroups: ParentDashboardLinkGroup[];
  className?: string;
}

export default function ParentDashboardHero({
  userName,
  mainLinks,
  linkGroups,
  className,
}: ParentDashboardHeroProps) {
  const { t } = useLocale();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative mb-4 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-info/10 via-card to-primary/5 p-4 shadow-card sm:mb-6 sm:rounded-2xl sm:p-5 md:p-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute -end-6 -top-8 hidden h-36 w-48 opacity-80 md:block md:h-44 md:w-56" aria-hidden>
        <ParentHeroIllustration />
      </div>

      <motion.div
        className="pointer-events-none absolute -bottom-8 -start-8 hidden h-32 w-32 rounded-full bg-info/5 blur-2xl md:block"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="relative z-10">
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-full md:max-w-[calc(100%-11rem)]">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-info/20 bg-info/5 px-2.5 py-1 text-xs font-medium text-info">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{t('dashboard.parent')}</span>
            </div>
            <h1 className="font-display text-lg font-bold leading-snug tracking-tight sm:text-2xl md:text-3xl">
              {userName ? `${t('dashboard.parent.welcome')}, ${userName}` : t('dashboard.parent')}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t('dashboard.parent.desc')}</p>
          </div>
        </div>

        <DashboardHomeLinks mainLinks={mainLinks} extraLinkGroups={linkGroups} />
      </div>
    </motion.section>
  );
}
