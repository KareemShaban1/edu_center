import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { adminAttendanceApi } from '@/services/endpoints/admin-attendance';

export default function AdminAttendanceHistory() {
  const { sectionId } = useParams();
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();

  const section = ((bootstrap?.sections || []) as Array<{ id: number; name: string; grade_id: number; class_id: number }>)
    .find(s => s.id === Number(sectionId));
  const grade = ((bootstrap?.grades || []) as Array<{ id: number; name: string }>)
    .find(g => g.id === section?.grade_id);
  const cls = ((bootstrap?.classes || []) as Array<{ id: number; name: string }>)
    .find(c => c.id === section?.class_id);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['attendance-history', Number(sectionId)],
    queryFn: () => adminAttendanceApi.getSectionHistory(Number(sectionId)),
    enabled: Boolean(sectionId),
  });

  const attendanceDays = useMemo(() => historyData?.days || [], [historyData]);

  if (!section) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{t('crud.noData')}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="page-title">{t('attendance.history')}</h1>
          <p className="text-sm text-muted-foreground">
            {grade?.name} — {cls?.name} — {section.name}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && (
            <p className="p-6 text-center text-muted-foreground">Loading...</p>
          )}
          {attendanceDays.length === 0 && (
            <p className="p-6 text-center text-muted-foreground">{t('crud.noData')}</p>
          )}
          {attendanceDays.map(day => (
            <div key={day.date} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">{day.date}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status="present" />
                    <span className="text-xs text-muted-foreground">{day.present}</span>
                    <StatusBadge status="absent" />
                    <span className="text-xs text-muted-foreground">{day.absent}</span>
                    <StatusBadge status="late" />
                    <span className="text-xs text-muted-foreground">{day.late}</span>
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/admin/attendance/section/${sectionId}/date/${day.date}`}>
                  <Eye className="h-3.5 w-3.5" />
                  {t('attendance.view')}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
