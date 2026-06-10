import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTenantLoginPath } from '@/lib/tenant-routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  Menu,
  FileText,
  Activity,
  Globe,
  ClipboardList,
  Library,
  MessageSquare,
  ChevronDown,
  UserCircle,
  Languages,
  Shield,
  Layers,
  BookMarked,
  ClipboardCheck,
  CircleDollarSign,
  FolderOpen,
  Video,
  PieChart,
  SlidersHorizontal,
  Layout,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PwaInstallButton } from '@/components/PwaInstallButton';

type NavIcon = React.ElementType;

interface NavLinkDef {
  labelKey: string;
  path: string;
  icon: NavIcon;
}

interface NavGroupDef {
  id: string;
  labelKey: string;
  icon: NavIcon;
  items: NavLinkDef[];
}

type NavBlock = { type: 'link'; item: NavLinkDef } | { type: 'group'; group: NavGroupDef };

function flattenNavBlocks(blocks: NavBlock[]): NavLinkDef[] {
  const out: NavLinkDef[] = [];
  for (const b of blocks) {
    if (b.type === 'link') out.push(b.item);
    else out.push(...b.group.items);
  }
  return out;
}

function groupIdsActiveForPath(pathname: string, blocks: NavBlock[]): string[] {
  const ids: string[] = [];
  for (const b of blocks) {
    if (b.type === 'group' && b.group.items.some(i => i.path === pathname)) {
      ids.push(b.group.id);
    }
  }
  return ids;
}

const platformNavBlocks: NavBlock[] = [
  { type: 'link', item: { labelKey: 'nav.dashboard', path: '/platform', icon: LayoutDashboard } },
  {
    type: 'group',
    group: {
      id: 'platform-tenant',
      labelKey: 'nav.group.platform',
      icon: Globe,
      items: [
        { labelKey: 'nav.tenants', path: '/platform/tenants', icon: Globe },
        { labelKey: 'nav.subscriptions', path: '/platform/subscriptions', icon: DollarSign },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'platform-access',
      labelKey: 'nav.group.access',
      icon: Shield,
      items: [
        { labelKey: 'nav.users', path: '/platform/users', icon: Users },
        { labelKey: 'nav.roles', path: '/platform/roles', icon: Settings },
      ],
    },
  },
  { type: 'link', item: { labelKey: 'nav.activityLogs', path: '/platform/logs', icon: Activity } },
];

const adminNavBlocks: NavBlock[] = [
  { type: 'link', item: { labelKey: 'nav.dashboard', path: '/admin', icon: LayoutDashboard } },
  {
    type: 'group',
    group: {
      id: 'admin-people',
      labelKey: 'nav.group.people',
      icon: Users,
      items: [
        { labelKey: 'nav.students', path: '/admin/students', icon: GraduationCap },
        { labelKey: 'nav.teachers', path: '/admin/teachers', icon: Users },
        { labelKey: 'nav.parents', path: '/admin/parents', icon: UserCircle },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-structure',
      labelKey: 'nav.group.structure',
      icon: Layers,
      items: [
        { labelKey: 'nav.grades', path: '/admin/grades', icon: BookOpen },
        { labelKey: 'nav.classes', path: '/admin/classes', icon: BookOpen },
        { labelKey: 'nav.sections', path: '/admin/sections', icon: Users },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-curriculum',
      labelKey: 'nav.group.curriculum',
      icon: BookMarked,
      items: [
        { labelKey: 'nav.units', path: '/admin/units', icon: BookOpen },
        { labelKey: 'nav.lessons', path: '/admin/lessons', icon: FileText },
        { labelKey: 'nav.homework', path: '/admin/homework', icon: ClipboardList },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-meetings',
      labelKey: 'nav.group.meetings',
      icon: CalendarCheck,
      items: [
        { labelKey: 'nav.adminMeetings', path: '/admin/meetings', icon: Video },
        { labelKey: 'nav.meetingSeriesAdmin', path: '/admin/meeting-series', icon: CalendarCheck },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-classroom',
      labelKey: 'nav.group.classroom',
      icon: ClipboardCheck,
      items: [
        { labelKey: 'nav.attendance', path: '/admin/attendance', icon: CalendarCheck },
        { labelKey: 'nav.exams', path: '/admin/exams', icon: ClipboardList },
        { labelKey: 'nav.quizzes', path: '/admin/quizzes', icon: ClipboardList },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-finance',
      labelKey: 'nav.group.finance',
      icon: CircleDollarSign,
      items: [
        { labelKey: 'nav.fees', path: '/admin/fees', icon: DollarSign },
        { labelKey: 'nav.payments', path: '/admin/payments', icon: DollarSign },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-content',
      labelKey: 'nav.group.content',
      icon: FolderOpen,
      items: [
        { labelKey: 'nav.library', path: '/admin/library', icon: Library },
        { labelKey: 'nav.announcements', path: '/admin/announcements', icon: MessageSquare },
        { labelKey: 'nav.landingBuilder', path: '/admin/landing', icon: Layout },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-insights',
      labelKey: 'nav.group.insights',
      icon: PieChart,
      items: [{ labelKey: 'nav.reports', path: '/admin/reports', icon: FileText }],
    },
  },
  {
    type: 'group',
    group: {
      id: 'admin-system',
      labelKey: 'nav.group.administration',
      icon: SlidersHorizontal,
      items: [
        { labelKey: 'nav.adminUsers', path: '/admin/users', icon: Users },
        { labelKey: 'nav.rolesPermissions', path: '/admin/roles', icon: Shield },
        { labelKey: 'nav.settings', path: '/admin/settings', icon: Settings },
      ],
    },
  },
];

const teacherNavBlocks: NavBlock[] = [
  { type: 'link', item: { labelKey: 'nav.dashboard', path: '/teacher', icon: LayoutDashboard } },
  {
    type: 'group',
    group: {
      id: 'teacher-teaching',
      labelKey: 'nav.group.teaching',
      icon: BookOpen,
      items: [
        { labelKey: 'nav.myClasses', path: '/teacher/classes', icon: BookOpen },
        { labelKey: 'nav.teacherMeetings', path: '/teacher/meetings', icon: Video },
        { labelKey: 'nav.meetingSeries', path: '/teacher/meeting-series', icon: CalendarCheck },
        { labelKey: 'nav.attendance', path: '/teacher/attendance', icon: CalendarCheck },
        { labelKey: 'nav.homework', path: '/teacher/homework', icon: FileText },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'teacher-assessment',
      labelKey: 'nav.group.assessment',
      icon: ClipboardList,
      items: [
        { labelKey: 'nav.exams', path: '/teacher/exams', icon: ClipboardList },
        { labelKey: 'nav.quizzes', path: '/teacher/quizzes', icon: ClipboardList },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'teacher-resources',
      labelKey: 'nav.group.resources',
      icon: Library,
      items: [{ labelKey: 'nav.library', path: '/teacher/library', icon: Library }],
    },
  },
];

const studentNavBlocks: NavBlock[] = [
  { type: 'link', item: { labelKey: 'nav.dashboard', path: '/student', icon: LayoutDashboard } },
  {
    type: 'group',
    group: {
      id: 'student-learning',
      labelKey: 'nav.group.learning',
      icon: BookOpen,
      items: [
        { labelKey: 'nav.myMeetings', path: '/student/meetings', icon: BookOpen },
        { labelKey: 'nav.attendance', path: '/student/attendance', icon: CalendarCheck },
        { labelKey: 'nav.myGrades', path: '/student/grades', icon: ClipboardList },
        { labelKey: 'nav.homework', path: '/student/homework', icon: FileText },
        { labelKey: 'nav.library', path: '/student/library', icon: Library },
      ],
    },
  },
];

const parentNavBlocks: NavBlock[] = [
  { type: 'link', item: { labelKey: 'nav.dashboard', path: '/parent', icon: LayoutDashboard } },
  {
    type: 'group',
    group: {
      id: 'parent-family',
      labelKey: 'nav.group.family',
      icon: Users,
      items: [
        { labelKey: 'nav.children', path: '/parent/children', icon: Users },
        { labelKey: 'nav.attendance', path: '/parent/attendance', icon: CalendarCheck },
        { labelKey: 'nav.fees_short', path: '/parent/fees', icon: DollarSign },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'parent-academic',
      labelKey: 'nav.group.assessment',
      icon: ClipboardList,
      items: [
        { labelKey: 'nav.exams', path: '/parent/exams', icon: ClipboardList },
        { labelKey: 'nav.quizzes', path: '/parent/quizzes', icon: ClipboardList },
      ],
    },
  },
  { type: 'link', item: { labelKey: 'nav.reports', path: '/parent/reports', icon: FileText } },
];

const roleNavBlocks: Record<UserRole, NavBlock[]> = {
  admin: adminNavBlocks,
  teacher: teacherNavBlocks,
  student: studentNavBlocks,
  parent: parentNavBlocks,
  super_admin: platformNavBlocks,
  platform_admin: platformNavBlocks,
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { locale, setLocale, t, dir } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const navBlocks = useMemo(() => (user ? roleNavBlocks[user.role] || [] : []), [user]);
  const flatNav = useMemo(() => flattenNavBlocks(navBlocks), [navBlocks]);

  const syncOpenGroups = useCallback(() => {
    const activeIds = groupIdsActiveForPath(location.pathname, navBlocks);
    if (activeIds.length === 0) return;
    setOpenGroups(prev => {
      const next = { ...prev };
      for (const id of activeIds) next[id] = true;
      return next;
    });
  }, [location.pathname, navBlocks]);

  useEffect(() => {
    syncOpenGroups();
  }, [syncOpenGroups]);

  if (!user) return null;

  const currentNavLabel = flatNav.find(n => n.path === location.pathname)?.labelKey;

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
          dir === 'rtl' ? 'right-0' : 'left-0',
          sidebarOpen ? 'translate-x-0' : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-primary-foreground">{t('app.name')}</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navBlocks.map(block => {
            if (block.type === 'link') {
              const item = block.item;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            }

            const { group } = block;
            const GroupIcon = group.icon;
            const groupActive = group.items.some(i => i.path === location.pathname);
            const open = openGroups[group.id] ?? false;

            return (
              <Collapsible
                key={group.id}
                open={open}
                onOpenChange={next => setOpenGroups(prev => ({ ...prev, [group.id]: next }))}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-start text-sm font-medium transition-colors',
                      groupActive
                        ? 'bg-sidebar-accent/80 text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    )}
                    aria-expanded={open}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <GroupIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t(group.labelKey)}</span>
                    </span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1 space-y-0.5 ltr:pl-2 rtl:pr-2">
                    {group.items.map(sub => {
                      const SubIcon = sub.icon;
                      const subActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ltr:ml-6 rtl:mr-6',
                            subActive
                              ? 'bg-sidebar-accent font-medium text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          <span className="truncate">{t(sub.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => {
              const platformSession = user && !user.tenant_slug && !user.tenant_id;
              const tenantSlug = user?.tenant_slug;
              logout();
              navigate(platformSession ? '/platform/login' : getTenantLoginPath(tenantSlug));
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t('auth.signOut')}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              {currentNavLabel ? t(currentNavLabel) : t('nav.dashboard')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <PwaInstallButton />

            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted"
              aria-label={t('misc.language')}
            >
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="hidden text-muted-foreground sm:inline">{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button type="button" className="relative rounded-lg p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 h-2 w-2 rounded-full bg-destructive ltr:right-1.5 rtl:left-1.5" />
            </button>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{t(`role.${user.role}`)}</p>
                {user.tenant_name && user.role !== 'platform_admin' && user.role !== 'super_admin' && (
                  <p className="text-[11px] text-muted-foreground">{user.tenant_name}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:pb-6 lg:p-6">{children}</main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden">
          <div className="overflow-x-auto p-2">
            <div className="flex min-w-max gap-2">
              {flatNav.slice(0, 4).map(item => {
                const isActive = location.pathname === item.path;
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={`bottom-${item.path}`}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex h-12 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted',
                    )}
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
