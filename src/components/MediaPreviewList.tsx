import { FileText, Image, Video } from 'lucide-react';
import type { MediaFile } from '@/types/models';
import { useLocale } from '@/contexts/LocaleContext';

export function formatMediaSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mediaKind(type: string) {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'file';
}

export default function MediaPreviewList({ media }: { media: MediaFile[] }) {
  const { t } = useLocale();
  if (media.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('misc.noDataAvailable')}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {media.map(file => {
        const kind = mediaKind(file.mime_type || file.type);
        const label = file.file_name || file.name;
        return (
          <div key={String(file.id)} className="overflow-hidden rounded-lg border border-border bg-muted/20">
            {kind === 'image' && (
              <a href={file.url} target="_blank" rel="noreferrer">
                <img src={file.url} alt={label} className="h-32 w-full object-cover" />
              </a>
            )}
            {kind === 'video' && (
              <video src={file.url} controls className="h-32 w-full bg-black object-contain" />
            )}
            {kind === 'audio' && (
              <div className="p-3">
                <audio src={file.url} controls className="w-full" />
              </div>
            )}
            {kind === 'file' && (
              <div className="flex h-32 items-center justify-center bg-muted/40">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm">
              {kind === 'image' ? <Image className="h-4 w-4 shrink-0 text-primary" /> : kind === 'video' ? <Video className="h-4 w-4 shrink-0 text-primary" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">
                {label}
              </a>
              <span className="text-xs text-muted-foreground">{formatMediaSize(file.size)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
