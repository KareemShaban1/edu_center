import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, ArrowRight, ChevronDown, List } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const USER_GUIDE_FILE = '13-user-guide.md';

interface GuideHeading {
  level: 2 | 3;
  text: string;
  id: string;
}

interface GuideSection {
  text: string;
  id: string;
  items: GuideHeading[];
}

async function fetchUserGuide(): Promise<string> {
  const res = await fetch(`/docs/${USER_GUIDE_FILE}`);
  if (!res.ok) {
    throw new Error('تعذر تحميل الدليل');
  }
  return res.text();
}

function slugifyHeading(text: string): string {
  return text
    .trim()
    .replace(/\s*\{#[^}]+\}\s*$/, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '');
}

function parseHeadingMeta(raw: string): { text: string; id: string } {
  const match = raw.trim().match(/^(.*?)\s*\{#([^}]+)\}\s*$/);
  if (match) {
    return { text: match[1].trim(), id: match[2].trim() };
  }
  const text = raw.trim();
  return { text, id: slugifyHeading(text) };
}

function extractText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    return extractText(props?.children);
  }
  return '';
}

function parseGuideOutline(markdown: string): GuideSection[] {
  const sections: GuideSection[] = [];
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const meta = parseHeadingMeta(h2[1]);
      if (meta.text === 'الفهرس') continue;
      sections.push({ ...meta, items: [] });
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3 && sections.length > 0) {
      sections[sections.length - 1].items.push({
        level: 3,
        ...parseHeadingMeta(h3[1]),
      });
    }
  }

  return sections;
}

function stripIndexSection(markdown: string): string {
  return markdown.replace(/^## الفهرس[\s\S]*?(?=^## )/m, '');
}

export default function UserGuidePage() {
  const { setLocale, t } = useLocale();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocale('ar');
  }, [setLocale]);

  const { data: markdown, isLoading, isError } = useQuery({
    queryKey: ['user-guide', USER_GUIDE_FILE],
    queryFn: fetchUserGuide,
    staleTime: 5 * 60 * 1000,
  });

  const outline = useMemo(() => parseGuideOutline(markdown ?? ''), [markdown]);
  const resolvedMarkdown = useMemo(
    () => stripIndexSection(markdown ?? ''),
    [markdown],
  );

  useEffect(() => {
    if (outline.length === 0) return;
    setOpenSections(prev => {
      const next = { ...prev };
      for (const section of outline) {
        if (next[section.id] === undefined) {
          next[section.id] = section.text.includes('لوحة');
        }
      }
      return next;
    });
  }, [outline]);

  const markdownComponents = useMemo(
    () => ({
      h2: ({ children }: { children?: React.ReactNode }) => {
        const meta = parseHeadingMeta(extractText(children));
        return (
          <h2 id={meta.id} className="scroll-mt-28">
            {meta.text}
          </h2>
        );
      },
      h3: ({ children }: { children?: React.ReactNode }) => {
        const meta = parseHeadingMeta(extractText(children));
        return (
          <h3 id={meta.id} className="scroll-mt-28">
            {meta.text}
          </h3>
        );
      },
    }),
    [],
  );

  return (
    <div dir="rtl" lang="ar" className={cn('min-h-screen bg-[#FAFAFA] font-arabic')}>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-gray-900 hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <GraduationCap className="h-4 w-4" aria-hidden />
            </div>
            <span className="font-bold">{t('app.name')}</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">دليل استخدام المنصة</h1>
          <p className="mt-2 text-gray-600">
            شرح بسيط لكل صفحة في المنصة — للإدارة والمعلمين والطلاب وأولياء الأمور.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <List className="h-4 w-4 text-primary" aria-hidden />
                محتويات الدليل
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-5/6" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <nav className="space-y-1" aria-label="فهرس الدليل">
                  {outline.map(section => {
                    const hasItems = section.items.length > 0;
                    const open = openSections[section.id] ?? false;

                    if (!hasItems) {
                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                          {section.text}
                        </a>
                      );
                    }

                    return (
                      <Collapsible
                        key={section.id}
                        open={open}
                        onOpenChange={value => setOpenSections(prev => ({ ...prev, [section.id]: value }))}
                      >
                        <div className="flex items-center gap-1">
                          <a
                            href={`#${section.id}`}
                            className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                          >
                            {section.text}
                          </a>
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="rounded-md p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
                              aria-label={open ? 'إخفاء العناصر' : 'عرض العناصر'}
                            >
                              <ChevronDown
                                className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
                              />
                            </button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <ul className="mb-2 me-2 space-y-0.5 border-e border-gray-100 pe-2">
                            {section.items.map(item => (
                              <li key={`${section.id}-${item.id}`}>
                                <a
                                  href={`#${item.id}`}
                                  className="block rounded-md px-3 py-1.5 text-xs text-gray-600 transition hover:bg-primary/5 hover:text-primary"
                                >
                                  {item.text}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </nav>
              )}
            </div>
          </aside>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
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
                <p className="font-medium text-destructive">تعذر تحميل الدليل</p>
                <p className="mt-1 text-muted-foreground">حاول تحديث الصفحة. إذا استمرت المشكلة، تواصل مع إدارة المركز.</p>
              </div>
            )}
            {!isLoading && !isError && markdown && (
              <article className="prose prose-slate max-w-none prose-headings:scroll-mt-28 prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-a:text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {resolvedMarkdown}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6">
          © {new Date().getFullYear()} {t('app.name')}.{' '}
          <Link to="/" className="text-primary hover:underline">
            العودة للرئيسية
          </Link>
        </div>
      </footer>
    </div>
  );
}
