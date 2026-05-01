import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiSend, FiLock, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';

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

const DesignMessages = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const qpId = searchParams.get('designRequestId') || '';
  const qpToken = searchParams.get('token') || '';

  const [designRequestId, setDesignRequestId] = useState(qpId || localStorage.getItem('customwear:lastDesignRequestId') || '');
  const [token, setToken] = useState(qpToken || localStorage.getItem('customwear:lastDesignAccessToken') || '');

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState('');

  const canLoad = useMemo(() => Boolean(designRequestId && token), [designRequestId, token]);

  const syncUrl = () => {
    const next = new URLSearchParams(searchParams);
    if (designRequestId) next.set('designRequestId', designRequestId);
    if (token) next.set('token', token);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (qpId) setDesignRequestId(qpId);
    if (qpToken) setToken(qpToken);
  }, [qpId, qpToken]);

  useEffect(() => {
    if (!designRequestId && !token) return;
    syncUrl();
  }, [designRequestId, token]);

  const loadMessages = async () => {
    if (!canLoad) {
      toast.error('Lien invalide. Il faut un ID + un token.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/api/design-requests/${encodeURIComponent(designRequestId)}/messages`, {
        params: { token }
      });
      setMessages(data?.data?.messages || []);
      localStorage.setItem('customwear:lastDesignRequestId', designRequestId);
      localStorage.setItem('customwear:lastDesignAccessToken', token);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Impossible de charger la discussion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canLoad) loadMessages();
  }, [canLoad]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    if (!canLoad) return;

    setSending(true);
    try {
      const { data } = await api.post(`/api/design-requests/${encodeURIComponent(designRequestId)}/messages`, {
        token,
        body: text
      });
      setMessages(data?.data?.messages || []);
      setBody('');
      toast.success('Message envoyé');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <FiMessageCircle />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">Discussion — Design</div>
                <div className="text-sm text-slate-500">Pour compléter ta demande, répondre aux questions, clarifier des détails.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadMessages}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FiRefreshCw />
                Actualiser
              </button>
              <Link
                to="/design"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Nouvelle demande
              </Link>
            </div>
          </div>

          <div className="p-5">
            {!canLoad && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <div className="flex items-center gap-2 font-semibold">
                  <FiLock />
                  Accès sécurisé
                </div>
                <div className="mt-2 text-sm">
                  Entre l’ID de ta demande et le token reçu par email (ou ouvre le lien envoyé).
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold text-slate-600">ID Demande</label>
                    <input
                      value={designRequestId}
                      onChange={(e) => setDesignRequestId(e.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                      placeholder="ex: 6630c8..."
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold text-slate-600">Token</label>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                      placeholder="token reçu par email"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={loadMessages}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Ouvrir la discussion
                  </button>
                </div>
              </div>
            )}

            {canLoad && (
              <>
                <div className="mb-4 text-sm text-slate-500">
                  Demande: <span className="font-semibold text-slate-700">{designRequestId}</span>
                </div>

                <div className="h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {loading && <div className="text-center text-slate-500">Chargement…</div>}
                  {!loading && messages.length === 0 && (
                    <div className="text-center text-slate-500">Aucun message pour le moment</div>
                  )}
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isClient = m.senderType === 'client';
                      return (
                        <div key={m._id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                              isClient
                                ? 'bg-white border-slate-200 text-slate-800'
                                : 'bg-blue-600 border-blue-600 text-white'
                            }`}
                          >
                            <div className={`text-xs ${isClient ? 'text-slate-500' : 'text-blue-50'} flex justify-between gap-3`}>
                              <span className="font-semibold">{isClient ? 'Toi' : 'CustomWear'}</span>
                              <span>{formatDate(m.createdAt)}</span>
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-sm">{m.body}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={sendMessage} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600">Ton message</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      placeholder="Réponds ici (infos, références, texte exact, couleurs, etc.)"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !body.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FiSend />
                    {sending ? 'Envoi…' : 'Envoyer'}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DesignMessages;

