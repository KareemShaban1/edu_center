import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { dateOnly, uniqueSorted } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import StudentCenterTabsBar from '@/components/student/StudentCenterTabsBar';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { useStudentCenterTabs } from '@/hooks/use-student-center-tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CenterScopedRow } from '@/types/models';

interface SessionRow extends CenterScopedRow {
  id: number;
  topic: string;
  teacher: string;
  start_at: string;
  duration: number;
  provider: string;
  room_slug?: string;
  join_url?: string;
  moderator_url?: string;
  password?: string;
  record_enabled?: boolean;
  livekit_url?: string;
  external_ref?: string;
  location?: string;
  notes?: string;
}

function SessionShowDialog({ item, onClose }: { item: SessionRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.mySessions')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.title')}:</strong> {item.topic}</p>
          <p><strong>{t('col.teacher')}:</strong> {item.teacher}</p>
          <p><strong>{t('col.startDate')}:</strong> {item.start_at}</p>
          <p><strong>{t('col.durationMinutes')}:</strong> {item.duration}</p>
          <p><strong>{t('col.provider')}:</strong> {item.provider}</p>
          {item.provider === 'offline' ? (
            <>
              <p><strong>Location:</strong> {item.location || '—'}</p>
              <p><strong>Notes:</strong> {item.notes || '—'}</p>
            </>
          ) : (
            <p><strong>Join URL:</strong> {(item.join_url && item.join_url !== '#') ? item.join_url : '—'}</p>
          )}
          {item.provider === 'livekit' && (
            <p>
              <Button asChild variant="secondary" size="sm">
                <Link to={`/student/sessions/${item.id}/livekit`}>{t('sessions.openLiveKit')}</Link>
              </Button>
            </p>
          )}
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentSessions() {
  const { t } = useLocale();
  const { data } = useStudentBootstrap();
  const [showItem, setShowItem] = useState<SessionRow | null>(null);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const rows = (data?.sessions || []) as SessionRow[];
  const {
    centerOptions,
    selectedCenterId,
    setSelectedCenterId,
    showCenterTabs,
    scopedRows,
  } = useStudentCenterTabs(data?.centers, rows);

  const teachers = useMemo(() => uniqueSorted(scopedRows.map(r => r.teacher)), [scopedRows]);
  const providers = useMemo(() => uniqueSorted(scopedRows.map(r => r.provider)), [scopedRows]);

  const filteredRows = useMemo(() => {
    return scopedRows.filter(row => {
      if (teacherFilter && row.teacher !== teacherFilter) return false;
      if (providerFilter && row.provider !== providerFilter) return false;
      if (dateFilter && dateOnly(row.start_at) !== dateFilter) return false;
      return true;
    });
  }, [scopedRows, teacherFilter, providerFilter, dateFilter]);

  const appliedFilters = [teacherFilter, providerFilter, dateFilter].filter(Boolean).length;

  const clearFilters = () => {
    setTeacherFilter('');
    setProviderFilter('');
    setDateFilter('');
  };

  const columns: CrudColumn<SessionRow>[] = useMemo(() => {
    const cols: CrudColumn<SessionRow>[] = [];
    if (showCenterTabs) {
      cols.push({ key: 'center_name', label: t('col.center'), render: c => <CenterLabel name={c.center_name} />, hideOnMobile: true });
    }
    cols.push(
      { key: 'topic', label: t('col.title'), sortable: true, primary: true },
      { key: 'teacher', label: t('col.teacher'), hideOnMobile: Boolean(teacherFilter) },
      { key: 'start_at', label: t('col.startDate'), sortable: true },
      { key: 'duration', label: t('col.durationMinutes'), render: c => `${c.duration} min`, hideOnMobile: true },
      { key: 'provider', label: t('col.provider'), hideOnMobile: Boolean(providerFilter) },
      {
        key: '_join',
        label: t('sessions.join'),
        render: c => {
          if (c.provider === 'offline') {
            return <span className="text-xs text-muted-foreground">{c.location || 'Offline'}</span>;
          }
          if (c.provider === 'livekit') {
            return <Link className="text-xs text-primary underline" to={`/student/sessions/${c.id}/livekit`}>{t('sessions.openLiveKit')}</Link>;
          }
          if (c.join_url) {
            return <a className="text-xs text-primary underline" href={c.join_url} target="_blank" rel="noreferrer">{t('sessions.join')}</a>;
          }
          return '—';
        },
      },
      {
        key: '_show',
        label: t('crud.view'),
        render: c => (
          <button type="button" onClick={() => setShowItem(c)} className="rounded-lg border px-2.5 py-1.5 text-xs font-medium">
            {t('crud.view')}
          </button>
        ),
      },
    );
    return cols;
  }, [providerFilter, showCenterTabs, teacherFilter, t]);

  return (
    <>
      <CrudPage<SessionRow>
        title={t('nav.mySessions')}
        description={t('page.studentSessions.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['topic', 'teacher', 'start_at', 'provider', 'center_name']}
        rowKey={c => portalRowKey(c.center_id, c.id)}
        readOnly
        canEdit={false}
        canDelete={false}
        topContent={(
          <>
            <StudentCenterTabsBar
              centers={centerOptions}
              value={selectedCenterId}
              onValueChange={setSelectedCenterId}
            />
            <StudentPageFilterBar
              appliedCount={appliedFilters}
              onClear={clearFilters}
              resultCount={filteredRows.length}
              renderFilters={idPrefix => (
                <>
                  <StudentFilterField id={`${idPrefix}-teacher`} label={t('col.teacher')}>
                    <FormSelect
                      id={`${idPrefix}-teacher`}
                      title={t('col.teacher')}
                      value={teacherFilter}
                      onChange={e => setTeacherFilter(e.target.value)}
                    >
                      <option value="">{t('filter.all')}</option>
                      {teachers.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </FormSelect>
                  </StudentFilterField>
                  <StudentFilterField id={`${idPrefix}-provider`} label={t('col.provider')}>
                    <FormSelect
                      id={`${idPrefix}-provider`}
                      title={t('col.provider')}
                      value={providerFilter}
                      onChange={e => setProviderFilter(e.target.value)}
                    >
                      <option value="">{t('filter.all')}</option>
                      {providers.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </FormSelect>
                  </StudentFilterField>
                  <StudentFilterField id={`${idPrefix}-date`} label={t('col.date')}>
                    <FormInput
                      id={`${idPrefix}-date`}
                      type="date"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                    />
                  </StudentFilterField>
                </>
              )}
            />
          </>
        )}
      />
      {showItem && <SessionShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}
