import { cn } from '@/lib/utils';
import { useLandingBrand } from './useLandingBrand';

/** Laptop + phone mockup matching the marketing design */
export function PlatformLandingHeroIllustration({ className }: { className?: string }) {
  const brand = useLandingBrand();

  return (
    <div className={cn('relative mx-auto w-full max-w-[520px]', className)}>
      {/* Floating phone */}
      <div
        className="absolute -top-2 z-20 w-[110px] rounded-2xl border bg-white p-2 shadow-xl sm:-start-6 sm:-top-4 sm:w-[130px]"
        style={{ borderColor: brand.redSoft }}
      >
        <div className="mb-2 text-center text-[9px] font-bold text-gray-700">جدول اليوم</div>
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-1.5 flex items-center gap-1.5 rounded-lg bg-gray-50 px-1.5 py-1">
            <div className="h-5 w-5 shrink-0 rounded-md" style={{ backgroundColor: brand.redSoft }} />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="h-1 w-full rounded bg-gray-200" />
              <div className="h-1 w-2/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Floating notification */}
      <div
        className="absolute bottom-16 z-20 w-[140px] rounded-xl border bg-white p-2.5 shadow-lg sm:-end-4 sm:bottom-20"
        style={{ borderColor: brand.redSoft }}
      >
        <div className="mb-1 text-[9px] font-bold" style={{ color: brand.red }}>واجب جديد</div>
        <div className="h-1.5 w-full rounded bg-gray-100" />
        <div className="mt-1 h-1.5 w-3/4 rounded bg-gray-100" />
      </div>

      {/* Laptop */}
      <div className="relative pt-8">
        <div
          className="overflow-hidden rounded-2xl border bg-white shadow-2xl"
          style={{ borderColor: `${brand.red}18`, boxShadow: `0 32px 64px ${brand.red}18` }}
        >
          {/* Screen bezel */}
          <div className="border-b bg-gray-100 px-4 py-2" style={{ borderColor: brand.border }}>
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
          </div>

          {/* Dashboard */}
          <div className="flex min-h-[280px] bg-gray-50">
            {/* Sidebar (RTL: appears on right) */}
            <div className="w-[72px] shrink-0 p-2" style={{ backgroundColor: brand.red }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="mb-2 h-6 rounded-md"
                  style={{ backgroundColor: i === 1 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)' }}
                />
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-3">
              <div className="mb-3 grid grid-cols-3 gap-2">
                {[brand.red, brand.redMuted, brand.redSoft].map((c, i) => (
                  <div key={i} className="rounded-lg bg-white p-2 shadow-sm">
                    <div className="mb-1 h-1.5 w-8 rounded" style={{ backgroundColor: `${c}55` }} />
                    <div className="text-sm font-bold" style={{ color: brand.red }}>{['248', '92%', '156'][i]}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <div className="mb-2 h-1.5 w-12 rounded bg-gray-200" />
                  <svg viewBox="0 0 120 60" className="h-16 w-full">
                    <polyline
                      fill="none"
                      stroke={brand.red}
                      strokeWidth="2"
                      strokeLinecap="round"
                      points="0,50 20,35 40,42 60,20 80,28 100,10 120,18"
                    />
                    <polyline
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      points="0,55 20,48 40,50 60,38 80,40 100,32 120,35"
                    />
                  </svg>
                </div>
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <div className="mb-2 h-1.5 w-12 rounded bg-gray-200" />
                  <div className="flex h-16 items-end justify-around gap-1">
                    {[40, 65, 50, 80, 55].map((h, i) => (
                      <div
                        key={i}
                        className="w-4 rounded-t"
                        style={{ height: `${h}%`, backgroundColor: i === 3 ? brand.red : brand.redMuted }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop base */}
        <div className="mx-auto h-3 w-[92%] rounded-b-xl bg-gray-300" />
        <div className="mx-auto h-1.5 w-[40%] rounded-b-lg bg-gray-400" />
      </div>
    </div>
  );
}
