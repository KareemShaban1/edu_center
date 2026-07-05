import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { PLATFORM_DOCUMENTATION, getDeveloperDocUrl } from '@/config/platform-documentation';
import { fetchDocsManifest } from '@/lib/developer-api-catalog';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Route,
} from 'lucide-react';

const generatedDocs = [
  { file: 'generated/api-routes.md', labelKey: 'developer.generated.apiRoutes' },
  { file: 'generated/frontend-routes.md', labelKey: 'developer.generated.frontendRoutes' },
  { file: 'generated/database-tables.md', labelKey: 'developer.generated.databaseTables' },
];

export default function DeveloperOverviewSection() {
  const { t } = useLocale();
  const { data: manifest, isLoading, isError } = useQuery({
    queryKey: ['developer-docs-manifest'],
    queryFn: fetchDocsManifest,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title={t('developer.stat.apiRoutes')}
              value={manifest?.apiRouteCount ?? '—'}
              icon={Code2}
            />
            <StatCard
              title={t('developer.stat.frontendRoutes')}
              value={manifest?.frontendRouteCount ?? '—'}
              icon={Route}
              variant="attendance"
            />
            <StatCard
              title={t('developer.stat.dbTables')}
              value={manifest?.migrationTableCount ?? '—'}
              icon={Database}
              variant="finance"
            />
            <StatCard
              title={t('developer.stat.endpointModules')}
              value={manifest?.endpointModules.length ?? '—'}
              icon={Layers}
              variant="exams"
            />
          </>
        )}
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {t('developer.manifestError')}
        </div>
      )}

      {manifest && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                {t('developer.syncInfo')}
              </CardTitle>
              <CardDescription>
                {t('developer.syncedAtLabel')}: {new Date(manifest.syncedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="mb-2 font-medium">{t('developer.userRoles')}</p>
                <div className="flex flex-wrap gap-2">
                  {manifest.userRoles.map(role => (
                    <span
                      key={role}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-medium">{t('developer.endpointModules')}</p>
                <div className="flex flex-wrap gap-2">
                  {manifest.endpointModules.map(mod => (
                    <span
                      key={mod}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground">
                {t('developer.scopedTables').replace('{count}', String(manifest.scopedTableCount))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                {t('developer.generatedDocs')}
              </CardTitle>
              <CardDescription>{t('developer.generatedDocsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {generatedDocs.map(doc => (
                <Button
                  key={doc.file}
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  asChild
                >
                  <a href={`/docs/${doc.file}`} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t(doc.labelKey)}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            {t('developer.documentationCatalog')}
          </CardTitle>
          <CardDescription>{t('developer.documentationCatalogDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PLATFORM_DOCUMENTATION.map(doc => (
              <Link
                key={doc.id}
                to={getDeveloperDocUrl(doc.id)}
                className="group rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2 group-hover:bg-primary/10">
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{t(doc.titleKey)}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {t(doc.descriptionKey)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Button className="mt-4" variant="outline" asChild>
            <Link to={getDeveloperDocUrl('index')}>
              <BookOpen className="h-4 w-4 me-2" />
              {t('developer.openDocumentationViewer')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
