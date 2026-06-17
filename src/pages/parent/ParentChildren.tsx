import DashboardLayout from '@/components/DashboardLayout';
import { CalendarCheck, Trophy } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';

export default function ParentChildren() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const children = data?.children || [];
  const attendanceRows = data?.attendance || [];
  const examRows = data?.exams || [];
  const quizRows = data?.quizzes || [];
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.children')}</h1>
        <p className="page-description">{t('page.children.desc')}</p>
      </div>
      <div className="space-y-6">
        {children.map(c => (
          <div key={portalRowKey(c.center_id, c.id)} className="rounded-xl border border-border bg-card p-6 shadow-card">
            {(() => {
              const childAttendance = attendanceRows.filter(a => a.student_id === c.id && a.center_id === c.center_id);
              const presentCount = childAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
              const attendanceRate = childAttendance.length > 0 ? Math.round((presentCount / childAttendance.length) * 100) : 0;
              const childExams = examRows.filter(e => e.student_id === c.id && e.center_id === c.center_id && typeof e.degree === 'number');
              const childQuizzes = quizRows.filter(q => q.student_id === c.id && q.center_id === c.center_id && typeof q.degree === 'number');
              const examAvg = childExams.length > 0 ? (childExams.reduce((s, r) => s + (r.degree || 0), 0) / childExams.length).toFixed(1) : '—';
              const quizAvg = childQuizzes.length > 0 ? (childQuizzes.reduce((s, r) => s + (r.degree || 0), 0) / childQuizzes.length).toFixed(1) : '—';
              const recentResults = [...childExams.map(e => ({ type: 'Exam', score: e.degree })), ...childQuizzes.map(q => ({ type: 'Quiz', score: q.degree }))]
                .filter(r => typeof r.score === 'number')
                .slice(0, 6);
              return (
                <>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-lg">
                {c.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-semibold text-lg">{c.name}</h3>
                  <CenterLabel name={c.center_name} />
                </div>
                <p className="text-sm text-muted-foreground">{c.grade} - {c.class} - {c.section}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg bg-success/5 border border-success/10 p-3 text-center">
                <CalendarCheck className="h-4 w-4 mx-auto mb-1 text-success" />
                <p className="text-xs text-muted-foreground">{t('nav.attendance')}</p>
                <p className="font-semibold text-success">{attendanceRate}%</p>
              </div>
              <div className="rounded-lg bg-exams/5 border border-exams/10 p-3 text-center">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-exams" />
                <p className="text-xs text-muted-foreground">{t('nav.exams')}</p>
                <p className="font-semibold text-exams">{examAvg}</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">{t('nav.quizzes')}</p>
                <p className="font-semibold text-primary">{quizAvg}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">{t('section.recentGrades')}</h4>
              <div className="flex flex-wrap gap-2">
                {recentResults.length > 0 ? (
                  recentResults.map((r, i) => (
                    <span key={`${c.id}-${i}`} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">{r.type}: {r.score}</span>
                  ))
                ) : (
                  <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">{t('misc.noDataAvailable')}</span>
                )}
              </div>
            </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
