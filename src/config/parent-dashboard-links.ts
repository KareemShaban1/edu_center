import type { LucideIcon } from 'lucide-react';
import {
  Users,
  CalendarCheck,
  DollarSign,
  Trophy,
  FileText,
  ClipboardList,
} from 'lucide-react';

export interface ParentDashboardLink {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export interface ParentDashboardLinkGroup {
  labelKey: string;
  links: ParentDashboardLink[];
}

export const parentMainLinks: ParentDashboardLink[] = [
  { labelKey: 'nav.children', path: '/parent/children', icon: Users },
  { labelKey: 'nav.attendance', path: '/parent/attendance', icon: CalendarCheck },
  { labelKey: 'nav.fees_short', path: '/parent/fees', icon: DollarSign },
];

export const parentLinkGroups: ParentDashboardLinkGroup[] = [
  {
    labelKey: 'nav.group.assessment',
    links: [
      { labelKey: 'nav.quizzes', path: '/parent/quizzes', icon: Trophy },
      { labelKey: 'nav.exams', path: '/parent/exams', icon: FileText },
    ],
  },
  {
    labelKey: 'nav.group.insights',
    links: [
      { labelKey: 'nav.reports', path: '/parent/reports', icon: ClipboardList },
    ],
  },
];
