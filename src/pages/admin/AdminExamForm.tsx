import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminAssessmentsApi } from '@/services/endpoints/admin-assessments';
import SessionLinkField from '@/components/SessionLinkField';
import WhatsAppSectionNotify, { WhatsAppRowButton } from '@/components/admin/WhatsAppSectionNotify';
import CertificationSectionIssue, { CertificationRowButton } from '@/components/admin/CertificationSectionIssue';

interface StudentExamRow {
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  degree: string;
  notes: string;
  can_whatsapp?: boolean;
}

export default function AdminExamForm() {
  const { sectionId, date: dateParam } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();

  const section = ((bootstrap?.sections || []) as Array<{ id: number; name: string; grade_id: number; class_id: number }>).find(s => s.id === Number(sectionId));
  const grade = ((bootstrap?.grades || []) as Array<{ id: number; name: string }>).find(g => g.id === section?.grade_id);
  const cls = ((bootstrap?.classes || []) as Array<{ id: number; name: string }>).find(c => c.id === section?.class_id);

  const today = new Date().toISOString().split('T')[0];
  const currentDate = dateParam || today;
  const isToday = !dateParam;

  const [rows, setRows] = useState<StudentExamRow[]>([]);
  const [sessionId, setSessionId] = useState(0);
  const [sessionOptions, setSessionOptions] = useState<Array<{ id: number; topic: string; start_at: string }>>([]);
  const { data, isLoading } = useQuery({
    queryKey: ['exam-date', Number(sectionId), currentDate],
    queryFn: () => adminAssessmentsApi.getExamDate(Number(sectionId), currentDate),
    enabled: Boolean(sectionId),
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      adminAssessmentsApi.saveExamDate(
        Number(sectionId),
        currentDate,
        rows.map(r => ({ student_id: r.student_id, status: r.status, degree: r.degree, notes: r.notes })),
        sessionId,
      ),
  });
  useEffect(() => {
    if (data?.rows) {
      setRows(data.rows.map(r => ({
        student_id: Number(r.student_id),
        student_name: r.student_name,
        status: r.status,
        degree: r.degree || '',
        notes: r.notes || '',
        can_whatsapp: r.can_whatsapp ?? false,
      })));
      setSessionId(data.session_id ? Number(data.session_id) : 0);
      setSessionOptions(data.session_options || []);
    }
  }, [data]);

  const updateRow = (studentId: number, field: keyof StudentExamRow, value: string) => {
    setRows(prev => prev.map(r => r.student_id === studentId ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async () => {
    try {
      await saveMutation.mutateAsync();
      toast({
        title: t('exam.saved'),
        description: `${t('exam.savedDesc')} ${currentDate}`,
      });
      navigate('/admin/exams');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save exam';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  if (!section) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{t('crud.noData')}</p>
      </DashboardLayout>
    );
  }

  const presentCount = rows.filter(r => r.status === 'present').length;
  const absentCount = rows.filter(r => r.status === 'absent').length;
  const lateCount = rows.filter(r => r.status === 'late').length;
  const sectionLabel = [grade?.name, cls?.name, section.name].filter(Boolean).join(' — ');

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={isToday ? '/admin/exams' : `/admin/exams/section/${sectionId}/history`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">
              {t('nav.exams')} — {isToday ? t('attendance.today') : currentDate}
            </h1>
            <p className="text-sm text-muted-foreground">
              {grade?.name} — {cls?.name} — {section.name}
            </p>
          </div>
        </div>
        {rows.length > 0 && (
          <Button onClick={handleSubmit} className="gap-2">
            <Save className="h-4 w-4" />
            {t('exam.submit')}
          </Button>
        )}
      </div>

      {isLoading && <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">Loading...</div>}
      {sessionOptions.length > 0 && (
        <div className="mb-4 max-w-md">
          <SessionLinkField id="exam-session" value={sessionId} options={sessionOptions} onChange={setSessionId} />
        </div>
      )}

      <WhatsAppSectionNotify
        context="exam"
        sectionId={Number(sectionId)}
        date={currentDate}
        sectionLabel={sectionLabel}
        rows={rows}
      />

      <CertificationSectionIssue
        context="exam"
        sectionId={Number(sectionId)}
        date={currentDate}
        sectionLabel={sectionLabel}
        rows={rows}
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">{presentCount}</p>
          <p className="text-xs text-muted-foreground">{t('attendance.present')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{absentCount}</p>
          <p className="text-xs text-muted-foreground">{t('attendance.absent')}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
          <p className="text-xs text-muted-foreground">{t('attendance.late')}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => setRows(prev => prev.map(r => ({ ...r, status: 'present' })))}>
          ✓ {t('attendance.markAllPresent')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRows(prev => prev.map(r => ({ ...r, status: 'absent' })))}>
          ✗ {t('attendance.markAllAbsent')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRows(prev => prev.map(r => ({ ...r, status: 'late' })))}>
          ◔ {t('attendance.markAllLate')}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-start font-medium text-muted-foreground w-10">#</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('crud.name')}</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('attendance.present')}</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('attendance.absent')}</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('attendance.late')}</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">{t('exam.degree')}</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t('col.notes')}</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">{t('crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{t('crud.noData')}</td></tr>
              ) : rows.map((row, idx) => (
                <tr key={row.student_id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{row.student_name}</td>
                  <td className="px-3 py-2 text-center">
                    <input title={t('attendance.present')} type="radio" name={`status-${row.student_id}`} checked={row.status === 'present'} onChange={() => updateRow(row.student_id, 'status', 'present')} className="h-4 w-4 accent-primary cursor-pointer" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input title={t('attendance.absent')} type="radio" name={`status-${row.student_id}`} checked={row.status === 'absent'} onChange={() => updateRow(row.student_id, 'status', 'absent')} className="h-4 w-4 accent-destructive cursor-pointer" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input title={t('attendance.late')} type="radio" name={`status-${row.student_id}`} checked={row.status === 'late'} onChange={() => updateRow(row.student_id, 'status', 'late')} className="h-4 w-4 accent-amber-500 cursor-pointer" />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={row.degree}
                      onChange={e => updateRow(row.student_id, 'degree', e.target.value)}
                      className="w-20 rounded border border-input bg-background px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      placeholder="..."
                      value={row.notes}
                      onChange={e => updateRow(row.student_id, 'notes', e.target.value)}
                      rows={1}
                      className="w-full min-w-[150px] rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <WhatsAppRowButton
                        context="exam"
                        sectionId={Number(sectionId)}
                        date={currentDate}
                        sectionLabel={sectionLabel}
                        row={row}
                      />
                      <CertificationRowButton
                        context="exam"
                        sectionId={Number(sectionId)}
                        date={currentDate}
                        sectionLabel={sectionLabel}
                        row={row}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            {t('exam.submit')}
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
