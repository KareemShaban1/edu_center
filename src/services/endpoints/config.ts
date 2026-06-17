import { apiClient } from '@/services/api-client';

export type TenancyMode = 'database_per_tenant' | 'central_shared';

export interface AppConfig {
  tenancy_mode: TenancyMode;
  tenancy_modes: TenancyMode[];
}

export const configApi = {
  async getAppConfig(): Promise<AppConfig> {
    return apiClient.get<AppConfig>('/config');
  },
};
