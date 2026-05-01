import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaFire, FaInstagram, FaTiktok, FaYoutube, FaTimes, FaTicketAlt, FaBolt } from 'react-icons/fa';
import './Events.css';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function useCountdown(targetDate) {
  const targetMs = useMemo(() => {
    const ms = new Date(targetDate).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [targetDate]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!targetMs) {
    return { isExpired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diff = Math.max(0, targetMs - now);
  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { isExpired: diff === 0, days, hours, minutes, seconds };
}

function formatEventDate(dateString) {
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return 'Date à venir';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

const Events = () => {
  const eventsSectionRef = useRef(null);

  const seasonalEvents = useMemo(
    () => [
      {
        id: 'back-to-school',
        emoji: '🎒',
        title: 'Back to School Drop',
        description:
          'Prépare ta rentrée avec des pièces uniques. Crée ton style, démarque-toi dès le premier jour.',
        highlights: ['Drop exclusif', 'Atelier customisation'],
        ctaLabel: 'Créer mon outfit',
        ctaTo: '/models',
        startsAt: '2026-09-01T18:00:00',
        limited: true,
        accent: 'mint',
        hasWorkshop: true,
        workshopSlots: ['18:30', '19:15', '20:00']
      },
      {
        id: 'black-friday',
        emoji: '🛍️',
        title: 'Black Friday Custom',
        description: 'Des réductions, mais toujours avec du style. Personnalise à prix réduit.',
        highlights: ['Promotions limitées', 'Offres flash'],
        ctaLabel: 'Profiter des offres',
        ctaTo: '/products',
        startsAt: '2026-11-27T08:00:00',
        limited: true,
        accent: 'violet',
        hasWorkshop: false,
        workshopSlots: []
      },
      {
        id: 'summer-festival',
        emoji: '☀️',
        title: 'Summer Festival',
        description: 'Des designs faits pour vibrer. Soleil, musique et style unique.',
        highlights: ['Pop-up stores', 'Custom en live'],
        ctaLabel: 'Voir les events été',
        ctaTo: '/about',
        startsAt: '2026-07-10T12:00:00',
        limited: false,
        accent: 'sun',
        hasWorkshop: true,
        workshopSlots: ['12:30', '14:00', '15:30']
      },
      {
        id: 'custom-xmas',
        emoji: '🎄',
        title: 'Custom Xmas',
        description: 'Offre un cadeau unique. Crée une pièce qui a du sens.',
        highlights: ['Cadeaux personnalisés', 'Emballage spécial'],
        ctaLabel: 'Créer un cadeau',
        ctaTo: '/models',
        startsAt: '2026-12-10T10:00:00',
        limited: false,
        accent: 'red',
        hasWorkshop: false,
        workshopSlots: []
      },
      {
        id: 'music-street',
        emoji: '🎶',
        title: 'Music & Street Culture',
        description: 'Mode et musique se rencontrent. Live, DJ sets et customisation en direct.',
        highlights: ['Événement live', 'Collaboration artistes'],
        ctaLabel: 'Participer',
        ctaTo: '/about',
        startsAt: '2026-06-21T16:00:00',
        limited: false,
        accent: 'blue',
        hasWorkshop: true,
        workshopSlots: ['16:30', '17:30', '18:30']
      }
    ],
    []
  );

  const [clockNow, setClockNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const nextEvent = useMemo(() => {
    const upcoming = seasonalEvents
      .map((ev) => ({ ev, ms: new Date(ev.startsAt).getTime() }))
      .filter(({ ms }) => Number.isFinite(ms) && ms > clockNow)
      .sort((a, b) => a.ms - b.ms)[0];
    return upcoming?.ev || null;
  }, [clockNow, seasonalEvents]);

  const [calendarFilter, setCalendarFilter] = useState('Tous');

  const calendarOptions = useMemo(() => {
    const months = seasonalEvents
      .map((ev) => new Date(ev.startsAt))
      .filter((d) => Number.isFinite(d.getTime()))
      .map((d) => new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(d));

    const uniqueMonths = Array.from(new Set(months.map((m) => m[0].toUpperCase() + m.slice(1))));
    return ['Tous', ...uniqueMonths];
  }, [seasonalEvents]);

  const filteredEvents = useMemo(() => {
    if (calendarFilter === 'Tous') return seasonalEvents;
    return seasonalEvents.filter((ev) => {
      const d = new Date(ev.startsAt);
      if (!Number.isFinite(d.getTime())) return false;
      const label = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(d);
      return (label[0].toUpperCase() + label.slice(1)) === calendarFilter;
    });
  }, [calendarFilter, seasonalEvents]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const selectedEvent = useMemo(
    () => seasonalEvents.find((ev) => ev.id === selectedEventId) || null,
    [seasonalEvents, selectedEventId]
  );

  const [eventEmail, setEventEmail] = useState('');
  const [eventSlot, setEventSlot] = useState('');

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  const [ugcItems] = useState(() => [
    { id: 'ugc-1', user: 'Nina', tag: '@customwear', text: 'Mon hoodie custom pour le concert. Vibes de fou.', emoji: '🧥' },
    { id: 'ugc-2', user: 'Yass', tag: '#customdrop', text: 'Back to School prêt. Pièce unique, zéro copié-collé.', emoji: '🎒' },
    { id: 'ugc-3', user: 'Léa', tag: '#streetart', text: 'Custom en live au pop-up. La qualité est insane.', emoji: '☀️' }
  ]);

  useEffect(() => {
    if (!isModalOpen) {
      setEventEmail('');
      setEventSlot('');
      setSelectedEventId(null);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const openRegistration = (eventId) => {
    setSelectedEventId(eventId);
    setIsModalOpen(true);
  };

  const handleHeroScroll = () => {
    eventsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEventRegistration = (e) => {
    e.preventDefault();
    const email = eventEmail.trim();
    if (!selectedEvent) return;
    if (!isValidEmail(email)) {
      toast.error('Ajoute un email valide pour t’inscrire.');
      return;
    }
    if (selectedEvent.hasWorkshop && !eventSlot) {
      toast.error('Choisis un créneau pour l’atelier.');
      return;
    }
    toast.success(`Inscription confirmée pour ${selectedEvent.title}.`);
    setIsModalOpen(false);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!isValidEmail(email)) {
      toast.error('Ajoute un email valide pour recevoir les actus.');
      return;
    }
    setNewsletterStatus('loading');
    window.setTimeout(() => {
      setNewsletterStatus('success');
      toast.success('Inscription confirmée. On te tient au courant des prochains drops.');
      setNewsletterEmail('');
      window.setTimeout(() => setNewsletterStatus('idle'), 1200);
    }, 400);
  };

  return (
    <div className="events-page">
      <section className="events-hero" aria-labelledby="events-hero-title">
        <div className="events-hero-bg" aria-hidden="true" />
        <div className="container events-hero-inner">
          <motion.div
            className="events-hero-content"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="events-hero-badges">
              <span className="events-chip">
                <FaBolt />
                Drops & ateliers
              </span>
              <span className="events-chip">
                <FaFire />
                Éditions limitées
              </span>
            </div>
            <h1 id="events-hero-title" className="events-hero-title">
              Les Événements <span className="events-highlight">CustomWear</span>
            </h1>
            <p className="events-hero-subtitle">
              Crée, partage, vis la culture streetwear toute l’année
            </p>
            <div className="events-hero-actions">
              <button type="button" className="events-btn events-btn-primary" onClick={handleHeroScroll}>
                <FaCalendarAlt />
                Voir les événements
              </button>
              <Link to="/models" className="events-btn events-btn-secondary">
                <FaTicketAlt />
                Personnaliser maintenant
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="events-hero-card"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            <div className="events-hero-card-title">
              <FaClock />
              Prochain rendez-vous
            </div>
            <div className="events-next">
              {nextEvent ? (
                <NextEventCard event={nextEvent} onRegister={() => openRegistration(nextEvent.id)} />
              ) : (
                <div className="events-next-inner">
                  <div className="events-next-title">
                    <span className="events-next-emoji" aria-hidden="true">
                      ✨
                    </span>
                    <span>Nouveaux events bientôt</span>
                  </div>
                  <div className="events-next-meta">Reste connecté, on tease le prochain drop.</div>
                  <div className="events-next-actions">
                    <button type="button" className="events-btn events-btn-primary" onClick={handleHeroScroll}>
                      Voir la grille
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="events-section" ref={eventsSectionRef} aria-labelledby="events-title">
        <div className="container">
          <motion.div
            className="events-section-header"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="events-title" className="events-section-title">
              Événements saisonniers
            </h2>
            <p className="events-section-subtitle">
              Des drops exclusifs, des ateliers et des vibes street toute l’année. Tu viens ?
            </p>
          </motion.div>

          <div className="events-calendar">
            <div className="events-calendar-title">
              <FaCalendarAlt />
              Calendrier (filtrer)
            </div>
            <div className="events-calendar-chips" role="tablist" aria-label="Filtrer les événements par mois">
              {calendarOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`events-filter-chip ${calendarFilter === opt ? 'active' : ''}`}
                  onClick={() => setCalendarFilter(opt)}
                  role="tab"
                  aria-selected={calendarFilter === opt}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="events-grid" role="list">
            {filteredEvents.map((ev, index) => (
              <motion.article
                key={ev.id}
                className={`event-card accent-${ev.accent}`}
                role="listitem"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.24) }}
                whileHover={{ y: -8 }}
              >
                <div className="event-card-top">
                  <div className="event-emoji" aria-hidden="true">
                    {ev.emoji}
                  </div>
                  <div className="event-top-right">
                    {ev.limited && <span className="event-badge">Édition limitée</span>}
                    <div className="event-date">{formatEventDate(ev.startsAt)}</div>
                  </div>
                </div>
                <h3 className="event-title">{ev.title}</h3>
                <p className="event-description">{ev.description}</p>

                <div className="event-highlights">
                  {ev.highlights.map((h) => (
                    <span key={h} className="event-pill">
                      {h}
                    </span>
                  ))}
                </div>

                <div className="event-countdown-row">
                  <FaClock className="event-countdown-icon" aria-hidden="true" />
                  <EventCountdown startsAt={ev.startsAt} />
                </div>

                <div className="event-actions">
                  <Link to={ev.ctaTo} className="events-btn events-btn-secondary">
                    {ev.ctaLabel}
                  </Link>
                  <button type="button" className="events-btn events-btn-primary" onClick={() => openRegistration(ev.id)}>
                    S’inscrire
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="events-community" aria-labelledby="events-community-title">
        <div className="container">
          <motion.div
            className="events-section-header"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="events-community-title" className="events-section-title">
              Rejoins la communauté CustomWear
            </h2>
            <p className="events-section-subtitle">
              Looks, vibes, créations. Partage ton style et inspire la street.
            </p>
          </motion.div>

          <div className="community-grid">
            <div className="community-gallery" aria-label="Photos clients (aperçu)">
              {['📸', '🔥', '🎨', '🧢', '🧥', '👕'].map((item, idx) => (
                <motion.div
                  key={`${item}-${idx}`}
                  className="community-tile"
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: Math.min(idx * 0.05, 0.2) }}
                >
                  <span className="community-tile-emoji" aria-hidden="true">
                    {item}
                  </span>
                  <span className="community-tile-label">UGC</span>
                </motion.div>
              ))}
            </div>

            <div className="community-ugc" aria-label="Posts de la communauté">
              {ugcItems.map((ugc, idx) => (
                <motion.div
                  key={ugc.id}
                  className="ugc-card"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.06, 0.18) }}
                >
                  <div className="ugc-top">
                    <span className="ugc-avatar" aria-hidden="true">
                      {ugc.emoji}
                    </span>
                    <div className="ugc-meta">
                      <div className="ugc-user">{ugc.user}</div>
                      <div className="ugc-tag">{ugc.tag}</div>
                    </div>
                  </div>
                  <div className="ugc-text">{ugc.text}</div>
                </motion.div>
              ))}

              <div className="community-actions">
                <button type="button" className="events-btn events-btn-primary" onClick={() => toast.info('Fonction upload à connecter (UGC).')}>
                  Partager mon style
                </button>
                <div className="social-links" aria-label="Réseaux sociaux">
                  <a className="social-link" href="https://instagram.com" target="_blank" rel="noreferrer">
                    <FaInstagram />
                    Instagram
                  </a>
                  <a className="social-link" href="https://tiktok.com" target="_blank" rel="noreferrer">
                    <FaTiktok />
                    TikTok
                  </a>
                  <a className="social-link" href="https://youtube.com" target="_blank" rel="noreferrer">
                    <FaYoutube />
                    YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="events-newsletter" aria-labelledby="events-newsletter-title">
        <div className="container">
          <motion.div
            className="newsletter-card"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="newsletter-left">
              <h2 id="events-newsletter-title" className="newsletter-title">
                Ne rate aucun événement
              </h2>
              <p className="newsletter-subtitle">
                Reçois les dates de drops, les ateliers et les collabs directement dans ta boîte.
              </p>
            </div>

            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <label className="newsletter-label" htmlFor="newsletter-email">
                Email
              </label>
              <div className="newsletter-row">
                <input
                  id="newsletter-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tonemail@exemple.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="newsletter-input"
                  aria-invalid={newsletterStatus === 'error'}
                />
                <button
                  type="submit"
                  className="events-btn events-btn-primary"
                  disabled={newsletterStatus === 'loading'}
                >
                  {newsletterStatus === 'loading' ? '...' : 'S’inscrire'}
                </button>
              </div>
              <div className="newsletter-hint">Zéro spam. Juste du style et des dates.</div>
            </form>
          </motion.div>
        </div>
      </section>

      {isModalOpen && (
        <div className="events-modal-overlay" role="presentation" onMouseDown={() => setIsModalOpen(false)}>
          <div
            className="events-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Inscription à un événement"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="events-modal-header">
              <div className="events-modal-title">
                <FaTicketAlt />
                {selectedEvent ? `S’inscrire — ${selectedEvent.title}` : 'S’inscrire'}
              </div>
              <button type="button" className="events-modal-close" onClick={() => setIsModalOpen(false)} aria-label="Fermer">
                <FaTimes />
              </button>
            </div>

            {selectedEvent && (
              <div className="events-modal-meta">
                <div className="events-modal-date">{formatEventDate(selectedEvent.startsAt)}</div>
                {selectedEvent.limited && <span className="event-badge">Édition limitée</span>}
              </div>
            )}

            <form className="events-modal-form" onSubmit={handleEventRegistration}>
              <label className="events-form-label" htmlFor="event-email">
                Email
              </label>
              <input
                id="event-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="events-form-input"
                placeholder="tonemail@exemple.com"
                value={eventEmail}
                onChange={(e) => setEventEmail(e.target.value)}
              />

              {selectedEvent?.hasWorkshop && (
                <>
                  <label className="events-form-label" htmlFor="event-slot">
                    Créneau atelier
                  </label>
                  <select
                    id="event-slot"
                    className="events-form-select"
                    value={eventSlot}
                    onChange={(e) => setEventSlot(e.target.value)}
                  >
                    <option value="">Choisir un créneau</option>
                    {selectedEvent.workshopSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="events-modal-actions">
                <Link to={selectedEvent?.ctaTo || '/models'} className="events-btn events-btn-ghost" onClick={() => setIsModalOpen(false)}>
                  {selectedEvent?.ctaLabel || 'Découvrir'}
                </Link>
                <button type="submit" className="events-btn events-btn-primary">
                  Confirmer
                </button>
              </div>
              <div className="events-modal-hint">
                En t’inscrivant, tu reçois un rappel et les infos pratiques (adresse, horaires, accès).
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function EventCountdown({ startsAt }) {
  const countdown = useCountdown(startsAt);
  if (countdown.isExpired) return <span className="event-countdown-text">En cours / terminé</span>;
  return (
    <span className="event-countdown-text">
      {countdown.days}j {pad2(countdown.hours)}h {pad2(countdown.minutes)}m {pad2(countdown.seconds)}s
    </span>
  );
}

function NextEventCard({ event, onRegister }) {
  const countdown = useCountdown(event.startsAt);
  return (
    <div className="events-next-inner">
      <div className="events-next-title">
        <span className="events-next-emoji" aria-hidden="true">
          {event.emoji}
        </span>
        <span>{event.title}</span>
      </div>
      <div className="events-countdown" aria-label="Compte à rebours">
        <div className="events-countdown-item">
          <span className="events-countdown-number">{pad2(countdown.days)}</span>
          <span className="events-countdown-label">J</span>
        </div>
        <div className="events-countdown-item">
          <span className="events-countdown-number">{pad2(countdown.hours)}</span>
          <span className="events-countdown-label">H</span>
        </div>
        <div className="events-countdown-item">
          <span className="events-countdown-number">{pad2(countdown.minutes)}</span>
          <span className="events-countdown-label">M</span>
        </div>
        <div className="events-countdown-item">
          <span className="events-countdown-number">{pad2(countdown.seconds)}</span>
          <span className="events-countdown-label">S</span>
        </div>
      </div>
      <div className="events-next-meta">{formatEventDate(event.startsAt)}</div>
      <div className="events-next-actions">
        <button type="button" className="events-btn events-btn-primary" onClick={onRegister}>
          S’inscrire
        </button>
        <Link to={event.ctaTo} className="events-btn events-btn-ghost">
          {event.ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export default Events;
