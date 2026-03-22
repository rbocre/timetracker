import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Play, Square, Pencil, Trash2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  date: string;
  project: Project;
}

interface EntryForm {
  description: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('de-CH');
}

function toLocalDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function toLocalTimeStr(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

const today = toLocalDateStr(new Date());

const emptyForm: EntryForm = {
  description: '',
  projectId: '',
  date: today,
  startTime: '09:00',
  endTime: '17:00',
};

export function EntriesPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);
  const [overlapEntries, setOverlapEntries] = useState<TimeEntry[]>([]);
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);
  const [isTimerOverlapModal, setIsTimerOverlapModal] = useState(false);
  const [isStopTimerOverlapModal, setIsStopTimerOverlapModal] = useState(false);

  // Timer state
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [timerProjectId, setTimerProjectId] = useState('');
  const [timerDesc, setTimerDesc] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [entRes, projRes] = await Promise.all([
      api.get<TimeEntry[]>('/entries'),
      api.get<Project[]>('/projects'),
    ]);
    if (entRes.success && entRes.data) {
      setEntries(entRes.data);
      const running = entRes.data.find((e) => !e.endTime);
      if (running) {
        setRunningEntry(running);
        const start = new Date(running.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }
    }
    if (projRes.success && projRes.data) {
      setProjects(projRes.data);
      if (!timerProjectId && projRes.data.length > 0) {
        setTimerProjectId(projRes.data[0].id);
      }
    }
    setIsLoading(false);
  }, [timerProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer tick
  useEffect(() => {
    if (runningEntry) {
      timerRef.current = setInterval(() => {
        const start = new Date(runningEntry.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningEntry]);

  const doStartTimer = async () => {
    const res = await api.post<TimeEntry>('/entries/timer/start', {
      projectId: timerProjectId,
      description: timerDesc || undefined,
    });
    if (res.success && res.data) {
      setRunningEntry(res.data);
      setElapsed(0);
      setTimerDesc('');
      setOverlapEntries([]);
      setPendingSave(null);
      setIsTimerOverlapModal(false);
      loadData();
    }
  };

  const startTimer = async () => {
    if (!timerProjectId) return;
    const now = new Date().toISOString();
    const overlapRes = await api.post<TimeEntry[]>('/entries/check-overlap', {
      projectId: timerProjectId,
      startTime: now,
    });
    if (overlapRes.success && overlapRes.data && overlapRes.data.length > 0) {
      setOverlapEntries(overlapRes.data);
      setIsTimerOverlapModal(true);
      setPendingSave(() => doStartTimer);
      return;
    }
    await doStartTimer();
  };

  const doStopTimer = async () => {
    if (!runningEntry) return;
    const res = await api.post<TimeEntry>(`/entries/timer/${runningEntry.id}/stop`, {});
    if (res.success) {
      setRunningEntry(null);
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
      setOverlapEntries([]);
      setPendingSave(null);
      setIsStopTimerOverlapModal(false);
      loadData();
    }
  };

  const stopTimer = async () => {
    if (!runningEntry) return;
    const now = new Date().toISOString();
    const overlapRes = await api.post<TimeEntry[]>('/entries/check-overlap', {
      projectId: runningEntry.project.id,
      startTime: runningEntry.startTime,
      endTime: now,
      excludeEntryId: runningEntry.id,
    });
    if (overlapRes.success && overlapRes.data && overlapRes.data.length > 0) {
      setOverlapEntries(overlapRes.data);
      setIsStopTimerOverlapModal(true);
      setPendingSave(() => doStopTimer);
      return;
    }
    await doStopTimer();
  };

  const openCreate = () => {
    setForm({ ...emptyForm, projectId: projects[0]?.id ?? '' });
    setEditingId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (entry: TimeEntry) => {
    setForm({
      description: entry.description ?? '',
      projectId: entry.project.id,
      date: toLocalDateStr(new Date(entry.date)),
      startTime: toLocalTimeStr(new Date(entry.startTime)),
      endTime: entry.endTime ? toLocalTimeStr(new Date(entry.endTime)) : '',
    });
    setEditingId(entry.id);
    setError('');
    setShowForm(true);
  };

  const doSave = async (body: Record<string, unknown>) => {
    setIsSaving(true);
    const res = editingId
      ? await api.put<TimeEntry>(`/entries/${editingId}`, body)
      : await api.post<TimeEntry>('/entries', body);

    if (res.success) {
      setShowForm(false);
      setOverlapEntries([]);
      setPendingSave(null);
      loadData();
    } else {
      setError(res.error ?? 'Error');
    }
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const startDt = new Date(`${form.date}T${form.startTime}:00`);
    const endDt = form.endTime ? new Date(`${form.date}T${form.endTime}:00`) : undefined;
    const duration = endDt ? Math.round((endDt.getTime() - startDt.getTime()) / 60000) : undefined;

    const body = {
      description: form.description || undefined,
      projectId: form.projectId,
      date: new Date(`${form.date}T00:00:00`).toISOString(),
      startTime: startDt.toISOString(),
      endTime: endDt?.toISOString(),
      duration,
    };

    // Check for overlaps if endTime is set
    if (form.projectId && endDt) {
      const overlapRes = await api.post<TimeEntry[]>('/entries/check-overlap', {
        projectId: form.projectId,
        startTime: startDt.toISOString(),
        endTime: endDt.toISOString(),
        excludeEntryId: editingId ?? undefined,
      });

      if (overlapRes.success && overlapRes.data && overlapRes.data.length > 0) {
        setOverlapEntries(overlapRes.data);
        setPendingSave(() => () => doSave(body));
        return;
      }
    }

    await doSave(body);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await api.delete(`/entries/${deleteTarget.id}`);
    if (res.success) {
      setDeleteTarget(null);
      loadData();
    }
  };

  const elapsedStr = `${Math.floor(elapsed / 3600)}:${String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('entries.title')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('entries.new')}
        </button>
      </div>

      {/* Timer Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        {runningEntry ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: runningEntry.project.color }}
                />
                <span className="font-medium text-gray-900">{runningEntry.project.name}</span>
              </div>
              {runningEntry.description && (
                <span className="text-gray-500 text-sm">{runningEntry.description}</span>
              )}
              <span className="font-mono text-2xl font-bold text-gray-900">{elapsedStr}</span>
            </div>
            <button
              onClick={stopTimer}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="h-4 w-4" />
              {t('entries.timer.stop')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={timerProjectId}
              onChange={(e) => setTimerProjectId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('entries.project')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t('entries.description')}
              value={timerDesc}
              onChange={(e) => setTimerDesc(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={startTimer}
              disabled={!timerProjectId}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {t('entries.timer.start')}
            </button>
          </div>
        )}
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">{t('app.loading')}</div>
      ) : entries.filter((e) => e.endTime).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('entries.noEntries')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('entries.date')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('entries.project')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('entries.description')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('entries.start')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('entries.end')}</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t('entries.duration')}</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.filter((e) => e.endTime).map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-500">{formatDate(entry.date)}</td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.project.color }} />
                      <span className="text-gray-900">{entry.project.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{entry.description ?? '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{formatTime(entry.startTime)}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{entry.endTime ? formatTime(entry.endTime) : '-'}</td>
                  <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                    {entry.duration ? formatDuration(entry.duration) : '-'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? t('common.edit') : t('entries.new')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('entries.project')} *</label>
            <select
              required
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">-</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('entries.description')}</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('entries.date')} *</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('entries.start')} *</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('entries.end')}</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message="Eintrag wirklich loeschen?"
        confirmLabel={t('common.delete')}
      />

      {/* Overlap Confirmation Dialog */}
      <Modal
        isOpen={overlapEntries.length > 0}
        onClose={() => { setOverlapEntries([]); setPendingSave(null); setIsTimerOverlapModal(false); setIsStopTimerOverlapModal(false); }}
        title="Zeitüberschneidung erkannt"
      >
        <p className="text-gray-600 mb-4">
          {isStopTimerOverlapModal
            ? 'Der Timer überschneidet sich mit '
            : isTimerOverlapModal
              ? 'Der Timer überschneidet sich mit '
              : 'Dieser Eintrag überschneidet sich mit '}
          {overlapEntries.length === 1 ? 'einem bestehenden Eintrag' : `${overlapEntries.length} bestehenden Einträgen`} für dieses Projekt:
        </p>
        <div className="space-y-2 mb-6">
          {overlapEntries.map((entry) => (
            <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.project.color }} />
                <span className="font-medium text-gray-900">{entry.project.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{formatDate(entry.date)}</span>
              </div>
              <div className="text-gray-700">
                {formatTime(entry.startTime)} – {entry.endTime ? formatTime(entry.endTime) : '?'}
                {entry.description && <span className="ml-2 text-gray-500">({entry.description})</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setOverlapEntries([]); setPendingSave(null); setIsTimerOverlapModal(false); setIsStopTimerOverlapModal(false); }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { if (pendingSave) pendingSave(); }}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isSaving ? '...' : isStopTimerOverlapModal ? 'Trotzdem stoppen' : isTimerOverlapModal ? 'Trotzdem starten' : 'Trotzdem speichern'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
