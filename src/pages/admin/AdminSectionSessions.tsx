import { useMemo } from 'react';

import { Link, useParams } from 'react-router-dom';

import {

  ArrowLeft,

  BookOpen,

  CalendarClock,

  ClipboardList,

  GraduationCap,

  MapPin,

  Users,

} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

import DashboardLayout from '@/components/DashboardLayout';
import ResponsiveDataTable, {
  stickyBodyCell,
  stickyHeadCell,
  tableBodyCell,
  tableHeadCell,
} from '@/components/ResponsiveDataTable';
import StatusBadge from '@/components/StatusBadge';

import SessionLinkedEntryPanel from '@/components/admin/SessionLinkedEntryPanel';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {

  Accordion,

  AccordionContent,

  AccordionItem,

  AccordionTrigger,

} from '@/components/ui/accordion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useLocale } from '@/contexts/LocaleContext';

import { cn } from '@/lib/utils';

import {

  adminSessionsApi,

  type SectionSessionOverview,

  type SessionAssessmentRecord,

  type SessionLinkedRecord,

} from '@/services/endpoints/admin-sessions';



function sessionTypeLabel(type: string, t: (key: string) => string) {
  if (type === 'offline' || type === 'online' || type === 'exam' || type === 'others') {
    return t(`session.type.${type}`);
  }
  return type;
}

function attendanceStatusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    present: 'attendance.present',
    late: 'attendance.late',
    absent: 'attendance.absent',
  };
  return keys[status] ? t(keys[status]) : status;
}



function formatSessionDateTime(startAt: string): string {

  const raw = String(startAt || '').trim();

  if (!raw) return '—';

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString(undefined, {

    weekday: 'short',

    year: 'numeric',

    month: 'short',

    day: 'numeric',

    hour: '2-digit',

    minute: '2-digit',

  });

}



function SessionStatBadges({

  session,

  t,

}: {

  session: SectionSessionOverview;

  t: (key: string) => string;

}) {

  return (

    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">

      <Badge variant="secondary" className="text-[11px] sm:text-xs">

        {sessionTypeLabel(session.session_type, t)}

      </Badge>

      <Badge variant="outline" className="gap-1 text-[11px] tabular-nums sm:text-xs">

        <CalendarClock className="h-3 w-3" />

        {session.duration}m

      </Badge>

      {session.attendance.total > 0 ? (

        <Badge variant="outline" className="gap-1 text-[11px] tabular-nums sm:text-xs">

          <Users className="h-3 w-3" />

          <span className="hidden sm:inline">{t('nav.attendance')}</span>

          {session.attendance.total}

        </Badge>

      ) : null}

      {session.exams.total > 0 ? (

        <Badge variant="outline" className="gap-1 text-[11px] tabular-nums sm:text-xs">

          <GraduationCap className="h-3 w-3" />

          <span className="hidden sm:inline">{t('nav.exams')}</span>

          {session.exams.total}

        </Badge>

      ) : null}

      {session.quizzes.total > 0 ? (

        <Badge variant="outline" className="gap-1 text-[11px] tabular-nums sm:text-xs">

          <ClipboardList className="h-3 w-3" />

          <span className="hidden sm:inline">{t('nav.quizzes')}</span>

          {session.quizzes.total}

        </Badge>

      ) : null}

    </div>

  );

}



function RecordsTable({

  rows,

  showDegree,

  t,

}: {

  rows: SessionLinkedRecord[] | SessionAssessmentRecord[];

  showDegree?: boolean;

  t: (key: string) => string;

}) {

  if (rows.length === 0) {

    return <p className="text-sm text-muted-foreground py-2">{t('crud.noData')}</p>;

  }



  return (

    <>

      <div className="space-y-2 md:hidden">

        {rows.map(row => (

          <div

            key={`${row.student_id}-${row.date}`}

            className="rounded-lg border border-border bg-card p-3 shadow-sm"

          >

            <div className="mb-2 flex items-start justify-between gap-2">

              <p className="min-w-0 font-medium leading-snug">

                {row.student_name || `#${row.student_id}`}

              </p>

              <StatusBadge status={row.status} label={attendanceStatusLabel(row.status, t)} />

            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">

              <span>

                {t('col.date')}: <span className="text-foreground">{row.date || '—'}</span>

              </span>

              {showDegree ? (

                <span>

                  {t('col.degree')}:{' '}

                  <span className="font-medium text-foreground tabular-nums">

                    {'degree' in row ? row.degree || '—' : '—'}

                  </span>

                </span>

              ) : null}

            </div>

            {row.notes ? (

              <p className="mt-2 text-xs text-muted-foreground">{row.notes}</p>

            ) : null}

          </div>

        ))}

      </div>



      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">

        <table className="w-full min-w-[520px] text-sm">

          <thead className="bg-muted/40 text-muted-foreground">

            <tr>

              <th className="px-3 py-2.5 text-start font-medium">{t('col.student')}</th>

              <th className="px-3 py-2.5 text-start font-medium">{t('col.date')}</th>

              <th className="px-3 py-2.5 text-start font-medium">{t('col.status')}</th>

              {showDegree ? (

                <th className="px-3 py-2.5 text-start font-medium">{t('col.degree')}</th>

              ) : null}

              <th className="px-3 py-2.5 text-start font-medium">{t('col.notes')}</th>

            </tr>

          </thead>

          <tbody className="divide-y divide-border">

            {rows.map(row => (

              <tr key={`${row.student_id}-${row.date}`} className="hover:bg-muted/20">

                <td className="px-3 py-2.5">{row.student_name || `#${row.student_id}`}</td>

                <td className="px-3 py-2.5 whitespace-nowrap">{row.date || '—'}</td>

                <td className="px-3 py-2.5">

                  <StatusBadge status={row.status} label={attendanceStatusLabel(row.status, t)} />

                </td>

                {showDegree ? (

                  <td className="px-3 py-2.5 tabular-nums">

                    {'degree' in row ? row.degree || '—' : '—'}

                  </td>

                ) : null}

                <td className="px-3 py-2.5 text-muted-foreground">{row.notes || '—'}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </>

  );

}



function LinkedRecordsPanel({

  session,

  t,

}: {

  session: SectionSessionOverview;

  t: (key: string) => string;

}) {

  const defaultTab =

    session.attendance.total > 0

      ? 'attendance'

      : session.exams.total > 0

        ? 'exams'

        : 'quizzes';



  return (

    <Tabs defaultValue={defaultTab} dir="rtl" className="w-full flex flex-col justify-start">

      <TabsList className="mb-3 grid flex-row justify-start h-auto w-full grid-cols-3 gap-1 p-1 sm:inline-flex sm:w-auto">

        <TabsTrigger value="attendance" className="gap-1 px-2 py-2 text-xs sm:px-3 sm:text-sm">

          <Users className="h-3.5 w-3.5 shrink-0" />

          <span>{t('nav.attendance')}</span>

          {session.attendance.total > 0 ? (

            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{session.attendance.total}</span>

          ) : null}

        </TabsTrigger>

        <TabsTrigger value="exams" className="gap-1 px-2 py-2 text-xs sm:px-3 sm:text-sm">

          <GraduationCap className="h-3.5 w-3.5 shrink-0" />

          <span>{t('nav.exams')}</span>

          {session.exams.total > 0 ? (

            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{session.exams.total}</span>

          ) : null}

        </TabsTrigger>

        <TabsTrigger value="quizzes" className="gap-1 px-2 py-2 text-xs sm:px-3 sm:text-sm">

          <ClipboardList className="h-3.5 w-3.5 shrink-0" />

          <span>{t('nav.quizzes')}</span>

          {session.quizzes.total > 0 ? (

            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{session.quizzes.total}</span>

          ) : null}

        </TabsTrigger>

      </TabsList>



      <TabsContent value="attendance" className="mt-0 space-y-3">

        {session.attendance.total > 0 ? (

          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted-foreground">

            <StatusBadge status="present" label={t('attendance.present')} />

            <span className="tabular-nums">{session.attendance.present ?? 0}</span>

            <StatusBadge status="absent" label={t('attendance.absent')} />

            <span className="tabular-nums">{session.attendance.absent ?? 0}</span>

            <StatusBadge status="late" label={t('attendance.late')} />

            <span className="tabular-nums">{session.attendance.late ?? 0}</span>

          </div>

        ) : null}

        <RecordsTable rows={session.attendance.records} t={t} />

      </TabsContent>

      <TabsContent value="exams" className="mt-0">

        <RecordsTable rows={session.exams.records} showDegree t={t} />

      </TabsContent>

      <TabsContent value="quizzes" className="mt-0">

        <RecordsTable rows={session.quizzes.records} showDegree t={t} />

      </TabsContent>

    </Tabs>

  );

}



function SessionPanel({

  session,

  sectionId,

  t,

}: {

  session: SectionSessionOverview;

  sectionId: number;

  t: (key: string) => string;

}) {

  const hasLinkedData =

    session.attendance.total > 0 || session.exams.total > 0 || session.quizzes.total > 0;

  const hasMeta = Boolean(session.provider || session.location || session.created_by);



  return (

    <AccordionItem value={String(session.id)} className="border-border/80">

      <AccordionTrigger className="px-3 py-3 hover:no-underline sm:px-4">

        <div className="flex w-full flex-1 flex-col gap-2 pe-2 text-start sm:flex-row sm:items-center sm:justify-between sm:pe-4">

          <div className="min-w-0 space-y-1">

            <p className="font-medium leading-snug">{session.topic}</p>

            <p className="text-xs text-muted-foreground">{formatSessionDateTime(session.start_at)}</p>

          </div>

          <SessionStatBadges session={session} t={t} />

        </div>

      </AccordionTrigger>

      <AccordionContent className="px-3 pb-4 sm:px-4">

        {hasMeta ? (

          <div className="mb-4 grid gap-2 rounded-lg border border-border/60 bg-muted/15 p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">

            {session.provider ? (

              <p className="min-w-0 break-words">

                <span className="text-muted-foreground">{t('page.sectionSessions.provider')}:</span>{' '}

                {session.provider}

              </p>

            ) : null}

            {session.location ? (

              <p className="flex min-w-0 items-start gap-1.5 break-words">

                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                {session.location}

              </p>

            ) : null}

            {session.created_by ? (

              <p className="min-w-0 break-words">

                <span className="text-muted-foreground">{t('col.teacher')}:</span> {session.created_by}

              </p>

            ) : null}

          </div>

        ) : null}



        <section className="mb-5">

          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">

            <BookOpen className="h-4 w-4 text-primary" />

            {t('page.sectionSessions.takeRecords')}

          </h3>

          <SessionLinkedEntryPanel sectionId={sectionId} session={session} />

        </section>



        {hasLinkedData ? (

          <section className="border-t border-border pt-4">

            <h3 className="mb-3 text-sm font-semibold">{t('page.sectionSessions.linkedRecords')}</h3>

            <LinkedRecordsPanel session={session} t={t} />

          </section>

        ) : (

          <p className="rounded-lg border border-dashed border-border bg-muted/15 px-4 py-5 text-center text-sm text-muted-foreground">

            {t('page.sectionSessions.noLinkedData')}

          </p>

        )}

      </AccordionContent>

    </AccordionItem>

  );

}



function StatCard({

  icon: Icon,

  value,

  label,

  iconClassName,

}: {

  icon: typeof CalendarClock;

  value: number;

  label: string;

  iconClassName?: string;

}) {

  return (

    <Card className="border-border/80 shadow-card">

      <CardContent className="flex items-center gap-3 p-3 sm:p-4">

        <div

          className={cn(

            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',

            iconClassName || 'bg-muted',

          )}

        >

          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconClassName ? 'text-primary' : 'text-muted-foreground')} />

        </div>

        <div className="min-w-0">

          <p className="font-display text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>

          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{label}</p>

        </div>

      </CardContent>

    </Card>

  );

}



export default function AdminSectionSessions() {

  const { sectionId } = useParams();

  const { t } = useLocale();

  const id = Number(sectionId);



  const { data, isLoading } = useQuery({

    queryKey: ['admin-section-sessions', id],

    queryFn: () => adminSessionsApi.getSectionOverview(id),

    enabled: Boolean(sectionId) && !Number.isNaN(id),

  });



  const section = data?.section;

  const sessions = data?.sessions || [];



  const defaultExpanded = useMemo(

    () => (sessions.length > 0 ? [String(sessions[0].id)] : []),

    [sessions],

  );



  const withAttendance = sessions.filter(s => s.attendance.total > 0).length;

  const withGrades = sessions.filter(s => s.exams.total > 0 || s.quizzes.total > 0).length;



  if (!sectionId || Number.isNaN(id)) {

    return (

      <DashboardLayout>

        <p className="text-muted-foreground">{t('crud.noData')}</p>

      </DashboardLayout>

    );

  }



  return (

    <DashboardLayout>

      <div className="page-header mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex min-w-0 items-start gap-2 sm:gap-3">

          <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">

            <Link to="/admin/sections" aria-label={t('misc.back')}>

              <ArrowLeft className="h-4 w-4" />

            </Link>

          </Button>

          <div className="min-w-0">

            <h1 className="page-title text-xl sm:text-2xl">{t('page.sectionSessions.title')}</h1>

            {section ? (

              <p className="mt-0.5 text-sm text-muted-foreground break-words">

                {section.grade_name} — {section.class_name} — {section.name}

              </p>

            ) : null}

            <p className="mt-1 text-xs text-muted-foreground">{t('page.sectionSessions.desc')}</p>

          </div>

        </div>

        <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">

          <Link to="/admin/sessions">{t('nav.adminSessions')}</Link>

        </Button>

      </div>



      <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-3">

        <StatCard

          icon={CalendarClock}

          value={sessions.length}

          label={t('page.sectionSessions.statSessions')}

          iconClassName="bg-primary/10"

        />

        <StatCard icon={Users} value={withAttendance} label={t('page.sectionSessions.statWithAttendance')} />

        <div className="col-span-2 sm:col-span-1">

          <StatCard icon={GraduationCap} value={withGrades} label={t('page.sectionSessions.statWithGrades')} />

        </div>

      </div>



      <Card className="border-border/80 shadow-card overflow-hidden">

        <CardHeader className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">

          <CardTitle className="text-sm sm:text-base">{t('page.sectionSessions.listTitle')}</CardTitle>

        </CardHeader>

        <CardContent className="p-0">

          {isLoading ? (

            <div className="space-y-3 p-4 sm:p-6">

              {[1, 2, 3].map(i => (

                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/60" />

              ))}

            </div>

          ) : sessions.length === 0 ? (

            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center sm:px-6">

              <CalendarClock className="h-10 w-10 text-muted-foreground/50" />

              <p className="text-sm text-muted-foreground">{t('page.sectionSessions.empty')}</p>

              <Button asChild variant="outline" size="sm">

                <Link to="/admin/sessions">{t('nav.adminSessions')}</Link>

              </Button>

            </div>

          ) : (

            <Accordion type="multiple" defaultValue={defaultExpanded} className="w-full">

              {sessions.map(session => (

                <SessionPanel key={session.id} session={session} sectionId={id} t={t} />

              ))}

            </Accordion>

          )}

        </CardContent>

      </Card>

    </DashboardLayout>

  );

}

