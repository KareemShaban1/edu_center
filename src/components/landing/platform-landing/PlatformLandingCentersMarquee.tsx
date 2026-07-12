import { useEffect, useMemo, useRef, useState } from 'react';
import { School2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicCenter } from '@/services/endpoints/public';
import { useLocale } from '@/contexts/LocaleContext';
import { useLandingBrand } from './useLandingBrand';
import { cn } from '@/lib/utils';

function dedupeCenters(centers: PublicCenter[]): PublicCenter[] {
  const seen = new Set<number>();
  return centers.filter(center => {
    if (seen.has(center.id)) {
      return false;
    }
    seen.add(center.id);
    return true;
  });
}

function CenterNameChip({
  center,
  brand,
}: {
  center: PublicCenter;
  brand: ReturnType<typeof useLandingBrand>;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm"
      style={{
        backgroundColor: brand.surface,
        borderColor: brand.border,
        color: brand.text,
      }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: brand.redSoft, color: brand.red }}
      >
        <School2 className="h-4 w-4 stroke-[1.75]" aria-hidden />
      </span>
      {center.name}
    </span>
  );
}

function MarqueeSkeleton({ brand }: { brand: ReturnType<typeof useLandingBrand> }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-11 w-44 shrink-0 animate-pulse rounded-full"
          style={{ backgroundColor: brand.redSoft }}
        />
      ))}
    </div>
  );
}

export default function PlatformLandingCentersMarquee() {
  const { locale, dir } = useLocale();
  const brand = useLandingBrand();
  const isAr = locale === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['public-centers'],
    queryFn: () => publicApi.listCenters(),
    staleTime: 5 * 60 * 1000,
  });

  const uniqueCenters = useMemo(() => dedupeCenters(centers), [centers]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const updateWidth = () => setContainerWidth(node.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const estimatedTrackWidth = uniqueCenters.length * 196;
  const shouldAnimate = uniqueCenters.length > 1 && containerWidth > 0 && estimatedTrackWidth > containerWidth;
  const marqueeClass = dir === 'rtl' ? 'animate-marquee-rtl' : 'animate-marquee';

  if (!isLoading && uniqueCenters.length === 0) {
    return null;
  }

  return (
    <div className="relative mt-10 border-t pt-8 sm:mt-12 sm:pt-10" style={{ borderColor: brand.border }}>
      <p
        className="mb-5 text-center text-sm font-medium"
        style={{ color: brand.textMuted }}
      >
        {isAr ? 'مراكز تعليمية تثق بمنصتنا' : 'Educational centers on our platform'}
      </p>

      <div ref={containerRef} className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 sm:w-20"
          style={{
            background: `linear-gradient(to inline-end, ${brand.redLight}, transparent)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 sm:w-20"
          style={{
            background: `linear-gradient(to inline-start, ${brand.redLight}, transparent)`,
          }}
        />

        {isLoading ? (
          <MarqueeSkeleton brand={brand} />
        ) : shouldAnimate ? (
          <div
            className={cn('flex w-max hover:[animation-play-state:paused]', marqueeClass)}
            aria-label={isAr ? 'أسماء المراكز' : 'Center names'}
          >
            {[0, 1].map(copyIndex => (
              <div
                key={copyIndex}
                className="flex shrink-0 items-center gap-4 pe-4"
                {...(copyIndex === 1 ? { 'aria-hidden': true as const } : {})}
              >
                {uniqueCenters.map(center => (
                  <CenterNameChip key={`${copyIndex}-${center.id}`} center={center} brand={brand} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {uniqueCenters.map(center => (
              <CenterNameChip key={center.id} center={center} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
