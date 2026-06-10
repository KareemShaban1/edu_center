import type {
  LandingPage,
  LandingPageAnalytics,
  LandingPageListItem,
  LandingPageRevision,
  MediaAsset,
} from '@/types/landing';
import {
  LANDING_ANALYTICS_KEY,
  LANDING_MEDIA_KEY,
  LANDING_REVISIONS_KEY,
  LANDING_STORAGE_KEY,
} from './constants';
import { createEmptyPage, uid } from './defaults';
import { generateTeacherLandingPage } from './teacher-generator';
import { mockTeachers } from '@/services/mock-data';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function seedPages(): LandingPage[] {
  const teacher = mockTeachers[0];
  const page = generateTeacherLandingPage(teacher, 'math');
  page.status = 'published';
  page.publishedAt = new Date().toISOString();
  page.slug = 'teacher/teacher-1';
  return [page];
}

export const landingMockStore = {
  getPages(): LandingPage[] {
    const pages = read<LandingPage[]>(LANDING_STORAGE_KEY, []);
    if (pages.length === 0) {
      const seeded = seedPages();
      write(LANDING_STORAGE_KEY, seeded);
      return seeded;
    }
    return pages;
  },

  savePages(pages: LandingPage[]): void {
    write(LANDING_STORAGE_KEY, pages);
  },

  getPage(id: string): LandingPage | undefined {
    return this.getPages().find(p => p.id === id);
  },

  getPageBySlug(slug: string): LandingPage | undefined {
    return this.getPages().find(p => p.slug === slug && p.status === 'published');
  },

  upsertPage(page: LandingPage): LandingPage {
    const pages = this.getPages();
    const idx = pages.findIndex(p => p.id === page.id);
    const updated = { ...page, updatedAt: new Date().toISOString() };
    if (idx >= 0) pages[idx] = updated;
    else pages.push(updated);
    this.savePages(pages);
    return updated;
  },

  deletePage(id: string): void {
    this.savePages(this.getPages().filter(p => p.id !== id));
  },

  listPages(): LandingPageListItem[] {
    const analytics = this.getAllAnalytics();
    return this.getPages().map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      type: p.type,
      status: p.status,
      teacherId: p.teacherId,
      updatedAt: p.updatedAt,
      publishedAt: p.publishedAt,
      visitors: analytics[p.id]?.visitors ?? 0,
    }));
  },

  getRevisions(pageId: string): LandingPageRevision[] {
    const all = read<LandingPageRevision[]>(LANDING_REVISIONS_KEY, []);
    return all.filter(r => r.pageId === pageId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addRevision(page: LandingPage, label?: string): LandingPageRevision {
    const all = read<LandingPageRevision[]>(LANDING_REVISIONS_KEY, []);
    const rev: LandingPageRevision = {
      id: uid('rev'),
      pageId: page.id,
      snapshot: structuredClone(page),
      createdAt: new Date().toISOString(),
      label,
    };
    all.push(rev);
    const trimmed = all.filter(r => r.pageId !== page.id).concat(
      all.filter(r => r.pageId === page.id).slice(-20),
    );
    write(LANDING_REVISIONS_KEY, trimmed);
    return rev;
  },

  getMedia(): MediaAsset[] {
    return read<MediaAsset[]>(LANDING_MEDIA_KEY, []);
  },

  addMedia(asset: Omit<MediaAsset, 'id' | 'createdAt'>): MediaAsset {
    const items = this.getMedia();
    const created: MediaAsset = { ...asset, id: uid('media'), createdAt: new Date().toISOString() };
    items.push(created);
    write(LANDING_MEDIA_KEY, items);
    return created;
  },

  deleteMedia(id: string): void {
    write(LANDING_MEDIA_KEY, this.getMedia().filter(m => m.id !== id));
  },

  getAnalytics(pageId: string): LandingPageAnalytics {
    const all = read<Record<string, LandingPageAnalytics>>(LANDING_ANALYTICS_KEY, {});
    if (all[pageId]) return all[pageId];
    const mock: LandingPageAnalytics = {
      pageId,
      visitors: Math.floor(Math.random() * 5000) + 200,
      uniqueVisitors: Math.floor(Math.random() * 3000) + 100,
      conversionRate: Math.round((Math.random() * 8 + 2) * 10) / 10,
      leads: Math.floor(Math.random() * 150) + 10,
      formSubmissions: Math.floor(Math.random() * 80) + 5,
      ctaClicks: Math.floor(Math.random() * 400) + 50,
      deviceStats: { mobile: 55, tablet: 15, desktop: 30 },
      trafficSources: [
        { source: 'Google', count: 45 },
        { source: 'Facebook', count: 25 },
        { source: 'WhatsApp', count: 20 },
        { source: 'Direct', count: 10 },
      ],
      dailyViews: Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
        views: Math.floor(Math.random() * 200) + 20,
      })),
    };
    all[pageId] = mock;
    write(LANDING_ANALYTICS_KEY, all);
    return mock;
  },

  getAllAnalytics(): Record<string, LandingPageAnalytics> {
    const pages = this.getPages();
    const out: Record<string, LandingPageAnalytics> = {};
    for (const p of pages) out[p.id] = this.getAnalytics(p.id);
    return out;
  },

  trackView(pageId: string): void {
    const all = read<Record<string, LandingPageAnalytics>>(LANDING_ANALYTICS_KEY, {});
    const a = all[pageId] || this.getAnalytics(pageId);
    a.visitors += 1;
    a.uniqueVisitors += Math.random() > 0.3 ? 1 : 0;
    all[pageId] = a;
    write(LANDING_ANALYTICS_KEY, all);
  },

  createPage(overrides?: Partial<LandingPage>): LandingPage {
    return this.upsertPage(createEmptyPage(overrides));
  },
};
