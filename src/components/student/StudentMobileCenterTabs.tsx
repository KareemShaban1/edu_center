import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  Trophy,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import { useLocale } from '@/contexts/LocaleContext';
import { portalRowKey } from '@/components/CenterLabel';
import type {
  StudentCenterSummary,
  StudentSelfBootstrapPayload,
} from '@/services/endpoints/student-self';

interface StudentMobileCenterTabsProps {
  centers: StudentCenterSummary[];
  bootstrap?: StudentSelfBootstrapPayload | null;
  loading?: boolean;
}

function sameCenterId(a: string | number | undefined, b: string | number | undefined): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function SectionEmpty({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-5 text-center text-xs text-muted-foreground">
      {label}
    </p>
  );
}

function SectionHeader({
  title,
  to,
  viewAllLabel,
}: {
  title: string;
  to?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      {to ? (
        <Link to={to} className="text-xs font-medium text-primary hover:underline">
          {viewAllLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default function StudentMobileCenterTabs({
  centers,
  bootstrap,
  loading,
}: StudentMobileCenterTabsProps) {
  const { t } = useLocale();
  const defaultCenterId = centers[0] ? String(centers[0].center_id) : '';
  const [activeCenterId, setActiveCenterId] = useState(defaultCenterId);

  const activeId = centers.some(c => String(c.center_id) === activeCenterId)
    ? activeCenterId
    : defaultCenterId;

  const activeCenter = useMemo(
    () => centers.find(c => String(c.center_id) === activeId) || centers[0],
    [activeId, centers],
  );

  const scoped = useMemo(() => {
    const match = <T extends { center_id?: string | number }>(rows: T[] | undefined) =>
      (rows || []).filter(row => {
        if (centers.length <= 1 && row.center_id == null) return true;
        return sameCenterId(row.center_id, activeId);
      });

    const homework = match(bootstrap?.homework);
    const pendingHomework = homework.filter(
      h => h.status !== 'submitted' && h.status !== 'graded' && h.status !== 'approved',
    );
    const grades = match(bootstrap?.grades);
    const exams = grades.filter(g => g.source === 'exam').slice(0, 5);
    const quizzes = grades.filter(g => g.source === 'quiz').slice(0, 5);
    const announcements = match(bootstrap?.announcements).slice(0, 5);
    const fees = match(bootstrap?.fees);
    const unpaidFees = fees.filter(f => f.status === 'unpaid' || f.status === 'pending').slice(0, 5);
    const attendance = match(bootstrap?.attendance);
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate =
      attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;
    const scored = grades.filter(g => typeof g.score === 'number');
    const gpa =
      scored.length > 0
        ? (scored.reduce((sum, g) => sum + (g.score || 0), 0) / scored.length).toFixed(1)
        : null;

    return {
      pendingHomework: pendingHomework.slice(0, 5),
      exams,
      quizzes,
      announcements,
      unpaidFees,
      sessionsCount: match(bootstrap?.sessions).length,
      attendanceRate,
      gpa,
      pendingHomeworkCount: pendingHomework.length,
      unpaidFeesTotal: unpaidFees.reduce((sum, f) => sum + (f.amount || 0), 0),
    };
  }, [activeId, bootstrap, centers.length]);

  if (loading) {
    return (
      <div className="mb-6 space-y-3 md:hidden">
        <div className="h-10 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-24 animate-pulse rounded-xl bg-muted/30" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
      </div>
    );
  }

  if (centers.length === 0) return null;

  const enrollment = [
    activeCenter?.profile?.grade_name,
    activeCenter?.profile?.class_name,
    activeCenter?.profile?.section_name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="mb-6 md:hidden">
      <h2 className="mb-3 font-display text-lg font-semibold">{t('student.myCenters')}</h2>

      <Tabs value={activeId} onValueChange={setActiveCenterId} className="w-full">
        <TabsList className="mb-4 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
          {centers.map(center => (
            <TabsTrigger
              key={String(center.center_id)}
              value={String(center.center_id)}
              className="max-w-[11rem] shrink-0 truncate rounded-lg px-3 py-2 text-xs data-[state=active]:shadow-sm sm:text-sm"
            >
              {center.center_name}
            </TabsTrigger>
          ))}
        </TabsList>

        {centers.map(center => (
          <TabsContent
            key={String(center.center_id)}
            value={String(center.center_id)}
            className="mt-0 space-y-4 focus-visible:ring-0"
          >
            {(enrollment || activeCenter?.profile?.name) && String(center.center_id) === activeId ? (
              <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-card">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('student.enrollment')}
                </p>
                {activeCenter?.profile?.name ? (
                  <p className="text-sm font-medium">{activeCenter.profile.name}</p>
                ) : null}
                {enrollment ? (
                  <p className="text-xs text-muted-foreground">{enrollment}</p>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-card">
                <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('nav.mySessions')}</p>
                  <p className="text-sm font-semibold tabular-nums">{scoped.sessionsCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-card">
                <CalendarCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('stat.attendanceRate')}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {scoped.attendanceRate != null ? `${scoped.attendanceRate}%` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-card">
                <Trophy className="h-3.5 w-3.5 text-warning" aria-hidden />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('stat.gpa')}</p>
                  <p className="text-sm font-semibold tabular-nums">{scoped.gpa ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-card">
                <ClipboardList className="h-3.5 w-3.5 text-primary" aria-hidden />
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('stat.pendingHomework')}</p>
                  <p className="text-sm font-semibold tabular-nums">{scoped.pendingHomeworkCount}</p>
                </div>
              </div>
            </div>

            <section>
              <SectionHeader title={t('nav.announcements')} />
              {scoped.announcements.length === 0 ? (
                <SectionEmpty label={t('crud.noData')} />
              ) : (
                <div className="space-y-2">
                  {scoped.announcements.map(item => (
                    <div
                      key={portalRowKey(item.center_id, item.id)}
                      className="rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="mb-1 flex items-start gap-2">
                        <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium leading-snug">{item.title}</h4>
                          {item.content ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {item.content}
                            </p>
                          ) : null}
                          {item.created_at || item.time ? (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {item.time || item.created_at}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader
                title={t('stat.pendingHomework')}
                to="/student/homework"
                viewAllLabel={t('student.viewAll')}
              />
              {scoped.pendingHomework.length === 0 ? (
                <SectionEmpty label={t('crud.noData')} />
              ) : (
                <div className="space-y-2">
                  {scoped.pendingHomework.map(hw => (
                    <div
                      key={portalRowKey(hw.center_id, hw.id)}
                      className="rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium">{hw.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {[hw.subject, hw.due_date].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <StatusBadge
                          status={hw.status}
                          label={t(`homework.status.${hw.status}`) || hw.status}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader
                title={t('section.recentExams')}
                to="/student/grades"
                viewAllLabel={t('student.viewAll')}
              />
              {scoped.exams.length === 0 ? (
                <SectionEmpty label={t('crud.noData')} />
              ) : (
                <div className="space-y-2">
                  {scoped.exams.map(g => (
                    <div
                      key={portalRowKey(g.center_id, `exam-${g.id}`)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{g.subject || t('nav.exams')}</p>
                        <p className="text-xs text-muted-foreground">{g.date}</p>
                      </div>
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success tabular-nums">
                        {g.score != null ? `${g.score}/${g.total}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader
                title={t('section.recentQuizzes')}
                to="/student/grades"
                viewAllLabel={t('student.viewAll')}
              />
              {scoped.quizzes.length === 0 ? (
                <SectionEmpty label={t('crud.noData')} />
              ) : (
                <div className="space-y-2">
                  {scoped.quizzes.map(g => (
                    <div
                      key={portalRowKey(g.center_id, `quiz-${g.id}`)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{g.subject || t('nav.quizzes')}</p>
                        <p className="text-xs text-muted-foreground">{g.date}</p>
                      </div>
                      <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success tabular-nums">
                        {g.score != null ? `${g.score}/${g.total}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader title={t('student.feesDue')} />
              {scoped.unpaidFees.length === 0 ? (
                <SectionEmpty label={t('student.noFeesDue')} />
              ) : (
                <div className="space-y-2">
                  {scoped.unpaidFees.map(fee => (
                    <div
                      key={portalRowKey(fee.center_id, fee.id)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{fee.item}</p>
                          <p className="text-xs text-muted-foreground">{fee.due_date}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-sm font-semibold tabular-nums">
                          {fee.amount.toLocaleString()}
                        </p>
                        <StatusBadge
                          status={fee.status}
                          label={t(`payments.status.${fee.status}`) || fee.status}
                        />
                      </div>
                    </div>
                  ))}
                  {scoped.unpaidFeesTotal > 0 ? (
                    <p className="px-1 text-xs text-muted-foreground">
                      {t('stat.pendingFees')}:{' '}
                      <span className="font-semibold text-foreground tabular-nums">
                        {scoped.unpaidFeesTotal.toLocaleString()}
                      </span>
                    </p>
                  ) : null}
                </div>
              )}
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
