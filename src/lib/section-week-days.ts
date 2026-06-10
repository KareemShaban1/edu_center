export const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type WeekDayName = (typeof WEEK_DAYS)[number];

export interface SectionWeekDay {
  day: WeekDayName | string;
  time: string;
}

export function parseWeekDays(raw: unknown): SectionWeekDay[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is SectionWeekDay => Boolean(item && typeof item === 'object'))
      .map(item => ({ day: String(item.day || ''), time: String(item.time || '') }))
      .filter(item => WEEK_DAYS.includes(item.day as WeekDayName) && /^\d{2}:\d{2}$/.test(item.time));
  }
  if (typeof raw === 'string') {
    try {
      return parseWeekDays(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

export function weekDayLabel(day: string, t: (key: string) => string): string {
  const key = `weekday.${day}`;
  const label = t(key);
  return label === key ? day : label;
}

export function formatWeekDays(
  items: SectionWeekDay[] | null | undefined,
  t: (key: string) => string,
): string {
  const parsed = parseWeekDays(items);
  if (parsed.length === 0) return '';
  return parsed.map(item => `${weekDayLabel(String(item.day), t)} ${item.time}`).join(' · ');
}

export function emptyWeekDayRow(): SectionWeekDay {
  return { day: 'monday', time: '09:00' };
}
