import { describe, expect, it } from 'vitest';
import {
  MANUAL_TEST_PLAN,
  countManualTestCases,
  listManualTestCases,
} from '@/config/manual-test-plan';

describe('manual test plan', () => {
  it('has unique case IDs', () => {
    const ids = listManualTestCases().map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every application role area', () => {
    const roles = new Set(MANUAL_TEST_PLAN.map(section => section.role));
    expect(roles).toEqual(new Set([
      'public',
      'auth',
      'admin',
      'teacher',
      'student',
      'parent',
      'platform',
      'developer',
      'cross-cutting',
    ]));
  });

  it('includes the platform testing module case', () => {
    expect(listManualTestCases().some(item => item.id === 'DEV-09')).toBe(true);
  });

  it('has a substantial checklist', () => {
    expect(countManualTestCases()).toBeGreaterThan(80);
  });
});
