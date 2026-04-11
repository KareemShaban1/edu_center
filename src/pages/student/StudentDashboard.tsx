import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import { BookOpen, CalendarCheck, ClipboardList, Trophy, Users, Shield, Activity, GraduationCap, DollarSign, FileText } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/endpoints/dashboard';
import type { DashboardStat } from '@/types/models';

const iconMap = {
  users: Users,
  'graduation-cap': GraduationCap,
  'calendar-check': CalendarCheck,
  'dollar-sign': DollarSign,
  shield: Shield,
  activity: Activity,
  'book-open': BookOpen,
  'clipboard-list': ClipboardList,
  trophy: Trophy,
  'file-text': FileText,
};

export default function StudentDashboard() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'student'],
    queryFn: () => dashboardApi.getByRole('student'),
  });

  const stats: DashboardStat[] = data?.stats || [];
  const assignments = data?.sections.find(s => s.key === 'assignments')?.items || [];
  const grades = data?.sections.find(s => s.key === 'grades')?.items || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.student')}</h1>
        <p className="page-description">{t('dashboard.student.desc')}</p>
      </div>

      <DashboardHomeLinks
        mainLinks={[
          { labelKey: 'nav.myMeetings', path: '/student/meetings' },
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
        ) : (
          stats.map(s => {
            const Icon = iconMap[s.icon as keyof typeof iconMap] || BookOpen;
            return <StatCard key={s.id} title={s.title} value={s.value} icon={Icon} trend={s.trend} variant={s.variant} />;
          })
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'assignments')?.title || t('section.upcomingAssignments')}</h3>
          <div className="space-y-2">
            {assignments.map((hw) => (
              <div key={hw.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium">{hw.title}</h4>
                    <p className="text-xs text-muted-foreground">{hw.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">{hw.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'grades')?.title || t('section.recentGrades')}</h3>
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
