import { cn } from '@/lib/utils';
import { resolveLandingAssetUrl } from '@/lib/landing/media-url';

interface SectionImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SectionImage({ src, alt = '', className, style }: SectionImageProps) {
  const resolved = resolveLandingAssetUrl(src);
  if (!resolved) return null;

  return (
    <img
      src={resolved}
      alt={alt}
      className={cn(className)}
      style={style}
      loading="lazy"
      decoding="async"
    />
  );
}
