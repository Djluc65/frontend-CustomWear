import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FaBolt,
  FaBrush,
  FaCheck,
  FaCrown,
  FaFileUpload,
  FaLock,
  FaMagic,
  FaPalette,
  FaShoppingBag,
  FaStar,
  FaWhatsapp
} from 'react-icons/fa';
import api from '../services/api';
import './CreateDesign.css';

function formatCents(cents) {
  const value = Number(cents || 0) / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

const PACKS = [
  {
    key: 'basic',
    label: 'BASIC',
    range: '15€–25€',
    icon: <FaBrush />,
    features: ['1 proposition', 'Design simple', 'Délai standard (48–72h)']
  },
  {
    key: 'standard',
    label: 'STANDARD',
    range: '30€–50€',
    icon: <FaStar />,
    features: ['2 propositions', '2 retouches', 'Qualité supérieure']
  },
  {
    key: 'premium',
    label: 'PREMIUM',
    range: '60€–100€',
    icon: <FaCrown />,
    features: ['Design complexe', 'Retouches illimitées', 'Priorité + livraison rapide']
  }
];

const DEADLINES = [
  { key: '7j', label: 'Semaine (7 jours)' },
  { key: '48-72h', label: 'Standard (48–72h)' },
  { key: '24-48h', label: 'Express (24–48h)' }
];

const PACK_PRICE_BY_DEADLINE = {
  basic: { '7j': 1500, '48-72h': 2000, '24-48h': 2500 },
  standard: { '7j': 3000, '48-72h': 4000, '24-48h': 5000 },
  premium: { '7j': 6000, '48-72h': 8000, '24-48h': 10000 }
};

const ADDONS = [
  { key: 'hdFile', label: 'Fichier HD', priceCents: 500, icon: <FaMagic /> },
  { key: 'commercialUse', label: 'Utilisation commerciale', priceCents: 1500, icon: <FaLock /> }
];

const CreateDesign = () => {
  const [form, setForm] = useState({
    email: '',
    description: '',
    style: 'streetwear',
    usage: 't-shirt',
    preferredColors: '',
    desiredDeadline: '48-72h'
  });

  const [packKey, setPackKey] = useState('standard');
  const [addons, setAddons] = useState({
    hdFile: false,
    commercialUse: false
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectedPack = useMemo(() => PACKS.find((p) => p.key === packKey) || PACKS[1], [packKey]);
  const selectedDeadline = useMemo(
    () => DEADLINES.find((d) => d.key === form.desiredDeadline) || DEADLINES[1],
    [form.desiredDeadline]
  );

  const basePackCents = useMemo(() => {
    const matrix = PACK_PRICE_BY_DEADLINE[packKey] || PACK_PRICE_BY_DEADLINE.standard;
    return matrix[form.desiredDeadline] ?? matrix['48-72h'];
  }, [form.desiredDeadline, packKey]);

  const addonsTotalCents = useMemo(() => {
    return ADDONS.reduce((sum, a) => sum + (addons[a.key] ? a.priceCents : 0), 0);
  }, [addons]);

  const totalCents = useMemo(() => Math.max(0, basePackCents + addonsTotalCents), [addonsTotalCents, basePackCents]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onAddonToggle = (key) => {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const createDesignRequest = async () => {
    const email = form.email.trim();
    if (!isValidEmail(email)) {
      throw new Error('Ajoute un email valide.');
    }
    if (!form.description || form.description.trim().length < 10) {
      throw new Error('Décris ton design avec plus de détails (au moins 10 caractères).');
    }

    const data = new FormData();
    data.append('email', email);
    data.append('description', form.description.trim());
    data.append('style', form.style);
    data.append('usage', form.usage);
    data.append('preferredColors', form.preferredColors.trim());
    data.append('desiredDeadline', form.desiredDeadline);
    data.append('pack', packKey);
    data.append('hdFile', String(Boolean(addons.hdFile)));
    data.append('commercialUse', String(Boolean(addons.commercialUse)));
    if (file) data.append('file', file);

    const response = await api.post('/api/design-requests', data);
    const designRequestId = response?.data?.data?.designRequestId;
    const pricing = response?.data?.data?.pricing;
    const accessToken = response?.data?.data?.accessToken;
    if (!designRequestId || !pricing?.totalCents) {
      throw new Error('Impossible de créer la demande. Réessaie.');
    }
    return { designRequestId, pricing, accessToken };
  };

  const startPayment = async ({ designRequestId, pricing }) => {
    const origin = window.location.origin;
    const successUrl = `${origin}/design/success?designRequestId=${encodeURIComponent(designRequestId)}`;
    const cancelUrl = `${origin}/design/cancel?designRequestId=${encodeURIComponent(designRequestId)}`;

    const lineItems = [
      {
        name: `Design personnalisé — ${selectedPack.label}`,
        amount: pricing.totalCents,
        quantity: 1,
        currency: 'EUR'
      }
    ];

    const metadata = {
      source: 'design-service',
      designRequestId: String(designRequestId),
      pack: packKey,
      desiredDeadline: form.desiredDeadline,
      hdFile: String(Boolean(addons.hdFile)),
      commercialUse: String(Boolean(addons.commercialUse))
    };

    if (paymentMethod === 'paypal') {
      const { data } = await api.post('/api/paypal/create-order', {
        items: lineItems,
        customerEmail: form.email.trim(),
        shippingFeeCents: 0,
        metadata: { reference: `design-${designRequestId}`, ...metadata },
        applicationContext: {
          return_url: successUrl,
          cancel_url: cancelUrl
        }
      });

      if (data?.approveUrl) {
        window.location.assign(data.approveUrl);
        return;
      }
      throw new Error('Lien PayPal manquant. Réessaie.');
    }

    const { data } = await api.post('/api/payments/create-checkout-session', {
      items: lineItems,
      customerEmail: form.email.trim(),
      shippingFeeCents: 0,
      metadata,
      successUrl,
      cancelUrl
    });

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    throw new Error('Lien Stripe manquant. Réessaie.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const created = await createDesignRequest();
      localStorage.setItem('customwear:lastDesignRequestId', created.designRequestId);
      localStorage.setItem('customwear:lastDesignEmail', form.email.trim());
      if (created.accessToken) {
        localStorage.setItem('customwear:lastDesignAccessToken', created.accessToken);
      }
      await startPayment(created);
    } catch (err) {
      toast.error(err?.message || 'Une erreur est survenue. Réessaie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-design-page">
      <section className="cd-hero" aria-labelledby="cd-hero-title">
        <div className="cd-hero-bg" aria-hidden="true" />
        <div className="cd-container cd-hero-inner">
          <motion.div
            className="cd-hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="cd-badges">
              <span className="cd-badge">
                <FaCheck />
                Design unique garanti
              </span>
              <span className="cd-badge">
                <FaBolt />
                Paiement upfront
              </span>
            </div>
            <h1 id="cd-hero-title" className="cd-hero-title">
              Ton idée. <span className="cd-highlight">Notre design.</span>
            </h1>
            <p className="cd-hero-subtitle">Transforme ton concept en visuel unique prêt à être porté.</p>
            <div className="cd-hero-actions">
              <a href="#cd-form" className="cd-btn cd-btn-primary">
                <FaPalette />
                Créer mon design
              </a>
              <Link to="/models" className="cd-btn cd-btn-secondary">
                <FaShoppingBag />
                Voir les produits
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="cd-hero-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
          >
            <div className="cd-hero-card-title">
              <FaWhatsapp />
              Processus (ultra clair)
            </div>
            <ol className="cd-steps">
              <li>Tu remplis le formulaire</li>
              <li>Tu choisis une offre + options</li>
              <li>Tu paies (sécurisé)</li>
              <li>On t’envoie une proposition (48–72h)</li>
              <li>Tu valides ou demandes une retouche</li>
              <li>Tu commandes ton produit</li>
            </ol>
            <div className="cd-hero-card-note">
              Offre bonus: <strong>design remboursé</strong> si tu commandes un produit (à activer sur demande).
            </div>
          </motion.div>
        </div>
      </section>

      <section id="cd-form" className="cd-main" aria-labelledby="cd-form-title">
        <div className="cd-container cd-main-grid">
          <motion.div
            className="cd-form-card"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 id="cd-form-title" className="cd-section-title">
              Formulaire de demande
            </h2>
            <p className="cd-section-subtitle">
              On te guide pour éviter le flou. Plus c’est précis, plus le rendu est fort.
            </p>

            <form className="cd-form" onSubmit={handleSubmit}>
              <div className="cd-field">
                <label className="cd-label" htmlFor="cd-email">
                  Email
                </label>
                <input
                  id="cd-email"
                  className="cd-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tonemail@exemple.com"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="cd-field">
                <label className="cd-label" htmlFor="cd-desc">
                  Description du design
                </label>
                <textarea
                  id="cd-desc"
                  className="cd-textarea"
                  placeholder="Ex: un logo streetwear avec un dragon + texte, style graffiti, vibe nocturne."
                  value={form.description}
                  onChange={(e) => onChange('description', e.target.value)}
                  rows={5}
                  required
                />
                <div className="cd-hint">Astuce: mentionne le texte exact, l’ambiance, et 1–2 références.</div>
              </div>

              <div className="cd-row">
                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-style">
                    Style souhaité
                  </label>
                  <select
                    id="cd-style"
                    className="cd-select"
                    value={form.style}
                    onChange={(e) => onChange('style', e.target.value)}
                  >
                    <option value="streetwear">Streetwear</option>
                    <option value="minimaliste">Minimaliste</option>
                    <option value="graffiti">Graffiti</option>
                    <option value="anime">Anime</option>
                    <option value="luxe">Luxe</option>
                  </select>
                </div>

                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-usage">
                    Utilisation
                  </label>
                  <select
                    id="cd-usage"
                    className="cd-select"
                    value={form.usage}
                    onChange={(e) => onChange('usage', e.target.value)}
                  >
                    <option value="t-shirt">T-shirt</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="casquette">Casquette</option>
                    <option value="accessoire">Accessoire</option>
                  </select>
                </div>
              </div>

              <div className="cd-row">
                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-colors">
                    Couleurs préférées
                  </label>
                  <input
                    id="cd-colors"
                    className="cd-input"
                    type="text"
                    placeholder="Ex: noir, blanc, rouge (ou #FF0000)"
                    value={form.preferredColors}
                    onChange={(e) => onChange('preferredColors', e.target.value)}
                  />
                </div>

                <div className="cd-field">
                  <label className="cd-label" htmlFor="cd-deadline">
                    Délai souhaité
                  </label>
                  <select
                    id="cd-deadline"
                    className="cd-select"
                    value={form.desiredDeadline}
                    onChange={(e) => onChange('desiredDeadline', e.target.value)}
                  >
                    {DEADLINES.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cd-upload">
                <div className="cd-upload-top">
                  <div>
                    <div className="cd-upload-title">
                      <FaFileUpload />
                      Upload fichier (croquis / inspi)
                    </div>
                    <div className="cd-upload-subtitle">Optionnel, mais super utile pour cadrer le rendu.</div>
                  </div>
                  <label className="cd-upload-btn">
                    Choisir un fichier
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                  </label>
                </div>

                {file && (
                  <div className="cd-upload-preview">
                    <div className="cd-upload-file">
                      <strong>Fichier:</strong> {file.name}
                    </div>
                    {filePreviewUrl && file.type.startsWith('image/') && (
                      <img className="cd-upload-image" src={filePreviewUrl} alt="Aperçu du fichier uploadé" />
                    )}
                  </div>
                )}
              </div>

              <div className="cd-pricing-block" aria-label="Choix de l’offre">
                <div className="cd-pricing-title">
                  <FaBolt />
                  Choisis ton pack
                </div>
                <div className="cd-packs">
                  {PACKS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`cd-pack ${packKey === p.key ? 'active' : ''}`}
                      onClick={() => setPackKey(p.key)}
                      aria-pressed={packKey === p.key}
                    >
                      <div className="cd-pack-top">
                        <div className="cd-pack-icon">{p.icon}</div>
                        <div className="cd-pack-meta">
                          <div className="cd-pack-label">{p.label}</div>
                          <div className="cd-pack-range">{p.range}</div>
                        </div>
                        <div className="cd-pack-price">
                          {formatCents((PACK_PRICE_BY_DEADLINE[p.key] || PACK_PRICE_BY_DEADLINE.standard)[form.desiredDeadline] || 0)}
                        </div>
                      </div>
                      <div className="cd-pack-features">
                        {p.features.map((f) => (
                          <div key={f} className="cd-pack-feature">
                            <FaCheck />
                            {f}
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="cd-addons">
                  <div className="cd-addons-title">Options add-on</div>
                  <div className="cd-addons-grid">
                    {ADDONS.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        className={`cd-addon ${addons[a.key] ? 'active' : ''}`}
                        onClick={() => onAddonToggle(a.key)}
                        aria-pressed={addons[a.key]}
                      >
                        <div className="cd-addon-left">
                          <div className="cd-addon-icon">{a.icon}</div>
                          <div className="cd-addon-label">{a.label}</div>
                        </div>
                        <div className="cd-addon-price">+ {formatCents(a.priceCents)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cd-payment">
                <div className="cd-payment-title">Paiement</div>
                <div className="cd-payment-methods">
                  <label className={`cd-method ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    Carte bancaire (Stripe)
                  </label>
                  <label className={`cd-method ${paymentMethod === 'paypal' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    PayPal
                  </label>
                </div>
                <div className="cd-payment-note">Tu seras redirigé vers un paiement sécurisé.</div>
              </div>

              <div className="cd-actions">
                <div className="cd-total">
                  <div className="cd-total-label">Total</div>
                  <div className="cd-total-value">{formatCents(totalCents)}</div>
                </div>
                <button type="submit" className="cd-btn cd-btn-primary cd-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Redirection…' : 'Payer et lancer mon design'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.aside
            className="cd-side"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            <div className="cd-side-card">
              <div className="cd-side-title">Un design qui te ressemble vraiment</div>
              <div className="cd-side-text">Pas de template. 100% unique. Créé par des designers, pensé pour toi.</div>
              <div className="cd-side-divider" />
              <div className="cd-side-row">
                <span>Pack</span>
                <strong>{selectedPack.label}</strong>
              </div>
              <div className="cd-side-row">
                <span>Prix pack</span>
                <strong>{formatCents(basePackCents)}</strong>
              </div>
              <div className="cd-side-row">
                <span>Délai</span>
                <strong>
                  {selectedDeadline.label}
                </strong>
              </div>
              <div className="cd-side-row">
                <span>Options</span>
                <strong>{formatCents(addonsTotalCents)}</strong>
              </div>
              <div className="cd-side-divider" />
              <div className="cd-side-row total">
                <span>Total</span>
                <strong>{formatCents(totalCents)}</strong>
              </div>
              <div className="cd-side-fineprint">
                Après paiement: confirmation + lancement de la création. Le tarif varie selon le délai choisi.
              </div>
            </div>

            <div className="cd-side-card">
              <div className="cd-side-title">Exemples de créations</div>
              <div className="cd-examples">
                {['🐉', '🖋️', '🧩', '💥', '🌙', '🎧'].map((e, idx) => (
                  <div key={`${e}-${idx}`} className="cd-example">
                    {e}
                  </div>
                ))}
              </div>
            </div>

            <div className="cd-side-card">
              <div className="cd-side-title">Avis clients</div>
              <div className="cd-testimonials">
                <div className="cd-testimonial">
                  <div className="cd-testimonial-top">
                    <span className="cd-avatar">🧢</span>
                    <div>
                      <div className="cd-name">“Propre et rapide”</div>
                      <div className="cd-stars">
                        <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar />
                      </div>
                    </div>
                  </div>
                  <div className="cd-quote">Le designer a compris direct l’ambiance. Résultat ultra clean.</div>
                </div>
                <div className="cd-testimonial">
                  <div className="cd-testimonial-top">
                    <span className="cd-avatar">👕</span>
                    <div>
                      <div className="cd-name">“100% unique”</div>
                      <div className="cd-stars">
                        <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar />
                      </div>
                    </div>
                  </div>
                  <div className="cd-quote">Pas de copie. Retouches rapides. Je recommande.</div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>
    </div>
  );
};

export default CreateDesign;
