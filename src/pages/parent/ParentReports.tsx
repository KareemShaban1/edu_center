import DashboardLayout from '@/components/DashboardLayout';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';

export default function ParentReports() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const reports = data?.reports || [];
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.reports')}</h1>
        <p className="page-description">{t('page.reports.desc')}</p>
      </div>
      <div className="space-y-6">
        {reports.map(c => (
          <div key={portalRowKey(c.center_id, c.student_id)} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="border-b border-border px-5 py-3 bg-muted/30">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display font-semibold">{c.student_name} — {c.grade}</h3>
                <CenterLabel name={c.center_name} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-medium text-muted-foreground ltr:text-left rtl:text-right">{t('col.title')}</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('nav.attendance')}</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('nav.quizzes')}</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('nav.exams')}</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('stat.revenue')}</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('stat.pendingFees')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-3 font-medium">{t('nav.reports')}</td>
                    <td className="px-4 py-3 text-center">{c.attendance_rate}%</td>
                    <td className="px-4 py-3 text-center">{c.quiz_average ?? '—'}</td>
                    <td className="px-4 py-3 text-center">{c.exam_average ?? '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold">${c.paid_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center font-semibold">${c.pending_amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
