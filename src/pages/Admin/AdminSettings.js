import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiRotateCcw, FiSettings, FiDollarSign, FiGlobe, FiLock } from 'react-icons/fi';
import { customizationPricingAPI } from '../../services/api';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

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
    setTimeout(() => setSaved(false), 3000);
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

  const savePricing = async () => {
    setPricingSaving(true);
    setPricingError('');
    setPricingSaved(false);
    try {
      const payload = [];
      ['text', 'image'].forEach(type => {
        ['front', 'back', 'both'].forEach(place => {
          const val = pricing[type][place];
          if (val !== '') payload.push({ type, placement: place, price: Number(val) });
        });
      });
      if (pricing.combo.any !== '') {
        payload.push({ type: 'combo', placement: 'any', price: Number(pricing.combo.any) });
      }
      await customizationPricingAPI.updateGrid(payload);
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 3000);
    } catch (err) {
      console.error('[AdminSettings] updateGrid error', err);
      setPricingError("Erreur sauvegarde grille");
    } finally {
      setPricingSaving(false);
    }
  };

  const SectionTitle = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FiSettings className="text-blue-600" />
            Paramètres
          </h1>
          <p className="text-slate-500 mt-1">Configuration générale et tarifs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="gap-2 text-slate-600">
            <FiRotateCcw /> Réinitialiser
          </Button>
          <Button onClick={save} className="bg-blue-600 text-white hover:bg-blue-700 gap-2">
            <FiSave /> {saved ? 'Enregistré !' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="space-y-6">
          <Card className="p-6">
            <SectionTitle icon={FiGlobe} title="Général" subtitle="Informations de base du site" />
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Nom du site</label>
                <Input 
                  value={settings.siteName} 
                  onChange={(e) => update('siteName', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Email support</label>
                <Input 
                  value={settings.supportEmail} 
                  onChange={(e) => update('supportEmail', e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Devise</label>
                  <Input 
                    value={settings.currency} 
                    onChange={(e) => update('currency', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">TVA (%)</label>
                  <Input 
                    type="number" 
                    value={settings.taxRatePercent} 
                    onChange={(e) => update('taxRatePercent', Number(e.target.value))} 
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Frais de port (€)</label>
                <Input 
                  type="number" 
                  value={settings.shippingFeeEuro} 
                  onChange={(e) => update('shippingFeeEuro', Number(e.target.value))} 
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={FiLock} title="Système" subtitle="Maintenance et paiements" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Mode Maintenance</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => update('maintenanceMode', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium text-slate-900">Paiements acceptés</h4>
                <div className="flex items-center gap-4">
                   <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={settings.payments.stripeEnabled}
                       onChange={(e) => update('payments.stripeEnabled', e.target.checked)}
                       className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     Stripe
                   </label>
                   <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={settings.payments.paypalEnabled}
                       onChange={(e) => update('payments.paypalEnabled', e.target.checked)}
                       className="rounded text-blue-600 focus:ring-blue-500"
                     />
                     PayPal
                   </label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Pricing Settings */}
        <div className="space-y-6">
          <Card className="p-6 h-full">
            <div className="flex justify-between items-start mb-6">
              <SectionTitle icon={FiDollarSign} title="Tarifs Personnalisation" subtitle="Prix par zone et type" />
              <Button 
                onClick={savePricing} 
                disabled={pricingSaving || pricingLoading}
                className="bg-slate-900 text-white hover:bg-slate-800"
                size="sm"
              >
                {pricingSaving ? '...' : (pricingSaved ? 'OK' : 'Sauvegarder Tarifs')}
              </Button>
            </div>

            {pricingLoading ? (
              <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : (
              <div className="space-y-6">
                {pricingError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{pricingError}</div>}
                
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Texte seul</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Devant (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.text.front}
                        onChange={(e) => updatePricing('text', 'front', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Dos (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.text.back}
                        onChange={(e) => updatePricing('text', 'back', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Les deux (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.text.both}
                        onChange={(e) => updatePricing('text', 'both', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Image seule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Devant (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.image.front}
                        onChange={(e) => updatePricing('image', 'front', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Dos (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.image.back}
                        onChange={(e) => updatePricing('image', 'back', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Les deux (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.image.both}
                        onChange={(e) => updatePricing('image', 'both', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 border-b pb-2">Combinaison (Texte + Image)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Tout placement (€)</label>
                      <Input 
                        type="number" step="0.5"
                        value={pricing.combo.any}
                        onChange={(e) => updatePricing('combo', 'any', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
