import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiRotateCcw } from 'react-icons/fi';
import './AdminSettings.css';
import { customizationPricingAPI } from '../../services/api';

const DEFAULTS = {
  siteName: 'CustomWear',
  supportEmail: 'support@customwear.local',
  currency: 'EUR',
  shippingFeeEuro: 5.99,
  taxRatePercent: 20,
  payments: {
    stripeEnabled: true,
    paypalEnabled: true,
  },
  maintenanceMode: false,
};

const STORAGE_KEY = 'adminSettings';

const AdminSettings = () => {
  const [settings, setSettings] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  // Tarification personnalisation (admin)
  const [pricing, setPricing] = useState({
    text: { front: '', back: '', both: '' },
    image: { front: '', back: '', both: '' },
    combo: { any: '' },
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingSaved, setPricingSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULTS, ...parsed });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setPricingLoading(true);
    setPricingError('');
    setPricingSaved(false);
    customizationPricingAPI.getGrid()
      .then((res) => {
        const items = res?.data?.data || [];
        const next = { text: { front: '', back: '', both: '' }, image: { front: '', back: '', both: '' }, combo: { any: '' } };
        items.forEach((it) => {
          if (next[it.type] && it.placement) next[it.type][it.placement] = String(it.price ?? '');
        });
        if (mounted) setPricing(next);
      })
      .catch((err) => {
        console.error('[AdminSettings] getGrid error', err?.response?.data || err);
        setPricingError("Impossible de charger la grille tarifaire");
      })
      .finally(() => mounted && setPricingLoading(false));
    return () => { mounted = false; };
  }, []);

  const update = (path, value) => {
    setSaved(false);
    setSettings((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = obj[keys[i]] ?? {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  const reset = () => {
    setSettings(DEFAULTS);
    setSaved(false);
  };

  const updatePricing = (type, placement, value) => {
    setPricingSaved(false);
    setPricing((prev) => ({
      ...prev,
      [type]: { ...prev[type], [placement]: value }
    }));
  };

  const resetPricing = () => {
    setPricing({ text: { front: '', back: '', both: '' }, image: { front: '', back: '', both: '' }, combo: { any: '' } });
    setPricingSaved(false);
    setPricingError('');
  };

  const savePricing = async () => {
    try {
      setPricingSaving(true);
      setPricingError('');
      setPricingSaved(false);
      const ops = [
        { type: 'text', placement: 'front', price: Number(pricing.text.front || 0) },
        { type: 'text', placement: 'back', price: Number(pricing.text.back || 0) },
        { type: 'text', placement: 'both', price: Number(pricing.text.both || 0) },
        { type: 'image', placement: 'front', price: Number(pricing.image.front || 0) },
        { type: 'image', placement: 'back', price: Number(pricing.image.back || 0) },
        { type: 'image', placement: 'both', price: Number(pricing.image.both || 0) },
        { type: 'combo', placement: 'any', price: Number(pricing.combo.any || 0) },
      ];
      for (const op of ops) {
        await customizationPricingAPI.setPrice({ ...op, isActive: true });
      }
      setPricingSaved(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde des tarifs';
      console.error('[AdminSettings] savePricing error:', msg);
      setPricingError(msg);
    } finally {
      setPricingSaving(false);
    }
  };

  return (
    <div className="admin-settings">
      <h2>Paramètres</h2>

      <div className="settings-grid">
        <motion.div className="settings-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Général</h3>
          <div className="form-row">
            <label>Nom du site</label>
            <input type="text" value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Email support</label>
            <input type="email" value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Devise</label>
            <select value={settings.currency} onChange={(e) => update('currency', e.target.value)}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </motion.div>

        <motion.div className="settings-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Paiements</h3>
          <div className="form-row inline">
            <label>
              <input type="checkbox" checked={settings.payments.stripeEnabled} onChange={(e) => update('payments.stripeEnabled', e.target.checked)} />
              Activer Stripe
            </label>
          </div>
          <div className="form-row inline">
            <label>
              <input type="checkbox" checked={settings.payments.paypalEnabled} onChange={(e) => update('payments.paypalEnabled', e.target.checked)} />
              Activer PayPal
            </label>
          </div>
        </motion.div>

        <motion.div className="settings-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Commande</h3>
          <div className="form-row">
            <label>Frais de livraison (€)</label>
            <input type="number" step="0.01" min="0" value={settings.shippingFeeEuro} onChange={(e) => update('shippingFeeEuro', parseFloat(e.target.value))} />
          </div>
          <div className="form-row">
            <label>Taux de TVA (%)</label>
            <input type="number" step="0.1" min="0" value={settings.taxRatePercent} onChange={(e) => update('taxRatePercent', parseFloat(e.target.value))} />
          </div>
        </motion.div>

        <motion.div className="settings-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Système</h3>
          <div className="form-row inline">
            <label>
              <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => update('maintenanceMode', e.target.checked)} />
              Mode maintenance
            </label>
          </div>
        </motion.div>

        {/* Carte Tarifs Personnalisation */}
        <motion.div className="settings-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Tarifs Personnalisation</h3>
          {pricingLoading && <p>Chargement de la grille…</p>}
          {pricingError && <p style={{ color: '#dc2626' }}>{pricingError}</p>}
          <div className="pricing-form-grid">
            <div className="pricing-section-title">Personnalisation Texte</div>
            <div className="form-row">
              <label>Texte avant uniquement (Prix A)</label>
              <input type="number" step="0.01" min="0" value={pricing.text.front} onChange={(e) => updatePricing('text', 'front', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Texte arrière uniquement (Prix A)</label>
              <input type="number" step="0.01" min="0" value={pricing.text.back} onChange={(e) => updatePricing('text', 'back', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Texte avant + arrière (Prix B)</label>
              <input type="number" step="0.01" min="0" value={pricing.text.both} onChange={(e) => updatePricing('text', 'both', e.target.value)} />
            </div>

            <div className="pricing-section-title" style={{ marginTop: '0.5rem' }}>Personnalisation Image</div>
            <div className="form-row">
              <label>Image avant uniquement (Prix C)</label>
              <input type="number" step="0.01" min="0" value={pricing.image.front} onChange={(e) => updatePricing('image', 'front', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Image arrière uniquement (Prix C)</label>
              <input type="number" step="0.01" min="0" value={pricing.image.back} onChange={(e) => updatePricing('image', 'back', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Image avant + arrière (Prix D)</label>
              <input type="number" step="0.01" min="0" value={pricing.image.both} onChange={(e) => updatePricing('image', 'both', e.target.value)} />
            </div>

            <div className="pricing-section-title" style={{ marginTop: '0.5rem' }}>Texte et Image</div>
            <div className="form-row">
              <label>Texte + Image (Prix E)</label>
              <input type="number" step="0.01" min="0" value={pricing.combo.any} onChange={(e) => updatePricing('combo', 'any', e.target.value)} />
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" type="button" onClick={resetPricing} disabled={pricingSaving}>Réinitialiser</button>
              <button className="btn btn-primary" type="button" onClick={savePricing} disabled={pricingSaving}>
                <FiSave /> {pricingSaving ? 'Sauvegarde…' : 'Enregistrer les tarifs'}
              </button>
              {pricingSaved && <span className="save-hint">Tarifs enregistrés !</span>}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={reset}>
          <FiRotateCcw /> Réinitialiser
        </button>
        <button className="btn btn-primary" onClick={save}>
          <FiSave /> Enregistrer
        </button>
        {saved && <span className="save-hint">Paramètres enregistrés !</span>}
      </div>
    </div>
  );
};

export default AdminSettings;