import DeveloperOverviewSection from '@/components/developer/DeveloperOverviewSection';
import { useLocale } from '@/contexts/LocaleContext';

export default function DeveloperOverviewPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('developer.pageTitle')}</h1>
        <p className="page-description">{t('developer.pageDesc')}</p>
      </div>
      <DeveloperOverviewSection />
    </div>
  );
}
