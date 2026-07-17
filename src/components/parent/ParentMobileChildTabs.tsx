import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  ClipboardList,
  DollarSign,
  Trophy,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import type { ParentBootstrapPayload } from '@/services/endpoints/parent';

interface ParentMobileChildTabsProps {
  bootstrap?: ParentBootstrapPayload | null;
  loading?: boolean;
}

function sameId(a: string | number | undefined | null, b: string | number | undefined | null): boolean {
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

export default function ParentMobileChildTabs({ bootstrap, loading }: ParentMobileChildTabsProps) {
  const { t } = useLocale();
  const childRows = bootstrap?.children || [];

  const childTabs = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const child of childRows) {
      const id = String(child.id);
      if (!byId.has(id)) {
        byId.set(id, { id, name: child.name });
      }
    }
    return Array.from(byId.values());
  }, [childRows]);

  const defaultChildId = childTabs[0]?.id ?? '';
  const [activeChildId, setActiveChildId] = useState(defaultChildId);

  useEffect(() => {
    if (!childTabs.some(c => c.id === activeChildId)) {
      setActiveChildId(defaultChildId);
    }
  }, [activeChildId, childTabs, defaultChildId]);

  const selectedChildId = childTabs.some(c => c.id === activeChildId) ? activeChildId : defaultChildId;

  const childCenterRows = useMemo(
    () => childRows.filter(row => sameId(row.id, selectedChildId)),
    [childRows, selectedChildId],
  );

  const centerTabs = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const row of childCenterRows) {
      if (row.center_id == null) continue;
      const id = String(row.center_id);
      if (!byId.has(id)) {
        byId.set(id, { id, name: row.center_name || id });
      }
    }
    if (byId.size === 0 && (bootstrap?.centers?.length || 0) > 0) {
      for (const center of bootstrap?.centers || []) {
        byId.set(String(center.center_id), {
          id: String(center.center_id),
          name: center.center_name,
        });
      }
    }
    return Array.from(byId.values());
  }, [bootstrap?.centers, childCenterRows]);

  const defaultCenterId = centerTabs[0]?.id ?? '';
  const [activeCenterId, setActiveCenterId] = useState(defaultCenterId);

  useEffect(() => {
    if (!centerTabs.some(c => c.id === activeCenterId)) {
      setActiveCenterId(defaultCenterId);
    }
  }, [activeCenterId, centerTabs, defaultCenterId, selectedChildId]);

  const selectedCenterId = centerTabs.some(c => c.id === activeCenterId)
    ? activeCenterId
    : defaultCenterId;

  const activeChildProfile = useMemo(() => {
    if (selectedCenterId) {
      return childCenterRows.find(row => sameId(row.center_id, selectedCenterId)) || childCenterRows[0];
    }
    return childCenterRows[0];
  }, [childCenterRows, selectedCenterId]);

  const scoped = useMemo(() => {
    const matchChildCenter = <T extends { student_id?: number; center_id?: string | number }>(
      rows: T[] | undefined,
    ) =>
      (rows || []).filter(row => {
        if (!sameId(row.student_id, selectedChildId)) return false;
        if (centerTabs.length <= 1 && row.center_id == null) return true;
        if (!selectedCenterId) return true;
        return sameId(row.center_id, selectedCenterId);
      });

    const homework = matchChildCenter(bootstrap?.homework);
    const pendingHomework = homework.filter(
      h => !['submitted', 'graded', 'approved'].includes(h.status),
    );
    const exams = matchChildCenter(bootstrap?.exams).slice(0, 5);
    const quizzes = matchChildCenter(bootstrap?.quizzes).slice(0, 5);
    const fees = matchChildCenter(bootstrap?.fees);
    const unpaidFees = fees.filter(f => f.status === 'unpaid' || f.status === 'pending').slice(0, 5);
    const attendance = matchChildCenter(bootstrap?.attendance);
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate =
      attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;
    const report = (bootstrap?.reports || []).find(r => {
      if (!sameId(r.student_id, selectedChildId)) return false;
      if (centerTabs.length <= 1 && r.center_id == null) return true;
      if (!selectedCenterId) return true;
      return sameId(r.center_id, selectedCenterId);
    });

    return {
      pendingHomework: pendingHomework.slice(0, 5),
      pendingHomeworkCount: pendingHomework.length,
      exams,
      quizzes,
      unpaidFees,
      unpaidFeesTotal: unpaidFees.reduce((sum, f) => sum + (f.amount || 0), 0),
      attendanceRate: report?.attendance_rate ?? attendanceRate,
      examAverage: report?.exam_average ?? null,
      quizAverage: report?.quiz_average ?? null,
      pendingAmount: report?.pending_amount ?? unpaidFees.reduce((sum, f) => sum + (f.amount || 0), 0),
    };
  }, [bootstrap, centerTabs.length, selectedCenterId, selectedChildId]);

  if (loading) {
    return (
      <div className="mb-6 space-y-3 md:hidden">
        <div className="h-10 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-10 animate-pulse rounded-xl bg-muted/30" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
      </div>
    );
  }

  if (childTabs.length === 0) return null;

  const enrollment = activeChildProfile
    ? [activeChildProfile.grade, activeChildProfile.class, activeChildProfile.section]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div className="mb-6 space-y-4 md:hidden">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('stat.children')}
        </p>
        <Tabs value={selectedChildId} onValueChange={setActiveChildId} className="w-full">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
            {childTabs.map(child => (
              <TabsTrigger
                key={child.id}
                value={child.id}
                className="max-w-[11rem] shrink-0 truncate rounded-lg px-3 py-2 text-xs data-[state=active]:shadow-sm sm:text-sm"
              >
                {child.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {centerTabs.length > 1 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('student.myCenters')}
          </p>
          <Tabs value={selectedCenterId} onValueChange={setActiveCenterId} className="w-full">
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
              {centerTabs.map(center => (
                <TabsTrigger
                  key={center.id}
                  value={center.id}
                  className="max-w-[11rem] shrink-0 truncate rounded-lg px-3 py-2 text-xs data-[state=active]:shadow-sm sm:text-sm"
                >
                  {center.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      ) : centerTabs.length === 1 ? (
        <p className="text-xs text-muted-foreground">{centerTabs[0].name}</p>
      ) : null}

      {(enrollment || activeChildProfile?.name) ? (
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-card">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t('section.childrenOverview')}
          </p>
          {activeChildProfile?.name ? (
            <p className="text-sm font-medium">{activeChildProfile.name}</p>
          ) : null}
          {enrollment ? <p className="text-xs text-muted-foreground">{enrollment}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
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
          <ClipboardList className="h-3.5 w-3.5 text-primary" aria-hidden />
          <div>
            <p className="text-[10px] text-muted-foreground">{t('stat.pendingHomework')}</p>
            <p className="text-sm font-semibold tabular-nums">{scoped.pendingHomeworkCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-card">
          <Trophy className="h-3.5 w-3.5 text-warning" aria-hidden />
          <div>
            <p className="text-[10px] text-muted-foreground">{t('nav.exams')}</p>
            <p className="text-sm font-semibold tabular-nums">
              {scoped.examAverage != null ? scoped.examAverage : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 shadow-card">
          <DollarSign className="h-3.5 w-3.5 text-warning" aria-hidden />
          <div>
            <p className="text-[10px] text-muted-foreground">{t('stat.pendingFees')}</p>
            <p className="text-sm font-semibold tabular-nums">
              {scoped.pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title={t('stat.pendingHomework')} />
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
                    <p className="text-xs text-muted-foreground">{hw.due_date}</p>
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
          to="/parent/exams"
          viewAllLabel={t('student.viewAll')}
        />
        {scoped.exams.length === 0 ? (
          <SectionEmpty label={t('crud.noData')} />
        ) : (
          <div className="space-y-2">
            {scoped.exams.map(exam => (
              <div
                key={portalRowKey(exam.center_id, exam.id)}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{exam.grade || t('nav.exams')}</p>
                  <p className="text-xs text-muted-foreground">{exam.date}</p>
                </div>
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success tabular-nums">
                  {exam.degree != null ? exam.degree : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title={t('section.recentQuizzes')}
          to="/parent/quizzes"
          viewAllLabel={t('student.viewAll')}
        />
        {scoped.quizzes.length === 0 ? (
          <SectionEmpty label={t('crud.noData')} />
        ) : (
          <div className="space-y-2">
            {scoped.quizzes.map(quiz => (
              <div
                key={portalRowKey(quiz.center_id, quiz.id)}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{quiz.grade || t('nav.quizzes')}</p>
                  <p className="text-xs text-muted-foreground">{quiz.date}</p>
                </div>
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success tabular-nums">
                  {quiz.degree != null ? quiz.degree : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title={t('student.feesDue')}
          to="/parent/fees"
          viewAllLabel={t('student.viewAll')}
        />
        {scoped.unpaidFees.length === 0 ? (
          <SectionEmpty label={t('student.noFeesDue')} />
        ) : (
          <div className="space-y-2">
            {scoped.unpaidFees.map(fee => (
              <div
                key={portalRowKey(fee.center_id, fee.id)}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{fee.item}</p>
                  <p className="text-xs text-muted-foreground">{fee.due_date}</p>
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
    </div>
  );
}
