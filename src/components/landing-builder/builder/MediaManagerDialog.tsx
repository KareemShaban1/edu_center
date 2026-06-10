import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/contexts/LocaleContext';
import { resolveLandingAssetUrl } from '@/lib/landing/media-url';
import { Upload, Trash2, Folder, Image as ImageIcon } from 'lucide-react';

interface MediaManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaAsset[];
  onUpload: (file: File, folder?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect?: (url: string) => void;
}

export function MediaManagerDialog({ open, onOpenChange, media, onUpload, onDelete, onSelect }: MediaManagerDialogProps) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState('');
  const [search, setSearch] = useState('');

  const filtered = media.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('landing.mediaManager')}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input placeholder={t('landing.searchMedia')} value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
          <Input placeholder={t('landing.folder')} value={folder} onChange={e => setFolder(e.target.value)} className="w-32" />
          <Button onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-1" />{t('landing.upload')}</Button>
          <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.svg" className="hidden" onChange={async e => {
            const file = e.target.files?.[0];
            if (file) await onUpload(file, folder || undefined);
            e.target.value = '';
          }} />
        </div>
        <ScrollArea className="h-80">
          <div className="grid grid-cols-4 gap-3">
            {filtered.map(m => (
              <div key={m.id} className="group relative border rounded-lg overflow-hidden aspect-square">
                {m.type === 'image' || m.type === 'svg' || m.type === 'logo' ? (
                  <img src={resolveLandingAssetUrl(m.url)} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Folder className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {onSelect && (
                    <Button size="sm" variant="secondary" onClick={() => { onSelect(m.url); onOpenChange(false); }}>
                      {t('landing.select')}
                    </Button>
                  )}
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => onDelete(m.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">{m.name}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                {t('landing.noMedia')}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
