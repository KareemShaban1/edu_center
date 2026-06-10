import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/contexts/LocaleContext';
import type { LandingPageRevision } from '@/types/landing';
import { History, RotateCcw } from 'lucide-react';

interface RevisionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: LandingPageRevision[];
  onRestore: (revisionId: string) => Promise<void>;
  loading?: boolean;
}

export function RevisionHistoryDialog({ open, onOpenChange, revisions, onRestore, loading }: RevisionHistoryDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="w-5 h-5" />{t('landing.revisionHistory')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('landing.noRevisions')}</p>
            ) : revisions.map(rev => (
              <div key={rev.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">{rev.label ?? t('landing.autoSave')}</div>
                  <div className="text-xs text-muted-foreground">{new Date(rev.createdAt).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="outline" disabled={loading} onClick={() => onRestore(rev.id)}>
                  <RotateCcw className="w-3 h-3 mr-1" />{t('landing.restore')}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
