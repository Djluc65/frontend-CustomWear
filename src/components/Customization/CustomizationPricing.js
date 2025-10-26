import React, { useEffect, useState } from 'react';
import { FiType, FiImage } from 'react-icons/fi';
import { customizationPricingAPI } from '../../services/api';

const typeLabel = {
  text: 'Texte',
  image: 'Image',
  combo: 'Texte + Image',
};
const placementLabel = {
  front: 'Avant',
  back: 'Arrière',
  both: 'Avant + Arrière',
  any: 'N’importe quel côté',
};

export default function CustomizationPricing() {
  const [grid, setGrid] = useState({ text: {}, image: {}, combo: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    customizationPricingAPI.getGrid()
      .then((res) => {
        const items = res?.data?.data || [];
        const next = { text: {}, image: {}, combo: {} };
        items.forEach((it) => {
          if (next[it.type]) next[it.type][it.placement] = it.price;
        });
        if (mounted) setGrid(next);
      })
      .catch((err) => {
        console.error('[CustomizationPricing] getGrid error', err?.response?.data || err);
        setError('Impossible de charger la grille tarifaire');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div > 
      {/* <h3>Tarification des personnalisations</h3>
      {loading && <p>Chargement…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      <div className="pricing-table">
        <div className="pricing-row">
          <div className="pricing-type"><FiType aria-hidden /> {typeLabel.text}</div>
          <div className="pricing-cell">{placementLabel.front}</div>
          <div className="pricing-cell">{placementLabel.back}</div>
          <div className="pricing-cell">{placementLabel.both}</div>
        </div>
        <div className="pricing-row">
          <div className="pricing-type muted">Prix (EUR)</div>
          <div className="pricing-cell price">{grid.text.front ?? '—'} €</div>
          <div className="pricing-cell price">{grid.text.back ?? '—'} €</div>
          <div className="pricing-cell price">{grid.text.both ?? '—'} €</div>
        </div>
        <div className="pricing-row">
          <div className="pricing-type"><FiImage aria-hidden /> {typeLabel.image}</div>
          <div className="pricing-cell">{placementLabel.front}</div>
          <div className="pricing-cell">{placementLabel.back}</div>
          <div className="pricing-cell">{placementLabel.both}</div>
        </div>
        <div className="pricing-row">
          <div className="pricing-type muted">Prix (EUR)</div>
          <div className="pricing-cell price">{grid.image.front ?? '—'} €</div>
          <div className="pricing-cell price">{grid.image.back ?? '—'} €</div>
          <div className="pricing-cell price">{grid.image.both ?? '—'} €</div>
        </div>
        <div className="pricing-row">
          <div className="pricing-type">{typeLabel.combo}</div>
          <div className="pricing-cell" colSpan={2}>{placementLabel.any}</div>
          <div className="pricing-cell price">{grid.combo.any ?? '—'} €</div>
        </div>
      </div>
      <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
        Astuce: les tarifs “Avant + Arrière” et “Texte + Image” sont avantageux.
      </p> */}
    </div>
  );
}