import { useCallback, useRef, useState } from 'react';
import type { LandingPage, LandingSection, PreviewDevice, ComponentType } from '@/types/landing';
import { createDefaultSection, normalizeLandingPage, uid } from '@/lib/landing/defaults';
import { createDefaultComponent, cloneComponents } from '@/lib/landing/component-defaults';

const MAX_HISTORY = 50;

interface BuilderState {
  page: LandingPage;
  selectedSectionId: string | null;
  selectedComponentId: string | null;
  selectedTextKey: string | null;
  previewDevice: PreviewDevice;
  previewLocale: 'ar' | 'en';
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
}

export function useLandingBuilder(initialPage: LandingPage) {
  const page = normalizeLandingPage(initialPage);

  const [state, setState] = useState<BuilderState>({
    page,
    selectedSectionId: page.sections[0]?.id ?? null,
    selectedComponentId: null,
    selectedTextKey: null,
    previewDevice: 'desktop',
    previewLocale: 'ar',
    isDirty: false,
    isSaving: false,
    lastSavedAt: null,
  });

  const historyRef = useRef<LandingPage[]>([structuredClone(page)]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((page: LandingPage) => {
    const hist = historyRef.current.slice(0, historyIndexRef.current + 1);
    hist.push(structuredClone(page));
    if (hist.length > MAX_HISTORY) hist.shift();
    else historyIndexRef.current += 1;
    historyRef.current = hist;
  }, []);

  const updatePage = useCallback((updater: (page: LandingPage) => LandingPage, recordHistory = true) => {
    setState(prev => {
      const nextPage = updater(prev.page);
      if (recordHistory) pushHistory(nextPage);
      return { ...prev, page: nextPage, isDirty: true };
    });
  }, [pushHistory]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    historyIndexRef.current -= 1;
    const page = structuredClone(historyRef.current[historyIndexRef.current]);
    setState(prev => ({ ...prev, page, isDirty: true }));
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    historyIndexRef.current += 1;
    const page = structuredClone(historyRef.current[historyIndexRef.current]);
    setState(prev => ({ ...prev, page, isDirty: true }));
  }, [canRedo]);

  const selectSection = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedSectionId: id, selectedComponentId: null, selectedTextKey: null }));
  }, []);

  const selectComponent = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedComponentId: id, selectedTextKey: null }));
  }, []);

  const selectTextField = useCallback((fieldKey: string | null) => {
    setState(prev => ({ ...prev, selectedTextKey: fieldKey }));
  }, []);

  const setPreviewDevice = useCallback((device: PreviewDevice) => {
    setState(prev => ({ ...prev, previewDevice: device }));
  }, []);

  const setPreviewLocale = useCallback((locale: 'en' | 'ar') => {
    setState(prev => ({ ...prev, previewLocale: locale }));
  }, []);

  const addSection = useCallback((type: LandingSection['type'], afterId?: string) => {
    updatePage(page => {
      const sections = [...page.sections];
      const order = afterId
        ? sections.findIndex(s => s.id === afterId) + 1
        : sections.length - 1;
      const newSec = createDefaultSection(type, order);
      sections.splice(order, 0, newSec);
      return {
        ...page,
        sections: sections.map((s, i) => ({ ...s, order: i })),
      };
    });
    setState(prev => {
      const added = prev.page.sections.find(s => s.order === (afterId ? prev.page.sections.findIndex(x => x.id === afterId) + 1 : prev.page.sections.length - 1));
      return { ...prev, selectedSectionId: added?.id ?? prev.selectedSectionId };
    });
  }, [updatePage]);

  const removeSection = useCallback((id: string) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })),
    }));
  }, [updatePage]);

  const duplicateSection = useCallback((id: string) => {
    updatePage(page => {
      const idx = page.sections.findIndex(s => s.id === id);
      if (idx < 0) return page;
      const copy = { ...structuredClone(page.sections[idx]), id: uid('sec') };
      if (copy.type === 'custom' && copy.components?.length) {
        copy.components = cloneComponents(copy.components);
      }
      const sections = [...page.sections];
      sections.splice(idx + 1, 0, copy);
      return { ...page, sections: sections.map((s, i) => ({ ...s, order: i })) };
    });
  }, [updatePage]);

  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    updatePage(page => {
      const sections = [...page.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { ...page, sections: sections.map((s, i) => ({ ...s, order: i })) };
    });
  }, [updatePage]);

  const updateSection = useCallback((id: string, patch: Partial<LandingSection>) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s => (s.id === id ? { ...s, ...patch } : s)),
    }), false);
  }, [updatePage]);

  const updateTextStyle = useCallback((sectionId: string, fieldKey: string, style?: import('@/types/landing').TextStyle) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s => {
        if (s.id !== sectionId) return s;
        const next = { ...(s.textStyles ?? {}) };
        if (style === undefined) delete next[fieldKey];
        else next[fieldKey] = style;
        return { ...s, textStyles: Object.keys(next).length ? next : undefined };
      }),
    }), false);
  }, [updatePage]);

  const updateSectionContent = useCallback((id: string, content: Record<string, unknown>) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s =>
        s.id === id ? { ...s, content: { ...s.content, ...content } } : s,
      ),
    }), false);
  }, [updatePage]);

  const updateSectionStyle = useCallback((id: string, style: Partial<NonNullable<LandingSection['style']>>) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s =>
        s.id === id ? { ...s, style: { ...s.style, ...style } } : s,
      ),
    }), false);
  }, [updatePage]);

  const addComponent = useCallback((sectionId: string, type: ComponentType) => {
    const newComponent = createDefaultComponent(type, 0);
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s => {
        if (s.id !== sectionId) return s;
        const components = [...(s.components ?? [])];
        newComponent.order = components.length;
        components.push(newComponent);
        return { ...s, components };
      }),
    }));
    setState(prev => ({ ...prev, selectedComponentId: newComponent.id }));
  }, [updatePage]);

  const removeComponent = useCallback((sectionId: string, componentId: string) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s => {
        if (s.id !== sectionId) return s;
        const components = (s.components ?? [])
          .filter(c => c.id !== componentId)
          .map((c, i) => ({ ...c, order: i }));
        return { ...s, components };
      }),
    }));
    setState(prev => ({
      ...prev,
      selectedComponentId: prev.selectedComponentId === componentId ? null : prev.selectedComponentId,
    }));
  }, [updatePage]);

  const moveComponent = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s => {
        if (s.id !== sectionId) return s;
        const components = [...(s.components ?? [])].sort((a, b) => a.order - b.order);
        const [moved] = components.splice(fromIndex, 1);
        components.splice(toIndex, 0, moved);
        return { ...s, components: components.map((c, i) => ({ ...c, order: i })) };
      }),
    }), false);
  }, [updatePage]);

  const updateComponentContent = useCallback((sectionId: string, componentId: string, content: Record<string, unknown>) => {
    updatePage(page => ({
      ...page,
      sections: page.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          components: (s.components ?? []).map(c =>
            c.id === componentId ? { ...c, content: { ...c.content, ...content } } : c,
          ),
        };
      }),
    }), false);
  }, [updatePage]);

  const updateTheme = useCallback((theme: Partial<LandingPage['theme']>) => {
    updatePage(page => ({ ...page, theme: { ...page.theme, ...theme } }));
  }, [updatePage]);

  const updateSeo = useCallback((seo: Partial<LandingPage['seo']>) => {
    updatePage(page => ({ ...page, seo: { ...page.seo, ...seo } }));
  }, [updatePage]);

  const updateBranding = useCallback((branding: Partial<LandingPage['branding']>) => {
    updatePage(page => ({ ...page, branding: { ...page.branding, ...branding } }));
  }, [updatePage]);

  const setPageMeta = useCallback((patch: Partial<LandingPage>) => {
    updatePage(page => ({ ...page, ...patch }));
  }, [updatePage]);

  const replacePage = useCallback((next: LandingPage) => {
    const normalized = normalizeLandingPage(next);
    historyRef.current = [structuredClone(normalized)];
    historyIndexRef.current = 0;
    setState(prev => ({
      ...prev,
      page: normalized,
      isDirty: false,
      selectedSectionId: normalized.sections[0]?.id ?? null,
      selectedComponentId: null,
      selectedTextKey: null,
    }));
  }, []);

  const markSaved = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: false, isSaving: false, lastSavedAt: new Date().toISOString() }));
  }, []);

  const setSaving = useCallback((isSaving: boolean) => {
    setState(prev => ({ ...prev, isSaving }));
  }, []);

  const selectedSection = state.page.sections?.find(s => s.id === state.selectedSectionId) ?? null;

  return {
    ...state,
    selectedSection,
    canUndo,
    canRedo,
    undo,
    redo,
    selectSection,
    selectComponent,
    selectTextField,
    setPreviewDevice,
    setPreviewLocale,
    addSection,
    removeSection,
    duplicateSection,
    moveSection,
    updateSection,
    updateSectionContent,
    updateSectionStyle,
    addComponent,
    removeComponent,
    moveComponent,
    updateComponentContent,
    updateTextStyle,
    updateTheme,
    updateSeo,
    updateBranding,
    setPageMeta,
    replacePage,
    markSaved,
    setSaving,
    updatePage,
  };
}
