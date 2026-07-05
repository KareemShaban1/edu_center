export interface ApiRouteDefinition {
  id: string;
  method: string;
  path: string;
  fullPath: string;
  handler: string;
  module: string;
  pathParams: string[];
  acceptsBody: boolean;
  authRequired: boolean;
}

export interface ApiRoutesCatalog {
  syncedAt: string;
  routes: ApiRouteDefinition[];
}

export interface DocsManifest {
  syncedAt: string;
  apiRouteCount: number;
  frontendRouteCount: number;
  migrationTableCount: number;
  scopedTableCount: number;
  userRoles: string[];
  endpointModules: string[];
}

export interface ApiTestRequest {
  routeId: string;
  method: string;
  path: string;
  pathParamValues: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  useLocale: boolean;
}

export interface ApiTestResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  requestUrl: string;
  requestMethod: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  error?: string;
}

export interface ApiTestLogEntry {
  id: string;
  timestamp: string;
  routeId: string;
  method: string;
  path: string;
  request: ApiTestRequest;
  result: ApiTestResult;
}
