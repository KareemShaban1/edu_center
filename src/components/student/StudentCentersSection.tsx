import { Building2, BookOpen, CalendarCheck, ClipboardList, Library, Mail, MapPin, Phone, Trophy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocale } from '@/contexts/LocaleContext';
import CenterLabel from '@/components/CenterLabel';
import type { StudentCenterSummary } from '@/services/endpoints/student-self';

interface StudentCentersSectionProps {
  centers: StudentCenterSummary[];
  loading?: boolean;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function StudentCentersSection({ centers, loading }: StudentCentersSectionProps) {
  const { t } = useLocale();

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="mb-3 font-display text-lg font-semibold">{t('student.myCenters')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  if (centers.length === 0) return null;

  const multiCenter = centers.length > 1;
  const defaultOpen = centers.length === 1 ? [String(centers[0].center_id)] : [];

  return (
    <div className="mb-6">
      <h2 className="mb-3 font-display text-lg font-semibold">{t('student.myCenters')}</h2>
      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className={
          multiCenter
            ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-3'
        }
      >
        {centers.map(center => {
          const profile = center.profile;
          const stats = center.stats;
          const enrollment = [profile?.grade_name, profile?.class_name, profile?.section_name].filter(Boolean).join(' · ');
          const location = [center.address, center.city].filter(Boolean).join(', ');

          return (
            <AccordionItem
              key={String(center.center_id)}
              value={String(center.center_id)}
              className="min-w-0 overflow-hidden rounded-xl border border-border border-b bg-card shadow-card"
            >
              <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-muted/20 sm:px-4 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/60">
                <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-start sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-2 font-display font-semibold">{center.center_name}</span>
                      {multiCenter ? null : <CenterLabel name={center.center_name} />}
                    </div>
                    {center.center_slug ? (
                      <p className="truncate text-xs text-muted-foreground">{center.center_slug}</p>
                    ) : null}
                    {enrollment ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{enrollment}</p>
                    ) : null}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-3 pb-4 sm:px-4">
                {profile ? (
                  <div className="mb-3 rounded-lg bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t('student.enrollment')}</p>
                    <p className="text-sm font-medium">{profile.name}</p>
                    {enrollment ? (
                      <p className="text-xs text-muted-foreground">{enrollment}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mb-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('student.centerInfo')}
                  </p>
                  <InfoRow icon={Mail} label={t('col.email')} value={center.email} />
                  <InfoRow icon={Phone} label={t('col.phone')} value={center.phone} />
                  <InfoRow icon={MapPin} label={t('col.address')} value={location || center.address} />
                </div>

                {stats ? (
                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-2 py-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('nav.mySessions')}</p>
                        <p className="text-sm font-semibold tabular-nums">{stats.sessions_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-2 py-1.5">
                      <CalendarCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('stat.attendanceRate')}</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {stats.attendance_rate != null ? `${stats.attendance_rate}%` : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-2 py-1.5">
                      <Trophy className="h-3.5 w-3.5 text-warning" aria-hidden />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('stat.gpa')}</p>
                        <p className="text-sm font-semibold tabular-nums">{stats.gpa ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-2 py-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-primary" aria-hidden />
                      <div>
                        <p className="text-[10px] text-muted-foreground">{t('stat.pendingHomework')}</p>
                        <p className="text-sm font-semibold tabular-nums">{stats.pending_homework}</p>
                      </div>
                    </div>
                    {stats.library_items > 0 ? (
                      <div className="col-span-2 flex items-center gap-2 rounded-lg bg-muted/20 px-2 py-1.5">
                        <Library className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{t('nav.library')}</p>
                          <p className="text-sm font-semibold tabular-nums">{stats.library_items}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
