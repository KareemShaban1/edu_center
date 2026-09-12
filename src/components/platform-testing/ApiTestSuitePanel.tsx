import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Loader2, Play, Square } from 'lucide-react';
import ApiMethodBadge from '@/components/developer/ApiMethodBadge';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/contexts/LocaleContext';
import { fetchApiRoutesCatalog } from '@/lib/developer-api-catalog';
import {
  runApiSuite,
  summarizeApiSuite,
  type ApiSuiteCaseResult,
  type ApiSuiteMode,
} from '@/lib/api-test-suite';
import { cn } from '@/lib/utils';

const GROUPS_PER_PAGE = 5;

function routeGroupKey(path: string): string {
  const segments = path.replace(/\{[^}]+\}/g, '').split('/').filter(Boolean);
  if (segments.length === 0) return 'root';
  if (segments.length === 1) return segments[0];
  return `${segments[0]}/${segments[1]}`;
}

function verdictClass(verdict: ApiSuiteCaseResult['verdict']) {
  if (verdict === 'pass') return 'bg-success/10 text-success';
  if (verdict === 'fail') return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
}

export default function ApiTestSuitePanel() {
  const { t } = useLocale();
  const [results, setResults] = useState<ApiSuiteCaseResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);

  const { data, isError, isLoading } = useQuery({
    queryKey: ['api-routes-catalog'],
    queryFn: fetchApiRoutesCatalog,
    staleTime: 5 * 60 * 1000,
  });

  const routes = data?.routes ?? [];
  const summary = useMemo(() => summarizeApiSuite(results), [results]);

  const groups = useMemo(() => {
    const map = new Map<string, ApiSuiteCaseResult[]>();
    for (const result of results) {
      const key = routeGroupKey(result.path);
      const list = map.get(key) ?? [];
      list.push(result);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, items]) => ({
      key,
      items,
      fails: items.filter(item => item.verdict === 'fail').length,
    }));
  }, [results]);

  const totalPages = Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageGroups = groups.slice((safePage - 1) * GROUPS_PER_PAGE, safePage * GROUPS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!running) return;
    setPage(Math.max(1, Math.ceil(groups.length / GROUPS_PER_PAGE)));
  }, [groups.length, running]);

  async function run(mode: ApiSuiteMode) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setResults([]);
    setCurrentIndex(0);
    setTotal(routes.length);
    setPage(1);
    setOpenGroups({});
    try {
      await runApiSuite(routes, mode, {
        signal: controller.signal,
        onResult: (result, index, count) => {
          setCurrentIndex(index + 1);
          setTotal(count);
          setResults(prev => [...prev, result]);
        },
      });
    } finally {
      setRunning(false);
    }
  }

  function setPageOpen(open: boolean) {
    setOpenGroups(prev => {
      const next = { ...prev };
      for (const group of pageGroups) next[group.key] = open;
      return next;
    });
  }

  function isOpen(group: { key: string; fails: number }, indexOnPage: number) {
    return openGroups[group.key] ?? (group.fails > 0 || indexOnPage === 0);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('testing.api.hint')}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run('unauthenticated')} disabled={running || routes.length === 0}>
          {running ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Play className="h-4 w-4 me-2" />}
          {t('testing.api.runUnauth')}
        </Button>
        <Button type="button" variant="outline" onClick={() => run('authenticated-get')} disabled={running || routes.length === 0}>
          <Play className="h-4 w-4 me-2" />
          {t('testing.api.runAuth')}
        </Button>
        {running ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => abortRef.current?.abort()}
          >
            <Square className="h-4 w-4 me-2" />
            {t('testing.api.stop')}
          </Button>
        ) : null}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">{t('testing.api.loading')}</p> : null}
      {isError ? <p className="text-sm text-destructive">{t('testing.api.empty')}</p> : null}

      {total > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{running ? t('testing.api.running') : t('testing.api.finished')}</span>
            <span className="text-muted-foreground">{currentIndex}/{total}</span>
          </div>
          <Progress value={total ? Math.round((currentIndex / total) * 100) : 0} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-success/10 text-success hover:bg-success/10">{t('testing.api.pass')}: {summary.pass}</Badge>
            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">{t('testing.api.fail')}: {summary.fail}</Badge>
            <Badge variant="secondary">{t('testing.api.skip')}: {summary.skip}</Badge>
          </div>
        </div>
      ) : null}

      {results.length > 0 ? (
        <>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPageOpen(true)}>
              <ChevronsUpDown className="h-4 w-4 me-2" />
              {t('testing.expandAll')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPageOpen(false)}>
              <ChevronsDownUp className="h-4 w-4 me-2" />
              {t('testing.collapseAll')}
            </Button>
          </div>

          <div className="space-y-3">
            {pageGroups.map((group, index) => {
              const open = isOpen(group, index);
              return (
                <Collapsible
                  key={group.key}
                  open={open}
                  onOpenChange={next => setOpenGroups(prev => ({ ...prev, [group.key]: next }))}
                >
                  <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
                        aria-expanded={open}
                      >
                        <span className="font-mono text-sm font-medium">{group.key}</span>
                        <span className="flex items-center gap-2">
                          {group.fails > 0 ? (
                            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">{group.fails}</Badge>
                          ) : null}
                          <Badge variant="secondary">{group.items.length}</Badge>
                          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/60">
                            <tr className="text-start">
                              <th className="px-3 py-2 font-medium">{t('testing.api.col.status')}</th>
                              <th className="px-3 py-2 font-medium">{t('testing.api.col.route')}</th>
                              <th className="px-3 py-2 font-medium">{t('testing.api.col.http')}</th>
                              <th className="px-3 py-2 font-medium">{t('testing.api.col.time')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map(result => (
                              <tr key={result.routeId} className="border-t border-border">
                                <td className="px-3 py-2">
                                  <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', verdictClass(result.verdict))}>
                                    {t(`testing.api.${result.verdict}`)}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <ApiMethodBadge method={result.method} />
                                    <span className="font-mono text-xs">{result.path}</span>
                                  </div>
                                  {result.skipReason || result.error || result.responsePreview ? (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                      {result.skipReason || result.error || result.responsePreview}
                                    </p>
                                  ) : null}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs">{result.status ?? '—'}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {result.durationMs != null ? `${result.durationMs}ms` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={groups.length}
            perPage={GROUPS_PER_PAGE}
          />
        </>
      ) : null}
    </div>
  );
}
