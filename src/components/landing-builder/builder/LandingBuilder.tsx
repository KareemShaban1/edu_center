import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useLandingBuilder } from '@/hooks/use-landing-builder';
import { adminLandingApi } from '@/services/endpoints/admin-landing';
import { normalizeLandingPage } from '@/lib/landing/defaults';
import type { LandingPage, SectionType } from '@/types/landing';
import { PREVIEW_WIDTHS } from '@/lib/landing/constants';
import { getPublicLandingPath, resolvePublicLandingTenant } from '@/lib/tenant-routes';
import { LandingPageRenderer } from '../LandingPageRenderer';
import { BuilderToolbar } from './BuilderToolbar';
import { SectionPalette } from './SectionPalette';
import { SectionList } from './SectionList';
import { PropertiesPanel } from './PropertiesPanel';
import { MediaManagerDialog } from './MediaManagerDialog';
import { RevisionHistoryDialog } from './RevisionHistoryDialog';

interface LandingBuilderProps {
  pageId: string;
}

export function LandingBuilder({ pageId }: LandingBuilderProps) {
  const { t } = useLocale();

  const { data: initialPage, isLoading, isError } = useQuery({
    queryKey: ['landing-page', pageId],
    queryFn: () => adminLandingApi.get(pageId),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">{t('landing.loading')}</div>;
  }

  if (isError || !initialPage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">{t('landing.loadError')}</p>
      </div>
    );
  }

  return <LandingBuilderEditor pageId={pageId} initialPage={normalizeLandingPage(initialPage)} />;
}

function LandingBuilderEditor({ pageId, initialPage }: { pageId: string; initialPage: LandingPage }) {
  const { t } = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const builder = useLandingBuilder(initialPage);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [revOpen, setRevOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(true);
  const mediaSelectRef = useRef<((url: string) => void) | null>(null);

  const openMediaPicker = useCallback((apply: (url: string) => void) => {
    mediaSelectRef.current = apply;
    setMediaOpen(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => adminLandingApi.save(builder.page),
    onMutate: () => builder.setSaving(true),
    onSuccess: saved => {
      builder.replacePage(saved);
      builder.markSaved();
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success(t('landing.saveSuccess'));
    },
    onError: () => toast.error(t('landing.saveError')),
    onSettled: () => builder.setSaving(false),
  });

  const handleSave = useCallback(() => saveMutation.mutate(), [saveMutation]);

  useEffect(() => {
    if (builder.isDirty) {
      builder.scheduleAutoSave(async () => handleSave());
    }
  }, [builder.page, builder.isDirty, builder.scheduleAutoSave, handleSave]);

  const publishMutation = useMutation({
    mutationFn: () => adminLandingApi.publish(pageId),
    onSuccess: page => { builder.replacePage(page); toast.success(t('landing.publishSuccess')); },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => adminLandingApi.unpublish(pageId),
    onSuccess: page => { builder.replacePage(page); toast.success(t('landing.unpublishSuccess')); },
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['landing-revisions', pageId],
    queryFn: () => adminLandingApi.getRevisions(pageId),
    enabled: revOpen,
  });

  const { data: media = [], refetch: refetchMedia } = useQuery({
    queryKey: ['landing-media'],
    queryFn: () => adminLandingApi.getMedia(),
    enabled: mediaOpen && isAuthenticated && !authLoading,
    retry: false,
  });

  const restoreMutation = useMutation({
    mutationFn: (revId: string) => adminLandingApi.restoreRevision(pageId, revId),
    onSuccess: page => { builder.replacePage(page); setRevOpen(false); toast.success(t('landing.restoreSuccess')); },
  });

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('section-type') as SectionType;
    if (type) builder.addSection(type);
  };

  const handleExport = () => {
    const json = adminLandingApi.exportPage(builder.page);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${builder.page.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const imported = adminLandingApi.importPage(text);
      builder.replacePage({ ...imported, id: pageId });
      toast.success(t('landing.importSuccess'));
    };
    input.click();
  };

  const previewWidth = PREVIEW_WIDTHS[builder.previewDevice];
  const previewDir = builder.previewLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" dir={previewDir}>
      <BuilderToolbar
        pageTitle={builder.page.title[builder.previewLocale]}
        status={builder.page.status}
        isDirty={builder.isDirty}
        isSaving={builder.isSaving}
        lastSavedAt={builder.lastSavedAt}
        canUndo={builder.canUndo}
        canRedo={builder.canRedo}
        previewDevice={builder.previewDevice}
        previewLocale={builder.previewLocale}
        onUndo={builder.undo}
        onRedo={builder.redo}
        onSave={handleSave}
        onPublish={() => publishMutation.mutate()}
        onUnpublish={() => unpublishMutation.mutate()}
        onPreview={() => window.open(getPublicLandingPath(builder.page.slug, resolvePublicLandingTenant(), { preview: true }), '_blank')}
        onDeviceChange={builder.setPreviewDevice}
        onLocaleChange={builder.setPreviewLocale}
        onDuplicate={async () => {
          const dup = await adminLandingApi.duplicate(pageId);
          navigate(`/admin/landing/${dup.id}/edit`);
        }}
        onExport={handleExport}
        onImport={handleImport}
        onRevisions={() => setRevOpen(true)}
        onMedia={() => setMediaOpen(true)}
        onSettings={() => {}}
        onBack={() => navigate('/admin/landing')}
      />

      <div className="flex flex-1 overflow-hidden">
        <SectionPalette
          collapsed={!paletteOpen}
          onToggleCollapsed={() => setPaletteOpen(v => !v)}
          onAddSection={type => builder.addSection(type)}
        />
        <SectionList
          collapsed={!structureOpen}
          onToggleCollapsed={() => setStructureOpen(v => !v)}
          sections={builder.page.sections}
          selectedId={builder.selectedSectionId}
          onSelect={builder.selectSection}
          onMove={builder.moveSection}
          onDuplicate={builder.duplicateSection}
          onRemove={builder.removeSection}
          onToggleVisible={id => builder.updateSection(id, { visible: !builder.page.sections.find(s => s.id === id)?.visible })}
        />

        <div
          className="flex-1 overflow-auto bg-slate-100 p-6"
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          <div className="flex flex-col items-center min-h-full">
            {builder.previewDevice !== 'desktop' && (
              <div className="mb-3 text-xs font-mono text-muted-foreground">
                {previewWidth}px · {t(`landing.device.${builder.previewDevice}`)}
              </div>
            )}
            <div
              className="mx-auto w-full bg-white shadow-xl rounded-lg overflow-hidden transition-[width,max-width] duration-300"
              style={{
                width: builder.previewDevice === 'desktop' ? '100%' : previewWidth,
                maxWidth: previewWidth,
              }}
            >
              <LandingPageRenderer
                page={builder.page}
                locale={builder.previewLocale}
                editMode
                selectedSectionId={builder.selectedSectionId}
                selectedTextKey={builder.selectedTextKey}
                onSelectSection={builder.selectSection}
                onSelectTextField={builder.selectTextField}
                onSectionContentChange={(id, content) => builder.updateSectionContent(id, content)}
              />
            </div>
          </div>
        </div>

        <PropertiesPanel
          page={builder.page}
          section={builder.selectedSection}
          previewLocale={builder.previewLocale}
          selectedTextKey={builder.selectedTextKey}
          onSelectTextField={builder.selectTextField}
          onUpdateSection={(id, patch) => builder.updateSection(id, patch)}
          onUpdateSectionContent={builder.updateSectionContent}
          onUpdateSectionStyle={builder.updateSectionStyle}
          onUpdateTextStyle={builder.updateTextStyle}
          onUpdateTheme={builder.updateTheme}
          onUpdateSeo={builder.updateSeo}
          onUpdateBranding={builder.updateBranding}
          onUpdateMeta={patch => builder.setPageMeta(patch)}
          onPickFromMedia={openMediaPicker}
        />
      </div>

      <MediaManagerDialog
        open={mediaOpen}
        onOpenChange={open => {
          setMediaOpen(open);
          if (!open) mediaSelectRef.current = null;
        }}
        media={media}
        onUpload={async (file, folder) => {
          try {
            await adminLandingApi.uploadMedia(file, folder);
            await refetchMedia();
            toast.success(t('landing.uploadSuccess'));
          } catch {
            toast.error(t('landing.uploadError'));
          }
        }}
        onDelete={async id => {
          try {
            await adminLandingApi.deleteMedia(id);
            await refetchMedia();
          } catch {
            toast.error(t('landing.deleteMediaError'));
          }
        }}
        onSelect={url => {
          mediaSelectRef.current?.(url);
          mediaSelectRef.current = null;
          setMediaOpen(false);
        }}
      />

      <RevisionHistoryDialog
        open={revOpen}
        onOpenChange={setRevOpen}
        revisions={revisions}
        loading={restoreMutation.isPending}
        onRestore={id => restoreMutation.mutateAsync(id)}
      />
    </div>
  );
}
