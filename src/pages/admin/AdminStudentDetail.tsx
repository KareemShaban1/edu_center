import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  FileText,
  Megaphone,
  Video,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import { adminStudentsApi } from '@/services/endpoints/admin-students';

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map(h => (
              <th key={h} className="px-4 py-2 text-start font-medium text-muted-foreground whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function AdminStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const { t } = useLocale();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-student-details', studentId],
    queryFn: () => adminStudentsApi.getDetails(studentId),
    enabled: Number.isFinite(studentId) && studentId > 0,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/admin/students">
              <ArrowLeft className="h-4 w-4" />
              {t('nav.students')}
            </Link>
          </Button>
          <p className="text-destructive">
            {error instanceof Error ? error.message : t('crud.noData')}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const { student, parent, summary } = data;
  const noData = t('crud.noData');

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <Link to="/admin/students" aria-label={t('nav.students')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="page-title truncate">{student.name}</h1>
            <p className="text-sm text-muted-foreground">
              {student.code}
              {student.email ? ` · ${student.email}` : ''}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[student.grade_name, student.class_name, student.section_name].filter(Boolean).join(' — ')}
            </p>
          </div>
        </div>
        <StatusBadge status={student.status} label={t(`status.${student.status}`)} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={`${t('nav.attendance')} (${summary.attendance_present}/${summary.attendance_total})`}
          value={`${summary.attendance_rate}%`}
          icon={CalendarCheck}
          variant="attendance"
        />
        <StatCard
          title={`${t('nav.exams')} (${summary.exams_count})`}
          value={summary.exams_avg != null ? String(summary.exams_avg) : '—'}
          icon={ClipboardList}
          variant="exams"
        />
        <StatCard
          title={`${t('nav.payments')} (${summary.payments_unpaid} ${t('payments.unpaid').toLowerCase()})`}
          value={`$${summary.payments_paid_amount.toLocaleString()}`}
          icon={DollarSign}
          variant="finance"
        />
        <StatCard
          title={t('nav.homework')}
          value={`${summary.homework_submitted}/${summary.homework_total}`}
          icon={BookOpen}
        />
      </div>

      <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('col.gender')}</p>
          <p className="mt-1 capitalize">{t(`gender.${student.gender}`) || student.gender}</p>
        </div>
        {student.phone ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('col.phone')}</p>
            <p className="mt-1">{student.phone}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('col.parent')}</p>
          <p className="mt-1">{parent?.name || '—'}</p>
          {parent?.email ? <p className="text-sm text-muted-foreground">{parent.email}</p> : null}
        </div>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="attendance" className="gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            {t('nav.attendance')}
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            {t('nav.exams')}
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            {t('nav.quizzes')}
          </TabsTrigger>
          <TabsTrigger value="homework" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {t('nav.homework')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            {t('nav.payments')}
          </TabsTrigger>
          <TabsTrigger value="certifications" className="gap-1.5">
            <Award className="h-3.5 w-3.5" />
            {t('nav.certifications')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            {t('nav.notifications')}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="h-3.5 w-3.5" />
            {t('nav.announcements')}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {t('nav.group.sessions')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <DataTable headers={[t('col.date'), t('col.status'), t('col.notes')]}>
            {data.attendance.length === 0 ? (
              <EmptyRow colSpan={3} label={noData} />
            ) : (
              data.attendance.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3 capitalize">{t(`status.${row.status}`) || row.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.notes || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="exams">
          <DataTable headers={[t('col.date'), t('col.score'), t('col.status'), t('col.notes')]}>
            {data.exams.length === 0 ? (
              <EmptyRow colSpan={4} label={noData} />
            ) : (
              data.exams.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">
                    {row.score != null ? `${row.score}/${row.total}` : '—'}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {t(`status.${row.attendance_status}`) || row.attendance_status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.notes || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="quizzes">
          <DataTable headers={[t('col.date'), t('col.score'), t('col.status'), t('col.notes')]}>
            {data.quizzes.length === 0 ? (
              <EmptyRow colSpan={4} label={noData} />
            ) : (
              data.quizzes.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">
                    {row.score != null ? `${row.score}/${row.total}` : '—'}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {t(`status.${row.attendance_status}`) || row.attendance_status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.notes || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="homework">
          <DataTable headers={[t('col.title'), t('col.dueDate'), t('col.status'), t('col.degree'), t('col.attachments')]}>
            {data.homework.length === 0 ? (
              <EmptyRow colSpan={5} label={noData} />
            ) : (
              data.homework.map(row => (
                <tr key={String(row.id)} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3">{row.due_date}</td>
                  <td className="px-4 py-3 capitalize">{row.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{row.grade ?? '—'}</td>
                  <td className="px-4 py-3">
                    {row.file_url ? (
                      <a href={row.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <FileText className="h-3.5 w-3.5" />
                        {row.file_name || 'File'}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="payments">
          <DataTable headers={[t('col.title'), t('col.month'), t('col.amount'), t('col.status'), t('col.date')]}>
            {data.payments.length === 0 ? (
              <EmptyRow colSpan={5} label={noData} />
            ) : (
              data.payments.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.item}</td>
                  <td className="px-4 py-3">{row.month || '—'}</td>
                  <td className="px-4 py-3">{row.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">
                    {row.status === 'paid' || row.status === 'unpaid'
                      ? t(`payments.${row.status}`)
                      : row.status}
                  </td>
                  <td className="px-4 py-3">{row.due_date || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="certifications">
          <DataTable headers={[t('col.title'), t('col.type'), t('col.date')]}>
            {data.certifications.length === 0 ? (
              <EmptyRow colSpan={3} label={noData} />
            ) : (
              data.certifications.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3 capitalize">{row.context}</td>
                  <td className="px-4 py-3">{row.issued_at || row.context_date || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="notifications">
          <DataTable headers={[t('col.title'), t('col.type'), t('col.status'), t('col.date')]}>
            {data.notifications.length === 0 ? (
              <EmptyRow colSpan={4} label={noData} />
            ) : (
              data.notifications.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.title || row.type}</p>
                    {row.body ? <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{row.body}</p> : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.channel_type}</td>
                  <td className="px-4 py-3">{row.read_at ? 'Read' : 'Unread'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="announcements">
          <DataTable headers={[t('col.title'), t('col.type'), t('col.date')]}>
            {data.announcements.length === 0 ? (
              <EmptyRow colSpan={3} label={noData} />
            ) : (
              data.announcements.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.title}</p>
                    {row.content ? <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{row.content}</p> : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.type}</td>
                  <td className="px-4 py-3">{row.created_at || row.time || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>

        <TabsContent value="sessions">
          <DataTable headers={[t('col.title'), t('col.teacher'), t('col.date'), t('col.durationMinutes')]}>
            {data.sessions.length === 0 ? (
              <EmptyRow colSpan={4} label={noData} />
            ) : (
              data.sessions.map(row => (
                <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">{row.topic || '—'}</td>
                  <td className="px-4 py-3">{row.teacher || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.start_at ? new Date(row.start_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">{row.duration || '—'}</td>
                </tr>
              ))
            )}
          </DataTable>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
