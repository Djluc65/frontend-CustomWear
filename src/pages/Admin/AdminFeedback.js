import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiLoader, FiMessageSquare, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous types' },
  { value: 'bug', label: 'Bug' },
  { value: 'improvement', label: 'Amélioration' },
  { value: 'idea', label: 'Idée' },
  { value: 'other', label: 'Autre' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'NEW', label: 'Nouveau' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'PLANNED', label: 'Planifié' },
  { value: 'REJECTED', label: 'Refusé' },
  { value: 'IMPLEMENTED', label: 'Implémenté' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'votes', label: 'Votes' },
  { value: 'priority', label: 'Priorité' },
];

const PAGE_SIZE = 30;

const AdminFeedback = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('date');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  const selectedId = selected?._id;

  const params = useMemo(() => {
    const p = {
      search: search || undefined,
      type: type !== 'all' ? type : undefined,
      status: status !== 'all' ? status : undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    };
    Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
    return p;
  }, [search, type, status, sort, page]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getGlobalFeedback(params);
      const list = res?.data?.data?.items || [];
      const pagination = res?.data?.data?.pagination || {};
      setItems(Array.isArray(list) ? list : []);
      setTotalPages(Math.max(1, Number(pagination.totalPages || 1)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [params]);

  const openItem = (item) => {
    setSelected(item);
    setMergeTargetId('');
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSelected(null);
    setMergeTargetId('');
  };

  const updateSelected = async (patch) => {
    if (!selectedId) return;
    try {
      setSaving(true);
      const res = await adminAPI.updateGlobalFeedback(selectedId, patch);
      const next = res?.data?.data?.item;
      if (next) {
        setSelected(next);
        setItems((curr) => curr.map((it) => (String(it._id) === String(selectedId) ? next : it)));
      }
      toast.success('Mise à jour enregistrée');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Impossible de mettre à jour');
    } finally {
      setSaving(false);
    }
  };

  const merge = async () => {
    if (!selectedId) return;
    const targetId = mergeTargetId.trim();
    if (!targetId) {
      toast.error('ID cible requis');
      return;
    }
    try {
      setSaving(true);
      await adminAPI.mergeGlobalFeedback(selectedId, targetId);
      toast.success('Fusion effectuée (doublon marqué)');
      close();
      fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Fusion impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
          <FiMessageSquare className="text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Avis Global</h2>
          <p className="text-slate-500">Feedback produit : bugs, idées et améliorations.</p>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-72" />
          <select className="border rounded-lg px-3 py-2 bg-white" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="border rounded-lg px-3 py-2 bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="border rounded-lg px-3 py-2 bg-white" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr className="text-left">
                <th className="p-3 font-semibold text-slate-700">Titre</th>
                <th className="p-3 font-semibold text-slate-700">Type</th>
                <th className="p-3 font-semibold text-slate-700">Statut</th>
                <th className="p-3 font-semibold text-slate-700">Votes</th>
                <th className="p-3 font-semibold text-slate-700">Auteur</th>
                <th className="p-3 font-semibold text-slate-700">Date</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-slate-600">
                    <div className="flex items-center gap-2">
                      <FiLoader className="animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-slate-600">
                    Aucun avis.
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((it) => (
                  <tr key={it._id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{it.title}</div>
                      {it.duplicateOf && (
                        <div className="text-xs text-slate-500">Doublon → {String(it.duplicateOf).slice(0, 8)}…</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">{it.type}</td>
                    <td className="p-3 text-slate-700">{it.status}</td>
                    <td className="p-3 text-slate-700">{it.votesCount || 0}</td>
                    <td className="p-3 text-slate-700">
                      {it.user ? `${it.user.firstName || ''} ${it.user.lastName || ''}`.trim() || it.user.email : 'Anonyme'}
                    </td>
                    <td className="p-3 text-slate-700">
                      {it.createdAt ? new Date(it.createdAt).toLocaleDateString() : ''}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="outline" onClick={() => openItem(it)}>
                        Gérer
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t bg-white">
          <div className="text-xs text-slate-500">
            Page {page} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <FiChevronLeft />
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <FiChevronRight />
            </Button>
          </div>
        </div>
      </Card>

      {open && selected && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">{selected.title}</div>
                <div className="text-sm text-slate-500">
                  {selected.type} • {selected.status} • {selected.votesCount || 0} vote(s)
                </div>
              </div>
              <button onClick={close} className="p-2 rounded-lg hover:bg-slate-100">
                <FiX />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-sm text-slate-700 whitespace-pre-line">{selected.description}</div>

              {Array.isArray(selected.attachments) && selected.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-800">Pièces jointes</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.attachments.map((a) => (
                      <a
                        key={a.url}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        Ouvrir
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Statut</div>
                  <select
                    className="border rounded-lg px-3 py-2 w-full bg-white"
                    value={selected.status}
                    onChange={(e) => setSelected((s) => ({ ...s, status: e.target.value }))}
                    disabled={saving}
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">Override priorité (optionnel)</div>
                  <Input
                    value={selected.priorityScoreOverride ?? ''}
                    onChange={(e) => setSelected((s) => ({ ...s, priorityScoreOverride: e.target.value }))}
                    placeholder="Ex: 10"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-800 mb-1">Réponse admin</div>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                  value={selected.adminResponse?.body || ''}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, adminResponse: { ...(s.adminResponse || {}), body: e.target.value } }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-slate-800 mb-2">Fusion / doublons</div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                  <Input
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    placeholder="ID cible (GlobalFeedback)"
                    disabled={saving}
                  />
                  <Button variant="outline" onClick={merge} disabled={saving}>
                    <FiCheckCircle className="mr-2" />
                    Fusionner
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={close} disabled={saving}>
                Fermer
              </Button>
              <Button
                onClick={() =>
                  updateSelected({
                    status: selected.status,
                    adminResponse: selected.adminResponse?.body || '',
                    priorityScoreOverride:
                      selected.priorityScoreOverride === '' ? null : Number(selected.priorityScoreOverride),
                  })
                }
                disabled={saving}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;

