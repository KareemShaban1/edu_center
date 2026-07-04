import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import TeacherDashboardHero from '@/components/dashboard/TeacherDashboardHero';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import {
  BookOpen,
  Users,
  CalendarCheck,
  ClipboardList,
  Trophy,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/endpoints/dashboard';
import { teacherLinkGroups, teacherMainLinks } from '@/config/teacher-dashboard-links';
import type { DashboardItem, DashboardSection, DashboardStat } from '@/types/models';

const statVariantById: Record<string, DashboardStat['variant']> = {
  sections: 'default',
  classes: 'default',
  students: 'students',
  attendance: 'attendance',
  homework: 'exams',
  exams: 'exams',
  quizzes: 'exams',
};

const statIconById: Record<string, typeof BookOpen> = {
  sections: BookOpen,
  classes: BookOpen,
  students: Users,
  attendance: CalendarCheck,
  homework: ClipboardList,
  exams: FileText,
  quizzes: Trophy,
};

const iconMap = {
  users: Users,
  'graduation-cap': GraduationCap,
  'calendar-check': CalendarCheck,
  'book-open': BookOpen,
  'clipboard-list': ClipboardList,
  trophy: Trophy,
  'file-text': FileText,
};

const statTitleKeys: Record<string, string> = {
  sections: 'stat.myClasses',
  classes: 'stat.myClasses',
  students: 'stat.totalStudentsSmall',
  attendance: 'stat.avgAttendance',
  homework: 'stat.pendingHomework',
  exams: 'stat.teacherExams',
  quizzes: 'stat.teacherQuizzes',
};

const sectionTitleKeys: Record<string, string> = {
  my_classes: 'section.myClasses',
  recent_attendance: 'section.recentAttendance',
  upcoming_homework: 'section.upcomingHomework',
  recent_exams: 'section.recentExams',
  recent_quizzes: 'section.recentQuizzes',
  today_schedule: 'section.todaySchedule',
  attendance: 'nav.attendance',
};

function statTitle(stat: DashboardStat, t: (key: string) => string) {
  const key = statTitleKeys[stat.id];
  return key ? t(key) : stat.title;
}

function sectionTitle(section: DashboardSection, t: (key: string) => string) {
  const key = sectionTitleKeys[section.key];
  return key ? t(key) : section.title;
}

function attendanceStatusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    present: 'attendance.present',
    late: 'attendance.late',
    absent: 'attendance.absent',
  };
  return keys[status] ? t(keys[status]) : status;
}

function studentsCountLabel(count: string | undefined, t: (key: string) => string) {
  if (!count) return '';
  return t('teacher.studentsCount').replace(':count', count);
}

const SECTION_PAGE_SIZE = 5;

function SectionBlock({
  section,
  t,
  delay = 0,
  children,
}: {
  section: DashboardSection | undefined;
  t: (key: string) => string;
  delay?: number;
  children: (items: DashboardItem[]) => ReactNode;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [section?.key, section?.items.length]);

  if (!section) return null;

  const totalPages = Math.ceil(section.items.length / SECTION_PAGE_SIZE);
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pagedItems = section.items.slice(
    (safePage - 1) * SECTION_PAGE_SIZE,
    safePage * SECTION_PAGE_SIZE,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
    >
      <h3 className="mb-3 font-display font-semibold">{sectionTitle(section, t)}</h3>
      {section.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          {t('crud.noData')}
        </p>
      ) : (
        <>
          <div className="space-y-2">{children(pagedItems)}</div>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={section.items.length}
            perPage={SECTION_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </motion.div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'teacher'],
    queryFn: () => dashboardApi.getByRole('teacher'),
  });

  const stats: DashboardStat[] = data?.stats || [];
  const sectionByKey = (key: string) => data?.sections.find(s => s.key === key);

  const myClasses = sectionByKey('my_classes');
  const recentAttendance = sectionByKey('recent_attendance');
  const upcomingHomework = sectionByKey('upcoming_homework');
  const recentExams = sectionByKey('recent_exams');
  const recentQuizzes = sectionByKey('recent_quizzes');

  const skeletonStats = [
    { id: 'sections', title: t('stat.myClasses'), icon: BookOpen, variant: 'default' as const },
    { id: 'students', title: t('stat.totalStudentsSmall'), icon: Users, variant: 'students' as const },
    { id: 'attendance', title: t('stat.avgAttendance'), icon: CalendarCheck, variant: 'attendance' as const },
    { id: 'homework', title: t('stat.pendingHomework'), icon: ClipboardList, variant: 'exams' as const },
    { id: 'exams', title: t('stat.teacherExams'), icon: FileText, variant: 'exams' as const },
    { id: 'quizzes', title: t('stat.teacherQuizzes'), icon: Trophy, variant: 'exams' as const },
  ];

  return (
    <DashboardLayout>
      <div className="min-w-0 max-w-full overflow-x-hidden">
        <TeacherDashboardHero
          userName={user?.name}
          mainLinks={teacherMainLinks}
          linkGroups={teacherLinkGroups}
        />

        <div className="mb-6 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {isLoading
          ? skeletonStats.map((s, i) => (
              <DashboardStatCard
                key={s.id}
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
              const Icon = statIconById[s.id] ?? iconMap[s.icon as keyof typeof iconMap] ?? BookOpen;
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

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionBlock section={myClasses} t={t} delay={0.35}>
          {items =>
            items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    {/* {item.subtitle ? (
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    ) : null} */}
                  </div>
                </div>
                {item.meta ? (
                  <span className="shrink-0 text-xs text-muted-foreground sm:ps-12">
                    {studentsCountLabel(item.meta, t)}
                  </span>
                ) : null}
              </motion.div>
            ))
          }
        </SectionBlock>

        <SectionBlock section={recentAttendance} t={t} delay={0.4}>
          {items =>
            items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  {item.meta ? (
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  ) : null}
                </div>
                {item.status ? (
                  <StatusBadge
                    status={item.status}
                    label={attendanceStatusLabel(item.status, t)}
                  />
                ) : null}
              </motion.div>
            ))
          }
        </SectionBlock>

        <SectionBlock section={upcomingHomework} t={t} delay={0.45}>
          {items =>
            items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                </div>
                {item.meta ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
                ) : null}
              </motion.div>
            ))
          }
        </SectionBlock>

        <SectionBlock section={recentExams} t={t} delay={0.5}>
          {items =>
            items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                </div>
                {item.meta ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
                ) : null}
              </motion.div>
            ))
          }
        </SectionBlock>

        <SectionBlock section={recentQuizzes} t={t} delay={0.55}>
          {items =>
            items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  ) : null}
                </div>
                {item.meta ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
                ) : null}
              </motion.div>
            ))
          }
        </SectionBlock>
        </div>
      </div>
    </DashboardLayout>
  );
}
