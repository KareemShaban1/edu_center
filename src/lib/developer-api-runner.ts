import { apiClient } from '@/services/api-client';
import type { ApiTestRequest, ApiTestResult } from '@/types/developer-api';
import { resolveApiPath } from '@/lib/developer-api-catalog';
import { getDeveloperApiAuthMeta, getDeveloperApiToken, getApiTestToken } from '@/lib/developer-api-auth';

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    return `${window.location.origin}/api`;
  }
  const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  return configured || 'http://127.0.0.1:8000/api';
}

function resolveTenantContext() {
  const devMeta = getDeveloperApiAuthMeta();
  if (devMeta?.tenantSlug || devMeta?.tenantId) {
    return {
      tenantId: devMeta.tenantId ?? undefined,
      tenantSlug: devMeta.tenantSlug ?? undefined,
      database: undefined as string | undefined,
    };
  }
  return apiClient.getTenantContext();
}

function buildHeaders(hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Locale': apiClient.getLocale(),
  };
  const token = getApiTestToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenant = resolveTenantContext();
  if (tenant.tenantId) headers['X-Tenant-Id'] = String(tenant.tenantId);
  if (tenant.tenantSlug) headers['X-Tenant-Slug'] = tenant.tenantSlug;
  if (tenant.database) headers['X-Tenant-Database'] = tenant.database;
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function readResponseBody(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return '';
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export async function runApiTest(request: ApiTestRequest): Promise<ApiTestResult> {
  const resolvedPath = resolveApiPath(request.path, request.pathParamValues);
  const localePrefix = request.useLocale ? `/${apiClient.getLocale()}` : '';
  let urlPath = `${localePrefix}${resolvedPath}`;

  const tenant = resolveTenantContext();
  if (tenant.tenantSlug && !urlPath.includes('tenant_slug=')) {
    const sep = urlPath.includes('?') ? '&' : '?';
    urlPath = `${urlPath}${sep}tenant_slug=${encodeURIComponent(tenant.tenantSlug)}`;
  }

  const url = new URL(`${resolveApiBaseUrl()}${urlPath}`);
  Object.entries(request.queryParams).forEach(([key, value]) => {
    if (key.trim()) url.searchParams.set(key.trim(), value);
  });

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(request.method) && request.body.trim() !== '';
  const headers = buildHeaders(hasBody);
  const started = performance.now();

  try {
    const response = await fetch(url.href, {
      method: request.method,
      headers,
      credentials: 'include',
      body: hasBody ? request.body : undefined,
    });
    const durationMs = Math.round(performance.now() - started);
    const responseBody = await readResponseBody(response);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      requestUrl: url.href,
      requestMethod: request.method,
      requestHeaders: headers,
      requestBody: hasBody ? request.body : undefined,
      responseHeaders: headersToRecord(response.headers),
      responseBody,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - started);
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      durationMs,
      requestUrl: url.href,
      requestMethod: request.method,
      requestHeaders: headers,
      requestBody: hasBody ? request.body : undefined,
      responseHeaders: {},
      responseBody: '',
      error: err instanceof Error ? err.message : 'Request failed',
    };
  }
}
