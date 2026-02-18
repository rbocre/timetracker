import { useTranslation } from 'react-i18next';
import { Clock, FolderOpen, BarChart3, TrendingUp } from 'lucide-react';

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

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Clock}
          label={t('dashboard.todayHours')}
          value="0.0h"
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label={t('dashboard.weekHours')}
          value="0.0h"
          color="bg-green-500"
        />
        <StatCard
          icon={BarChart3}
          label={t('dashboard.monthHours')}
          value="0.0h"
          color="bg-purple-500"
        />
        <StatCard
          icon={FolderOpen}
          label={t('dashboard.activeProjects')}
          value="0"
          color="bg-orange-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.recentEntries')}
        </h2>
        <p className="text-gray-500 text-sm">{t('entries.noEntries')}</p>
      </div>
    </div>
  );
}
