import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';
import type { LandingSection, LocalizedText } from '@/types/landing';
import { ImageUrlField } from './ImageUrlField';

interface SectionImageEditorProps {
  section: LandingSection;
  onUpdateContent: (patch: Record<string, unknown>) => void;
  onUpdateStyle: (patch: NonNullable<LandingSection['style']>) => void;
  onPickFromMedia?: (apply: (url: string) => void) => void;
}

export function SectionImageEditor({
  section,
  onUpdateContent,
  onUpdateStyle,
  onPickFromMedia,
}: SectionImageEditorProps) {
  const { t } = useLocale();
  const c = section.content;
  const type = section.type;

  const hasContentImage = ['hero', 'about_teacher', 'about_center'].includes(type);
  const isGallery = type === 'gallery';
  const isTeam = type === 'team';

  if (!hasContentImage && !isGallery && !isTeam) {
    return (
      <ImageUrlField
        label={t('landing.backgroundImage')}
        value={section.style?.backgroundImage ?? ''}
        onChange={url => onUpdateStyle({ backgroundImage: url || undefined })}
        onPickFromMedia={onPickFromMedia}
      />
    );
  }

  return (
    <div className="space-y-4">
      {hasContentImage && (
        <ImageUrlField
          label={t('landing.sectionImage')}
          value={(c.imageUrl as string) ?? ''}
          onChange={url => onUpdateContent({ imageUrl: url })}
          onPickFromMedia={onPickFromMedia}
        />
      )}

      {isGallery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t('landing.galleryImages')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const images = [...((c.images as string[]) ?? []), ''];
                onUpdateContent({ images });
              }}
            >
              <Plus className="w-3 h-3 me-1" />
              {t('landing.addImage')}
            </Button>
          </div>
          {((c.images as string[]) ?? []).map((img, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('landing.image')} {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => {
                    const images = [...((c.images as string[]) ?? [])];
                    images.splice(i, 1);
                    onUpdateContent({ images });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <ImageUrlField
                label=""
                value={img}
                onChange={url => {
                  const images = [...((c.images as string[]) ?? [])];
                  images[i] = url;
                  onUpdateContent({ images });
                }}
                onPickFromMedia={onPickFromMedia}
              />
            </div>
          ))}
          {((c.images as string[]) ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">{t('landing.noGalleryImages')}</p>
          )}
        </div>
      )}

      {isTeam && (
        <div className="space-y-3">
          <Label className="text-xs">{t('landing.teamPhotos')}</Label>
          {((c.members as { name: LocalizedText; role: LocalizedText; imageUrl?: string }[]) ?? []).map((member, i) => (
            <ImageUrlField
              key={i}
              label={`${member.name.en || member.name.ar || t('landing.member')} ${i + 1}`}
              value={member.imageUrl ?? ''}
              onChange={url => {
                const members = [...((c.members as typeof member[]) ?? [])];
                members[i] = { ...members[i], imageUrl: url };
                onUpdateContent({ members });
              }}
              onPickFromMedia={onPickFromMedia}
            />
          ))}
        </div>
      )}

      <Separator />
      <ImageUrlField
        label={t('landing.backgroundImage')}
        value={section.style?.backgroundImage ?? ''}
        onChange={url => onUpdateStyle({ backgroundImage: url || undefined })}
        onPickFromMedia={onPickFromMedia}
      />
    </div>
  );
}
