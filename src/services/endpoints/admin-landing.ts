import { apiClient, USE_MOCK } from '../api-client';
import type {
  LandingPage,
  LandingPageAnalytics,
  LandingPageListItem,
  LandingPageRevision,
  LandingTemplate,
  MediaAsset,
} from '@/types/landing';
import type { TeacherSubjectKey } from '@/lib/landing/constants';
import { landingMockStore } from '@/lib/landing/mock-store';
import { templateToPage, LANDING_TEMPLATES, getTemplateById } from '@/lib/landing/templates';
import { generateTeacherLandingPage, duplicatePage } from '@/lib/landing/teacher-generator';
import { normalizeLandingPage } from '@/lib/landing/defaults';
import { normalizeMediaUrl, resolveLandingAssetUrl } from '@/lib/landing/media-url';
import { resolvePublicLandingTenant } from '@/lib/tenant-routes';
import { mockTeachers } from '../mock-data';

export const adminLandingApi = {
  async list(): Promise<LandingPageListItem[]> {
    if (USE_MOCK) return landingMockStore.listPages();
    const res = await apiClient.get<{ pages: LandingPageListItem[] }>('/admin/landing-pages', undefined, false);
    return res.pages;
  },

  async get(id: string): Promise<LandingPage> {
    if (USE_MOCK) {
      const page = landingMockStore.getPage(id);
      if (!page) throw new Error('Page not found');
      return page;
    }
    const res = await apiClient.get<{ page: LandingPage }>(`/admin/landing-pages/${id}`, undefined, false);
    return normalizeLandingPage(res.page);
  },

  async create(data?: Partial<LandingPage>): Promise<LandingPage> {
    if (USE_MOCK) return landingMockStore.createPage(data);
    const res = await apiClient.post<{ page: LandingPage }>('/admin/landing-pages', data ?? {}, false);
    return normalizeLandingPage(res.page);
  },

  async save(page: LandingPage): Promise<LandingPage> {
    if (USE_MOCK) {
      landingMockStore.addRevision(page, 'Auto-save');
      return landingMockStore.upsertPage(page);
    }
    const res = await apiClient.put<{ page: LandingPage }>(`/admin/landing-pages/${page.id}`, page, false);
    return normalizeLandingPage(res.page);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      landingMockStore.deletePage(id);
      return;
    }
    await apiClient.delete(`/admin/landing-pages/${id}`, false);
  },

  async publish(id: string): Promise<LandingPage> {
    if (USE_MOCK) {
      const page = landingMockStore.getPage(id);
      if (!page) throw new Error('Page not found');
      return landingMockStore.upsertPage({
        ...page,
        status: 'published',
        publishedAt: new Date().toISOString(),
      });
    }
    const res = await apiClient.post<{ page: LandingPage }>(`/admin/landing-pages/${id}/publish`, {}, false);
    return normalizeLandingPage(res.page);
  },

  async unpublish(id: string): Promise<LandingPage> {
    if (USE_MOCK) {
      const page = landingMockStore.getPage(id);
      if (!page) throw new Error('Page not found');
      return landingMockStore.upsertPage({ ...page, status: 'draft' });
    }
    const res = await apiClient.post<{ page: LandingPage }>(`/admin/landing-pages/${id}/unpublish`, {}, false);
    return normalizeLandingPage(res.page);
  },

  async duplicate(id: string): Promise<LandingPage> {
    if (USE_MOCK) {
      const page = landingMockStore.getPage(id);
      if (!page) throw new Error('Page not found');
      return landingMockStore.upsertPage(duplicatePage(page));
    }
    const res = await apiClient.post<{ page: LandingPage }>(`/admin/landing-pages/${id}/duplicate`, {}, false);
    return normalizeLandingPage(res.page);
  },

  async getTemplates(): Promise<LandingTemplate[]> {
    return LANDING_TEMPLATES;
  },

  async createFromTemplate(templateId: string): Promise<LandingPage> {
    const template = getTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    const page = templateToPage(template);
    if (USE_MOCK) return landingMockStore.upsertPage(page);
    return this.create(page);
  },

  async generateFromTeacher(teacherId: number, subjectKey?: TeacherSubjectKey): Promise<LandingPage> {
    if (USE_MOCK) {
      const teacher = mockTeachers.find(t => t.id === teacherId) ?? mockTeachers[0];
      const page = generateTeacherLandingPage(teacher, subjectKey);
      return landingMockStore.upsertPage(page);
    }
    const res = await apiClient.post<{ page: LandingPage }>(
      '/admin/landing-pages/from-teacher',
      { teacherId, subjectKey },
      false,
    );
    return normalizeLandingPage(res.page);
  },

  async getRevisions(pageId: string): Promise<LandingPageRevision[]> {
    if (USE_MOCK) return landingMockStore.getRevisions(pageId);
    const res = await apiClient.get<{ revisions: LandingPageRevision[] }>(
      `/admin/landing-pages/${pageId}/revisions`,
      undefined,
      false,
    );
    return res.revisions;
  },

  async restoreRevision(pageId: string, revisionId: string): Promise<LandingPage> {
    if (USE_MOCK) {
      const rev = landingMockStore.getRevisions(pageId).find(r => r.id === revisionId);
      if (!rev) throw new Error('Revision not found');
      return landingMockStore.upsertPage(rev.snapshot);
    }
    const res = await apiClient.post<{ page: LandingPage }>(
      `/admin/landing-pages/${pageId}/revisions/${revisionId}/restore`,
      {},
      false,
    );
    return normalizeLandingPage(res.page);
  },

  async getAnalytics(pageId: string): Promise<LandingPageAnalytics> {
    if (USE_MOCK) return landingMockStore.getAnalytics(pageId);
    const res = await apiClient.get<{ analytics: LandingPageAnalytics }>(
      `/admin/landing-pages/${pageId}/analytics`,
      undefined,
      false,
    );
    return res.analytics;
  },

  async getMedia(): Promise<MediaAsset[]> {
    if (USE_MOCK) return landingMockStore.getMedia();
    const res = await apiClient.get<{ media: MediaAsset[] }>('/admin/landing-pages/media', undefined, false);
    return res.media.map(m => ({ ...m, url: resolveLandingAssetUrl(normalizeMediaUrl(m.url)) }));
  },

  async uploadMedia(file: File, folder?: string): Promise<MediaAsset> {
    if (USE_MOCK) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : file.type.includes('svg') ? 'svg' : 'image';
      return landingMockStore.addMedia({ name: file.name, type, url, folder, size: file.size });
    }
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    const res = await apiClient.upload<{ media: MediaAsset }>('/admin/landing-pages/media', form, false);
    return { ...res.media, url: resolveLandingAssetUrl(normalizeMediaUrl(res.media.url)) };
  },

  async deleteMedia(id: string): Promise<void> {
    if (USE_MOCK) {
      landingMockStore.deleteMedia(id);
      return;
    }
    await apiClient.delete(`/admin/landing-pages/media/${id}`, false);
  },

  exportPage(page: LandingPage): string {
    return JSON.stringify(page, null, 2);
  },

  importPage(json: string): LandingPage {
    const parsed = JSON.parse(json) as LandingPage;
    if (USE_MOCK) return landingMockStore.upsertPage({ ...parsed, id: `imported_${Date.now()}`, status: 'draft' });
    return parsed;
  },
};

export const publicLandingApi = {
  async getBySlug(
    slug: string,
    options?: { tenantSlug?: string; preview?: boolean },
  ): Promise<{ page: LandingPage | null; reason?: 'not_found' | 'unpublished' | 'tenant_required' }> {
    if (USE_MOCK) {
      const page = landingMockStore.getPageBySlug(slug);
      if (page) landingMockStore.trackView(page.id);
      return { page: page ?? null, reason: page ? undefined : 'not_found' };
    }
    const tenantSlug = resolvePublicLandingTenant(options?.tenantSlug);
    const path = `/public/landing/${slug.split('/').map(encodeURIComponent).join('/')}`;
    const params: Record<string, string> = { tenant_slug: tenantSlug };
    if (options?.preview) params.preview = '1';
    const res = await apiClient.get<{ page: LandingPage | null; reason?: string }>(path, params, false);
    const reason = res.reason === 'unpublished' || res.reason === 'not_found' || res.reason === 'tenant_required'
      ? res.reason
      : undefined;
    return {
      page: res.page ? normalizeLandingPage(res.page) : null,
      reason,
    };
  },
};
