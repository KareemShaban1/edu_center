import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronDown, ChevronsDownUp, ChevronsUpDown, Circle, ExternalLink, RotateCcw, Search } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MANUAL_TEST_PLAN, countManualTestCases, listManualTestCases } from '@/config/manual-test-plan';
import { getDeveloperDocUrl } from '@/config/platform-documentation';
import { useLocale } from '@/contexts/LocaleContext';
import {
  countDoneCases,
  getManualTestProgress,
  resetManualTestProgress,
  setManualTestCaseDone,
  type ManualTestProgressMap,
} from '@/lib/manual-test-progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const SECTIONS_PER_PAGE = 5;

export default function ManualTestPlanPanel() {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';
  const [progress, setProgress] = useState<ManualTestProgressMap>(() => getManualTestProgress());
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const total = countManualTestCases();
  const done = countDoneCases(progress, listManualTestCases().map(item => item.id));

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MANUAL_TEST_PLAN.map(section => ({
      ...section,
      cases: section.cases.filter(testCase => {
        if (!needle) return true;
        const haystack = [
          testCase.id,
          testCase.titleEn,
          testCase.titleAr,
          testCase.stepsEn,
          testCase.stepsAr,
        ].join(' ').toLowerCase();
        return haystack.includes(needle);
      }),
    })).filter(section => section.cases.length > 0);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(sections.length / SECTIONS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageSections = sections.slice((safePage - 1) * SECTIONS_PER_PAGE, safePage * SECTIONS_PER_PAGE);

  useEffect(() => {
    setPage(1);
    if (!query.trim()) return;
    setOpenSections(prev => {
      const next = { ...prev };
      for (const section of MANUAL_TEST_PLAN) next[section.id] = true;
      return next;
    });
  }, [query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function setPageOpen(open: boolean) {
    setOpenSections(prev => {
      const next = { ...prev };
      for (const section of pageSections) next[section.id] = open;
      return next;
    });
  }

  function isOpen(sectionId: string, indexOnPage: number) {
    return openSections[sectionId] ?? indexOnPage === 0;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{t('testing.manual.progress')}</p>
            <span className="text-sm text-muted-foreground">{done}/{total}</span>
          </div>
          <Progress value={total ? Math.round((done / total) * 100) : 0} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={getDeveloperDocUrl('manual-test-plan')}>
              <ExternalLink className="h-4 w-4 me-2" />
              {t('testing.manual.openDoc')}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (window.confirm(t('testing.manual.resetConfirm'))) {
                setProgress(resetManualTestProgress());
              }
            }}
          >
            <RotateCcw className="h-4 w-4 me-2" />
            {t('testing.manual.reset')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('testing.manual.search')}
            className="ps-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setPageOpen(true)}>
            <ChevronsUpDown className="h-4 w-4 me-2" />
            {t('testing.expandAll')}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPageOpen(false)}>
            <ChevronsDownUp className="h-4 w-4 me-2" />
            {t('testing.collapseAll')}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {pageSections.map((section, index) => {
          const sectionDone = section.cases.filter(testCase => progress[testCase.id]?.done).length;
          const open = isOpen(section.id, index);
          return (
            <Collapsible
              key={section.id}
              open={open}
              onOpenChange={next => setOpenSections(prev => ({ ...prev, [section.id]: next }))}
            >
              <section className="rounded-xl border border-border bg-card shadow-card">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-start"
                    aria-expanded={open}
                  >
                    <h2 className="font-display text-lg font-semibold">{isAr ? section.titleAr : section.titleEn}</h2>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{sectionDone}/{section.cases.length}</Badge>
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 px-4 pb-4">
                    {section.cases.map(testCase => {
                      const checked = Boolean(progress[testCase.id]?.done);
                      return (
                        <label
                          key={testCase.id}
                          className={cn(
                            'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
                            checked ? 'border-success/30 bg-success/5' : 'border-border bg-background',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={value => setProgress(setManualTestCaseDone(testCase.id, value === true))}
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{testCase.id}</span>
                              {checked ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <p className="font-medium">{isAr ? testCase.titleAr : testCase.titleEn}</p>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {isAr ? testCase.stepsAr : testCase.stepsEn}
                            </p>
                            <p className="mt-1 text-sm">
                              <span className="font-medium">{t('testing.manual.expected')}: </span>
                              {isAr ? testCase.expectedAr : testCase.expectedEn}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </section>
            </Collapsible>
          );
        })}
      </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={sections.length}
        perPage={SECTIONS_PER_PAGE}
      />
    </div>
  );
}
