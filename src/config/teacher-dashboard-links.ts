import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Video,
  CalendarCheck,
  ClipboardList,
  FileText,
  Trophy,
  Library,
  ListTodo,
  NotebookPen,
} from 'lucide-react';

export interface TeacherDashboardLink {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export interface TeacherDashboardLinkGroup {
  labelKey: string;
  links: TeacherDashboardLink[];
}

export const teacherMainLinks: TeacherDashboardLink[] = [
  { labelKey: 'nav.myClasses', path: '/teacher/classes', icon: BookOpen },
  { labelKey: 'nav.teacherSessions', path: '/teacher/sessions', icon: Video },
  { labelKey: 'nav.attendance', path: '/teacher/attendance', icon: CalendarCheck },
  { labelKey: 'nav.todos', path: '/teacher/todos', icon: ListTodo },
];

export const teacherLinkGroups: TeacherDashboardLinkGroup[] = [
  {
    labelKey: 'nav.group.classroom',
    links: [
      { labelKey: 'nav.quizzes', path: '/teacher/quizzes', icon: Trophy },
      { labelKey: 'nav.exams', path: '/teacher/exams', icon: FileText },
      { labelKey: 'nav.homework', path: '/teacher/homework', icon: ClipboardList },
    ],
  },
  {
    labelKey: 'nav.group.content',
    links: [
      { labelKey: 'nav.library', path: '/teacher/library', icon: Library },
      { labelKey: 'nav.notes', path: '/teacher/notes', icon: NotebookPen },
    ],
  },
];
