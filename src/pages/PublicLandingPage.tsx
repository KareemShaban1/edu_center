import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicLandingApi } from '@/services/endpoints/admin-landing';
import { LandingPageRenderer } from '@/components/landing-builder/LandingPageRenderer';
import { useLocale } from '@/contexts/LocaleContext';
import { getPublicLandingPath, parsePublicLandingRoute, resolvePublicLandingTenant } from '@/lib/tenant-routes';

export default function PublicLandingPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { locale, t } = useLocale();

  const { tenantSlug: tenantFromPath, slug } = parsePublicLandingRoute(location.pathname);
  const tenantSlug = resolvePublicLandingTenant(tenantFromPath);
  const preview = searchParams.get('preview') === '1';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-landing', tenantSlug, slug, preview],
    queryFn: () => publicLandingApi.getBySlug(slug, { tenantSlug, preview }),
    enabled: !!slug,
  });

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">{t('landing.publicNotFound')}</p>
          <Link to="/" className="text-primary underline">{t('landing.returnHome')}</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('landing.loading')}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold">{t('landing.publicLoadError')}</h1>
          <p className="text-muted-foreground">{t('landing.publicLoadErrorHint')}</p>
          <Link to={getPublicLandingPath(slug, tenantSlug, { preview })} className="text-primary underline">
            {t('landing.retry')}
          </Link>
        </div>
      </div>
    );
  }

  const page = data?.page;
  if (!page) {
    const isUnpublished = data?.reason === 'unpublished';
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">
            {isUnpublished ? t('landing.publicUnpublished') : t('landing.publicNotFound')}
          </p>
          {!preview && isUnpublished && (
            <p className="text-sm text-muted-foreground">{t('landing.publicUnpublishedHint')}</p>
          )}
          <Link to="/" className="text-primary underline">{t('landing.returnHome')}</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {preview && page.status !== 'published' && (
        <div className="bg-amber-500 text-white text-center text-sm py-2 px-4">
          {t('landing.previewDraftBanner')}
        </div>
      )}
      <LandingPageRenderer page={page} locale={locale} />
    </>
  );
}
