import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import { BookOpen, CalendarCheck, ClipboardList, Trophy } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/endpoints/dashboard';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import StudentCentersSection from '@/components/student/StudentCentersSection';
import { portalRowKey } from '@/components/CenterLabel';
import type { DashboardStat } from '@/types/models';

export default function StudentDashboard() {
  const { t } = useLocale();
  const { user } = useAuth();
  const portalMode = user?.portal_mode;

  const { data: bootstrap, isLoading: bootstrapLoading } = useStudentBootstrap();
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: () => dashboardApi.getByRole('student'),
    enabled: !portalMode,
  });

  const isLoading = portalMode ? bootstrapLoading : dashboardLoading;

  const portalStats = portalMode && bootstrap ? (() => {
    const attendance = bootstrap.attendance || [];
    const grades = bootstrap.grades || [];
    const homework = bootstrap.homework || [];
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = attendance.length > 0 ? `${Math.round((present / attendance.length) * 100)}%` : '—';
    const scored = grades.filter(g => typeof g.score === 'number');
    const gpa = scored.length > 0
      ? (scored.reduce((s, g) => s + (g.score || 0), 0) / scored.length).toFixed(1)
      : '—';
    const pending = homework.filter(h => h.status !== 'submitted' && h.status !== 'graded').length;
    return [
      { id: 'sessions', title: t('nav.mySessions'), value: String(bootstrap.sessions?.length || 0), icon: 'book-open' as const },
      { id: 'attendance', title: t('stat.attendanceRate'), value: attendanceRate, icon: 'calendar-check' as const, variant: 'attendance' as const },
      { id: 'gpa', title: t('stat.gpa'), value: gpa, icon: 'trophy' as const },
      { id: 'homework', title: t('stat.pendingHomework'), value: String(pending), icon: 'clipboard-list' as const },
    ] satisfies DashboardStat[];
  })() : [];

  const stats: DashboardStat[] = portalMode ? portalStats : (dashboardData?.stats || []);
  const assignments = portalMode
    ? (bootstrap?.homework || []).slice(0, 6).map(h => ({
        id: portalRowKey(h.center_id, h.id),
        title: h.title,
        subtitle: [h.center_name, h.subject, h.due_date].filter(Boolean).join(' · '),
        meta: h.status,
      }))
    : (dashboardData?.sections.find(s => s.key === 'assignments')?.items || []);
  const grades = portalMode
    ? (bootstrap?.grades || []).slice(0, 6).map(g => ({
        id: portalRowKey(g.center_id, g.id),
        title: g.subject,
        subtitle: [g.center_name, g.date].filter(Boolean).join(' · '),
        status: g.score != null ? `${g.score}/${g.total}` : '—',
      }))
    : (dashboardData?.sections.find(s => s.key === 'grades')?.items || []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.student')}</h1>
        <p className="page-description">{t('dashboard.student.desc')}</p>
      </div>

      <StudentCentersSection
        centers={bootstrap?.centers || []}
        loading={bootstrapLoading}
      />

      <DashboardHomeLinks
        mainLinks={[
          { labelKey: 'nav.mySessions', path: '/student/sessions' },
          { labelKey: 'nav.attendance', path: '/student/attendance' },
          { labelKey: 'nav.myGrades', path: '/student/grades' },
        ]}
        extraLinks={[
          { labelKey: 'nav.homework', path: '/student/homework' },
          { labelKey: 'nav.library', path: '/student/library' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          <>
            <StatCard title={t('stat.enrolledCourses')} value="..." icon={BookOpen} />
            <StatCard title={t('stat.attendanceRate')} value="..." icon={CalendarCheck} />
            <StatCard title={t('stat.gpa')} value="..." icon={Trophy} />
            <StatCard title={t('stat.pendingHomework')} value="..." icon={ClipboardList} />
          </>
        ) : portalMode ? (
          <>
            <StatCard title={t('nav.mySessions')} value={stats[0]?.value || '0'} icon={BookOpen} />
            <StatCard title={t('stat.attendanceRate')} value={stats[1]?.value || '—'} icon={CalendarCheck} variant="attendance" />
            <StatCard title={t('stat.gpa')} value={stats[2]?.value || '—'} icon={Trophy} />
            <StatCard title={t('stat.pendingHomework')} value={stats[3]?.value || '0'} icon={ClipboardList} />
          </>
        ) : (
          stats.map(s => {
            const iconMap = { users: BookOpen, 'book-open': BookOpen, 'calendar-check': CalendarCheck, trophy: Trophy, 'clipboard-list': ClipboardList } as const;
            const Icon = iconMap[s.icon as keyof typeof iconMap] || BookOpen;
            return <StatCard key={s.id} title={s.title} value={s.value} icon={Icon} trend={s.trend} variant={s.variant} />;
          })
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display font-semibold">{portalMode ? t('nav.homework') : (dashboardData?.sections.find(s => s.key === 'assignments')?.title || t('section.upcomingAssignments'))}</h3>
          <div className="space-y-2">
            {assignments.map((hw) => (
              <div key={hw.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium">{hw.title}</h4>
                    <p className="text-xs text-muted-foreground">{hw.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning shrink-0">{hw.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display font-semibold">{portalMode ? t('section.recentGrades') : (dashboardData?.sections.find(s => s.key === 'grades')?.title || t('section.recentGrades'))}</h3>
          <div className="space-y-2">
            {grades.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-card">
                <span className="text-sm font-medium">{g.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{g.subtitle}</span>
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
