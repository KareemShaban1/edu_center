import { cn } from '@/lib/utils';
import { useLandingBrand } from './useLandingBrand';
import { useUiIconName } from '@/contexts/UiIconsContext';
import { landingIconKey, resolveLucideIcon } from '@/lib/lucide-icons';
import { UI_ICON_BY_KEY } from '@/config/ui-icons';

export function EgyptLandmarkIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 220"
      fill="none"
      className={cn('h-auto w-full max-w-[280px]', className)}
      aria-hidden
    >
      <rect width="280" height="220" rx="16" fill="#FEF3C7" fillOpacity="0.35" />
      <circle cx="220" cy="48" r="28" fill="#FCD34D" fillOpacity="0.6" />
      <path d="M40 180 L100 80 L160 180 Z" fill="#D97706" fillOpacity="0.85" />
      <path d="M90 180 L145 95 L200 180 Z" fill="#B45309" fillOpacity="0.9" />
      <path d="M150 180 L195 110 L240 180 Z" fill="#92400E" fillOpacity="0.85" />
      <path d="M0 180 H280 V220 H0 Z" fill="#FDE68A" fillOpacity="0.5" />
      <g transform="translate(24, 130)">
        <rect width="56" height="36" rx="4" fill="#CE1126" />
        <rect y="12" width="56" height="12" fill="#FFFFFF" />
        <rect y="24" width="56" height="12" fill="#000000" />
        <rect x="18" y="6" width="20" height="24" fill="#C09300" fillOpacity="0.9" />
      </g>
    </svg>
  );
}

export function FeatureIconCircle({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const brand = useLandingBrand();
  const key = landingIconKey(icon);
  const definition = UI_ICON_BY_KEY.get(key);
  const resolvedName = useUiIconName(key, definition?.defaultIcon || 'Sparkles');
  const LucideIcon = resolveLucideIcon(resolvedName);

  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
        className,
      )}
      style={{ backgroundColor: `${brand.red}12`, color: brand.red }}
    >
      <LucideIcon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
    </div>
  );
}
