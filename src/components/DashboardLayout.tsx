import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck, DollarSign,
  Bell, Settings, LogOut, Menu, X, FileText, Activity, Globe, ClipboardList,
  Library, MessageSquare, ChevronDown, UserCircle, Languages, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ElementType;
}

const platformNavItems: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/platform', icon: LayoutDashboard },
  { labelKey: 'nav.tenants', path: '/platform/tenants', icon: Globe },
  { labelKey: 'nav.subscriptions', path: '/platform/subscriptions', icon: DollarSign },
  { labelKey: 'nav.users', path: '/platform/users', icon: Users },
  { labelKey: 'nav.roles', path: '/platform/roles', icon: Settings },
  { labelKey: 'nav.activityLogs', path: '/platform/logs', icon: Activity },
];

const roleNavItems: Record<UserRole, NavItem[]> = {
  admin: [
    { labelKey: 'nav.dashboard', path: '/admin', icon: LayoutDashboard },
    { labelKey: 'nav.students', path: '/admin/students', icon: GraduationCap },
    { labelKey: 'nav.teachers', path: '/admin/teachers', icon: Users },
    { labelKey: 'nav.parents', path: '/admin/parents', icon: UserCircle },
    { labelKey: 'nav.grades', path: '/admin/grades', icon: BookOpen },
    { labelKey: 'nav.classes', path: '/admin/classes', icon: BookOpen },
    { labelKey: 'nav.sections', path: '/admin/sections', icon: Users },
    { labelKey: 'nav.attendance', path: '/admin/attendance', icon: CalendarCheck },
    { labelKey: 'nav.units', path: '/admin/units', icon: BookOpen },
    { labelKey: 'nav.lessons', path: '/admin/lessons', icon: FileText },
    { labelKey: 'nav.homework', path: '/admin/homework', icon: ClipboardList },
    { labelKey: 'nav.meetingSeriesAdmin', path: '/admin/meeting-series', icon: CalendarCheck },
    { labelKey: 'nav.fees', path: '/admin/fees', icon: DollarSign },
    { labelKey: 'nav.payments', path: '/admin/payments', icon: DollarSign },
    { labelKey: 'nav.exams', path: '/admin/exams', icon: ClipboardList },
    { labelKey: 'nav.quizzes', path: '/admin/quizzes', icon: ClipboardList },
    { labelKey: 'nav.library', path: '/admin/library', icon: Library },
    { labelKey: 'nav.announcements', path: '/admin/announcements', icon: MessageSquare },
    { labelKey: 'nav.reports', path: '/admin/reports', icon: FileText },
    { labelKey: 'nav.adminUsers', path: '/admin/users', icon: Users },
    { labelKey: 'nav.rolesPermissions', path: '/admin/roles', icon: Shield },
    { labelKey: 'nav.settings', path: '/admin/settings', icon: Settings },
  ],
  teacher: [
    { labelKey: 'nav.dashboard', path: '/teacher', icon: LayoutDashboard },
    { labelKey: 'nav.myClasses', path: '/teacher/classes', icon: BookOpen },
    { labelKey: 'nav.meetingSeries', path: '/teacher/meeting-series', icon: CalendarCheck },
    { labelKey: 'nav.attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { labelKey: 'nav.exams', path: '/teacher/exams', icon: ClipboardList },
    { labelKey: 'nav.quizzes', path: '/teacher/quizzes', icon: ClipboardList },
    { labelKey: 'nav.homework', path: '/teacher/homework', icon: FileText },
    { labelKey: 'nav.library', path: '/teacher/library', icon: Library },
  ],
  student: [
    { labelKey: 'nav.dashboard', path: '/student', icon: LayoutDashboard },
    { labelKey: 'nav.myMeetings', path: '/student/meetings', icon: BookOpen },
    { labelKey: 'nav.attendance', path: '/student/attendance', icon: CalendarCheck },
    { labelKey: 'nav.myGrades', path: '/student/grades', icon: ClipboardList },
    { labelKey: 'nav.homework', path: '/student/homework', icon: FileText },
    { labelKey: 'nav.library', path: '/student/library', icon: Library },
  ],
  parent: [
    { labelKey: 'nav.dashboard', path: '/parent', icon: LayoutDashboard },
    { labelKey: 'nav.children', path: '/parent/children', icon: Users },
    { labelKey: 'nav.attendance', path: '/parent/attendance', icon: CalendarCheck },
    { labelKey: 'nav.exams', path: '/parent/exams', icon: ClipboardList },
    { labelKey: 'nav.quizzes', path: '/parent/quizzes', icon: ClipboardList },
    { labelKey: 'nav.fees_short', path: '/parent/fees', icon: DollarSign },
    { labelKey: 'nav.reports', path: '/parent/reports', icon: FileText },
  ],
  super_admin: platformNavItems,
  platform_admin: platformNavItems,
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
  const academicPaths = ['/admin/grades', '/admin/classes', '/admin/sections' ,'/admin/units','/admin/lessons','/admin/homework','/admin/exams','/admin/quizzes'];
  const [academicsOpen, setAcademicsOpen] = useState(academicPaths.includes(location.pathname));
  useEffect(() => {
    if (academicPaths.includes(location.pathname)) {
      setAcademicsOpen(true);
    }
  }, [location.pathname]);

  if (!user) return null;

  const navItems = roleNavItems[user.role] || [];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
        dir === 'rtl' ? 'right-0' : 'left-0',
        sidebarOpen
          ? 'translate-x-0'
          : dir === 'rtl' ? 'translate-x-full' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-primary-foreground">{t('app.name')}</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => {
            if (user.role === 'admin' && item.path === '/admin/grades') {
              const groupActive = academicPaths.includes(location.pathname);
              return (
                <div key="admin-academics-group" className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setAcademicsOpen(v => !v)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      groupActive
                        ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                    aria-label="Academics menu"
                    title="Academics menu"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4" />
                      Academics
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', academicsOpen ? 'rotate-180' : '')} />
                  </button>

                  {academicsOpen && (
                    <div className="space-y-1 ltr:pl-8 rtl:pr-8">
                      {navItems
                        .filter(n => academicPaths.includes(n.path))
                        .map(sub => {
                          const subActive = location.pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                subActive
                                  ? 'bg-sidebar-accent text-sidebar-primary-foreground font-medium'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                              )}
                            >
                              {t(sub.labelKey)}
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            if (user.role === 'admin' && academicPaths.includes(item.path)) {
              return null;
            }

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
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t('auth.signOut')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
            aria-label="Open menu"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              {navItems.find(n => n.path === location.pathname) ? t(navItems.find(n => n.path === location.pathname)!.labelKey) : t('nav.dashboard')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Locale Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-muted transition-colors"
              aria-label={t('misc.language')}
            >
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline text-muted-foreground">{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button className="relative rounded-lg p-2 hover:bg-muted" aria-label="Notifications" title="Notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 h-2 w-2 rounded-full bg-destructive ltr:right-1.5 rtl:left-1.5" />
            </button>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{t(`role.${user.role}`)}</p>
                {user.tenant_name && user.role !== 'platform_admin' && user.role !== 'super_admin' && (
                  <p className="text-[11px] text-muted-foreground">{user.tenant_name}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-24 md:pb-6 lg:p-6">
          {children}
        </main>

        {/* Mobile bottom nav (all pages) */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 md:hidden">
          <div className="overflow-x-auto p-2">
            <div className="flex min-w-max gap-2">
              {navItems.slice(0, 3).map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={`bottom-${item.path}`}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex h-12 items-center gap-2 rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
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
