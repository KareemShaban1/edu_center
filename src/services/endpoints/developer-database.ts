import { apiClient, USE_MOCK } from '../api-client';
import type { DatabaseSchemaCatalog } from '@/types/developer-database';

interface SyncDatabaseSchemaResponse {
  ok: boolean;
  message: string;
  written: string[];
  catalog: DatabaseSchemaCatalog;
}

export const developerDatabaseApi = {
  async liveCatalog(): Promise<DatabaseSchemaCatalog> {
    if (USE_MOCK) {
      return {
        syncedAt: new Date().toISOString(),
        tableCount: 0,
        centerScopedCount: 0,
        membershipScopedCount: 0,
        tables: [],
      };
    }
    return apiClient.get<DatabaseSchemaCatalog>('/developer/database-schema', undefined, false);
  },

  async syncFromLiveDatabase(): Promise<SyncDatabaseSchemaResponse> {
    if (USE_MOCK) {
      const catalog = await this.liveCatalog();
      return { ok: true, message: 'Mock sync', written: [], catalog };
    }
    return apiClient.post<SyncDatabaseSchemaResponse>('/developer/database-schema/sync', {}, false);
  },
};
