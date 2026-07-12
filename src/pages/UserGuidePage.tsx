import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const USER_GUIDE_FILE = '13-user-guide.md';

async function fetchUserGuide(): Promise<string> {
  const res = await fetch(`/docs/${USER_GUIDE_FILE}`);
  if (!res.ok) {
    throw new Error('تعذر تحميل الدليل');
  }
  return res.text();
}

export default function UserGuidePage() {
  const { setLocale, t } = useLocale();

  useEffect(() => {
    setLocale('ar');
  }, [setLocale]);

  const { data: markdown, isLoading, isError } = useQuery({
    queryKey: ['user-guide', USER_GUIDE_FILE],
    queryFn: fetchUserGuide,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedMarkdown = useMemo(() => markdown ?? '', [markdown]);

  return (
    <div dir="rtl" lang="ar" className={cn('min-h-screen bg-[#FAFAFA] font-arabic')}>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">دليل استخدام المنصة</h1>
          <p className="mt-2 text-gray-600">
            شرح بسيط لكل صفحة في المنصة — للإدارة والمعلمين والطلاب وأولياء الأمور.
          </p>
        </div>

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
            <article className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{resolvedMarkdown}</ReactMarkdown>
            </article>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-gray-500 sm:px-6">
          © {new Date().getFullYear()} {t('app.name')}.{' '}
          <Link to="/" className="text-primary hover:underline">
            العودة للرئيسية
          </Link>
        </div>
      </footer>
    </div>
  );
}
