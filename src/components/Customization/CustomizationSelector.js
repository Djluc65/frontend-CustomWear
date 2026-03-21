import React, { useEffect, useMemo, useState } from 'react';
import { FiType, FiImage } from 'react-icons/fi';
import { customizationPricingAPI } from '../../services/api';
import './CustomizationComponents.css';

export default function CustomizationSelector({ baseModelPrice = 0, onTotals, selection }) {
  const [textFront,  setTextFront]  = useState(false);
  const [textBack,   setTextBack]   = useState(false);
  const [imageFront, setImageFront] = useState(false);
  const [imageBack,  setImageBack]  = useState(false);

  const [grid,     setGrid]    = useState({ text: {}, image: {}, combo: {} });
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [animated, setAnimated] = useState(false);

  /* ── Fetch pricing grid ── */
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
        console.error('[CustomizationSelector] getGrid error', err?.response?.data || err);
        if (mounted) setError('Impossible de charger la grille tarifaire');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  /* ── Sync with canvas selection ── */
  useEffect(() => {
    if (!selection) return;
    setTextFront( Boolean(selection.textFront  ?? selection?.text?.front));
    setTextBack(  Boolean(selection.textBack   ?? selection?.text?.back));
    setImageFront(Boolean(selection.imageFront ?? selection?.image?.front));
    setImageBack( Boolean(selection.imageBack  ?? selection?.image?.back));
  }, [selection]);

  /* ── Computed placements ── */
  const textPlacement  = useMemo(() =>
    textFront && textBack ? 'both' : textFront ? 'front' : textBack ? 'back' : null,
    [textFront, textBack]);

  const imagePlacement = useMemo(() =>
    imageFront && imageBack ? 'both' : imageFront ? 'front' : imageBack ? 'back' : null,
    [imageFront, imageBack]);

  /* ── Prices ── */
  const textPrice  = useMemo(() => textPlacement  ? (grid.text[textPlacement]   ?? 0) : 0, [grid, textPlacement]);
  const imagePrice = useMemo(() => imagePlacement ? (grid.image[imagePlacement] ?? 0) : 0, [grid, imagePlacement]);

  const comboSelected = useMemo(() => Boolean(textPlacement && imagePlacement), [textPlacement, imagePlacement]);
  const comboPrice    = useMemo(() => grid?.combo?.any ?? null, [grid]);

  const savingsText = useMemo(() => {
    if (textPlacement !== 'both') return 0;
    return Math.max(0, (grid.text.front ?? 0) + (grid.text.back ?? 0) - (grid.text.both ?? 0));
  }, [grid, textPlacement]);

  const savingsImage = useMemo(() => {
    if (imagePlacement !== 'both') return 0;
    return Math.max(0, (grid.image.front ?? 0) + (grid.image.back ?? 0) - (grid.image.both ?? 0));
  }, [grid, imagePlacement]);

  const customizationPrice = useMemo(() => {
    const sum = textPrice + imagePrice;
    if (comboSelected && typeof comboPrice === 'number') return Number(comboPrice.toFixed(2));
    return Number(sum.toFixed(2));
  }, [textPrice, imagePrice, comboSelected, comboPrice]);

  const grandTotal = useMemo(() =>
    Number(((Number(baseModelPrice) || 0) + customizationPrice).toFixed(2)),
    [baseModelPrice, customizationPrice]);

  /* ── Pulse animation on price change ── */
  useEffect(() => {
    setAnimated(true);
    const t = setTimeout(() => setAnimated(false), 200);
    return () => clearTimeout(t);
  }, [customizationPrice, grandTotal]);

  /* ── Emit totals upward ── */
  useEffect(() => {
    if (!onTotals) return;
    onTotals({ customizationPrice, baseModelPrice: Number(baseModelPrice) || 0, grandTotal });
  }, [customizationPrice, baseModelPrice, grandTotal]);

  const toggle = (setter) => setter(v => !v);

  return (
    <div className="cc-panel">
      <h3 className="cc-panel-title">Sélection des personnalisations</h3>

      {loading && <p className="cc-loading">Chargement…</p>}
      {error   && <p className="cc-error">{error}</p>}

      {/* ── Text row ── */}
      <div className="cc-option-row" role="group" aria-label="Texte">
        <span className="cc-row-icon"><FiType /></span>

        <button
          className={`cc-chip ${textFront ? 'active' : ''}`}
          onClick={() => toggle(setTextFront)}
          aria-pressed={textFront}
        >
          Texte avant
        </button>

        <button
          className={`cc-chip ${textBack ? 'active' : ''}`}
          onClick={() => toggle(setTextBack)}
          aria-pressed={textBack}
        >
          Texte arrière
        </button>

        <span className="cc-row-price" aria-label="Prix texte">
          {textPrice.toFixed(2)} €
        </span>
      </div>

      {/* ── Image row ── */}
      <div className="cc-option-row" role="group" aria-label="Image">
        <span className="cc-row-icon"><FiImage /></span>

        <button
          className={`cc-chip ${imageFront ? 'active' : ''}`}
          onClick={() => toggle(setImageFront)}
          aria-pressed={imageFront}
        >
          Image avant
        </button>

        <button
          className={`cc-chip ${imageBack ? 'active' : ''}`}
          onClick={() => toggle(setImageBack)}
          aria-pressed={imageBack}
        >
          Image arrière
        </button>

        <span className="cc-row-price" aria-label="Prix image">
          {imagePrice.toFixed(2)} €
        </span>
      </div>

      {/* ── Savings notice ── */}
      {(savingsText > 0 || savingsImage > 0) && (
        <div className="cc-savings">
          🎉 Vous économisez {(savingsText + savingsImage).toFixed(2)} € en choisissant avant + arrière
        </div>
      )}

      {/* ── Combo notice ── */}
      {comboSelected && typeof comboPrice === 'number' && (
        <div className="cc-combo-notice">
          ✨ Offre combinée Texte + Image appliquée : {Number(comboPrice).toFixed(2)} €
        </div>
      )}

      {/* ── Totals ── */}
      <div className="cc-totals">
        <div className="cc-total-item">
          <span className="cc-total-label">Personnalisation</span>
          <span className={`cc-total-value ${animated ? 'pulse' : ''}`}>
            {customizationPrice.toFixed(2)} €
          </span>
        </div>
        <div className="cc-total-item">
          <span className="cc-total-label">Total (modèle + perso)</span>
          <span className={`cc-total-value ${animated ? 'pulse' : ''}`}>
            {grandTotal.toFixed(2)} €
          </span>
        </div>
      </div>
    </div>
  );
}