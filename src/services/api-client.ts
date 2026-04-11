import type { ApiError, PaginatedResponse, TenantContext } from '@/types/models';

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TENANT_STORAGE_KEY = 'edu_tenant_context';

class ApiClient {
  private baseUrl: string;
  private locale: string;
  private token: string | null = null;
  private tenantContext: TenantContext = {};

  constructor() {
    this.baseUrl = DEFAULT_BASE_URL;
    this.locale = DEFAULT_LOCALE;
    this.token = localStorage.getItem('auth_token');
    const storedTenant = localStorage.getItem(TENANT_STORAGE_KEY);
    if (storedTenant) {
      try {
        this.tenantContext = JSON.parse(storedTenant) as TenantContext;
      } catch {
        this.tenantContext = {};
      }
    }
  }

  setLocale(locale: string) {
    this.locale = locale;
  }

  getLocale() {
    return this.locale;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  setTenantContext(ctx: TenantContext | null) {
    this.tenantContext = ctx ?? {};
    if (ctx) {
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(ctx));
    } else {
      localStorage.removeItem(TENANT_STORAGE_KEY);
    }
  }

  getTenantContext() {
    return this.tenantContext;
  }

  private buildUrl(path: string, useLocale = true): string {
    const prefix = useLocale ? `/${this.locale}` : '';
    return `${this.baseUrl}${prefix}${path}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: body.message || `Request failed with status ${response.status}`,
        errors: body.errors,
        status: response.status,
      };
      throw error;
    }
    return response.json();
  }

  private headers(): HeadersInit {
    const h: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    if (this.tenantContext.tenantId) h['X-Tenant-Id'] = String(this.tenantContext.tenantId);
    if (this.tenantContext.tenantSlug) h['X-Tenant-Slug'] = this.tenantContext.tenantSlug;
    if (this.tenantContext.database) h['X-Tenant-Database'] = this.tenantContext.database;
    return h;
  }

  async get<T>(path: string, params?: Record<string, string | number>, useLocale = true): Promise<T> {
    const builtUrl = this.buildUrl(path, useLocale);
    const url = builtUrl.startsWith('http://') || builtUrl.startsWith('https://')
      ? new URL(builtUrl)
      : new URL(builtUrl, window.location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString(), { headers: this.headers(), credentials: 'include' });
    return this.handleResponse<T>(res);
  }

  async post<T>(path: string, body?: unknown, useLocale = true): Promise<T> {
    const res = await fetch(this.buildUrl(path, useLocale), {
      method: 'POST',
      headers: this.headers(),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(path: string, body?: unknown, useLocale = true): Promise<T> {
    const res = await fetch(this.buildUrl(path, useLocale), {
      method: 'PUT',
      headers: this.headers(),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string, useLocale = true): Promise<T> {
    const res = await fetch(this.buildUrl(path, useLocale), {
      method: 'DELETE',
      headers: this.headers(),
      credentials: 'include',
    });
    return this.handleResponse<T>(res);
  }

  async upload<T>(path: string, formData: FormData, useLocale = true): Promise<T> {
    const h = this.headers() as Record<string, string>;
    delete h['Content-Type'];
    const res = await fetch(this.buildUrl(path, useLocale), {
      method: 'POST',
      headers: h,
      credentials: 'include',
      body: formData,
    });
    return this.handleResponse<T>(res);
  }

  async getPaginated<T>(path: string, params?: Record<string, string | number>): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(path, params);
  }
}

export const apiClient = new ApiClient();
export { USE_MOCK };
