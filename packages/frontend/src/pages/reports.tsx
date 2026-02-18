import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar } from 'lucide-react';
import { api } from '../lib/api';

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  client: Client | null;
}

interface ProjectSummary {
  project: {
    id: string;
    name: string;
    color: string;
    hourlyRate: number | null;
  };
  totalMinutes: number;
  totalHours: number;
  entryCount: number;
  totalAmount: number;
}

interface SummaryData {
  period: { from: string; to: string };
  totalMinutes: number;
  totalHours: number;
  totalEntries: number;
  byProject: ProjectSummary[];
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = firstDay.toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  return { from, to };
}

export function ReportsPage() {
  const { t } = useTranslation();
  const defaults = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadFilterData();
    loadSummary();
  }, []);

  async function loadFilterData() {
    const [cRes, pRes] = await Promise.all([
      api.get<Client[]>('/clients'),
      api.get<Project[]>('/projects'),
    ]);
    if (cRes.data) setClients(cRes.data);
    if (pRes.data) setProjects(pRes.data);
  }

  async function loadSummary() {
    setLoading(true);
    try {
      let url = `/reports/summary?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      if (clientId) url += `&clientId=${clientId}`;
      if (projectId) url += `&projectId=${projectId}`;
      const res = await api.get<SummaryData>(url);
      if (res.data) setSummary(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  }

  async function downloadCsv(filterClientId?: string, filterProjectId?: string, label?: string) {
    const exportKey = filterClientId ?? filterProjectId ?? 'all';
    setExporting(exportKey);
    try {
      const token = api.getToken();
      let url = `/api/reports/export/csv?dateFrom=${dateFrom}&dateTo=${dateTo}`;
      if (filterClientId) url += `&clientId=${filterClientId}`;
      if (filterProjectId) url += `&projectId=${filterProjectId}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      let filename = `timetracker-${dateFrom}-${dateTo}`;
      if (label) filename += `-${label.replace(/\s+/g, '-').toLowerCase()}`;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('CSV export failed', err);
    } finally {
      setExporting(null);
    }
  }

  const totalAmount = summary?.byProject.reduce((sum, p) => sum + p.totalAmount, 0) ?? 0;

  const filteredProjects = clientId
    ? projects.filter((p) => p.client?.id === clientId)
    : projects;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
        <button
          onClick={() => downloadCsv(clientId || undefined, projectId || undefined, 'gesamt')}
          disabled={!!exporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Download className="h-5 w-5" />
          {exporting === 'all' ? '...' : t('reports.exportCsv')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kunde</label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setProjectId('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[160px]"
            >
              <option value="">Alle Kunden</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company ?? c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projekt</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[160px]"
            >
              <option value="">Alle Projekte</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('common.filter')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('reports.summary')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-500">{t('reports.totalHours')}</p>
            <p className="text-3xl font-bold text-gray-900">
              {summary?.totalHours?.toFixed(1) ?? '0.0'}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-500">{t('reports.totalAmount')}</p>
            <p className="text-3xl font-bold text-gray-900">
              CHF {totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-500">{t('reports.period')}</p>
            <p className="text-lg font-medium text-gray-900">
              {summary
                ? `${new Date(summary.period.from).toLocaleDateString('de-CH')} – ${new Date(summary.period.to).toLocaleDateString('de-CH')}`
                : '-'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {summary?.totalEntries ?? 0} Eintraege
            </p>
          </div>
        </div>
      </div>

      {/* By Project Breakdown */}
      {summary && summary.byProject.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nach Projekt
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Projekt</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Eintraege</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">{t('reports.totalHours')}</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Stundensatz</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Betrag (CHF)</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Export</th>
                </tr>
              </thead>
              <tbody>
                {summary.byProject.map((item) => (
                  <tr key={item.project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.project.color }}
                        />
                        <span className="font-medium text-gray-900">{item.project.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600">{item.entryCount}</td>
                    <td className="py-3 px-2 text-right text-gray-700 font-medium">
                      {item.totalHours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600">
                      {item.project.hourlyRate != null
                        ? `CHF ${item.project.hourlyRate.toFixed(0)}`
                        : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700 font-medium">
                      {item.totalAmount > 0 ? `CHF ${item.totalAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => downloadCsv(undefined, item.project.id, item.project.name)}
                        disabled={!!exporting}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        title={`CSV: ${item.project.name}`}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td className="py-3 px-2 font-bold text-gray-900">Total</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900">
                    {summary.totalEntries}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900">
                    {summary.totalHours.toFixed(1)}h
                  </td>
                  <td className="py-3 px-2" />
                  <td className="py-3 px-2 text-right font-bold text-gray-900">
                    CHF {totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-2" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {summary && summary.byProject.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}
