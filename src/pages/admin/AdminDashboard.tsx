import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminDashboardHero from '@/components/dashboard/AdminDashboardHero';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import UnpaidStudentsFilters, { MONTHS, monthLabel } from '@/components/dashboard/UnpaidStudentsFilters';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { GraduationCap, CalendarCheck, DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/endpoints/dashboard';
import { adminLinkGroups, adminMainLinks } from '@/config/admin-dashboard-links';
import type { DashboardFilters, DashboardStat } from '@/types/models';

const statVariantById: Record<string, DashboardStat['variant']> = {
  students: 'students',
  teachers: 'teachers',
  attendance: 'attendance',
  unpaid_students: 'alerts',
  unpaid_amount: 'finance',
};

const statIconById: Record<string, typeof GraduationCap> = {
  students: GraduationCap,
  teachers: Users,
  attendance: CalendarCheck,
  unpaid_students: DollarSign,
  unpaid_amount: DollarSign,
};

const iconMap = {
  users: Users,
  'graduation-cap': GraduationCap,
  'calendar-check': CalendarCheck,
  'dollar-sign': DollarSign,
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

function currentMonthValue(): string {
  return MONTHS[new Date().getMonth()];
}

function activeFilterCount(gradeId: string, classId: string, sectionId: string) {
  return [gradeId, classId, sectionId].filter(Boolean).length;
}

export default function AdminDashboard() {
  const { user } = useAuth();
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const filterProps = {
    locale,
    t,
    unpaidMonth,
    gradeId,
    classId,
    sectionId,
    grades,
    classesByGrade,
    sectionsByClass,
    onMonthChange: setUnpaidMonth,
    onGradeChange: (value: string) => {
      setGradeId(value);
      setClassId('');
      setSectionId('');
    },
    onClassChange: (value: string) => {
      setClassId(value);
      setSectionId('');
    },
    onSectionChange: setSectionId,
  };

  const appliedFilters = activeFilterCount(gradeId, classId, sectionId);

  const clearFilters = () => {
    setGradeId('');
    setClassId('');
    setSectionId('');
  };

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

  const skeletonStats = [
    { id: 'students', title: t('stat.totalStudents'), icon: GraduationCap, variant: 'students' as const },
    { id: 'teachers', title: t('stat.teachers'), icon: Users, variant: 'teachers' as const },
    { id: 'attendance', title: t('stat.attendanceRate'), icon: CalendarCheck, variant: 'attendance' as const },
    { id: 'unpaid_students', title: t('stat.unpaidStudents'), icon: DollarSign, variant: 'alerts' as const },
    { id: 'unpaid_amount', title: t('stat.unpaidAmount'), icon: DollarSign, variant: 'finance' as const },
  ];

  return (
    <DashboardLayout>
      <AdminDashboardHero
        userName={user?.name}
        mainLinks={adminMainLinks}
        linkGroups={adminLinkGroups}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? skeletonStats.map((s, i) => (
              <DashboardStatCard
                key={s.title}
                title={s.title}
                value="—"
                icon={s.icon}
                statKey={s.id}
                variant={s.variant}
                index={i}
                loading
              />
            ))
          : stats.map((s, i) => {
              const Icon = statIconById[s.id] ?? iconMap[s.icon as keyof typeof iconMap] ?? GraduationCap;
              return (
                <DashboardStatCard
                  key={s.id}
                  title={statTitle(s, t)}
                  value={s.value}
                  icon={Icon}
                  statKey={s.id}
                  trend={s.trend}
                  variant={s.variant ?? statVariantById[s.id] ?? 'default'}
                  index={i}
                />
              );
            })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="mb-6"
      >
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

        <div className="mb-4 hidden gap-3 md:grid sm:grid-cols-2 lg:grid-cols-4">
          <UnpaidStudentsFilters {...filterProps} />
        </div>

        <div className="mb-4 flex items-center gap-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('filter.title')}
            {appliedFilters > 0 ? (
              <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums">
                {appliedFilters}
              </Badge>
            ) : null}
          </Button>
          <span className="text-xs text-muted-foreground">
            {monthLabel(unpaidMonth, locale)}
            {gradeId ? ` · ${grades.find(g => String(g.id) === gradeId)?.name}` : ''}
          </span>
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-8">
            <SheetHeader className="text-start">
              <SheetTitle>{t('filter.title')}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid gap-4">
              <UnpaidStudentsFilters {...filterProps} idPrefix="unpaid-filter-sheet" />
            </div>
            <SheetFooter className="mt-6 flex-row gap-2 sm:justify-between">
              <Button type="button" variant="outline" className="flex-1" onClick={clearFilters}>
                {t('filter.clear')}
              </Button>
              <Button type="button" className="flex-1" onClick={() => setFiltersOpen(false)}>
                {t('filter.apply')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

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
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: locale === 'ar' ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
        >
          <h3 className="mb-3 font-display font-semibold">
            {sectionTitle('recent_students', data?.sections.find(s => s.key === 'recent_students')?.title, t)}
          </h3>
          <DataTable
            searchable
            columns={[
              { key: 'name', label: t('col.name') },
          //     { key: 'gender', label: t('col.gender') },
              { key: 'created_at', label: t('col.enrolled') },
            ]}
            data={students.map(s => ({ name: s.title, created_at: s.meta || '-' }))}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: locale === 'ar' ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.45 }}
        >
          <h3 className="mb-3 font-display font-semibold">
            {sectionTitle('announcements', data?.sections.find(s => s.key === 'announcements')?.title, t)}
          </h3>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                {t('crud.noData')}
              </p>
            ) : announcements.map((a, i) => {
              const scope = [a.grade_name, a.class_name, a.section_name].filter(Boolean).join(' — ');
              return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                whileHover={{ scale: 1.01 }}
                className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-medium">{a.title}</h4>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.meta}</span>
                </div>
                {scope ? (
                  <p className="mt-1.5 text-xs font-medium text-primary/90">{scope}</p>
                ) : null}
                {a.subtitle ? (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{a.subtitle}</p>
                ) : null}
              </motion.div>
            );
            })}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
