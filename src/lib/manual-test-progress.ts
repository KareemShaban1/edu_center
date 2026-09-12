const STORAGE_KEY = 'edu_platform_manual_test_progress';

export interface ManualTestProgressEntry {
  done: boolean;
  updatedAt: string;
}

export type ManualTestProgressMap = Record<string, ManualTestProgressEntry>;

function readProgress(): ManualTestProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ManualTestProgressMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(map: ManualTestProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getManualTestProgress(): ManualTestProgressMap {
  return readProgress();
}

export function setManualTestCaseDone(id: string, done: boolean): ManualTestProgressMap {
  const next = { ...readProgress() };
  if (done) {
    next[id] = { done: true, updatedAt: new Date().toISOString() };
  } else {
    delete next[id];
  }
  writeProgress(next);
  return next;
}

export function resetManualTestProgress(): ManualTestProgressMap {
  localStorage.removeItem(STORAGE_KEY);
  return {};
}

export function countDoneCases(progress: ManualTestProgressMap, caseIds: string[]): number {
  return caseIds.filter(id => progress[id]?.done).length;
}
