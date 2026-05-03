import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag } from 'react-icons/fi';
import { updateQuantity, removeFromCart, clearCart } from '../store/slices/cartSlice';
import CustomizationPreview from '../components/CustomizationPreview';
import './Cart.css';

const TrashIcon = () => (
  <svg className="cart-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const MinusIcon = () => (
  <svg className="cart-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PlusIcon = () => (
  <svg className="cart-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const hasCustom = (item) =>
  (item?.customization?.textLayers?.length > 0) ||
  Boolean(item?.customization?.image?.url);

const getItemTotal = (item) => {
  const qty = Number(item.quantity || 1);
  if (item?.customization?.totals?.grandTotal !== undefined)
    return Number(item.customization.totals.grandTotal) * qty;
  if (item?.customization?.totals)
    return (
      Number(item.customization.totals.baseModelPrice || 0) +
      Number(item.customization.totals.customizationPrice || 0)
    ) * qty;
  return Number(item.price || 0) * qty;
};

const getUnitPrice = (item) => {
  if (item?.customization?.totals?.grandTotal !== undefined)
    return Number(item.customization.totals.grandTotal);
  if (item?.customization?.totals)
    return (
      Number(item.customization.totals.baseModelPrice || 0) +
      Number(item.customization.totals.customizationPrice || 0)
    );
  return Number(item.price || 0);
};

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

/* ── Thumbnail ── */
const ItemThumb = ({ item }) => (
  <div className="ci-thumb">
    {hasCustom(item) ? (
      <CustomizationPreview item={item} size="sm" showSide="front" />
    ) : item.image ? (
      <img src={item.image} alt={item.name} />
    ) : (
      <span className="ci-thumb-icon">🧥</span>
    )}
  </div>
);

/* ── Quantité ── */
const QtyControl = ({ item, onChange, small }) => (
  <div className={`ci-qty${small ? ' ci-qty--sm' : ''}`}>
    <button type="button" onClick={() => onChange(item.id, item.quantity - 1)} aria-label="Diminuer">
      <MinusIcon />
    </button>
    <span>{item.quantity}</span>
    <button type="button" onClick={() => onChange(item.id, item.quantity + 1)} aria-label="Augmenter">
      <PlusIcon />
    </button>
  </div>
);

/* ── Badges ── */
const Badges = ({ item, small }) => (
  <>
    {hasCustom(item) && (
      <span className={`ci-badge ci-badge--custom${small ? ' ci-badge--sm' : ''}`}>
        🎨{small ? '' : ' Personnalisé'}
      </span>
    )}
    {item?.discountPercentage > 0 && (
      <span className={`ci-badge ci-badge--promo${small ? ' ci-badge--sm' : ''}`}>
        −{item.discountPercentage}%
      </span>
    )}
  </>
);

/* ── Aperçu personnalisation avec toggle ── */
const ChevronIcon = ({ open }) => (
  <svg className="cart-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CustPreviewToggle = ({ item }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="ci-cust-block">
      <button
        type="button"
        className="ci-cust-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="ci-cust-label">🎨 Voir l'aperçu personnalisé</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="ci-cust-content">
          <CustomizationPreview item={item} size="md" showSide="both" />
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   CART PAGE
══════════════════════════════════════════ */
const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, itemCount } = useSelector((s) => s.cart);

  const modelTotal = items.reduce((s, item) => {
    const qty = Number(item.quantity || 1);
    const base = typeof item?.customization?.totals?.baseModelPrice === 'number'
      ? item.customization.totals.baseModelPrice
      : Number(item.price || 0);
    return s + base * qty;
  }, 0);

  const customTotal = items.reduce((s, item) => {
    const qty = Number(item.quantity || 1);
    const c = typeof item?.customization?.totals?.customizationPrice === 'number'
      ? item.customization.totals.customizationPrice : 0;
    return s + c * qty;
  }, 0);

  const handleQty = (id, qty) => {
    if (qty <= 0) dispatch(removeFromCart(id));
    else dispatch(updateQuantity({ id, quantity: qty }));
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon"><FiShoppingBag /></div>
        <h2>Votre panier est vide</h2>
        <p>Découvrez nos produits et ajoutez-les à votre panier</p>
        <button className="cart-btn cart-btn--primary" onClick={() => navigate('/products')}>
          Commencer mes achats
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">

      <header className="cart-header">
        <h1>Mon panier</h1>
        <span className="cart-header-count">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
      </header>

      <div className="cart-layout">

        {/* ─── LISTE ─── */}
        <section className="cart-items">

          {items.map((item, idx) => (
            <motion.article
              key={item.id}
              className="ci"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.055 }}
            >
              {/* ════════ DESKTOP (≥ 769px) ════════ */}
              <div className="ci-desk">
                <ItemThumb item={item} />

                <div className="ci-body">
                  <div className="ci-body-top">
                    {/* Infos */}
                    <div className="ci-info">
                      <p className="ci-name">{item.name}</p>
                      <div className="ci-meta">
                        {item.color && <span>{item.color}</span>}
                        {item.color && item.size && <span className="ci-sep">·</span>}
                        {item.size && <span>{item.size}</span>}
                      </div>
                      <div className="ci-badges-row">
                        <Badges item={item} />
                      </div>
                    </div>

                    {/* Prix + suppression */}
                    <div className="ci-right">
                      <p className="ci-total">{fmt(getItemTotal(item))}</p>
                      <button className="ci-del" type="button"
                        onClick={() => dispatch(removeFromCart(item.id))}
                        aria-label="Supprimer l'article">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  {/* Quantité + unité */}
                  <div className="ci-body-bottom">
                    <QtyControl item={item} onChange={handleQty} />
                    {item.quantity > 1 && (
                      <span className="ci-unit">{fmt(getUnitPrice(item))} / unité</span>
                    )}
                    {hasCustom(item) && item?.customization?.technique && (
                      <span className="ci-technique">🖨 {item.customization.technique}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ════════ MOBILE (≤ 768px) ════════ */}
              <div className="ci-mob">
                <ItemThumb item={item} />

                <div className="ci-mob-body">
                  <div className="ci-mob-top">
                    <div>
                      <p className="ci-name">{item.name}</p>
                      <div className="ci-meta">
                        {item.color && <span>{item.color}</span>}
                        {item.color && item.size && <span className="ci-sep">·</span>}
                        {item.size && <span>{item.size}</span>}
                        <Badges item={item} small />
                      </div>
                    </div>
                    <button className="ci-del" type="button"
                      onClick={() => dispatch(removeFromCart(item.id))}
                      aria-label="Supprimer l'article">
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="ci-mob-bottom">
                    <QtyControl item={item} onChange={handleQty} small />
                    <p className="ci-total">{fmt(getItemTotal(item))}</p>
                  </div>
                </div>
              </div>

              {/* Aperçu personnalisation — masqué par défaut */}
              {hasCustom(item) && (
                <CustPreviewToggle item={item} />
              )}

            </motion.article>
          ))}

          <div className="cart-footer-actions">
            <button className="cart-btn cart-btn--ghost" type="button"
              onClick={() => dispatch(clearCart())}>
              Vider le panier
            </button>
          </div>
        </section>

        {/* ─── RÉSUMÉ ─── */}
        <aside className="cart-summary">
          <h2>Résumé</h2>

          <dl className="cart-summary-lines">
            <div className="cart-summary-row">
              <dt>Articles</dt>
              <dd>{fmt(modelTotal)}</dd>
            </div>
            {customTotal > 0 && (
              <div className="cart-summary-row">
                <dt>Personnalisation</dt>
                <dd className="cart-summary-extra">+{fmt(customTotal)}</dd>
              </div>
            )}
            <div className="cart-summary-row cart-summary-row--muted">
              <dt>Livraison</dt>
              <dd>Calculée ensuite</dd>
            </div>
          </dl>

          <div className="cart-summary-total">
            <span>Total estimé</span>
            <strong>{fmt(modelTotal + customTotal)}</strong>
          </div>

          <button className="cart-btn cart-btn--primary cart-btn--block"
            onClick={() => navigate('/checkout')}>
            Procéder au paiement
          </button>
          <button className="cart-btn cart-btn--outline cart-btn--block"
            onClick={() => navigate('/products')}>
            Continuer mes achats
          </button>
        </aside>

      </div>
    </div>
  );
};

export default Cart;