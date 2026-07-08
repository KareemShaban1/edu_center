import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { CertificateDesignConfig } from '@/lib/certification/types';
import { renderDesignFields } from '@/lib/certification/render-utils';
import { SAMPLE_CERT_VARIABLES } from '@/lib/certification/types';
import { Award } from 'lucide-react';

interface CertificatePreviewProps {
  design: CertificateDesignConfig;
  variables?: Record<string, string>;
  compact?: boolean;
  className?: string;
  exportMode?: boolean;
}

function borderClasses(style: CertificateDesignConfig['layout']['borderStyle']): string {
  switch (style) {
    case 'ornate':
      return 'border-[6px] border-double shadow-inner';
    case 'minimal':
      return 'border border-dashed';
    case 'double':
      return 'border-4 border-double';
    case 'ribbon':
      return 'border-[5px] shadow-lg';
    case 'gradient':
      return 'border-4';
    case 'academic':
      return 'border-[5px] border-double';
    case 'modern':
      return 'border-l-[8px] border-y border-r';
    default:
      return 'border-[5px]';
  }
}

const CertificatePreview = forwardRef<HTMLDivElement, CertificatePreviewProps>(function CertificatePreview(
  {
    design,
    variables = SAMPLE_CERT_VARIABLES,
    compact = false,
    className,
    exportMode = false,
  },
  ref,
) {
  const fields = renderDesignFields(design, variables);
  const { colors, fonts, layout } = design;
  const isLandscape = design.orientation === 'landscape';
  const bgStyle = colors.backgroundEnd
    ? { background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.backgroundEnd} 100%)` }
    : { background: colors.background };

  return (
    <div
      ref={ref}
      data-certificate-export={exportMode ? true : undefined}
      className={cn(
        'relative mx-auto overflow-hidden rounded-sm',
        exportMode
          ? 'aspect-[1.414/1] w-full'
          : isLandscape
            ? compact
              ? 'aspect-[1.414/1] w-full max-w-md'
              : 'aspect-[1.414/1] w-full'
            : compact
              ? 'aspect-[1/1.414] w-full max-w-xs'
              : 'aspect-[1/1.414] w-full max-w-md',
        className,
      )}
      style={bgStyle}
    >
      {layout.showBorder && (
        <div
          className={cn('absolute inset-2 rounded-sm', borderClasses(layout.borderStyle))}
          style={{ borderColor: colors.border }}
        />
      )}

      {layout.borderStyle === 'ornate' && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-full opacity-40" style={{ background: colors.accent }} />
          <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 rounded-full opacity-40" style={{ background: colors.accent }} />
          <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 rounded-full opacity-40" style={{ background: colors.accent }} />
          <div className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 rounded-full opacity-40" style={{ background: colors.accent }} />
        </>
      )}

      {layout.borderStyle === 'ribbon' && (
        <div
          className="absolute left-0 right-0 top-0 h-2"
          style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent}, ${colors.secondary})` }}
        />
      )}

      <div
        className={cn(
          'relative flex h-full flex-col justify-center px-6 py-5',
          layout.headerAlign === 'center' ? 'text-center' : 'text-start',
          compact ? 'px-3 py-3' : 'px-8 py-6',
        )}
        style={{ color: colors.text, fontFamily: fonts.body }}
      >
        {layout.showLogo && (
          <div className={cn('mb-2 flex justify-center', layout.headerAlign === 'left' && 'justify-start')}>
            {design.logoUrl ? (
              <img src={design.logoUrl} alt="" className={cn('object-contain', compact ? 'h-6' : 'h-10')} />
            ) : (
              <div
                className={cn('flex items-center justify-center rounded-full', compact ? 'h-8 w-8' : 'h-12 w-12')}
                style={{ background: `${colors.accent}33`, color: colors.primary }}
              >
                <Award className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
              </div>
            )}
          </div>
        )}

        <h2
          className={cn('font-bold uppercase tracking-widest', compact ? 'text-[9px] leading-tight' : 'text-sm sm:text-base')}
          style={{ fontFamily: fonts.heading, color: colors.primary }}
        >
          {fields.heading}
        </h2>

        {fields.subtitle && (
          <p className={cn('mt-2 opacity-80', compact ? 'text-[7px]' : 'text-xs sm:text-sm')}>{fields.subtitle}</p>
        )}

        <div
          className={cn('my-2 font-semibold', compact ? 'text-[10px]' : 'text-lg sm:text-xl')}
          style={{ color: colors.secondary, fontFamily: fonts.heading }}
        >
          {fields.body.includes('{{') ? fields.body : fields.body}
        </div>

        {layout.showSeal && (
          <div className={cn('my-1 flex justify-center', layout.headerAlign === 'left' && 'justify-start')}>
            <div
              className={cn('flex items-center justify-center rounded-full border-2 font-bold', compact ? 'h-8 w-8 text-[6px]' : 'h-14 w-14 text-[8px]')}
              style={{ borderColor: colors.accent, color: colors.primary }}
            >
              SEAL
            </div>
          </div>
        )}

        {fields.footer && (
          <p className={cn('mt-2 opacity-70', compact ? 'text-[6px]' : 'text-xs')}>{fields.footer}</p>
        )}
      </div>
    </div>
  );
});

export default CertificatePreview;
