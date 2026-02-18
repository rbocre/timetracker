import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  FolderOpen,
  Clock,
  Users,
  BarChart3,
  LogOut,
  Globe,
  Timer,
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { path: '/projects', icon: FolderOpen, label: 'nav.projects' },
  { path: '/entries', icon: Clock, label: 'nav.entries' },
  { path: '/clients', icon: Users, label: 'nav.clients' },
  { path: '/reports', icon: BarChart3, label: 'nav.reports' },
] as const;

export function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'de' ? 'en' : 'de');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Timer className="h-8 w-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">{t('app.title')}</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === path
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className="h-5 w-5" />
              {t(label)}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Globe className="h-5 w-5" />
            {i18n.language === 'de' ? 'English' : 'Deutsch'}
          </button>
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{user.name}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
