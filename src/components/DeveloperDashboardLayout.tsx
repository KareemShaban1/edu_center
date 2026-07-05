import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { revokeDeveloperAccess } from '@/config/developer-access';
import { useAppFontClasses } from '@/hooks/use-app-font';
import HeaderUserMenu from '@/components/dashboard/HeaderUserMenu';
import { cn } from '@/lib/utils';
import { BookOpen, Code2, Database, Languages, LayoutDashboard, LogOut, Menu, Terminal } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { labelKey: 'developer.tab.overview', path: '/developer', icon: LayoutDashboard, exact: true },
  { labelKey: 'developer.tab.apis', path: '/developer/apis', icon: Code2, exact: false },
  { labelKey: 'developer.tab.database', path: '/developer/database', icon: Database, exact: false },
  { labelKey: 'developer.tab.documentation', path: '/developer/documentation', icon: BookOpen, exact: false },
];

export default function DeveloperDashboardLayout() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t, dir } = useLocale();
  const fonts = useAppFontClasses();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    revokeDeveloperAccess();
    logout();
    navigate('/developer/login');
  };

  const currentNav = navItems.find(item =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path),
  );

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
            <Terminal className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className={cn('text-lg font-bold text-sidebar-primary-foreground', fonts.display)}>
            {t('developer.portalName')}
          </span>
        </div>

        <nav className={cn('flex-1 space-y-1 overflow-y-auto p-3', fonts.body)}>
          {navItems.map(item => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 app-nav-text font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 app-nav-text font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              fonts.body,
            )}
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
            <h2 className="text-xl font-medium text-muted-foreground">
              {currentNav ? t(currentNav.labelKey) : t('developer.pageTitle')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 app-nav-text font-medium transition-colors hover:bg-muted"
              aria-label={t('misc.language')}
            >
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {locale === 'en' ? 'العربية' : 'English'}
              </span>
            </button>
            <HeaderUserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 pb-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
