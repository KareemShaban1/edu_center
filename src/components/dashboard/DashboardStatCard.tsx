import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceRing, StatCardDecor } from '@/components/dashboard/DashboardStatDecor';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  statKey?: string;
  trend?: { value: number; label: string };
  variant?: 'default' | 'students' | 'teachers' | 'attendance' | 'finance' | 'exams' | 'alerts';
  index?: number;
  loading?: boolean;
  className?: string;
}

const variantStyles: Record<string, { chip: string; glow: string }> = {
  default: {
    chip: 'bg-primary/10 text-primary',
    glow: 'from-primary/8 via-card to-card',
  },
  students: {
    chip: 'bg-info/10 text-info',
    glow: 'from-info/10 via-card to-card',
  },
  teachers: {
    chip: 'bg-exams/10 text-exams',
    glow: 'from-exams/10 via-card to-card',
  },
  attendance: {
    chip: 'bg-success/10 text-success',
    glow: 'from-success/10 via-card to-card',
  },
  finance: {
    chip: 'bg-warning/10 text-warning',
    glow: 'from-warning/10 via-card to-card',
  },
  exams: {
    chip: 'bg-exams/10 text-exams',
    glow: 'from-exams/10 via-card to-card',
  },
  alerts: {
    chip: 'bg-destructive/10 text-destructive',
    glow: 'from-destructive/10 via-card to-card',
  },
};

function parsePercent(value: string | number): number | null {
  const text = String(value).replace('%', '').trim();
  const n = Number.parseFloat(text);
  return Number.isFinite(n) ? n : null;
}

export default function DashboardStatCard({
  title,
  value,
  icon: Icon,
  statKey,
  trend,
  variant = 'default',
  index = 0,
  loading = false,
  className,
}: DashboardStatCardProps) {
  const styles = variantStyles[variant] ?? variantStyles.default;
  const attendancePercent = variant === 'attendance' ? parsePercent(value) : null;

  if (loading) {
    return (
      <div className={cn('relative overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 shadow-card sm:p-5', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-16 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br p-4 shadow-card sm:p-5',
        styles.glow,
        className,
      )}
    >
      <StatCardDecor variant={variant} statKey={statKey} className="hidden md:block" />

      <div className="relative z-10 flex items-center gap-3 sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-muted-foreground sm:text-sm">{title}</p>
          <motion.p
            className="mt-0.5 font-display text-2xl font-bold tracking-tight sm:mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.07 + 0.15 }}
          >
            {value}
          </motion.p>
          {trend && (
            <p className={cn('mt-1.5 text-xs font-medium', trend.value >= 0 ? 'text-success' : 'text-destructive')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          {attendancePercent !== null ? (
            <AttendanceRing percent={attendancePercent} className="h-9 w-9 sm:h-11 sm:w-11" />
          ) : (
            <motion.div
              className={cn('rounded-xl p-2 shadow-sm sm:p-2.5', styles.chip)}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
