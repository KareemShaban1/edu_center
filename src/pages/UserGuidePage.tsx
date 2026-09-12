import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap,
  ArrowRight,
  ChevronDown,
  List,
  Shield,
  BookOpen,
  User,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useUiIcon } from '@/contexts/UiIconsContext';
import { guideRoleIconKey } from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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

const ROLE_JUMP_META = [
  {
    id: 'لوحة-الإدارة',
    role: 'admin',
    title: 'الإدارة',
    desc: 'الطلاب، الحصص، الحضور، الرسوم، واتساب والتقارير',
    fallback: Shield,
    tone: 'bg-primary/10 text-primary',
  },
  {
    id: 'لوحة-المعلم',
    role: 'teacher',
    title: 'المعلم',
    desc: 'صفوفك، الحضور، الواجبات والاختبارات',
    fallback: BookOpen,
    tone: 'bg-emerald-500/10 text-emerald-700',
  },
  {
    id: 'لوحة-الطالب',
    role: 'student',
    title: 'الطالب',
    desc: 'الحصص، تسليم الواجبات وتسجيل الحضور',
    fallback: User,
    tone: 'bg-sky-500/10 text-sky-700',
  },
  {
    id: 'لوحة-ولي-الأمر',
    role: 'parent',
    title: 'ولي الأمر',
    desc: 'متابعة الأبناء والحضور والرسوم',
    fallback: Users,
    tone: 'bg-amber-500/10 text-amber-700',
  },
] as const;

function GuideRoleJumpCard({
  meta,
}: {
  meta: (typeof ROLE_JUMP_META)[number];
}) {
  const Icon = useUiIcon(guideRoleIconKey(meta.role), meta.fallback);
  return (
    <a
      href={`#${meta.id}`}
      className="group rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition hover:border-primary/30 hover:bg-white hover:shadow-sm"
    >
      <span className={cn('mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl', meta.tone)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-semibold text-gray-900 group-hover:text-primary">{meta.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{meta.desc}</p>
    </a>
  );
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
  const [tocQuery, setTocQuery] = useState('');

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

  const filteredOutline = useMemo(() => {
    const q = tocQuery.trim();
    if (!q) return outline;
    return outline
      .map(section => {
        const sectionMatch = section.text.includes(q);
        const items = section.items.filter(item => item.text.includes(q));
        if (sectionMatch || items.length > 0) {
          return {
            ...section,
            items: sectionMatch ? section.items : items,
          };
        }
        return null;
      })
      .filter((section): section is GuideSection => Boolean(section));
  }, [outline, tocQuery]);

  useEffect(() => {
    if (outline.length === 0) return;
    setOpenSections(prev => {
      const next = { ...prev };
      for (const section of outline) {
        if (next[section.id] === undefined) {
          next[section.id] = section.text.includes('لوحة') || section.text.includes('خطوات');
        }
      }
      return next;
    });
  }, [outline]);

  useEffect(() => {
    if (!tocQuery.trim()) return;
    setOpenSections(prev => {
      const next = { ...prev };
      for (const section of filteredOutline) {
        next[section.id] = true;
      }
      return next;
    });
  }, [tocQuery, filteredOutline]);

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
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="my-6 overflow-x-auto rounded-xl border border-gray-200">
          <table className="m-0 w-full min-w-[28rem] border-0">{children}</table>
        </div>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="not-italic border-primary/30 bg-primary/5 text-gray-700">
          {children}
        </blockquote>
      ),
    }),
    [],
  );

  return (
    <div dir="rtl" lang="ar" className={cn('min-h-screen bg-[#FAFAFA] font-arabic text-[17px] sm:text-[18px]')}>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-gray-900 hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <GraduationCap className="h-4 w-4" aria-hidden />
            </div>
            <span className="text-base font-bold sm:text-lg">{t('app.name')}</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-base font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 sm:p-8">
            <p className="text-sm font-medium text-primary">دليل الاستخدام</p>
            <h1 className="mt-1 text-3xl font-bold leading-snug text-gray-900 sm:text-4xl">
              دليل استخدام المنصة
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-600">
              شرح مفصّل وسهل لكل دور: كيف تبدأ، أين تجد كل صفحة، وأهم الخطوات اليومية
              (الحضور، الواجبات، واتساب، التقارير، والمصاريف).
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 ring-1 ring-gray-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                محدّث حسب آخر المزايا
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 ring-1 ring-gray-200">
                خطوات عملية + حلول للمشاكل الشائعة
              </span>
            </div>
          </div>

          <div className="grid gap-3 border-t border-gray-100 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            {ROLE_JUMP_META.map(role => (
              <GuideRoleJumpCard key={role.id} meta={role} />
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                <List className="h-4 w-4 text-primary" aria-hidden />
                محتويات الدليل
              </div>

              <div className="relative mb-3">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 start-3" />
                <Input
                  value={tocQuery}
                  onChange={e => setTocQuery(e.target.value)}
                  placeholder="ابحث في المحتويات…"
                  className="h-10 bg-gray-50 ps-9"
                  aria-label="ابحث في محتويات الدليل"
                />
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-5/6" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredOutline.length === 0 ? (
                <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">لا نتائج مطابقة.</p>
              ) : (
                <nav className="max-h-[70vh] space-y-1 overflow-y-auto pe-1" aria-label="فهرس الدليل">
                  {filteredOutline.map(section => {
                    const hasItems = section.items.length > 0;
                    const open = openSections[section.id] ?? false;

                    if (!hasItems) {
                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="block rounded-lg px-3 py-2.5 text-base font-medium leading-snug text-gray-800 transition hover:bg-gray-50"
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
                            className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-base font-medium leading-snug text-gray-800 transition hover:bg-gray-50"
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
                                  className="block rounded-md px-3 py-2 text-sm leading-snug text-gray-600 transition hover:bg-primary/5 hover:text-primary"
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

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            )}
            {isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-base">
                <p className="font-medium text-destructive">تعذر تحميل الدليل</p>
                <p className="mt-1 text-muted-foreground">حاول تحديث الصفحة. إذا استمرت المشكلة، تواصل مع إدارة المركز.</p>
              </div>
            )}
            {!isLoading && !isError && markdown && (
              <article
                className={cn(
                  'prose prose-slate max-w-none prose-lg sm:prose-xl',
                  'prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:leading-snug',
                  'prose-p:leading-8 prose-li:leading-8',
                  'prose-img:rounded-xl prose-img:border prose-img:border-gray-200',
                  'prose-a:text-primary',
                  'prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2',
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {resolvedMarkdown}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-base text-gray-500 sm:px-6">
          © {new Date().getFullYear()} {t('app.name')}.{' '}
          <Link to="/" className="text-primary hover:underline">
            العودة للرئيسية
          </Link>
        </div>
      </footer>
    </div>
  );
}
