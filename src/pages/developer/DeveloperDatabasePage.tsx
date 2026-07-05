import DeveloperDatabaseSection from '@/components/developer/DeveloperDatabaseSection';
import { useLocale } from '@/contexts/LocaleContext';

export default function DeveloperDatabasePage() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('developer.tab.database')}</h1>
        <p className="page-description">{t('developer.db.pageDesc')}</p>
      </div>
      <DeveloperDatabaseSection />
    </div>
  );
}
