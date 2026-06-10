import { useRef, useState } from 'react';
import {
  Undo2, Redo2, Monitor, Tablet, Smartphone, Save, Eye, Globe, GlobeLock,
  Copy, Download, Upload, History, Image, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLocale } from '@/contexts/LocaleContext';
import type { PreviewDevice } from '@/types/landing';
import { PREVIEW_WIDTHS } from '@/lib/landing/constants';
import { cn } from '@/lib/utils';

interface BuilderToolbarProps {
  pageTitle: string;
  status: 'draft' | 'published' | 'archived';
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  canUndo: boolean;
  canRedo: boolean;
  previewDevice: PreviewDevice;
  previewLocale: 'ar' | 'en';
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onPreview: () => void;
  onDeviceChange: (d: PreviewDevice) => void;
  onLocaleChange: (l: 'ar' | 'en') => void;
  onDuplicate: () => void;
  onExport: () => void;
  onImport: () => void;
  onRevisions: () => void;
  onMedia: () => void;
  onSettings: () => void;
  onBack: () => void;
}

export function BuilderToolbar(props: BuilderToolbarProps) {
  const { t } = useLocale();
  const {
    pageTitle, status, isDirty, isSaving, lastSavedAt,
    canUndo, canRedo, previewDevice, previewLocale,
    onUndo, onRedo, onSave, onPublish, onUnpublish, onPreview,
    onDeviceChange, onLocaleChange,     onDuplicate, onExport, onImport,
    onRevisions, onMedia, onSettings, onBack,
  } = props;

  return (
    <div className="h-14 border-b bg-background flex items-center gap-2 px-4 shrink-0">
      <Button variant="ghost" size="sm" onClick={onBack}>{t('landing.back')}</Button>
      <Separator orientation="vertical" className="h-6" />
      <span className="font-medium truncate max-w-[200px]">{pageTitle}</span>
      <Badge variant={status === 'published' ? 'default' : 'secondary'}>
        {t(`landing.status.${status}`)}
      </Badge>
      {isDirty && <Badge variant="outline" className="text-amber-600">{t('landing.unsaved')}</Badge>}
      {lastSavedAt && !isDirty && (
        <span className="text-xs text-muted-foreground hidden md:inline">{t('landing.saved')}</span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" disabled={!canUndo} onClick={onUndo} title={t('landing.undo')}>
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled={!canRedo} onClick={onRedo} title={t('landing.redo')}>
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <ToggleGroup type="single" value={previewDevice} onValueChange={v => v && onDeviceChange(v as PreviewDevice)}>
        <ToggleGroupItem value="desktop" aria-label={`Desktop (${PREVIEW_WIDTHS.desktop}px)`} title={`Desktop (${PREVIEW_WIDTHS.desktop}px)`}>
          <Monitor className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="tablet" aria-label={`Tablet (${PREVIEW_WIDTHS.tablet}px)`} title={`Tablet (${PREVIEW_WIDTHS.tablet}px)`}>
          <Tablet className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="mobile" aria-label={`Mobile (${PREVIEW_WIDTHS.mobile}px)`} title={`Mobile (${PREVIEW_WIDTHS.mobile}px)`}>
          <Smartphone className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup type="single" value={previewLocale} onValueChange={v => v && onLocaleChange(v as 'ar' | 'en')}>
	          <ToggleGroupItem value="ar">AR</ToggleGroupItem>
		<ToggleGroupItem value="en">EN</ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="icon" onClick={onRevisions} title={t('landing.revisions')}><History className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onMedia} title={t('landing.media')}><Image className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onSettings} title={t('landing.settings')}><Settings className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onDuplicate} title={t('landing.duplicate')}><Copy className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onExport} title={t('landing.export')}><Download className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onImport} title={t('landing.import')}><Upload className="w-4 h-4" /></Button>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="outline" size="sm" onClick={onPreview}><Eye className="w-4 h-4 me-1" />{t('landing.preview')}</Button>
      <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
        <Save className="w-4 h-4 me-1" />{isSaving ? t('landing.saving') : t('landing.save')}
      </Button>
      {status === 'published' ? (
        <Button variant="secondary" size="sm" onClick={onUnpublish}><GlobeLock className="w-4 h-4 me-1" />{t('landing.unpublish')}</Button>
      ) : (
        <Button size="sm" onClick={onPublish}><Globe className="w-4 h-4 me-1" />{t('landing.publish')}</Button>
      )}
    </div>
  );
}
