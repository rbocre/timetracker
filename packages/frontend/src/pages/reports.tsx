import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';

export function ReportsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Download className="h-5 w-5" />
          {t('reports.exportCsv')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.summary')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">{t('reports.totalHours')}</p>
            <p className="text-3xl font-bold text-gray-900">0.0</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">{t('reports.totalAmount')}</p>
            <p className="text-3xl font-bold text-gray-900">CHF 0.00</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">{t('reports.period')}</p>
            <p className="text-lg font-medium text-gray-900">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
