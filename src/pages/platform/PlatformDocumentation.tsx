import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import {
  DEFAULT_PLATFORM_DOC_ID,
  PLATFORM_DOCUMENTATION,
  getPlatformDocById,
  getPlatformDocUrl,
} from '@/config/platform-documentation';
import { cn } from '@/lib/utils';
import { BookOpen, ExternalLink, FileText } from 'lucide-react';

async function fetchDocMarkdown(file: string): Promise<string> {
  const res = await fetch(`/docs/${file}`);
  if (!res.ok) {
    throw new Error(`Failed to load documentation (${res.status})`);
  }
  return res.text();
}

function DocMarkdownLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  if (!href) return <span>{children}</span>;

  const normalized = href.replace(/^\.\//, '');
  const doc = PLATFORM_DOCUMENTATION.find(
    d => d.file === normalized || href.endsWith(`/${d.file}`),
  );
  if (doc) {
    return (
      <Link to={getPlatformDocUrl(doc.id)} className="text-primary underline-offset-4 hover:underline">
        {children}
      </Link>
    );
  }

  if (href.startsWith('http') || href.startsWith('/')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
        {children}
      </a>
    );
  }

  return <span>{children}</span>;
}

export default function PlatformDocumentation() {
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const activeDoc = getPlatformDocById(docId || DEFAULT_PLATFORM_DOC_ID);

  const { data: markdown, isLoading, isError, error } = useQuery({
    queryKey: ['platform-documentation', activeDoc.file],
    queryFn: () => fetchDocMarkdown(activeDoc.file),
    staleTime: 5 * 60 * 1000,
  });

  const resolvedMarkdown = useMemo(() => {
    if (!markdown) return '';
    return markdown.replace(/\]\(\.\/generated\//g, '](/docs/generated/');
  }, [markdown]);

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">{t('docs.pageTitle')}</h1>
          <p className="page-description">{t('docs.pageDesc')}</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" asChild>
          <a href={`/docs/${activeDoc.file}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 me-2" />
            {t('docs.openRaw')}
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              {t('docs.catalog')}
            </CardTitle>
            <CardDescription>{t('docs.catalogDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[min(420px,50vh)] px-4 pb-4">
              <nav className="space-y-1">
                {PLATFORM_DOCUMENTATION.map(doc => {
                  const isActive = doc.id === activeDoc.id;
                  return (
                    <Link
                      key={doc.id}
                      to={getPlatformDocUrl(doc.id)}
                      className={cn(
                        'flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t(doc.titleKey)}</span>
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle>{t(activeDoc.titleKey)}</CardTitle>
            <CardDescription>{t(activeDoc.descriptionKey)}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[min(70vh,900px)]">
              <div className="p-6">
                {isLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                )}
                {isError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <p className="font-medium text-destructive">{t('docs.loadError')}</p>
                    <p className="mt-1 text-muted-foreground">
                      {(error as Error)?.message || t('docs.loadErrorHint')}
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(getPlatformDocUrl(DEFAULT_PLATFORM_DOC_ID))}
                    >
                      {t('docs.retry')}
                    </Button>
                  </div>
                )}
                {!isLoading && !isError && markdown && (
                  <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary prose-pre:bg-muted prose-pre:text-foreground">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: DocMarkdownLink,
                      }}
                    >
                      {resolvedMarkdown}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
