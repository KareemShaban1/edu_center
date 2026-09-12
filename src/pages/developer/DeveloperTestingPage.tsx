import AutomatedTestsPanel from '@/components/platform-testing/AutomatedTestsPanel';
import ApiTestSuitePanel from '@/components/platform-testing/ApiTestSuitePanel';
import ManualTestPlanPanel from '@/components/platform-testing/ManualTestPlanPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { countManualTestCases } from '@/config/manual-test-plan';
import { useLocale } from '@/contexts/LocaleContext';

export default function DeveloperTestingPage() {
  const { t } = useLocale();
  const manualCount = countManualTestCases();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('testing.pageTitle')}</h1>
        <p className="page-description">{t('testing.pageDesc')}</p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="manual">{t('testing.tab.manual')} ({manualCount})</TabsTrigger>
          <TabsTrigger value="api">{t('testing.tab.api')}</TabsTrigger>
          <TabsTrigger value="automated">{t('testing.tab.automated')}</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <ManualTestPlanPanel />
        </TabsContent>
        <TabsContent value="api">
          <ApiTestSuitePanel />
        </TabsContent>
        <TabsContent value="automated">
          <AutomatedTestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
