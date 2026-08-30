import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Clock3, ExternalLink, Eye, FileText, Upload } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset-url';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { dateOnly, uniqueSorted } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import FormDialog from '@/components/FormDialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAppFontClasses } from '@/hooks/use-app-font';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentHomeworkPayload, type StudentSelfBootstrapPayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HWRow = StudentSelfBootstrapPayload['homework'][number] & { grade?: string };

const UNKNOWN_TEACHER = '__unknown__';

function teacherKey(row: HWRow): string {
  const name = (row.teacher || '').trim();
  if (name) return name;
  if (row.teacher_id != null) return `id:${row.teacher_id}`;
  return UNKNOWN_TEACHER;
}

function teacherLabel(key: string, t: (k: string) => string): string {
  if (key === UNKNOWN_TEACHER || key.startsWith('id:')) return t('student.attendance.unknownTeacher');
  return key;
}

function normalizeHomeworkRow(row: HWRow): HWRow {
  const degree = row.degree ?? (row.grade && row.grade !== '—' ? row.grade : undefined);
  return {
    ...row,
    degree: degree && degree !== '—' ? degree : '—',
    final_degree: row.final_degree ?? '',
    rate: row.rate && row.rate !== '—' ? row.rate : '—',
  };
}

type HomeworkSummary = {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
};

type MonthGroup = {
  month: string;
  label: string;
  rows: HWRow[];
  summary: HomeworkSummary;
};

function homeworkStatusLabel(status: string, t: (key: string) => string): string {
  return t(`homework.status.${status}`) || status.replace(/_/g, ' ');
}

function formatShortDate(value: string | undefined, locale: string): string {
  if (!value) return '—';
  const normalized = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return value;
  return new Date(`${normalized}T12:00:00`).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function monthKey(date: string): string {
  return dateOnly(date).slice(0, 7);
}

function formatMonthLabel(month: string, locale: string): string {
  const d = new Date(`${month}-01T12:00:00`);
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

function hasSubmission(row: HWRow): boolean {
  return Boolean(
    row.submission_id
    || row.file_url
    || (row.status && row.status !== 'not_submitted'),
  );
}

function isHomeworkSubmissionLocked(status: string): boolean {
  return status === 'submitted' || status === 'late' || status === 'approved';
}

function homeworkSubmissionDeadline(row: HWRow): string {
  return dateOnly(row.due_date) || dateOnly(row.submit_date);
}

function isHomeworkSubmissionClosed(row: HWRow): boolean {
  const deadline = homeworkSubmissionDeadline(row);
  if (!deadline) return false;
  return dateOnly(new Date().toISOString()) > deadline;
}

function canSubmitHomework(row: HWRow): boolean {
  if (isHomeworkSubmissionLocked(row.status)) return false;
  if (isHomeworkSubmissionClosed(row)) return false;
  return true;
}

function isGraded(row: HWRow): boolean {
  return row.status === 'approved'
    || (Boolean(row.degree) && row.degree !== '—' && row.degree !== '');
}

function formatHomeworkDegree(row: HWRow): string {
  const degree = row.degree && row.degree !== '—' ? row.degree : '';
  const finalDegree = row.final_degree?.trim() || '';
  if (degree && finalDegree) return `${degree} / ${finalDegree}`;
  if (degree) return degree;
  if (finalDegree) return `— / ${finalDegree}`;
  return '—';
}

function formatHomeworkRate(row: HWRow): string {
  if (row.rate && row.rate !== '—') return row.rate;
  return '—';
}

function summarizeRows(rows: HWRow[]): HomeworkSummary {
  return {
    total: rows.length,
    pending: rows.filter(r => r.status === 'not_submitted').length,
    submitted: rows.filter(r => r.status === 'submitted' || r.status === 'late').length,
    graded: rows.filter(isGraded).length,
  };
}

function buildMonthGroups(rows: HWRow[], locale: string): MonthGroup[] {
  const byMonth = new Map<string, HWRow[]>();
  for (const row of rows) {
    const key = monthKey(row.due_date);
    const list = byMonth.get(key) || [];
    list.push(row);
    byMonth.set(key, list);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, monthRows]) => ({
      month,
      label: formatMonthLabel(month, locale),
      rows: [...monthRows].sort((a, b) => {
        const dateCmp = dateOnly(b.due_date).localeCompare(dateOnly(a.due_date));
        if (dateCmp !== 0) return dateCmp;
        return String(a.title).localeCompare(String(b.title));
      }),
      summary: summarizeRows(monthRows),
    }));
}

function resolveRowCenterId(row: HWRow, soleCenterId: string | null): string {
  if (row.center_id != null) return String(row.center_id);
  if (soleCenterId) return soleCenterId;
  return '_none';
}

function submissionFileLabel(row: HWRow, t: (key: string) => string): string {
  if (row.file_url) return row.file_name || t('homework.openFile');
  if (hasSubmission(row) && row.student_notes) return t('homework.notesOnly');
  return t('homework.notSubmitted');
}

function HomeworkDetailFields({ item, locale }: { item: HWRow; locale: string }) {
  const { t } = useLocale();

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: t('col.title'), value: item.title },
    {
      label: t('col.teacher'),
      value: item.teacher?.trim() || t('student.attendance.unknownTeacher'),
    },
    ...(item.teacher_subject?.trim()
      ? [{ label: t('col.subject'), value: item.teacher_subject.trim() }]
      : []),
    { label: t('col.dueDate'), value: formatShortDate(item.due_date, locale) },
    {
      label: t('col.status'),
      value: <StatusBadge status={item.status} label={homeworkStatusLabel(item.status, t)} />,
    },
    { label: t('col.degree'), value: item.degree && item.degree !== '—' ? item.degree : '—' },
    { label: t('col.finalDegree'), value: item.final_degree?.trim() || '—' },
    { label: t('homework.rate'), value: formatHomeworkRate(item) },
    { label: t('homework.submittedAt'), value: formatShortDate(item.upload_date, locale) },
    { label: t('homework.studentNotes'), value: item.student_notes || '—' },
    { label: t('homework.teacherResponse'), value: item.response || '—' },
    {
      label: t('homework.currentFile'),
      value: item.file_url ? (
        <a
          href={resolveAssetUrl(item.file_url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 break-all text-primary underline"
        >
          {item.file_name || t('homework.openFile')}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : submissionFileLabel(item, t),
    },
    {
      label: t('homework.correctionFile'),
      value: item.correction_url ? (
        <a
          href={resolveAssetUrl(item.correction_url)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 break-all text-primary underline"
        >
          {item.correction_name || t('homework.openFile')}
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : '—',
    },
    ...(item.center_name
      ? [{ label: t('col.center'), value: <CenterLabel name={item.center_name} /> }]
      : []),
  ];

  return (
    <div className="space-y-3">
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-[minmax(0,38%)_1fr] gap-x-3 gap-y-1 text-sm sm:grid-cols-[140px_1fr]">
          <span className="font-medium text-muted-foreground">{row.label}</span>
          <div className="min-w-0 break-words text-foreground">{row.value}</div>
        </div>
      ))}
    </div>
  );
}

function HomeworkShowDialog({ item, onClose }: { item: HWRow; onClose: () => void }) {
  const { t, locale } = useLocale();
  const isMobile = useIsMobile();
  const title = `${t('crud.view')} ${t('nav.homework')}`;

  if (isMobile) {
    return (
      <Sheet open onOpenChange={v => !v && onClose()}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-8">
          <SheetHeader className="text-start">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <HomeworkDetailFields item={item} locale={locale} />
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" className="w-full" onClick={onClose}>
              {t('misc.close')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <HomeworkDetailFields item={item} locale={locale} />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>{t('misc.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HomeworkSubmissionForm({
  item,
  onClose,
  onSave,
  saving,
  tenantSlug,
}: {
  item: HWRow;
  onClose: () => void;
  onSave: (payload: StudentHomeworkPayload, submissionId?: number | null) => Promise<void>;
  saving: boolean;
  tenantSlug?: string | null;
}) {
  const { t } = useLocale();
  const [studentNotes, setStudentNotes] = useState(item.student_notes || '');
  const [file, setFile] = useState<File | null>(null);
  const isLocked = isHomeworkSubmissionLocked(item.status);
  const isClosed = isHomeworkSubmissionClosed(item);

  useEffect(() => {
    if (isLocked) {
      toast({
        title: t('homework.submittedLocked'),
        description: t('homework.submittedLockedDesc'),
      });
      onClose();
      return;
    }
    if (isClosed) {
      toast({
        title: t('homework.deadlinePassed'),
        description: t('homework.deadlinePassedDesc'),
      });
      onClose();
    }
  }, [isClosed, isLocked, onClose, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isClosed) return;
    if (!item.submission_id && !file && !studentNotes.trim()) {
      toast({
        title: t('homework.submitFailed'),
        description: t('homework.submitRequired'),
        variant: 'destructive',
      });
      return;
    }
    await onSave({
      homework_id: item.homework_id,
      student_notes: studentNotes.trim() || undefined,
      file: file || undefined,
      center_id: item.center_id,
      center_slug: item.center_slug ?? tenantSlug ?? undefined,
    }, item.submission_id);
    onClose();
  };

  if (isLocked || isClosed) return null;

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item.submission_id ? t('homework.resubmit') : t('homework.submit')}
      description={item.title}
      onSubmit={handleSubmit}
      loading={saving}
      submitLabel={item.submission_id ? t('homework.resubmit') : t('homework.submit')}
    >
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
        <p><strong>{t('col.dueDate')}:</strong> {item.due_date}</p>
        <p className="mt-1">
          <strong>{t('col.status')}:</strong>{' '}
          <StatusBadge status={item.status} label={homeworkStatusLabel(item.status, t)} />
        </p>
      </div>

      {item.file_url && (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <span className="font-medium">{t('homework.currentFile')}: </span>
          <a
            href={resolveAssetUrl(item.file_url)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary underline"
          >
            {item.file_name || t('homework.openFile')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      <FormField label={t('homework.upload')} id="homework-file">
        <FormInput
          id="homework-file"
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('homework.uploadHint')}</p>
      </FormField>

      <FormField label={t('homework.studentNotes')} id="homework-notes">
        <FormTextarea
          id="homework-notes"
          value={studentNotes}
          placeholder={t('homework.notesPlaceholder')}
          onChange={e => setStudentNotes(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

function HomeworkCard({
  item,
  dateLocale,
  onView,
  onSubmit,
}: {
  item: HWRow;
  dateLocale: string;
  onView: () => void;
  onSubmit: () => void;
}) {
  const { t } = useLocale();
  const fonts = useAppFontClasses();
  const canSubmit = canSubmitHomework(item);
  const isClosed = isHomeworkSubmissionClosed(item);
  const teacher = item.teacher?.trim() || t('student.attendance.unknownTeacher');
  const teacherSubject = item.teacher_subject?.trim() || '';

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-card',
        isClosed ? 'border-destructive/35' : 'border-border',
      )}
    >
      {isClosed ? (
        <>
          <div className="h-1 w-full bg-destructive" aria-hidden />
          <div className="flex items-center justify-center border-b border-destructive/15 bg-destructive/10 px-3 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive sm:text-xs">
              {t('homework.deadlinePassed')}
            </span>
          </div>
        </>
      ) : null}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
      <p className={cn('line-clamp-2 text-sm font-semibold text-foreground', fonts.display)}>
        {item.center_name || t('col.center')}
      </p>

      <div className="mt-2 space-y-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</p>
      </div>

      <div className="mt-2 flex items-start justify-between gap-3 text-xs sm:text-sm">
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{teacher}</span>
        {teacherSubject ? (
          <span className="min-w-0 flex-1 truncate text-end text-muted-foreground">{teacherSubject}</span>
        ) : null}
      </div>

      <div className="mt-4 flex-1 space-y-2 border-t border-border/60 pt-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.dueDate')}</span>
          <span className="font-medium text-foreground">{formatShortDate(item.due_date, dateLocale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.status')}</span>
          <StatusBadge status={item.status} label={homeworkStatusLabel(item.status, t)} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.degree')}</span>
          <span className="font-medium tabular-nums text-foreground">{formatHomeworkDegree(item)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('homework.rate')}</span>
          <span className="font-medium tabular-nums text-foreground">{formatHomeworkRate(item)}</span>
        </div>
      </div>

      <div className={cn('mt-3 flex gap-2', !canSubmit ? 'flex-col' : 'flex-col sm:flex-row')}>
        <Button type="button" size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onView}>
          <Eye className="h-4 w-4" />
          {t('crud.view')}
        </Button>
        {canSubmit ? (
          <Button type="button" size="sm" className="flex-1 gap-1.5" onClick={onSubmit}>
            <Upload className="h-4 w-4" />
            {item.submission_id ? t('homework.resubmit') : t('homework.submit')}
          </Button>
        ) : null}
      </div>
      </div>
    </div>
  );
}

export default function StudentHomework() {
  const { t, locale } = useLocale();
  const fonts = useAppFontClasses();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useStudentBootstrap();
  const allRows = useMemo(
    () => ((data?.homework || []) as HWRow[]).map(normalizeHomeworkRow),
    [data?.homework],
  );

  const [centerFilter, setCenterFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [showItem, setShowItem] = useState<HWRow | null>(null);
  const [editItem, setEditItem] = useState<HWRow | null>(null);

  const dateLocale = locale === 'ar' ? 'ar' : 'en';

  const soleCenterId = useMemo(() => {
    if (data?.centers?.length === 1) return String(data.centers[0].center_id);
    const ids = new Set<string>();
    for (const row of allRows) {
      if (row.center_id != null) ids.add(String(row.center_id));
    }
    if (ids.size === 1) return Array.from(ids)[0];
    return null;
  }, [allRows, data?.centers]);

  const centerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.centers || []) {
      map.set(String(c.center_id), c.center_name);
    }
    for (const row of allRows) {
      if (row.center_id == null) continue;
      const id = String(row.center_id);
      if (!map.has(id)) map.set(id, row.center_name || id);
    }
    if (map.size === 0 && soleCenterId) {
      map.set(soleCenterId, data?.centers?.[0]?.center_name || soleCenterId);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allRows, data?.centers, soleCenterId]);

  const showCenterFilter = centerOptions.length > 0;

  const teacherOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const row of allRows) {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) continue;
      keys.add(teacherKey(row));
    }
    return Array.from(keys).sort((a, b) => {
      if (a === UNKNOWN_TEACHER) return 1;
      if (b === UNKNOWN_TEACHER) return -1;
      return a.localeCompare(b);
    });
  }, [allRows, centerFilter, soleCenterId]);

  const statuses = useMemo(() => uniqueSorted(allRows.map(r => r.status)), [allRows]);

  useEffect(() => {
    if (centerFilter && !centerOptions.some(c => c.id === centerFilter)) {
      setCenterFilter('');
    }
  }, [centerFilter, centerOptions]);

  useEffect(() => {
    if (teacherFilter && !teacherOptions.includes(teacherFilter)) {
      setTeacherFilter('');
    }
  }, [teacherFilter, teacherOptions]);

  useEffect(() => {
    if (statusFilter && !statuses.includes(statusFilter)) {
      setStatusFilter('');
    }
  }, [statusFilter, statuses]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) return false;
      if (teacherFilter && teacherKey(row) !== teacherFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (monthFilter && monthKey(row.due_date) !== monthFilter) return false;
      return true;
    });
  }, [allRows, centerFilter, teacherFilter, statusFilter, monthFilter, soleCenterId]);

  const monthGroups = useMemo(
    () => buildMonthGroups(filteredRows, dateLocale),
    [filteredRows, dateLocale],
  );

  const summary = useMemo(() => summarizeRows(filteredRows), [filteredRows]);
  const appliedFilters = [centerFilter, teacherFilter, statusFilter, monthFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCenterFilter('');
    setTeacherFilter('');
    setStatusFilter('');
    setMonthFilter('');
  };

  const saveMutation = useMutation({
    mutationFn: ({ payload, submissionId }: { payload: StudentHomeworkPayload; submissionId?: number | null }) => (
      submissionId
        ? studentSelfApi.updateHomeworkSubmission(submissionId, payload)
        : studentSelfApi.createHomeworkSubmission(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] });
      toast({ title: t('homework.saved'), description: t('homework.savedDesc') });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('homework.submitFailed');
      toast({ title: t('homework.submitFailed'), description: message, variant: 'destructive' });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <h1 className={cn('flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl', fonts.display)}>
              <FileText className="h-6 w-6 text-primary" aria-hidden />
              {t('nav.homework')}
            </h1>
            <p className="page-description mt-1 text-sm text-muted-foreground sm:text-base">
              {t('page.homework.student.desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('student.homework.total')}
            </p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums', fonts.display)}>
              {isLoading ? '…' : summary.total}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <Clock3 className="h-3.5 w-3.5 text-warning" aria-hidden />
              {t('student.homework.pending')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{summary.pending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <Upload className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t('student.homework.submitted')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{summary.submitted}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
              {t('student.homework.graded')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-success">{summary.graded}</p>
          </div>
        </div>

        <StudentPageFilterBar
          appliedCount={appliedFilters}
          onClear={clearFilters}
          resultCount={filteredRows.length}
          renderFilters={idPrefix => (
            <>
              {showCenterFilter ? (
                <StudentFilterField id={`${idPrefix}-center`} label={t('col.center')}>
                  <FormSelect
                    id={`${idPrefix}-center`}
                    title={t('col.center')}
                    value={centerFilter}
                    onChange={e => {
                      setCenterFilter(e.target.value);
                      setTeacherFilter('');
                    }}
                  >
                    <option value="">{t('filter.all')}</option>
                    {centerOptions.map(center => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </FormSelect>
                </StudentFilterField>
              ) : null}
              <StudentFilterField id={`${idPrefix}-teacher`} label={t('col.teacher')}>
                <FormSelect
                  id={`${idPrefix}-teacher`}
                  title={t('col.teacher')}
                  value={teacherFilter}
                  onChange={e => setTeacherFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  {teacherOptions.map(key => (
                    <option key={key} value={key}>{teacherLabel(key, t)}</option>
                  ))}
                </FormSelect>
              </StudentFilterField>
              <StudentFilterField id={`${idPrefix}-status`} label={t('col.status')}>
                <FormSelect
                  id={`${idPrefix}-status`}
                  title={t('col.status')}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{homeworkStatusLabel(status, t)}</option>
                  ))}
                </FormSelect>
              </StudentFilterField>
              <StudentFilterField id={`${idPrefix}-month`} label={t('col.month')}>
                <FormInput
                  id={`${idPrefix}-month`}
                  type="month"
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                />
              </StudentFilterField>
            </>
          )}
        />

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-48 animate-pulse rounded bg-muted/40" />
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map(j => (
                    <div key={j} className="h-48 animate-pulse rounded-xl border border-border bg-muted/30" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
            {t('student.homework.empty')}
          </div>
        ) : (
          <div className="space-y-6">
            {monthGroups.map(group => (
              <section key={group.month} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
                  <div>
                    <h2 className={cn('text-base font-semibold sm:text-lg', fonts.display)}>{group.label}</h2>
                    <p className="text-xs text-muted-foreground">
                      {group.summary.pending} {t('student.homework.pending').toLowerCase()} · {group.summary.submitted} {t('student.homework.submitted').toLowerCase()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {group.summary.total} {t('crud.results')}
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map(item => (
                    <HomeworkCard
                      key={portalRowKey(item.center_id, item.id)}
                      item={item}
                      dateLocale={dateLocale}
                      onView={() => setShowItem(item)}
                      onSubmit={() => {
                        if (!canSubmitHomework(item)) return;
                        setEditItem(item);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showItem ? <HomeworkShowDialog item={showItem} onClose={() => setShowItem(null)} /> : null}
      {editItem && canSubmitHomework(editItem) ? (
        <HomeworkSubmissionForm
          item={editItem}
          onClose={() => setEditItem(null)}
          saving={saveMutation.isPending}
          tenantSlug={user?.tenant_slug}
          onSave={async (payload, submissionId) => {
            await saveMutation.mutateAsync({ payload, submissionId });
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
