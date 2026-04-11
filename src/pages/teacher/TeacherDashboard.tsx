import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import { BookOpen, Users, CalendarCheck, ClipboardList, Shield, Activity, GraduationCap, DollarSign, Trophy, FileText } from 'lucide-react';
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

export default function TeacherDashboard() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => dashboardApi.getByRole('teacher'),
  });

  const stats: DashboardStat[] = data?.stats || [];
  const schedule = data?.sections.find(s => s.key === 'today_schedule')?.items || [];
  const attendance = data?.sections.find(s => s.key === 'attendance')?.items || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.teacher')}</h1>
        <p className="page-description">{t('dashboard.teacher.desc')}</p>
      </div>

      <DashboardHomeLinks
        mainLinks={[
          { labelKey: 'nav.myClasses', path: '/teacher/classes' },
          { labelKey: 'nav.meetingSeries', path: '/teacher/meeting-series' },
          { labelKey: 'nav.attendance', path: '/teacher/attendance' },
          { labelKey: 'nav.quizzes', path: '/teacher/quizzes' },
        ]}
        extraLinks={[
          { labelKey: 'nav.exams', path: '/teacher/exams' },
          { labelKey: 'nav.homework', path: '/teacher/homework' },
          { labelKey: 'nav.library', path: '/teacher/library' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          <>
            <StatCard title={t('stat.myClasses')} value="..." icon={BookOpen} />
            <StatCard title={t('stat.totalStudentsSmall')} value="..." icon={Users} />
            <StatCard title={t('stat.avgAttendance')} value="..." icon={CalendarCheck} />
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
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'today_schedule')?.title || t('section.todaySchedule')}</h3>
          <div className="space-y-2">
            {schedule.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{item.title} ({item.meta})</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'attendance')?.title || t('nav.attendance')}</h3>
          <div className="space-y-2">
            {attendance.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-card">
                <span className="text-sm font-medium">{a.title}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  a.status === 'present' ? 'bg-success/10 text-success' :
                  a.status === 'late' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
