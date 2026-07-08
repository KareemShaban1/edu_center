import type { LucideIcon } from 'lucide-react';
import {
  GraduationCap,
  Users,
  UserCircle,
  BookOpen,
  Layers,
  BookMarked,
  FileText,
  ClipboardList,
  Video,
  CalendarCheck,
  DollarSign,
  Library,
  MessageSquare,
  Bell,
  Layout,
  MessageCircle,
  PieChart,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';

export interface AdminDashboardLink {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export interface AdminDashboardLinkGroup {
  labelKey: string;
  links: AdminDashboardLink[];
}

export const adminMainLinks: AdminDashboardLink[] = [
  { labelKey: 'nav.students', path: '/admin/students', icon: GraduationCap },
  { labelKey: 'nav.teachers', path: '/admin/teachers', icon: Users },
  { labelKey: 'nav.parents', path: '/admin/parents', icon: UserCircle },
];

export const adminLinkGroups: AdminDashboardLinkGroup[] = [
  {
    labelKey: 'nav.group.structure',
    links: [
      { labelKey: 'nav.grades', path: '/admin/grades', icon: BookOpen },
      { labelKey: 'nav.classes', path: '/admin/classes', icon: Layers },
      { labelKey: 'nav.sections', path: '/admin/sections', icon: Users },
    ],
  },
  {
    labelKey: 'nav.group.curriculum',
    links: [
      { labelKey: 'nav.units', path: '/admin/units', icon: BookMarked },
      { labelKey: 'nav.lessons', path: '/admin/lessons', icon: FileText },
      { labelKey: 'nav.homework', path: '/admin/homework', icon: ClipboardList },
    ],
  },
  {
    labelKey: 'nav.group.sessions',
    links: [
      { labelKey: 'nav.adminSessions', path: '/admin/sessions', icon: Video },
    ],
  },
  {
    labelKey: 'nav.group.classroom',
    links: [
      { labelKey: 'nav.attendance', path: '/admin/attendance', icon: CalendarCheck },
      { labelKey: 'nav.exams', path: '/admin/exams', icon: ClipboardList },
      { labelKey: 'nav.quizzes', path: '/admin/quizzes', icon: ClipboardList },
    ],
  },
  {
    labelKey: 'nav.group.finance',
    links: [
      { labelKey: 'nav.fees', path: '/admin/fees', icon: DollarSign },
      { labelKey: 'nav.payments', path: '/admin/payments', icon: DollarSign },
    ],
  },
  {
    labelKey: 'nav.group.content',
    links: [
      { labelKey: 'nav.library', path: '/admin/library', icon: Library },
      { labelKey: 'nav.announcements', path: '/admin/announcements', icon: MessageSquare },
      { labelKey: 'nav.notifications', path: '/admin/notifications', icon: Bell },
      { labelKey: 'nav.whatsapp', path: '/admin/whatsapp', icon: MessageCircle },
      { labelKey: 'nav.landingBuilder', path: '/admin/landing', icon: Layout },
    ],
  },
  {
    labelKey: 'nav.group.insights',
    links: [
      { labelKey: 'nav.reportsAttendance', path: '/admin/reports/attendance', icon: CalendarCheck },
      { labelKey: 'nav.reportsExams', path: '/admin/reports/exams', icon: ClipboardList },
      { labelKey: 'nav.reportsQuizzes', path: '/admin/reports/quizzes', icon: ClipboardList },
      { labelKey: 'nav.reportsPayments', path: '/admin/reports/payments', icon: DollarSign },
    ],
  },
  {
    labelKey: 'nav.group.administration',
    links: [
      { labelKey: 'nav.adminUsers', path: '/admin/users', icon: Users },
      { labelKey: 'nav.rolesPermissions', path: '/admin/roles', icon: Shield },
      { labelKey: 'nav.settings', path: '/admin/settings', icon: SlidersHorizontal },
    ],
  },
];
