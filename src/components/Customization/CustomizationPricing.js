import React, { useEffect, useState } from 'react';
import { FiType, FiImage, FiTag } from 'react-icons/fi';
import { customizationPricingAPI } from '../../services/api';
import './CustomizationComponents.css';

const fmt = (v) => (v !== undefined && v !== null ? `${Number(v).toFixed(2)} €` : '—');

export default function CustomizationPricing() {
  const [grid,    setGrid]    = useState({ text: {}, image: {}, combo: {} });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    customizationPricingAPI.getGrid()
      .then(res => {
        const items = res?.data?.data || [];
        const next  = { text: {}, image: {}, combo: {} };
        items.forEach(it => { if (next[it.type]) next[it.type][it.placement] = it.price; });
        if (mounted) setGrid(next);
      })
      .catch(err => {
        console.error('[CustomizationPricing] getGrid error', err?.response?.data || err);
        if (mounted) setError('Impossible de charger la grille tarifaire');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="cc-panel">
      <h3 className="cc-panel-title">Tarification des personnalisations</h3>

      {loading && <p className="cc-loading">Chargement…</p>}
      {error   && <p className="cc-error">{error}</p>}

      {!loading && !error && (
        <>
          {/* ── Pricing table ── */}
          <table className="cc-pricing-table" aria-label="Grille tarifaire">
            <thead>
              <tr>
                <th>Type</th>
                <th>Avant</th>
                <th>Arrière</th>
                <th>Avant + Arrière</th>
              </tr>
            </thead>
            <tbody>
              {/* Text row */}
              <tr>
                <td>
                  <div className="cc-type-cell">
                    <span className="cc-type-icon"><FiType /></span>
                    Texte
                  </div>
                </td>
                <td className="cc-price-cell">{fmt(grid.text.front)}</td>
                <td className="cc-price-cell">{fmt(grid.text.back)}</td>
                <td className="cc-price-cell">{fmt(grid.text.both)}</td>
              </tr>

              {/* Image row */}
              <tr>
                <td>
                  <div className="cc-type-cell">
                    <span className="cc-type-icon"><FiImage /></span>
                    Image
                  </div>
                </td>
                <td className="cc-price-cell">{fmt(grid.image.front)}</td>
                <td className="cc-price-cell">{fmt(grid.image.back)}</td>
                <td className="cc-price-cell">{fmt(grid.image.both)}</td>
              </tr>

              {/* Combo row */}
              <tr>
                <td>
                  <div className="cc-type-cell">
                    <span className="cc-type-icon"><FiTag /></span>
                    Texte + Image
                  </div>
                </td>
                <td colSpan={3} className="cc-price-cell" style={{ textAlign: 'center' }}>
                  {fmt(grid.combo.any)} (tous placements)
                </td>
              </tr>
            </tbody>
          </table>

          {/* Hint */}
          <p className="cc-hint">
            💡 Les tarifs « Avant + Arrière » et l'offre combinée « Texte + Image » sont avantageux.
          </p>
        </>
      )}
    </div>
  );
}