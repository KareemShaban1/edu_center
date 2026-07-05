import type { ApiTestLogEntry, ApiTestRequest, ApiTestResult } from '@/types/developer-api';

const STORAGE_KEY = 'edu_developer_api_test_logs';
const MAX_LOGS = 200;

function readLogs(): ApiTestLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ApiTestLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: ApiTestLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
}

export function listApiTestLogs(): ApiTestLogEntry[] {
  return readLogs();
}

export function appendApiTestLog(
  routeId: string,
  method: string,
  path: string,
  request: ApiTestRequest,
  result: ApiTestResult,
): ApiTestLogEntry {
  const entry: ApiTestLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    routeId,
    method,
    path,
    request,
    result,
  };
  const next = [entry, ...readLogs()].slice(0, MAX_LOGS);
  writeLogs(next);
  return entry;
}

export function clearApiTestLogs() {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearApiTestLogsForRoute(routeId: string) {
  writeLogs(readLogs().filter(log => log.routeId !== routeId));
}
