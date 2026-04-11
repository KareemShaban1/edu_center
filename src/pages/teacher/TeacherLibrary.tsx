import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { Download } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';

interface LibRow { id: number; title: string; type: string; grade: string; url?: string | null; }

export default function TeacherLibrary() {
  const { t } = useLocale();
  const { data: bootstrap } = useTeacherBootstrap();
  const data = (bootstrap?.library || []) as LibRow[];
  const columns: CrudColumn<LibRow>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'title', label: t('col.title'), sortable: true },
    { key: 'type', label: t('col.type') },
    { key: 'grade', label: t('col.grade') },
    {
      key: 'download',
      label: '',
      render: (row) => (
        <a
          href={row.url || '#'}
          target="_blank"
          rel="noreferrer"
          className={`rounded-lg p-1.5 inline-flex ${row.url ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40 pointer-events-none'}`}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
      ),
    },
  ];
  return <CrudPage<LibRow> title={t('nav.library')} description={t('page.library.desc')} columns={columns} data={data} searchKeys={['title']} readOnly />;
}
