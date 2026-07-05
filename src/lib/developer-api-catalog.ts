import type { ApiRoutesCatalog, DocsManifest } from '@/types/developer-api';
import type { DatabaseSchemaCatalog } from '@/types/developer-database';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchDocsManifest(): Promise<DocsManifest> {
  return fetchJson<DocsManifest>('/docs/generated/MANIFEST.json');
}

export function fetchApiRoutesCatalog(): Promise<ApiRoutesCatalog> {
  return fetchJson<ApiRoutesCatalog>('/docs/generated/api-routes.json');
}

export function fetchDatabaseSchemaCatalog(): Promise<DatabaseSchemaCatalog> {
  return fetchJson<DatabaseSchemaCatalog>('/docs/generated/database-schema.json');
}

export function resolveApiPath(
  template: string,
  pathParamValues: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = pathParamValues[key];
    return value !== undefined && value !== '' ? encodeURIComponent(value) : `{${key}}`;
  });
}
