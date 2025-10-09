import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiRotateCcw } from 'react-icons/fi';
import './AdminSettings.css';

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