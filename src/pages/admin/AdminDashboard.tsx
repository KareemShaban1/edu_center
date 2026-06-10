import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { FormSelect } from '@/components/FormFields';
import { Users, GraduationCap, CalendarCheck, DollarSign, Shield, Activity, BookOpen, ClipboardList, Trophy, FileText } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/endpoints/dashboard';
import type { DashboardFilters, DashboardStat } from '@/types/models';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

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

const statTitleKeys: Record<string, string> = {
  students: 'stat.totalStudents',
  teachers: 'stat.teachers',
  attendance: 'stat.attendanceRate',
  revenue: 'stat.revenue',
  unpaid_students: 'stat.unpaidStudents',
  unpaid_amount: 'stat.unpaidAmount',
  paid_students: 'stat.paidStudents',
};

const sectionTitleKeys: Record<string, string> = {
  unpaid_students: 'section.unpaidStudents',
  recent_students: 'section.recentStudents',
  announcements: 'section.announcements',
};

function statTitle(stat: DashboardStat, t: (key: string) => string) {
  const key = statTitleKeys[stat.id];
  return key ? t(key) : stat.title;
}

function sectionTitle(key: string, fallback: string | undefined, t: (key: string) => string, month?: string) {
  if (key === 'unpaid_students' && month) {
    return `${t('section.unpaidStudents')} — ${month}`;
  }
  const titleKey = sectionTitleKeys[key];
  return titleKey ? t(titleKey) : (fallback || key);
}

function monthLabel(month: string, locale: 'en' | 'ar') {
  const index = MONTHS.indexOf(month as (typeof MONTHS)[number]);
  if (index < 0) return month;
  return new Date(2026, index, 1).toLocaleString(locale === 'ar' ? 'ar' : 'en', { month: 'long' });
}

function currentMonthValue(): string {
  return MONTHS[new Date().getMonth()];
}

export default function AdminDashboard() {
  const { t, locale } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = useMemo(() => (bootstrap?.grades || []) as Array<{ id: number; name: string }>, [bootstrap?.grades]);
  const classes = useMemo(() => (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>, [bootstrap?.classes]);
  const sections = useMemo(
    () => (bootstrap?.sections || []) as Array<{ id: number; name: string; grade_id: number; class_id: number }>,
    [bootstrap?.sections],
  );

  const [unpaidMonth, setUnpaidMonth] = useState<string>(currentMonthValue);
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const unpaidFilters = useMemo<DashboardFilters>(() => ({
    month: unpaidMonth,
    year: String(new Date().getFullYear()),
    ...(gradeId ? { grade_id: Number(gradeId) } : {}),
    ...(classId ? { class_id: Number(classId) } : {}),
    ...(sectionId ? { section_id: Number(sectionId) } : {}),
  }), [unpaidMonth, gradeId, classId, sectionId]);

  const classesByGrade = useMemo(
    () => (gradeId ? classes.filter(c => c.grade_id === Number(gradeId)) : classes),
    [classes, gradeId],
  );

  const sectionsByClass = useMemo(() => {
    let list = sections;
    if (gradeId) list = list.filter(s => s.grade_id === Number(gradeId));
    if (classId) list = list.filter(s => s.class_id === Number(classId));
    return list;
  }, [sections, gradeId, classId]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'admin', locale, unpaidFilters],
    queryFn: () => dashboardApi.getByRole('admin', unpaidFilters),
  });

  const stats: DashboardStat[] = data?.stats || [];
  const students = data?.sections.find(s => s.key === 'recent_students')?.items || [];
  const announcements = data?.sections.find(s => s.key === 'announcements')?.items || [];
  const unpaidStudents = data?.sections.find(s => s.key === 'unpaid_students')?.items || [];
  const paymentSummary = data?.payment_summary;
  const unpaidSectionTitle = data?.sections.find(s => s.key === 'unpaid_students')?.title;

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
        {isLoading ? (
          <>
            <StatCard title={t('stat.totalStudents')} value="..." icon={GraduationCap} />
            <StatCard title={t('stat.teachers')} value="..." icon={Users} />
            <StatCard title={t('stat.attendanceRate')} value="..." icon={CalendarCheck} />
            <StatCard title={t('stat.unpaidStudents')} value="..." icon={DollarSign} variant="alerts" />
            <StatCard title={t('stat.unpaidAmount')} value="..." icon={DollarSign} variant="finance" />
          </>
        ) : (
          stats.map(s => {
            const Icon = iconMap[s.icon as keyof typeof iconMap] || GraduationCap;
            return (
              <StatCard
                key={s.id}
                title={statTitle(s, t)}
                value={s.value}
                icon={Icon}
                trend={s.trend}
                variant={s.variant}
              />
            );
          })
        )}
      </div>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold">
              {sectionTitle('unpaid_students', unpaidSectionTitle, t, paymentSummary?.month)}
            </h3>
            {paymentSummary && (
              <p className="text-sm text-muted-foreground">
                {paymentSummary.month} · {t('stat.paidStudents')}: {paymentSummary.paid_count} / {paymentSummary.expected_students}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="unpaid-filter-month" className="mb-1.5 block text-sm font-medium">
              {t('col.month')}
            </label>
            <FormSelect
              id="unpaid-filter-month"
              value={unpaidMonth}
              onChange={e => setUnpaidMonth(e.target.value)}
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{monthLabel(m, locale)}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <label htmlFor="unpaid-filter-grade" className="mb-1.5 block text-sm font-medium">
              {t('col.grade')}
            </label>
            <FormSelect
              id="unpaid-filter-grade"
              value={gradeId}
              onChange={e => {
                setGradeId(e.target.value);
                setClassId('');
                setSectionId('');
              }}
            >
              <option value="">{t('filter.all')}</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <label htmlFor="unpaid-filter-class" className="mb-1.5 block text-sm font-medium">
              {t('col.class')}
            </label>
            <FormSelect
              id="unpaid-filter-class"
              value={classId}
              disabled={!gradeId}
              onChange={e => {
                setClassId(e.target.value);
                setSectionId('');
              }}
            >
              <option value="">{t('filter.all')}</option>
              {classesByGrade.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <label htmlFor="unpaid-filter-section" className="mb-1.5 block text-sm font-medium">
              {t('col.section')}
            </label>
            <FormSelect
              id="unpaid-filter-section"
              value={sectionId}
              disabled={!classId}
              onChange={e => setSectionId(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {sectionsByClass.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </FormSelect>
          </div>
        </div>

        <DataTable
          searchable
          columns={[
            { key: 'name', label: t('col.name') },
            { key: 'grade', label: t('col.grade') },
            { key: 'class', label: t('col.class') },
            { key: 'section', label: t('col.section') },
            { key: 'fee', label: t('col.title') },
            { key: 'amount', label: t('col.amount') },
            { key: 'status', label: t('col.status') },
          ]}
          data={unpaidStudents.map(s => ({
            name: s.title,
            grade: s.grade_name || '-',
            class: s.class_name || '-',
            section: s.section_name || '-',
            fee: s.fee_title || '-',
            amount: s.meta || '-',
            status: s.status === 'unpaid' ? t('payments.status.unpaid') : (s.status || '-'),
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display font-semibold">
            {sectionTitle('recent_students', data?.sections.find(s => s.key === 'recent_students')?.title, t)}
          </h3>
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
          <h3 className="mb-3 font-display font-semibold">
            {sectionTitle('announcements', data?.sections.find(s => s.key === 'announcements')?.title, t)}
          </h3>
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
