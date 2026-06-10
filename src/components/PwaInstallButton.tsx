import { Download } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PwaInstallButtonProps {
  className?: string;
  iconClassName?: string;
  style?: CSSProperties;
}

export function PwaInstallButton({ className, iconClassName, style }: PwaInstallButtonProps = {}) {
  const { t } = useLocale();
  const { showInstallUi, canInstall, isIos, install } = usePwaInstall();

  if (!showInstallUi) return null;

  const button = (
    <button
      type="button"
      onClick={() => {
        if (canInstall) {
          void install();
        }
      }}
      className={cn('rounded-lg p-2 transition-colors hover:bg-muted', className)}
      style={style}
      aria-label={t('pwa.install')}
    >
      <Download className={cn('h-5 w-5 text-muted-foreground', iconClassName)} />
    </button>
  );

  if (isIos) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px] text-center">
          {t('pwa.iosHint')}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom">{t('pwa.install')}</TooltipContent>
    </Tooltip>
  );
}
