import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ClipboardList, Sparkles, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import type { StudentSelfBootstrapPayload } from '@/services/endpoints/student-self';

interface StudentDashboardBannerProps {
  userName?: string;
  bootstrap?: StudentSelfBootstrapPayload | null;
  loading?: boolean;
}

export default function StudentDashboardBanner({
  userName,
  bootstrap,
  loading,
}: StudentDashboardBannerProps) {
  const { t } = useLocale();
  const pendingHomework = (bootstrap?.homework || []).filter(
    item => !['submitted', 'graded', 'approved'].includes(item.status),
  ).length;
  const gradedItems = (bootstrap?.grades || []).filter(item => item.score != null);
  const nextAction = pendingHomework > 0
    ? {
        to: '/student/homework',
        label: t('student.banner.homeworkAction'),
        icon: ClipboardList,
      }
    : {
        to: '/student/sessions',
        label: t('student.banner.sessionsAction'),
        icon: BookOpen,
      };
  const NextActionIcon = nextAction.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-exams/10 p-4 shadow-card sm:mb-6 sm:p-6"
    >
      <motion.div
        className="pointer-events-none absolute -end-10 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -bottom-10 end-10 h-28 w-28 rounded-full bg-exams/10 blur-2xl"
        animate={{ x: [0, 12, 0], y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="relative z-10 max-w-2xl">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/60 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t('dashboard.student')}
        </div>

        <h1 className="font-display text-xl font-bold leading-snug tracking-tight sm:text-3xl">
          {userName
            ? `${t('student.banner.welcome')}, ${userName}`
            : t('student.banner.welcome')}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {pendingHomework > 0
            ? t('student.banner.pending').replace('{count}', String(pendingHomework))
            : t('student.banner.ready')}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to={nextAction.to}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              <NextActionIcon className="h-4 w-4" aria-hidden />
              {nextAction.label}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/student/grades"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-2 text-sm font-semibold backdrop-blur transition-colors hover:bg-background"
            >
              <Trophy className="h-4 w-4 text-warning" aria-hidden />
              {t('student.banner.gradesAction')}
            </Link>
          </motion.div>
        </div>

        <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-background/60 px-2.5 py-1 backdrop-blur">
            {loading ? '…' : `${pendingHomework} ${t('nav.homework')}`}
          </span>
          <span className="rounded-full bg-background/60 px-2.5 py-1 backdrop-blur">
            {loading ? '…' : `${gradedItems.length} ${t('section.recentGrades')}`}
          </span>
        </div>
      </div>
    </motion.section>
  );
}
