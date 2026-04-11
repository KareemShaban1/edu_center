import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { useQuery } from '@tanstack/react-query';
import { platformApi } from '@/services/endpoints/platform';
import type { ActivityLog } from '@/types/models';
import { useLocale } from '@/contexts/LocaleContext';

export default function PlatformLogs() {
  const { t } = useLocale();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-logs'],
    queryFn: () => platformApi.listActivityLogs(),
  });

  const columns: CrudColumn<ActivityLog>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'description', label: t('col.action'), sortable: true },
    { key: 'causer_id', label: t('col.user'), render: a => a.causer_id ? `User #${a.causer_id}` : 'System' },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  return (
    <CrudPage<ActivityLog>
      title={t('nav.activityLogs')}
      description={t('page.logs.desc')}
      columns={columns}
      data={isLoading ? [] : data}
      searchKeys={['description']}
      readOnly
    />
  );
}
