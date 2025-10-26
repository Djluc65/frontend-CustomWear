import React, { useEffect, useMemo, useState } from 'react';
import { FiType, FiImage, FiChevronRight } from 'react-icons/fi';
import { customizationPricingAPI } from '../../services/api';
import '../../pages/Customize.css';

export default function CustomizationSelector({ baseModelPrice = 0, onTotals, selection }) {
  const [textFront, setTextFront] = useState(false);
  const [textBack, setTextBack] = useState(false);
  const [imageFront, setImageFront] = useState(false);
  const [imageBack, setImageBack] = useState(false);

  const [grid, setGrid] = useState({ text: {}, image: {}, combo: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animated, setAnimated] = useState(false);

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
        console.error('[CustomizationSelector] getGrid error', err?.response?.data || err);
        setError('Impossible de charger la grille tarifaire');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Synchroniser avec la sélection réelle (texte/image ajoutés sur le modèle)
  useEffect(() => {
    if (!selection) return;
    const tf = Boolean(selection.textFront ?? selection?.text?.front);
    const tb = Boolean(selection.textBack ?? selection?.text?.back);
    const imf = Boolean(selection.imageFront ?? selection?.image?.front);
    const imb = Boolean(selection.imageBack ?? selection?.image?.back);
    setTextFront(tf);
    setTextBack(tb);
    setImageFront(imf);
    setImageBack(imb);
  }, [selection]);

  const textPlacement = useMemo(() => (textFront && textBack) ? 'both' : (textFront ? 'front' : (textBack ? 'back' : null)), [textFront, textBack]);
  const imagePlacement = useMemo(() => (imageFront && imageBack) ? 'both' : (imageFront ? 'front' : (imageBack ? 'back' : null)), [imageFront, imageBack]);

  const textPrice = useMemo(() => (textPlacement ? (grid.text[textPlacement] ?? 0) : 0), [grid, textPlacement]);
  const imagePrice = useMemo(() => (imagePlacement ? (grid.image[imagePlacement] ?? 0) : 0), [grid, imagePlacement]);

  const comboSelected = useMemo(() => Boolean(textPlacement && imagePlacement), [textPlacement, imagePlacement]);
  const comboPrice = useMemo(() => grid?.combo?.any ?? null, [grid]);

  const savingsText = useMemo(() => {
    if (textPlacement !== 'both') return 0;
    const singles = (grid.text.front ?? 0) + (grid.text.back ?? 0);
    return Math.max(0, singles - (grid.text.both ?? 0));
  }, [grid, textPlacement]);
  const savingsImage = useMemo(() => {
    if (imagePlacement !== 'both') return 0;
    const singles = (grid.image.front ?? 0) + (grid.image.back ?? 0);
    return Math.max(0, singles - (grid.image.both ?? 0));
  }, [grid, imagePlacement]);

  const customizationPrice = useMemo(() => {
    const sum = (textPrice + imagePrice) || 0;
    if (comboSelected && typeof comboPrice === 'number') return Number(comboPrice.toFixed(2));
    return Number(sum.toFixed(2));
  }, [textPrice, imagePrice, comboSelected, comboPrice]);

  const grandTotal = useMemo(() => Number(((Number(baseModelPrice) || 0) + customizationPrice).toFixed(2)), [baseModelPrice, customizationPrice]);

  useEffect(() => {
    setAnimated(true);
    const t = setTimeout(() => setAnimated(false), 180);
    return () => clearTimeout(t);
  }, [customizationPrice, grandTotal]);

  useEffect(() => {
  //   onTotals && onTotals({ customizationPrice, baseModelPrice: Number(baseModelPrice) || 0, grandTotal });
  // }, [onTotals, customizationPrice, baseModelPrice, grandTotal]);

    if (!onTotals) return;
    onTotals({ customizationPrice, baseModelPrice: Number(baseModelPrice) || 0, grandTotal });
  }, [customizationPrice, baseModelPrice, grandTotal]);

  const toggle = (setter) => setter((v) => !v);

  return (
    <div className="panel">
      <h3>Sélection des personnalisations</h3>
      {loading && <p>Chargement…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div className="options-row" role="group" aria-label="Texte">
        <span style={{ minWidth: 28, display: 'inline-flex', alignItems: 'center' }}><FiType aria-hidden /></span>
        <button className={`chip ${textFront ? 'active' : ''}`} onClick={() => toggle(setTextFront)}>Texte avant</button>
        <button className={`chip ${textBack ? 'active' : ''}`} onClick={() => toggle(setTextBack)}>Texte arrière</button>
        <FiChevronRight aria-hidden style={{ marginLeft: 'auto', color: '#9ca3af' }} />
        <span className="model-price-inline" aria-label="Prix texte">{textPrice.toFixed(2)} €</span>
      </div>

      <div className="options-row" role="group" aria-label="Image" style={{ marginTop: '0.5rem' }}>
        <span style={{ minWidth: 28, display: 'inline-flex', alignItems: 'center' }}><FiImage aria-hidden /></span>
        <button className={`chip ${imageFront ? 'active' : ''}`} onClick={() => toggle(setImageFront)}>Image avant</button>
        <button className={`chip ${imageBack ? 'active' : ''}`} onClick={() => toggle(setImageBack)}>Image arrière</button>
        <FiChevronRight aria-hidden style={{ marginLeft: 'auto', color: '#9ca3af' }} />
        <span className="model-price-inline" aria-label="Prix image">{imagePrice.toFixed(2)} €</span>
      </div>

      {(savingsText > 0 || savingsImage > 0) && (
        <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Économisez {(savingsText + savingsImage).toFixed(2)} € en choisissant avant + arrière
        </p>
      )}

      {comboSelected && typeof comboPrice === 'number' && (
        <p style={{ color: '#2563eb', fontSize: '0.85rem' }}>
          Offre combinée Texte + Image appliquée: {Number(comboPrice).toFixed(2)} €
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Prix personnalisation</div>
          <div className={`total-price ${animated ? 'pulse' : ''}`}>{customizationPrice.toFixed(2)} €</div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Total (modèle + perso)</div>
          <div className={`total-price ${animated ? 'pulse' : ''}`}>{grandTotal.toFixed(2)} €</div>
        </div>
      </div>
    </div>
  );
}