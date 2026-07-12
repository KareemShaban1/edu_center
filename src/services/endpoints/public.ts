import { apiClient, USE_MOCK } from '../api-client';

export interface PublicPlatformStats {
  centers: number;
  students: number;
  teachers: number;
}

export interface PublicCenter {
  id: number;
  slug: string;
  name: string;
}

export const publicApi = {
  async getStats(): Promise<PublicPlatformStats> {
    if (USE_MOCK) {
      return { centers: 120, students: 8500, teachers: 420 };
    }
    return apiClient.get<PublicPlatformStats>('/public/stats', undefined, false);
  },

  async listCenters(): Promise<PublicCenter[]> {
    if (USE_MOCK) {
      return [
        { id: 1, slug: 'demo', name: 'Demo Center' },
        { id: 2, slug: 'cairo-excellence', name: 'Cairo Excellence Academy' },
        { id: 3, slug: 'alex-learning', name: 'Alexandria Learning Hub' },
        { id: 4, slug: 'giza-smart', name: 'Giza Smart School' },
        { id: 5, slug: 'delta-edu', name: 'Delta Education Center' },
        { id: 6, slug: 'nile-academy', name: 'Nile Academy' },
        { id: 7, slug: 'future-stars', name: 'Future Stars Center' },
        { id: 8, slug: 'bright-minds', name: 'Bright Minds Institute' },
      ];
    }
    return apiClient.get<PublicCenter[]>('/public/centers', undefined, false);
  },
};
