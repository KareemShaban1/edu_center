import { useRef, useState } from 'react';
import { ImageIcon, Images, Upload, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import { resolveLandingAssetUrl } from '@/lib/landing/media-url';
import { adminLandingApi } from '@/services/endpoints/admin-landing';

interface ImageUrlFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onPickFromMedia?: (apply: (url: string) => void) => void;
}

export function ImageUrlField({ label, value, onChange, onPickFromMedia }: ImageUrlFieldProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = resolveLandingAssetUrl(value);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await adminLandingApi.uploadMedia(file, 'general');
      onChange(asset.url);
      queryClient.invalidateQueries({ queryKey: ['landing-media'] });
      toast.success(t('landing.uploadSuccess'));
    } catch {
      toast.error(t('landing.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? <Label className="text-xs">{label}</Label> : null}
      {previewUrl ? (
        <div className="relative rounded-lg border overflow-hidden aspect-video bg-muted">
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 end-2 h-7 w-7"
            onClick={() => onChange('')}
            title={t('landing.removeImage')}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full rounded-lg border border-dashed aspect-video flex flex-col items-center justify-center gap-2 bg-muted/40 hover:bg-muted/60 transition-colors disabled:opacity-50"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-40" />
          <span className="text-xs text-muted-foreground">{t('landing.upload')}</span>
        </button>
      )}
      <Input
        className="h-8 text-xs"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://..."
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1 text-xs"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-3 h-3 me-1" />
          {uploading ? t('landing.uploading') : t('landing.upload')}
        </Button>
        {onPickFromMedia && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 flex-1 text-xs"
            disabled={uploading}
            onClick={() => onPickFromMedia(onChange)}
          >
            <Images className="w-3 h-3 me-1" />
            {t('landing.media')}
          </Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.svg"
        className="hidden"
        aria-label={t('landing.upload')}
        onChange={async e => {
          const file = e.target.files?.[0];
          if (file) await handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
