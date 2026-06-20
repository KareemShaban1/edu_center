import type { ApiError, PaginatedResponse, TenantContext } from '@/types/models';

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    return `${window.location.origin}/api`;
  }
  const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  return configured || 'http://127.0.0.1:8000/api';
}

const DEFAULT_BASE_URL = resolveApiBaseUrl();
const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TENANT_STORAGE_KEY = 'edu_tenant_context';

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null) {
  onSessionExpired = handler;
}

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

  private getBaseUrl(): string {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      return `${window.location.origin}/api`;
    }
    return this.baseUrl;
  }

  private buildUrl(path: string, useLocale = true): string {
    const prefix = useLocale ? `/${this.locale}` : '';
    return `${this.getBaseUrl()}${prefix}${path}`;
  }

  /** Always resolve to an absolute same-origin URL so session cookies attach reliably. */
  private resolveRequestUrl(path: string, useLocale = true): string {
    const built = this.buildUrl(path, useLocale);
    if (built.startsWith('http://') || built.startsWith('https://')) {
      return built;
    }
    return new URL(built, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1').href;
  }

  private withTenantQuery(path: string): string {
    const slug = this.tenantContext.tenantSlug;
    if (!slug || path.includes('tenant_slug=')) return path;
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}tenant_slug=${encodeURIComponent(slug)}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: body.message || `Request failed with status ${response.status}`,
        errors: body.errors,
        status: response.status,
        requires_tenant_selection: body.requires_tenant_selection === true,
        memberships: Array.isArray(body.memberships) ? body.memberships : undefined,
        user: body.user,
      };
      if (response.status === 401 && onSessionExpired && this.token) {
        const path = new URL(response.url).pathname;
        if (path.endsWith('/user') || path.endsWith('/login')) {
          onSessionExpired();
        }
      }
      throw error;
    }
    return response.json();
  }

  private headers(): HeadersInit {
    const h: HeadersInit = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Locale': this.locale,
    };
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.tenantContext.tenantId) h['X-Tenant-Id'] = String(this.tenantContext.tenantId);
    if (this.tenantContext.tenantSlug) h['X-Tenant-Slug'] = this.tenantContext.tenantSlug;
    if (this.tenantContext.database) h['X-Tenant-Database'] = this.tenantContext.database;
    return h;
  }

  async get<T>(path: string, params?: Record<string, string | number>, useLocale = true): Promise<T> {
    const url = new URL(this.resolveRequestUrl(this.withTenantQuery(path), useLocale));
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.href, { headers: this.headers(), credentials: 'include' });
    return this.handleResponse<T>(res);
  }

  async post<T>(path: string, body?: unknown, useLocale = true): Promise<T> {
    const res = await fetch(this.resolveRequestUrl(this.withTenantQuery(path), useLocale), {
      method: 'POST',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(path: string, body?: unknown, useLocale = true): Promise<T> {
    const res = await fetch(this.resolveRequestUrl(this.withTenantQuery(path), useLocale), {
      method: 'PUT',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string, useLocale = true): Promise<T> {
    const res = await fetch(this.resolveRequestUrl(this.withTenantQuery(path), useLocale), {
      method: 'DELETE',
      headers: this.headers(),
      credentials: 'include',
    });
    return this.handleResponse<T>(res);
  }

  async upload<T>(path: string, formData: FormData, useLocale = true): Promise<T> {
    const h = this.headers() as Record<string, string>;
    delete h['Content-Type'];
    const res = await fetch(this.resolveRequestUrl(this.withTenantQuery(path), useLocale), {
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
