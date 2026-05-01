import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiEdit3, FiFileText, FiSearch, FiX, FiChevronLeft, FiChevronRight, FiSend, FiLink, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'pending_payment', label: 'En attente paiement' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'in_review', label: 'En révision' },
  { value: 'info_required', label: 'Infos requises' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' }
];

function formatDate(value) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

function formatCents(cents, currency = 'EUR') {
  const n = Number(cents || 0) / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);
}

function isValidToken(token) {
  return typeof token === 'string' && token.length >= 24;
}

function statusBadge(status) {
  switch (status) {
    case 'pending_payment':
      return { label: 'En attente paiement', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'in_progress':
      return { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'in_review':
      return { label: 'En révision', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'info_required':
      return { label: 'Infos requises', className: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'completed':
      return { label: 'Terminé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'cancelled':
      return { label: 'Annulé', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: status || '—', className: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

function paymentBadge(paymentStatus) {
  switch (paymentStatus) {
    case 'paid':
      return { label: 'Payé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'pending':
      return { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'failed':
      return { label: 'Échec', className: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'cancelled':
      return { label: 'Annulé', className: 'bg-slate-50 text-slate-700 border-slate-200' };
    default:
      return { label: paymentStatus || '—', className: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

const AdminDesignRequests = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [status, setStatus] = useState('');
  const [qDraft, setQDraft] = useState('');
  const [q, setQ] = useState('');

  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.getDesignRequests({ page, limit, status, q });
      const payload = data?.data || {};
      setItems(payload.designRequests || []);
      setTotalPages(payload.pagination?.pages || 1);
      setTotalCount(payload.pagination?.total || 0);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors du chargement des demandes design';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, status, q]);

  useEffect(() => {
    if (!selected) return;
    setEditStatus(selected.status || '');
    setEditNotes(selected.notes || '');
    setAdminMessage('');
  }, [selected]);

  const openModal = async (row) => {
    setSelected(row);
    if (!row?._id) return;
    setSelectedLoading(true);
    try {
      const { data } = await adminAPI.getDesignRequest(row._id);
      const full = data?.data?.designRequest;
      if (full?._id) setSelected(full);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Impossible de charger le détail');
    } finally {
      setSelectedLoading(false);
    }

    try {
      await adminAPI.markDesignRequestRead(row._id);
      setItems((prev) => prev.map((it) => (it._id === row._id ? { ...it, adminHasUnread: false } : it)));
    } catch (_err) {
      // No toast: mark-read is optional. If the backend isn't updated yet, this endpoint can 404.
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQ(qDraft.trim());
  };

  const clearFilters = () => {
    setStatus('');
    setQDraft('');
    setQ('');
    setPage(1);
  };

  const selectedAttachment = useMemo(() => selected?.attachment || null, [selected]);
  const selectedPricing = useMemo(() => selected?.pricing || null, [selected]);
  const selectedPayment = useMemo(() => selected?.payment || null, [selected]);
  const selectedMessages = useMemo(() => (Array.isArray(selected?.messages) ? selected.messages : []), [selected]);

  const clientMessagesLink = useMemo(() => {
    if (!selected?._id || !isValidToken(selected?.accessToken)) return '';
    return `${window.location.origin}/design/messages?designRequestId=${encodeURIComponent(selected._id)}&token=${encodeURIComponent(selected.accessToken)}`;
  }, [selected]);

  const saveChanges = async () => {
    if (!selected?._id) return;
    setSaving(true);
    try {
      const { data } = await adminAPI.updateDesignRequest(selected._id, {
        status: editStatus,
        notes: editNotes
      });
      const updated = data?.data?.designRequest;
      if (updated?._id) {
        setItems((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
        setSelected(updated);
        toast.success('Demande mise à jour');
      } else {
        toast.success('Demande mise à jour');
        await fetchList();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => setSelected(null);

  const sendMessageToClient = async () => {
    const text = adminMessage.trim();
    if (!text || !selected?._id) return;
    setSendingMessage(true);
    try {
      const { data } = await adminAPI.sendDesignRequestMessage(selected._id, { body: text });
      const updatedMessages = data?.data?.messages;
      if (Array.isArray(updatedMessages)) {
        setSelected((prev) => (prev ? { ...prev, messages: updatedMessages } : prev));
      } else {
        const refreshed = await adminAPI.getDesignRequest(selected._id);
        const full = refreshed?.data?.data?.designRequest;
        if (full?._id) setSelected(full);
      }
      setAdminMessage('');
      toast.success('Message envoyé au client');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l’envoi');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandes Design</h1>
          <p className="text-slate-500 mt-1">
            {totalCount} demande(s) — filtre, ouvre une demande, change le statut, ajoute des notes.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchList}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          Actualiser
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <FiFileText />
            <CardTitle>Liste</CardTitle>
          </div>
          <form onSubmit={onSearch} className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              aria-label="Filtrer par statut"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700"
                placeholder="Rechercher email, style, usage…"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Rechercher
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-white border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </form>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="py-10 text-center text-slate-500">Chargement…</div>
          )}

          {!loading && error && (
            <div className="py-10 text-center text-rose-600">{error}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="py-10 text-center text-slate-500">Aucune demande</div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <div className="md:hidden space-y-3">
                {items.map((it) => {
                  const s = statusBadge(it.status);
                  const p = paymentBadge(it.payment?.status);
                  return (
                    <div key={it._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{it.email}</div>
                          <div className="text-xs text-slate-500 mt-1">{formatDate(it.createdAt)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${p.className}`}>
                            {p.label}
                          </span>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${s.className}`}>
                            {s.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-500">Pack</div>
                        <div className="text-slate-900 font-semibold text-right">{it.pricing?.pack?.label || '—'}</div>
                        <div className="text-slate-500">Total</div>
                        <div className="text-slate-900 font-semibold text-right">
                          {formatCents(it.pricing?.totalCents, it.pricing?.currency)}
                        </div>
                        <div className="text-slate-500">Messages</div>
                        <div className="text-right">
                          {it.adminHasUnread ? (
                            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                              Nouveau
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </div>
                        <div className="text-slate-500">Fichier</div>
                        <div className="text-right">
                          {it.attachment?.url ? (
                            <a
                              href={it.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                              title={it.attachment.originalName || 'Ouvrir'}
                            >
                              <FiDownload />
                              Ouvrir
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openModal(it)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FiEdit3 />
                          Ouvrir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Client</th>
                    <th className="py-3 pr-4">Pack</th>
                    <th className="py-3 pr-4">Total</th>
                    <th className="py-3 pr-4">Paiement</th>
                    <th className="py-3 pr-4">Statut</th>
                    <th className="py-3 pr-4">Messages</th>
                    <th className="py-3 pr-4">Fichier</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const s = statusBadge(it.status);
                    const p = paymentBadge(it.payment?.status);
                    return (
                      <tr key={it._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="py-3 pr-4 text-sm text-slate-700 whitespace-nowrap">{formatDate(it.createdAt)}</td>
                        <td className="py-3 pr-4 text-sm text-slate-900 whitespace-nowrap">{it.email}</td>
                        <td className="py-3 pr-4 text-sm text-slate-700 whitespace-nowrap">{it.pricing?.pack?.label || '—'}</td>
                        <td className="py-3 pr-4 text-sm text-slate-900 whitespace-nowrap">
                          {formatCents(it.pricing?.totalCents, it.pricing?.currency)}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${p.className}`}>
                            {p.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${s.className}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {it.adminHasUnread ? (
                            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                              Nouveau message
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {it.attachment?.url ? (
                            <a
                              href={it.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                              title={it.attachment.originalName || 'Ouvrir'}
                            >
                              <FiDownload />
                              Ouvrir
                            </a>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openModal(it)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FiEdit3 />
                            Ouvrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Page {page} / {totalPages}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <FiChevronLeft />
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Suivant
                <FiChevronRight />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeModal}
          >
            <motion.div
              className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh]"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
                <div className="flex flex-col">
                  <div className="text-sm text-slate-500">Demande design</div>
                  <div className="text-lg font-bold text-slate-900 break-all">{selected._id}</div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  aria-label="Fermer"
                >
                  <FiX />
                </button>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto max-h-[calc(90vh-86px)]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Client</div>
                    <div className="text-sm text-slate-700">{selected.email}</div>
                    <div className="text-xs text-slate-500 mt-2">Créée le {formatDate(selected.createdAt)}</div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Brief</div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-500">Style</div>
                      <div className="text-slate-900 font-semibold">{selected.style || '—'}</div>
                      <div className="text-slate-500">Usage</div>
                      <div className="text-slate-900 font-semibold">{selected.usage || '—'}</div>
                      <div className="text-slate-500">Couleurs</div>
                      <div className="text-slate-900 font-semibold">{selected.preferredColors || '—'}</div>
                      <div className="text-slate-500">Délai</div>
                      <div className="text-slate-900 font-semibold">{selected.desiredDeadline || '—'}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Fichier</div>
                    {selectedAttachment?.url ? (
                      <a
                        href={selectedAttachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <FiDownload />
                        {selectedAttachment.originalName || 'Ouvrir'}
                      </a>
                    ) : (
                      <div className="text-sm text-slate-500">—</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-3">Paiement & Prix</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-500">Pack</div>
                      <div className="text-slate-900 font-semibold">{selectedPricing?.pack?.label || '—'}</div>
                      <div className="text-slate-500">Total</div>
                      <div className="text-slate-900 font-semibold">{formatCents(selectedPricing?.totalCents, selectedPricing?.currency)}</div>
                      <div className="text-slate-500">Paiement</div>
                      <div className="text-slate-900 font-semibold">{selectedPayment?.status || '—'}</div>
                      <div className="text-slate-500">Méthode</div>
                      <div className="text-slate-900 font-semibold">{selectedPayment?.method || '—'}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">Messages</div>
                      {clientMessagesLink ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(clientMessagesLink);
                            toast.success('Lien copié');
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Copier le lien client"
                        >
                          <FiLink />
                          Copier lien
                        </button>
                      ) : (
                        <div className="text-xs text-slate-400">Lien indisponible</div>
                      )}
                    </div>

                    {selectedLoading && (
                      <div className="mt-3 text-sm text-slate-500">Chargement…</div>
                    )}

                    {!selectedLoading && (
                      <>
                        <div className="mt-3 max-h-44 sm:max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                          {selectedMessages.length === 0 && (
                            <div className="text-sm text-slate-500">Aucun message</div>
                          )}
                          {selectedMessages
                            .slice()
                            .reverse()
                            .slice(0, 20)
                            .reverse()
                            .map((m) => {
                              const isClient = m.senderType === 'client';
                              return (
                                <div key={m._id} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                                  <div
                                    className={`max-w-[90%] rounded-xl border px-3 py-2 ${
                                      isClient
                                        ? 'bg-white border-slate-200 text-slate-800'
                                        : 'bg-blue-600 border-blue-600 text-white'
                                    }`}
                                  >
                                    <div className={`text-xs ${isClient ? 'text-slate-500' : 'text-blue-50'} flex items-center justify-between gap-3`}>
                                      <span className="font-semibold">{isClient ? 'Client' : 'Admin'}</span>
                                      <span>{formatDate(m.createdAt)}</span>
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap text-sm">{m.body}</div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        <div className="mt-3 grid gap-2">
                          <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                            <FiMessageSquare />
                            Message au client
                          </label>
                          <textarea
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            placeholder="Demande de précisions (texte exact, couleurs, référence, placement, etc.)"
                          />
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                            <button
                              type="button"
                              onClick={sendMessageToClient}
                              disabled={sendingMessage || !adminMessage.trim()}
                              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              <FiSend />
                              {sendingMessage ? 'Envoi…' : 'Envoyer'}
                            </button>
                            <div className="text-xs text-slate-500">
                              Le client reçoit aussi un email si SMTP est configuré.
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Actions admin</div>
                    <div className="grid gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-slate-600">Statut</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                        >
                          {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-1">
                        <label className="text-xs font-semibold text-slate-600">Notes</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={5}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          placeholder="Notes internes (brief clarifié, retouches, étapes…)"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={saveChanges}
                          disabled={saving}
                          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditStatus(selected.status || '');
                            setEditNotes(selected.notes || '');
                            toast.info('Modifications annulées');
                          }}
                          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-white border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900 mb-2">Historique</div>
                    {Array.isArray(selected.timeline) && selected.timeline.length > 0 ? (
                      <div className="space-y-2">
                        {selected.timeline
                          .slice()
                          .reverse()
                          .slice(0, 8)
                          .map((t, idx) => (
                            <div key={`${t.timestamp}-${idx}`} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-slate-900">{t.status}</div>
                                <div className="text-xs text-slate-500">{formatDate(t.timestamp)}</div>
                              </div>
                              {t.description && <div className="text-sm text-slate-600 mt-1">{t.description}</div>}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">—</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDesignRequests;
