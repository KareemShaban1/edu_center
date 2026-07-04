import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ResponsiveDataTable, {
  stickyBodyCell,
  stickyHeadCell,
  tableBodyCell,
  tableHeadCell,
} from '@/components/ResponsiveDataTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  adminAttendanceApi,
  type AttendanceStatus,
} from '@/services/endpoints/admin-attendance';
import { adminAssessmentsApi } from '@/services/endpoints/admin-assessments';
import type { SectionSessionOverview } from '@/services/endpoints/admin-sessions';

type AttendanceRow = {
  student_id: number;
  student_name: string;
  status: AttendanceStatus;
  notes: string;
};

type AssessmentRow = {
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  degree: string;
  notes: string;
};

type EntryRow = {
  student_id: number;
  student_name: string;
  status: string;
  degree?: string;
  notes: string;
};

export function sessionDateFromStartAt(startAt: string): string {
  const raw = String(startAt || '').trim();
  if (!raw) return new Date().toISOString().split('T')[0];
  return raw.slice(0, 10);
}

function StatusToggle({
  value,
  onChange,
  t,
  className,
}: {
  value: string;
  onChange: (status: string) => void;
  t: (key: string) => string;
  className?: string;
}) {
  const options = [
    {
      key: 'present',
      label: t('attendance.present'),
      mobile: '✓',
      active: 'bg-success text-success-foreground shadow-sm ring-1 ring-success/30',
      inactive: 'bg-success/12 text-success hover:bg-success/20',
    },
    {
      key: 'absent',
      label: t('attendance.absent'),
      mobile: '✗',
      active: 'bg-destructive text-destructive-foreground shadow-sm ring-1 ring-destructive/30',
      inactive: 'bg-destructive/12 text-destructive hover:bg-destructive/20',
    },
    {
      key: 'late',
      label: t('attendance.late'),
      mobile: '◔',
      active: 'bg-warning text-warning-foreground shadow-sm ring-1 ring-warning/30',
      inactive: 'bg-warning/12 text-warning hover:bg-warning/20',
    },
  ] as const;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/20 p-0.5',
        className,
      )}
      role="group"
      aria-label={t('col.status')}
    >
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          title={opt.label}
          onClick={() => onChange(opt.key)}
          className={cn(
            'flex h-6 min-w-6 flex-1 items-center justify-center rounded px-1 text-[10px] font-semibold leading-none transition-all sm:h-7 sm:min-w-[4.5rem] sm:flex-none sm:px-2 sm:text-[11px]',
            value === opt.key ? opt.active : opt.inactive,
          )}
        >
          <span className="sm:hidden" aria-hidden>
            {opt.mobile}
          </span>
          <span className="hidden sm:inline">{opt.label}</span>
          <span className="sr-only sm:hidden">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function FormToolbar({
  onMarkAll,
  onSave,
  saveLabel,
  saving,
  canSave,
  t,
}: {
  onMarkAll: (status: AttendanceStatus) => void;
  onSave: () => void;
  saveLabel: string;
  saving: boolean;
  canSave: boolean;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs sm:h-8 sm:text-sm"
            onClick={() => onMarkAll('present')}
          >
            <span className="sm:hidden">✓</span>
            <span className="hidden sm:inline">✓ {t('attendance.markAllPresent')}</span>
            <span className="sr-only sm:hidden">{t('attendance.markAllPresent')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs sm:h-8 sm:text-sm"
            onClick={() => onMarkAll('absent')}
          >
            <span className="sm:hidden">✗</span>
            <span className="hidden sm:inline">✗ {t('attendance.markAllAbsent')}</span>
            <span className="sr-only sm:hidden">{t('attendance.markAllAbsent')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs sm:h-8 sm:text-sm"
            onClick={() => onMarkAll('late')}
          >
            <span className="sm:hidden">◔</span>
            <span className="hidden sm:inline">◔ {t('attendance.markAllLate')}</span>
            <span className="sr-only sm:hidden">{t('attendance.markAllLate')}</span>
          </Button>
        </div>
        {canSave ? (
          <Button
            size="sm"
            className="hidden h-9 gap-1.5 sm:ms-auto sm:inline-flex sm:h-8"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="h-3.5 w-3.5" />
            {saveLabel}
          </Button>
        ) : null}
      </div>
      {canSave ? (
        <div className="sticky bottom-0 z-10 -mx-3 border-t border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
          <Button className="h-11 w-full gap-2" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saveLabel}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function EntryList({
  rows,
  t,
  showDegree,
  degreeLabel,
  onStatusChange,
  onDegreeChange,
  onNotesChange,
}: {
  rows: EntryRow[];
  t: (key: string) => string;
  showDegree: boolean;
  degreeLabel?: string;
  onStatusChange: (studentId: number, status: string) => void;
  onDegreeChange: (studentId: number, degree: string) => void;
  onNotesChange: (studentId: number, notes: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {t('crud.noData')}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2 md:hidden">
        {rows.map((row, idx) => (
          <div key={row.student_id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">#{idx + 1}</p>
                <p className="font-medium leading-snug">{row.student_name}</p>
              </div>
              {showDegree ? (
                <div className="shrink-0 text-end">
                  <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                    {degreeLabel || t('col.degree')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    inputMode="numeric"
                    placeholder="0"
                    value={row.degree || ''}
                    onChange={e => onDegreeChange(row.student_id, e.target.value)}
                    className="w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ) : null}
            </div>
            <div className="mb-2.5">
              <p className="mb-1 text-[10px] font-medium text-muted-foreground">{t('col.status')}</p>
              <StatusToggle
                value={row.status}
                onChange={status => onStatusChange(row.student_id, status)}
                t={t}
                className="flex w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                {t('col.notes')}
              </label>
              <input
                type="text"
                placeholder={t('attendance.notesPlaceholder')}
                value={row.notes}
                onChange={e => onNotesChange(row.student_id, e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        ))}
      </div>

      <ResponsiveDataTable minWidth={showDegree ? 460 : 380} className="hidden md:block">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className={cn(stickyHeadCell, 'start-0 w-8 text-start')}>#</th>
            <th className={cn(stickyHeadCell, 'start-8 min-w-[7rem] text-start shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)] sm:min-w-[9rem]')}>
              {t('col.student')}
            </th>
            <th className={cn(tableHeadCell, 'min-w-[5.5rem] text-center')}>{t('col.status')}</th>
            {showDegree ? (
              <th className={cn(tableHeadCell, 'w-16 text-center')}>{degreeLabel || t('col.degree')}</th>
            ) : null}
            <th className={cn(tableHeadCell, 'min-w-[7rem] text-start')}>{t('col.notes')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, idx) => (
            <tr key={row.student_id} className="hover:bg-muted/20">
              <td className={cn(stickyBodyCell, 'start-0 text-muted-foreground')}>{idx + 1}</td>
              <td
                className={cn(
                  stickyBodyCell,
                  'start-8 max-w-[9rem] font-medium shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)] sm:max-w-none',
                )}
              >
                <span className="line-clamp-2 sm:line-clamp-none">{row.student_name}</span>
              </td>
              <td className={cn(tableBodyCell, 'text-center')}>
                <StatusToggle
                  value={row.status}
                  onChange={status => onStatusChange(row.student_id, status)}
                  t={t}
                />
              </td>
              {showDegree ? (
                <td className={cn(tableBodyCell, 'text-center')}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    inputMode="numeric"
                    placeholder="0"
                    value={row.degree || ''}
                    onChange={e => onDegreeChange(row.student_id, e.target.value)}
                    className="w-14 rounded border border-input bg-background px-1.5 py-1.5 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring sm:w-16 sm:text-sm"
                  />
                </td>
              ) : null}
              <td className={tableBodyCell}>
                <input
                  type="text"
                  placeholder="..."
                  value={row.notes}
                  onChange={e => onNotesChange(row.student_id, e.target.value)}
                  className="w-full min-w-[6rem] rounded border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring sm:min-w-[8rem] sm:text-sm"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </ResponsiveDataTable>
    </>
  );
}

function AttendanceEntryForm({
  sectionId,
  sessionId,
  date,
  onSaved,
  t,
}: {
  sectionId: number;
  sessionId: number;
  date: string;
  onSaved: () => void;
  t: (key: string) => string;
}) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const { data, isLoading } = useQuery({
    queryKey: ['session-attendance', sectionId, sessionId, date],
    queryFn: () => adminAttendanceApi.getSectionDate(sectionId, date, sessionId),
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      adminAttendanceApi.saveSectionDate(
        sectionId,
        date,
        rows.map(r => ({ student_id: r.student_id, status: r.status, notes: r.notes })),
        sessionId,
      ),
    onSuccess: () => {
      toast({ title: t('attendance.saved'), description: `${t('attendance.savedDesc')} ${date}` });
      onSaved();
    },
    onError: (error: Error) => {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (data?.rows) {
      setRows(
        data.rows.map(r => ({
          student_id: Number(r.student_id),
          student_name: r.student_name,
          status: r.status,
          notes: r.notes || '',
        })),
      );
    }
  }, [data]);

  const updateRow = (studentId: number, field: keyof AttendanceRow, value: string) => {
    setRows(prev => prev.map(r => (r.student_id === studentId ? { ...r, [field]: value } : r)));
  };

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <FormToolbar
        t={t}
        canSave={rows.length > 0}
        saving={saveMutation.isPending}
        saveLabel={t('attendance.submit')}
        onSave={() => saveMutation.mutate()}
        onMarkAll={status => setRows(prev => prev.map(r => ({ ...r, status })))}
      />
      <EntryList
        rows={rows}
        t={t}
        showDegree={false}
        onStatusChange={(id, status) => updateRow(id, 'status', status)}
        onDegreeChange={() => undefined}
        onNotesChange={(id, notes) => updateRow(id, 'notes', notes)}
      />
    </div>
  );
}

function AssessmentEntryForm({
  sectionId,
  sessionId,
  date,
  kind,
  onSaved,
  t,
}: {
  sectionId: number;
  sessionId: number;
  date: string;
  kind: 'exam' | 'quiz';
  onSaved: () => void;
  t: (key: string) => string;
}) {
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const isExam = kind === 'exam';
  const { data, isLoading } = useQuery({
    queryKey: [kind, 'session', sectionId, sessionId, date],
    queryFn: () =>
      isExam
        ? adminAssessmentsApi.getExamDate(sectionId, date, sessionId)
        : adminAssessmentsApi.getQuizDate(sectionId, date, sessionId),
  });
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = rows.map(r => ({
        student_id: r.student_id,
        status: r.status,
        degree: r.degree,
        notes: r.notes,
      }));
      return isExam
        ? adminAssessmentsApi.saveExamDate(sectionId, date, payload, sessionId)
        : adminAssessmentsApi.saveQuizDate(sectionId, date, payload, sessionId);
    },
    onSuccess: () => {
      toast({
        title: t(isExam ? 'exam.saved' : 'quiz.saved'),
        description: `${t(isExam ? 'exam.savedDesc' : 'quiz.savedDesc')} ${date}`,
      });
      onSaved();
    },
    onError: (error: Error) => {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (data?.rows) {
      setRows(
        data.rows.map(r => ({
          student_id: Number(r.student_id),
          student_name: r.student_name,
          status: r.status,
          degree: r.degree || '',
          notes: r.notes || '',
        })),
      );
    }
  }, [data]);

  const updateRow = (studentId: number, field: keyof AssessmentRow, value: string) => {
    setRows(prev => prev.map(r => (r.student_id === studentId ? { ...r, [field]: value } : r)));
  };

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <FormToolbar
        t={t}
        canSave={rows.length > 0}
        saving={saveMutation.isPending}
        saveLabel={t(isExam ? 'exam.submit' : 'quiz.submit')}
        onSave={() => saveMutation.mutate()}
        onMarkAll={status => setRows(prev => prev.map(r => ({ ...r, status })))}
      />
      <EntryList
        rows={rows}
        t={t}
        showDegree
        degreeLabel={t(isExam ? 'exam.degree' : 'quiz.degree')}
        onStatusChange={(id, status) => updateRow(id, 'status', status)}
        onDegreeChange={(id, degree) => updateRow(id, 'degree', degree)}
        onNotesChange={(id, notes) => updateRow(id, 'notes', notes)}
      />
    </div>
  );
}

export default function SessionLinkedEntryPanel({
  sectionId,
  session,
}: {
  sectionId: number;
  session: SectionSessionOverview;
}) {
  const { t, dir } = useLocale();
  const queryClient = useQueryClient();
  const date = sessionDateFromStartAt(session.start_at);

  const refreshOverview = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-section-sessions', sectionId] });
    void queryClient.invalidateQueries({ queryKey: ['session-attendance', sectionId, session.id, date] });
    void queryClient.invalidateQueries({ queryKey: ['exam', 'session', sectionId, session.id, date] });
    void queryClient.invalidateQueries({ queryKey: ['quiz', 'session', sectionId, session.id, date] });
  };

  return (
    <div dir={dir} className="rounded-xl border border-border bg-muted/10 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground sm:text-sm">
          {t('page.sectionSessions.entryDate')}
        </p>
        <span className="rounded-md bg-background px-2.5 py-1 text-xs font-semibold tabular-nums shadow-sm sm:text-sm">
          {date}
        </span>
      </div>
      <div className="w-full">
        <Tabs defaultValue="attendance" dir="rtl" className="w-full flex flex-col justify-start">
          <div className="mb-3 flex justify-start ">
            <TabsList className="grid flex-row justify-start h-auto w-full grid-cols-3 gap-1 p-1 sm:inline-flex sm:w-auto">
              <TabsTrigger value="attendance" className="px-2 py-2 text-xs sm:px-3 sm:text-sm">
                {t('nav.attendance')}
              </TabsTrigger>
              <TabsTrigger value="exams" className="px-2 py-2 text-xs sm:px-3 sm:text-sm">
                {t('nav.exams')}
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="px-2 py-2 text-xs sm:px-3 sm:text-sm">
                {t('nav.quizzes')}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="attendance" className="mt-0 text-start">
          <AttendanceEntryForm
            sectionId={sectionId}
            sessionId={session.id}
            date={date}
            onSaved={refreshOverview}
            t={t}
          />
        </TabsContent>
        <TabsContent value="exams" className="mt-0 text-start">
          <AssessmentEntryForm
            sectionId={sectionId}
            sessionId={session.id}
            date={date}
            kind="exam"
            onSaved={refreshOverview}
            t={t}
          />
        </TabsContent>
        <TabsContent value="quizzes" className="mt-0 text-start">
          <AssessmentEntryForm
            sectionId={sectionId}
            sessionId={session.id}
            date={date}
            kind="quiz"
            onSaved={refreshOverview}
            t={t}
          />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
