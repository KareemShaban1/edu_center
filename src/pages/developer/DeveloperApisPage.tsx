import DeveloperApisSection from '@/components/developer/DeveloperApisSection';
import { useLocale } from '@/contexts/LocaleContext';

export default function DeveloperApisPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('developer.tab.apis')}</h1>
        <p className="page-description">{t('developer.api.detailsDesc')}</p>
      </div>
      <DeveloperApisSection />
    </div>
  );
}
