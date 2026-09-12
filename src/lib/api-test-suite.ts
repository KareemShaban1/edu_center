import type { ApiRouteDefinition, ApiTestRequest, ApiTestResult } from '@/types/developer-api';
import { runApiTest } from '@/lib/developer-api-runner';

export type ApiSuiteMode = 'unauthenticated' | 'authenticated-get';

export type ApiSuiteVerdict = 'pass' | 'fail' | 'skip';

export type ExpectedStatus = number | '2xx';

export interface ApiSuiteCase {
  route: ApiRouteDefinition;
  request: ApiTestRequest;
  expectedStatuses: ExpectedStatus[];
  skipReason?: string;
}

export interface ApiSuiteCaseResult {
  routeId: string;
  method: string;
  path: string;
  verdict: ApiSuiteVerdict;
  expectedStatuses: ExpectedStatus[];
  skipReason?: string;
  status?: number;
  durationMs?: number;
  error?: string;
  responsePreview?: string;
}

const PUBLIC_EXACT = new Set([
  '/login',
  '/register/parent',
  '/register/student',
  '/register/center',
  '/auth/guards',
  '/config',
  '/branding',
  '/ui-translations',
  '/website-images',
  '/ui-icons',
  '/public/centers',
  '/public/stats',
]);

const PUBLIC_PREFIXES = ['/public/', '/storage/'];

export function isPublicApiRoute(route: ApiRouteDefinition): boolean {
  if (!route.authRequired) return true;
  if (PUBLIC_EXACT.has(route.path)) return true;
  return PUBLIC_PREFIXES.some(prefix => route.path.startsWith(prefix));
}

export function dummyPathParams(route: ApiRouteDefinition): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of route.pathParams) {
    if (key === 'date') out[key] = '2026-01-01';
    else if (key === 'slug' || key === 'fileName') out[key] = 'demo';
    else if (key === 'format') out[key] = 'pdf';
    else if (key === 'source') out[key] = 'exam';
    else if (key === 'type') out[key] = 'attendance';
    else if (key === 'locale') out[key] = 'en';
    else if (key === 'key') out[key] = 'test.key';
    else out[key] = '1';
  }
  return out;
}

export function statusMatches(status: number, expected: ExpectedStatus[]): boolean {
  return expected.some(item => (item === '2xx' ? status >= 200 && status < 300 : item === status));
}

function expectedForUnauthenticated(route: ApiRouteDefinition): ExpectedStatus[] {
  if (route.method === 'POST' && route.path === '/login') {
    return [422, 400, 401];
  }
  if (isPublicApiRoute(route) && (route.method === 'GET' || route.method === 'HEAD')) {
    return ['2xx', 404];
  }
  if (isPublicApiRoute(route) && route.acceptsBody) {
    return ['2xx', 400, 401, 404, 405, 422];
  }
  return [401, 403, 404, 405];
}

export function buildApiSuiteCases(routes: ApiRouteDefinition[], mode: ApiSuiteMode): ApiSuiteCase[] {
  return routes.map(route => {
    if (mode === 'authenticated-get' && route.method !== 'GET' && route.method !== 'HEAD') {
      return {
        route,
        request: {
          routeId: route.id,
          method: route.method,
          path: route.path,
          pathParamValues: dummyPathParams(route),
          queryParams: {},
          body: '{}',
          useLocale: false,
        },
        expectedStatuses: [],
        skipReason: 'Mutating methods are skipped in the authenticated GET suite',
      };
    }

    const expectedStatuses = mode === 'authenticated-get'
      ? (['2xx', 401, 403, 404, 405, 422] as ExpectedStatus[])
      : expectedForUnauthenticated(route);

    return {
      route,
      request: {
        routeId: route.id,
        method: route.method,
        path: route.path,
        pathParamValues: dummyPathParams(route),
        queryParams: {},
        body: route.acceptsBody ? '{}' : '',
        useLocale: false,
      },
      expectedStatuses,
    };
  });
}

function previewBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return '';
  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}

export function evaluateApiSuiteResult(
  testCase: ApiSuiteCase,
  result?: ApiTestResult,
): ApiSuiteCaseResult {
  if (testCase.skipReason) {
    return {
      routeId: testCase.route.id,
      method: testCase.route.method,
      path: testCase.route.path,
      verdict: 'skip',
      expectedStatuses: testCase.expectedStatuses,
      skipReason: testCase.skipReason,
    };
  }

  if (!result) {
    return {
      routeId: testCase.route.id,
      method: testCase.route.method,
      path: testCase.route.path,
      verdict: 'fail',
      expectedStatuses: testCase.expectedStatuses,
      error: 'No response',
    };
  }

  const serverError = result.status >= 500 || result.status === 0;
  const ok = !serverError && statusMatches(result.status, testCase.expectedStatuses);

  return {
    routeId: testCase.route.id,
    method: testCase.route.method,
    path: testCase.route.path,
    verdict: ok ? 'pass' : 'fail',
    expectedStatuses: testCase.expectedStatuses,
    status: result.status,
    durationMs: result.durationMs,
    error: result.error,
    responsePreview: previewBody(result.responseBody),
  };
}

export async function runApiSuite(
  routes: ApiRouteDefinition[],
  mode: ApiSuiteMode,
  options: {
    signal?: AbortSignal;
    onResult?: (result: ApiSuiteCaseResult, index: number, total: number) => void;
  } = {},
): Promise<ApiSuiteCaseResult[]> {
  const cases = buildApiSuiteCases(routes, mode);
  const results: ApiSuiteCaseResult[] = [];

  for (let index = 0; index < cases.length; index += 1) {
    if (options.signal?.aborted) break;
    const testCase = cases[index];
    if (testCase.skipReason) {
      const skipped = evaluateApiSuiteResult(testCase);
      results.push(skipped);
      options.onResult?.(skipped, index, cases.length);
      continue;
    }

    const response = await runApiTest(testCase.request);
    const evaluated = evaluateApiSuiteResult(testCase, response);
    results.push(evaluated);
    options.onResult?.(evaluated, index, cases.length);
  }

  return results;
}

export function summarizeApiSuite(results: ApiSuiteCaseResult[]) {
  return results.reduce(
    (acc, item) => {
      acc[item.verdict] += 1;
      return acc;
    },
    { pass: 0, fail: 0, skip: 0 },
  );
}
