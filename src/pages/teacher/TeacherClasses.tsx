import DashboardLayout from '@/components/DashboardLayout';
import { BookOpen, Users } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';

export default function TeacherClasses() {
  const { t } = useLocale();
  const { data, isLoading } = useTeacherBootstrap();
  const classes = data?.classes || [];
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.sections')}</h1>
        <p className="page-description">{t('page.sections.desc')}</p>
      </div>
      {isLoading && <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">{t('misc.loading')}</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map(c => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-primary/10 p-2.5"><BookOpen className="h-5 w-5 text-primary" /></div>
            </div>
            <h3 className="font-display font-semibold">{c.name}</h3>
            <p className="text-sm text-muted-foreground">{c.grade} - {c.class} - {c.section}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.students} {t('nav.students').toLowerCase()}</span>
            </div>
            <div className="mt-3 rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <p className="text-xs font-medium mb-1">{t('nav.students').toLowerCase()}</p>
              {(c.students_list && c.students_list.length > 0) ? (
                <div className="max-h-28 overflow-auto space-y-1">
                  {c.students_list.map((s) => (
                    <p key={s.id} className="text-xs text-muted-foreground">{s.name}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t('crud.noData')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
