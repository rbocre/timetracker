import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, FolderOpen, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  date: string;
  project: {
    id: string;
    name: string;
    color: string;
  };
}

interface Project {
  id: string;
  name: string;
  isActive: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}.${m < 10 ? '0' : ''}${m}h`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        api.get<TimeEntry[]>('/entries'),
        api.get<Project[]>('/projects'),
      ]);
      if (entriesRes.data) setEntries(entriesRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayMinutes = entries
    .filter((e) => e.date?.startsWith(todayStr))
    .reduce((sum, e) => sum + (e.duration ?? 0), 0);

  const weekMinutes = entries
    .filter((e) => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => sum + (e.duration ?? 0), 0);

  const monthMinutes = entries
    .filter((e) => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + (e.duration ?? 0), 0);

  const activeProjectCount = projects.filter((p) => p.isActive).length;

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Clock}
          label={t('dashboard.todayHours')}
          value={formatDuration(todayMinutes)}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.weekHours')}
          value={formatDuration(weekMinutes)}
          color="bg-green-500"
        />
        <StatCard
          icon={BarChart3}
          label={t('dashboard.monthHours')}
          value={formatDuration(monthMinutes)}
          color="bg-purple-500"
        />
        <StatCard
          icon={FolderOpen}
          label={t('dashboard.activeProjects')}
          value={String(activeProjectCount)}
          color="bg-orange-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.recentEntries')}
        </h2>
        {recentEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('entries.noEntries')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    {t('entries.date')}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    {t('entries.project')}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">
                    {t('entries.description')}
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">
                    {t('entries.duration')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-700">
                      {new Date(entry.date).toLocaleDateString('de-CH')}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.project?.color ?? '#6b7280' }}
                        />
                        <span className="text-gray-700">{entry.project?.name ?? '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {entry.description ?? '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700">
                      {entry.duration != null
                        ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m`
                        : formatTime(entry.startTime) + ' ...'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
