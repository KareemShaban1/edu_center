import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { Users, GraduationCap, CalendarCheck, DollarSign, Shield, Activity, BookOpen, ClipboardList, Trophy, FileText } from 'lucide-react';
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

export default function AdminDashboard() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getByRole('admin'),
  });

  const stats: DashboardStat[] = data?.stats || [];
  const students = data?.sections.find(s => s.key === 'recent_students')?.items || [];
  const announcements = data?.sections.find(s => s.key === 'announcements')?.items || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.admin')}</h1>
        <p className="page-description">{t('dashboard.admin.desc')}</p>
      </div>

      <DashboardHomeLinks
        mainLinks={[
          { labelKey: 'nav.students', path: '/admin/students' },
          { labelKey: 'nav.teachers', path: '/admin/teachers' },
          { labelKey: 'nav.parents', path: '/admin/parents' },
        ]}
        extraLinks={[
          { labelKey: 'nav.grades', path: '/admin/grades' },
          { labelKey: 'nav.classes', path: '/admin/classes' },
          { labelKey: 'nav.sections', path: '/admin/sections' },
          { labelKey: 'nav.attendance', path: '/admin/attendance' },
          { labelKey: 'nav.units', path: '/admin/units' },
          { labelKey: 'nav.lessons', path: '/admin/lessons' },
          { labelKey: 'nav.homework', path: '/admin/homework' },
          { labelKey: 'nav.fees', path: '/admin/fees' },
          { labelKey: 'nav.payments', path: '/admin/payments' },
          { labelKey: 'nav.exams', path: '/admin/exams' },
          { labelKey: 'nav.quizzes', path: '/admin/quizzes' },
          { labelKey: 'nav.library', path: '/admin/library' },
          { labelKey: 'nav.announcements', path: '/admin/announcements' },
          { labelKey: 'nav.reports', path: '/admin/reports' },
          { labelKey: 'nav.adminUsers', path: '/admin/users' },
          { labelKey: 'nav.rolesPermissions', path: '/admin/roles' },
          { labelKey: 'nav.settings', path: '/admin/settings' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          <>
            <StatCard title={t('stat.totalStudents')} value="..." icon={GraduationCap} />
            <StatCard title={t('stat.teachers')} value="..." icon={Users} />
            <StatCard title={t('stat.attendanceRate')} value="..." icon={CalendarCheck} />
            <StatCard title={t('stat.revenue')} value="..." icon={DollarSign} />
          </>
        ) : (
          stats.map(s => {
            const Icon = iconMap[s.icon as keyof typeof iconMap] || GraduationCap;
            return <StatCard key={s.id} title={s.title} value={s.value} icon={Icon} trend={s.trend} variant={s.variant} />;
          })
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'recent_students')?.title || t('section.recentStudents')}</h3>
          <DataTable
            searchable
            columns={[
              { key: 'name', label: t('col.name') },
              { key: 'gender', label: t('col.gender') },
              { key: 'created_at', label: t('col.enrolled') },
            ]}
            data={students.map(s => ({ name: s.title, gender: s.subtitle || '-', created_at: s.meta || '-' }))}
          />
        </div>

        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'announcements')?.title || t('section.announcements')}</h3>
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{a.title}</h4>
                  <span className="text-xs text-muted-foreground">{a.meta}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
