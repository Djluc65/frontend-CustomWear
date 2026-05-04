import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { feedbackAPI } from '../services/api';
import './Feedback.css';

const TYPE_OPTIONS = [
  { value: 'bug', label: 'Bug' },
  { value: 'improvement', label: 'Amélioration' },
  { value: 'idea', label: 'Idée' },
  { value: 'other', label: 'Autre' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous statuts' },
  { value: 'NEW', label: 'Nouveau' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'PLANNED', label: 'Planifié' },
  { value: 'IMPLEMENTED', label: 'Implémenté' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Populaires' },
  { value: 'new', label: 'Récents' },
  { value: 'priority', label: 'Priorité' },
];

const toTypeLabel = (type) => TYPE_OPTIONS.find(o => o.value === type)?.label || type;
const toStatusLabel = (status) => STATUS_OPTIONS.find(o => o.value === status)?.label || status;

const Feedback = () => {
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [items, setItems] = useState([]);

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('popular');

  const [formType, setFormType] = useState('improvement');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarItems, setSimilarItems] = useState([]);

  const debounceRef = useRef(null);

  const pageUrl = useMemo(() => {
    try {
      return window.location.href;
    } catch {
      return '';
    }
  }, []);

  const fetchList = async () => {
    try {
      setListLoading(true);
      setListError('');
      const params = {
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
        sort: sort || undefined,
        page: 1,
        limit: 20,
      };
      Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
      const res = await feedbackAPI.list(params);
      const list = res?.data?.data?.items || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      setListError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search, type, status, sort]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const t = title.trim();
    if (t.length < 4) {
      setSimilarItems([]);
      setSimilarLoading(false);
      return;
    }
    setSimilarLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await feedbackAPI.findSimilar({ title: t, limit: 5 });
        const list = res?.data?.data?.items || [];
        setSimilarItems(Array.isArray(list) ? list : []);
      } catch {
        setSimilarItems([]);
      } finally {
        setSimilarLoading(false);
      }
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [title]);

  const handleVote = async (id, shouldVote) => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour voter');
      return;
    }
    const prev = items;
    setItems((curr) =>
      curr.map((it) =>
        String(it._id) !== String(id)
          ? it
          : {
              ...it,
              hasVoted: shouldVote,
              votesCount: Math.max(0, (Number(it.votesCount) || 0) + (shouldVote ? 1 : -1)),
            }
      )
    );
    try {
      const res = shouldVote ? await feedbackAPI.vote(id) : await feedbackAPI.unvote(id);
      const votesCount = res?.data?.data?.votesCount;
      if (votesCount !== undefined) {
        setItems((curr) =>
          curr.map((it) => (String(it._id) === String(id) ? { ...it, votesCount } : it))
        );
      }
    } catch (err) {
      setItems(prev);
      toast.error(err?.response?.data?.message || 'Impossible de voter');
    }
  };

  const resetForm = () => {
    setFormType('improvement');
    setTitle('');
    setDescription('');
    setRating('');
    setAttachment(null);
    setSimilarItems([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim().length < 4 || description.trim().length < 10) {
      toast.error('Titre ou description trop court');
      return;
    }
    try {
      setSubmitting(true);
      const res = await feedbackAPI.create({
        type: formType,
        title: title.trim(),
        description: description.trim(),
        rating: rating !== '' ? Number(rating) : undefined,
        pageUrl,
        attachment,
      });
      if (res?.data?.success) {
        toast.success('Merci ! Votre avis a été envoyé.');
        resetForm();
        fetchList();
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        toast.info('Une suggestion similaire existe déjà. Votez pour elle plutôt que de la recréer.');
        fetchList();
        return;
      }
      toast.error(err?.response?.data?.message || 'Impossible d’envoyer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-hero">
        <h1>Avis & Suggestions</h1>
        <p>
          Proposez des améliorations, signalez un problème, ou suggérez une nouvelle fonctionnalité.
          Les suggestions populaires sont priorisées.
        </p>
      </div>

      <div className="feedback-layout">
        <div className="feedback-card">
          <div className="feedback-card-inner">
            <form onSubmit={handleSubmit}>
              <div className="feedback-form-row">
                <label>Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-form-row">
                <label>Titre</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Bug sur le paiement, améliorer la recherche..."
                  maxLength={120}
                />
              </div>

              <div className="feedback-form-row">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème ou l’idée, étapes, contexte, etc."
                  maxLength={6000}
                />
              </div>

              <div className="feedback-form-row">
                <label>Note globale du site (optionnel)</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="">Aucune</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1 - Mauvais</option>
                </select>
              </div>

              <div className="feedback-form-row">
                <label>Capture (optionnel)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                />
              </div>

              <div className="feedback-form-actions">
                <button className="feedback-btn primary" type="submit" disabled={submitting}>
                  Envoyer
                </button>
                <button className="feedback-btn ghost" type="button" onClick={resetForm} disabled={submitting}>
                  Réinitialiser
                </button>
              </div>

              {(similarLoading || similarItems.length > 0) && (
                <div className="feedback-similar">
                  <div className="feedback-similar-title">Suggestions similaires</div>
                  {similarLoading && <div className="feedback-similar-meta">Recherche...</div>}
                  {!similarLoading && (
                    <div className="feedback-similar-list">
                      {similarItems.map((it) => (
                        <div key={it._id} className="feedback-similar-item">
                          <div>
                            <strong>{it.title}</strong>
                            <div className="feedback-similar-meta">
                              <span>{toTypeLabel(it.type)}</span>
                              <span>•</span>
                              <span>{toStatusLabel(it.status)}</span>
                              <span>•</span>
                              <span>{it.votesCount || 0} vote(s)</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="feedback-btn ghost"
                            onClick={() => handleVote(it._id, true)}
                          >
                            Voter
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="feedback-card">
          <div className="feedback-toolbar">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
            />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous types</option>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="feedback-card-inner">
            {listError && <div>{listError}</div>}
            {listLoading && <div>Chargement...</div>}
            {!listLoading && !items.length && <div>Aucune suggestion pour le moment.</div>}

            <div className="feedback-list">
              {items.map((it) => (
                <div key={it._id} className="feedback-card feedback-item">
                  <div className="feedback-item-head">
                    <div>
                      <div className="feedback-item-title">{it.title}</div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        <span className="feedback-pill type">{toTypeLabel(it.type)}</span>
                        <span className="feedback-pill status">{toStatusLabel(it.status)}</span>
                      </div>
                    </div>
                    <div className="feedback-vote">
                      <span className="feedback-vote-count">{it.votesCount || 0}</span>
                      <button
                        className="feedback-btn ghost"
                        type="button"
                        onClick={() => handleVote(it._id, !it.hasVoted)}
                      >
                        {it.hasVoted ? 'Retirer' : 'Vote'}
                      </button>
                    </div>
                  </div>
                  <div className="feedback-item-body">{it.description}</div>
                  {it.adminResponse?.body && (
                    <div style={{ marginTop: '0.7rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.7rem' }}>
                      <div style={{ fontWeight: 900, marginBottom: '0.25rem' }}>Réponse CustomWear</div>
                      <div className="feedback-item-body">{it.adminResponse.body}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

