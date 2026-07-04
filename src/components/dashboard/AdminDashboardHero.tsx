import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import { AdminHeroIllustration } from '@/components/dashboard/DashboardStatDecor';
import type { AdminDashboardLink, AdminDashboardLinkGroup } from '@/config/admin-dashboard-links';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface AdminDashboardHeroProps {
  userName?: string;
  mainLinks: AdminDashboardLink[];
  linkGroups: AdminDashboardLinkGroup[];
  className?: string;
}

export default function AdminDashboardHero({
  userName,
  mainLinks,
  linkGroups,
  className,
}: AdminDashboardHeroProps) {
  const { t } = useLocale();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-exams/5 p-5 shadow-card sm:p-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute -end-6 -top-8 h-44 w-56 opacity-80" aria-hidden>
        <AdminHeroIllustration />
      </div>

      <motion.div
        className="pointer-events-none absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="relative z-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('dashboard.admin')}
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {userName ? `${t('dashboard.admin.welcome')}, ${userName}` : t('dashboard.admin')}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t('dashboard.admin.desc')}</p>
          </div>
        </div>

        <DashboardHomeLinks mainLinks={mainLinks} extraLinkGroups={linkGroups} />
      </div>
    </motion.section>
  );
}
