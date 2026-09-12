import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';

const FRONTEND_TESTS = [
  'src/lib/routes.test.ts',
  'src/lib/api-test-suite.test.ts',
  'src/config/manual-test-plan.test.ts',
];

const BACKEND_TESTS = [
  'backend/tests/Feature/Api/ApiRouteCatalogTest.php',
  'backend/tests/Feature/Api/PublicApiTest.php',
  'backend/tests/Feature/Api/AuthApiTest.php',
  'backend/tests/Feature/Api/ProtectedApiUnauthenticatedTest.php',
];

export default function AutomatedTestsPanel() {
  const { t } = useLocale();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('testing.automated.commands')}</CardTitle>
          <CardDescription>{t('testing.automated.note')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">npm test</pre>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">npm run test:backend</pre>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">npm run test:all</pre>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">cd backend && php artisan test --filter=Api</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('testing.automated.frontend')}</CardTitle>
          <CardDescription>Vitest · jsdom</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 font-mono text-xs text-muted-foreground">
            {FRONTEND_TESTS.map(file => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('testing.automated.backend')}</CardTitle>
          <CardDescription>PHPUnit · Laravel feature tests for every API route</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 font-mono text-xs text-muted-foreground sm:grid-cols-2">
            {BACKEND_TESTS.map(file => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
