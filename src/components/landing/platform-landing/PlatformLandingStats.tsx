import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { BookOpenCheck, GraduationCap, School2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/endpoints/public';
import { useLocale } from '@/contexts/LocaleContext';
import { useLandingBrand } from './useLandingBrand';
import PlatformLandingCentersMarquee from './PlatformLandingCentersMarquee';
import { cn } from '@/lib/utils';

interface StatItem {
  key: string;
  value: number;
  label: string;
  description: string;
  icon: LucideIcon;
}

function AnimatedCounter({
  value,
  locale,
  color,
  loading,
}: {
  value: number;
  locale: string;
  color: string;
  loading: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, latest => Math.round(latest));
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    return rounded.on('change', latest => {
      setDisplay(latest.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US'));
    });
  }, [rounded, locale]);

  useEffect(() => {
    if (loading) {
      setDisplay('—');
      return;
    }
    if (!isInView) {
      return;
    }
    motionValue.set(0);
    const controls = animate(motionValue, value, {
      duration: 2.4,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [isInView, value, motionValue, loading]);

  return (
    <span ref={ref} className="tabular-nums" style={{ color }}>
      {display}
    </span>
  );
}

function StatSkeleton({ brand }: { brand: ReturnType<typeof useLandingBrand> }) {
  return (
    <div className="flex animate-pulse flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="h-16 w-16 rounded-2xl" style={{ backgroundColor: brand.redSoft }} />
      <div className="space-y-2 text-center sm:text-start">
        <div className="mx-auto h-9 w-20 rounded-md bg-gray-200/80 sm:mx-0" />
        <div className="mx-auto h-4 w-28 rounded-md bg-gray-200/60 sm:mx-0" />
      </div>
    </div>
  );
}

export default function PlatformLandingStats() {
  const { locale } = useLocale();
  const brand = useLandingBrand();
  const isAr = locale === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['public-platform-stats'],
    queryFn: () => publicApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  const items: StatItem[] = [
    {
      key: 'centers',
      value: data?.centers ?? 0,
      label: isAr ? 'مركز تعليمي' : 'Educational centers',
      description: isAr ? 'مراكز نشطة على المنصة' : 'Active centers on the platform',
      icon: School2,
    },
    {
      key: 'students',
      value: data?.students ?? 0,
      label: isAr ? 'طالب مسجّل' : 'Registered students',
      description: isAr ? 'طلاب عبر جميع المراكز' : 'Students across all centers',
      icon: GraduationCap,
    },
    {
      key: 'teachers',
      value: data?.teachers ?? 0,
      label: isAr ? 'معلم ومعلّمة' : 'Teachers & educators',
      description: isAr ? 'معلمون يستخدمون المنصة يومياً' : 'Educators using the platform daily',
      icon: BookOpenCheck,
    },
  ];

  return (
    <section
      className="relative overflow-hidden border-y py-12 sm:py-14"
      style={{
        backgroundColor: 'white',
        borderColor: brand.border,
      }}
      aria-label={isAr ? 'إحصائيات المنصة' : 'Platform statistics'}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${brand.redSoft}, transparent 55%), radial-gradient(circle at 80% 50%, ${brand.redMuted}, transparent 50%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: brand.red }}
          >
            {isAr ? 'أرقام المنصة' : 'Platform at a glance'}
          </p>
          <h2
            className="mt-2 text-balance text-xl font-bold sm:text-2xl"
            style={{ color: brand.text }}
          >
            {isAr
              ? 'نمو حقيقي مع مراكز تعليمية في جميع أنحاء مصر'
              : 'Real growth with educational centers across Egypt'}
          </h2>
        </motion.div>

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} brand={brand} />)
            : items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.article
                    key={item.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ delay: index * 0.12, duration: 0.5 }}
                    className={cn(
                      'relative flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-start',
                      index > 0 && 'sm:border-s sm:ps-6 lg:ps-8',
                    )}
                    style={index > 0 ? { borderColor: brand.border } : undefined}
                  >
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-sm"
                      style={{
                        backgroundColor: brand.surface,
                        borderColor: brand.border,
                        color: brand.red,
                        boxShadow: `0 8px 24px ${brand.redSoft}`,
                      }}
                    >
                      <Icon className="h-8 w-8 stroke-[1.65]" aria-hidden />
                    </div>

                    <div className="min-w-0">
                      <p className="text-4xl font-extrabold leading-none tracking-tight sm:text-[2.75rem]">
                        <AnimatedCounter
                          value={item.value}
                          locale={locale}
                          color={brand.red}
                          loading={isLoading}
                        />
                        <span className="ms-0.5 text-2xl font-bold sm:text-3xl" style={{ color: brand.redDark }}>
                          +
                        </span>
                      </p>
                      <p className="mt-2 text-base font-semibold" style={{ color: brand.text }}>
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: brand.textMuted }}>
                        {item.description}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
        </div>

        <PlatformLandingCentersMarquee />
      </div>
    </section>
  );
}
