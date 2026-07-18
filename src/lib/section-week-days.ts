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

/** Resolve weekday key (monday…sunday) from a session start_at datetime string. */
export function weekDayFromStartAt(startAt: string | null | undefined): WeekDayName | '' {
  if (!startAt) return '';
  const normalized = startAt.includes('T') ? startAt : startAt.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '';
  const map: WeekDayName[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return map[date.getDay()] ?? '';
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
