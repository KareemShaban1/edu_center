import { describe, expect, it } from 'vitest';
import type { ApiRouteDefinition } from '@/types/developer-api';
import {
  buildApiSuiteCases,
  dummyPathParams,
  evaluateApiSuiteResult,
  isPublicApiRoute,
  statusMatches,
} from '@/lib/api-test-suite';

function route(partial: Partial<ApiRouteDefinition> & Pick<ApiRouteDefinition, 'path' | 'method'>): ApiRouteDefinition {
  return {
    id: `${partial.method}-${partial.path}`,
    fullPath: `/api${partial.path}`,
    handler: 'test',
    module: 'test',
    pathParams: [],
    acceptsBody: ['POST', 'PUT', 'PATCH'].includes(partial.method),
    authRequired: true,
    ...partial,
  };
}

describe('api test suite helpers', () => {
  it('treats public catalog routes as public', () => {
    expect(isPublicApiRoute(route({ method: 'GET', path: '/config', authRequired: false }))).toBe(true);
    expect(isPublicApiRoute(route({ method: 'GET', path: '/public/centers' }))).toBe(true);
    expect(isPublicApiRoute(route({ method: 'GET', path: '/admin/bootstrap' }))).toBe(false);
  });

  it('fills dummy path parameters', () => {
    const params = dummyPathParams(route({
      method: 'GET',
      path: '/admin/attendance/section/{sectionId}/date/{date}',
      pathParams: ['sectionId', 'date'],
    }));
    expect(params.sectionId).toBe('1');
    expect(params.date).toBe('2026-01-01');
  });

  it('matches 2xx as a range', () => {
    expect(statusMatches(200, ['2xx', 401])).toBe(true);
    expect(statusMatches(401, ['2xx', 401])).toBe(true);
    expect(statusMatches(500, ['2xx', 401])).toBe(false);
  });

  it('skips mutating methods in the authenticated GET suite', () => {
    const cases = buildApiSuiteCases([
      route({ method: 'DELETE', path: '/admin/students/{id}', pathParams: ['id'] }),
      route({ method: 'GET', path: '/admin/bootstrap' }),
    ], 'authenticated-get');
    expect(cases[0].skipReason).toBeTruthy();
    expect(cases[1].skipReason).toBeUndefined();
  });

  it('fails server errors even if the status is listed', () => {
    const testCase = buildApiSuiteCases([route({ method: 'GET', path: '/admin/bootstrap' })], 'unauthenticated')[0];
    const result = evaluateApiSuiteResult(testCase, {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      durationMs: 10,
      requestUrl: '/api/admin/bootstrap',
      requestMethod: 'GET',
      requestHeaders: {},
      responseHeaders: {},
      responseBody: '{"message":"error"}',
    });
    expect(result.verdict).toBe('fail');
  });
});
