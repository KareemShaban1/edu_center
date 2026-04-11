import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { adminPaymentsApi } from '@/services/endpoints/admin-payments';

export default function AdminPaymentHistory() {
  const { t } = useLocale();
  const { sectionId } = useParams();
  const { data: bootstrap } = useAdminBootstrap();
  const section = ((bootstrap?.sections || []) as Array<{ id: number; name: string; grade_id: number; class_id: number }>).find(s => s.id === Number(sectionId));
  const grade = ((bootstrap?.grades || []) as Array<{ id: number; name: string }>).find(g => g.id === section?.grade_id);
  const cls = ((bootstrap?.classes || []) as Array<{ id: number; name: string }>).find(c => c.id === section?.class_id);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', 'history', Number(sectionId)],
    queryFn: () => adminPaymentsApi.getSectionHistory(Number(sectionId)),
    enabled: Boolean(sectionId),
  });

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin/payments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">Payment History</h1>
            {section && <p className="text-sm text-muted-foreground">{grade?.name} — {cls?.name} — {section.name}</p>}
          </div>
        </div>
        <Button asChild>
          <Link to={`/admin/payments/section/${sectionId}/today`}>{t('attendance.today')}</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-start font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-2 text-start font-medium text-muted-foreground">Paid</th>
              <th className="px-4 py-2 text-start font-medium text-muted-foreground">Unpaid</th>
              <th className="px-4 py-2 text-start font-medium text-muted-foreground">{t('col.amount')}</th>
              <th className="px-4 py-2 text-start font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-2 text-end font-medium text-muted-foreground">{t('crud.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : (data?.days || []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('crud.noData')}</td></tr>
            ) : (
              data!.days.map(day => (
                <tr key={day.date} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3"><div className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{day.date}</div></td>
                  <td className="px-4 py-3">{day.paid}</td>
                  <td className="px-4 py-3">{day.unpaid}</td>
                  <td className="px-4 py-3">${day.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{day.total}</td>
                  <td className="px-4 py-3 text-end">
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link to={`/admin/payments/section/${sectionId}/date/${day.date}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Show
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

