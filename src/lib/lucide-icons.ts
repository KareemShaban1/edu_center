import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

const EXCLUDED_EXPORTS = new Set([
  'createLucideIcon',
  'icons',
  'default',
  'Icon',
  'LucideIcon',
]);

function isReactComponent(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { $$typeof?: unknown; render?: unknown };
  return candidate.$$typeof != null || typeof candidate.render === 'function';
}

export function isLucideIconExport(name: string, value: unknown): value is LucideIcon {
  return (
    isReactComponent(value)
    && /^[A-Z]/.test(name)
    && !name.endsWith('Icon')
    && !EXCLUDED_EXPORTS.has(name)
  );
}

function buildLucideIconNames(): string[] {
  const fromIconsMap = LucideIcons.icons
    ? Object.keys(LucideIcons.icons).filter(name => /^[A-Z]/.test(name))
    : [];

  if (fromIconsMap.length > 0) {
    return fromIconsMap.sort((a, b) => a.localeCompare(b));
  }

  return Object.keys(LucideIcons)
    .filter(name => isLucideIconExport(name, (LucideIcons as Record<string, unknown>)[name]))
    .sort((a, b) => a.localeCompare(b));
}

/** Full Lucide icon name list for the picker. */
export const LUCIDE_ICON_NAMES: string[] = buildLucideIconNames();

export function resolveLucideIcon(name?: string | null, fallback: LucideIcon = HelpCircle): LucideIcon {
  if (!name) return fallback;

  const fromMap = LucideIcons.icons?.[name as keyof typeof LucideIcons.icons];
  if (fromMap && isReactComponent(fromMap)) {
    return fromMap as LucideIcon;
  }

  const candidate = (LucideIcons as Record<string, unknown>)[name];
  if (isLucideIconExport(name, candidate)) return candidate;

  return fallback;
}

export function navPathIconKey(path: string): string {
  return `nav.path.${path.replace(/^\//, '').replace(/\//g, '.')}`;
}

export function navGroupIconKey(groupId: string): string {
  return `nav.group.${groupId}`;
}

export function landingIconKey(semantic: string): string {
  return `landing.icon.${semantic}`;
}

export function guideRoleIconKey(role: string): string {
  return `guide.role.${role}`;
}

export function landingStatIconKey(stat: string): string {
  return `landing.stat.${stat}`;
}
