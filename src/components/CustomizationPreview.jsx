import { useMemo, useState } from 'react';

const getModelImage = (item, side) => {
  const productImages = item?.product?.images;
  if (productImages && typeof productImages === 'object' && !Array.isArray(productImages)) {
    return (
      productImages?.[side] ||
      productImages?.[side === 'front' ? 'Front' : 'Back'] ||
      productImages?.front ||
      productImages?.back ||
      item?.image ||
      '/placeholder-product.jpg'
    );
  }
  if (Array.isArray(productImages) && productImages.length) {
    if (side === 'back' && productImages[1]) return productImages[1];
    const first = productImages[0];
    return (typeof first === 'string' ? first : (first?.url || first?.secure_url)) || item?.image || '/placeholder-product.jpg';
  }
  return item?.image || '/placeholder-product.jpg';
};

const CustomizationPreview = ({ item, size = 'sm', showSide = 'front' }) => {
  const [activeSide, setActiveSide] = useState(showSide === 'both' ? 'front' : showSide);

  const side = showSide === 'both' ? activeSide : showSide;
  const baseSrc = useMemo(() => getModelImage(item, side), [item, side]);

  const overlayImage = item?.customization?.image?.url;
  const overlaySide = item?.customization?.image?.side || 'front';
  const overlayVisible = item?.customization?.image?.visible ?? true;

  const textLayers = Array.isArray(item?.customization?.textLayers) ? item.customization.textLayers : [];

  const dims = useMemo(() => {
    if (size === 'sm') return { w: 52, h: 52, fontScale: 0.28 };
    return { w: 260, h: 260, fontScale: 0.8 };
  }, [size]);

  const canvasStyle = useMemo(
    () => ({
      width: size === 'sm' ? `${dims.w}px` : '100%',
      maxWidth: size === 'sm' ? `${dims.w}px` : '320px',
    }),
    [dims.w, size]
  );

  return (
    <div className={`czp czp--${size}`}>
      {showSide === 'both' && size !== 'sm' && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSide('front')}
            aria-pressed={activeSide === 'front'}
            style={{
              flex: 1,
              padding: '0.35rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid rgba(148,163,184,0.35)',
              background: activeSide === 'front' ? 'rgba(59,130,246,0.14)' : 'transparent',
              color: activeSide === 'front' ? 'var(--ct-text-title, #0f172a)' : 'var(--ct-text-secondary, #475569)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Avant
          </button>
          <button
            type="button"
            onClick={() => setActiveSide('back')}
            aria-pressed={activeSide === 'back'}
            style={{
              flex: 1,
              padding: '0.35rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid rgba(148,163,184,0.35)',
              background: activeSide === 'back' ? 'rgba(59,130,246,0.14)' : 'transparent',
              color: activeSide === 'back' ? 'var(--ct-text-title, #0f172a)' : 'var(--ct-text-secondary, #475569)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Arrière
          </button>
        </div>
      )}

      <div
        className="czp__canvas"
        style={{
          ...canvasStyle,
          position: 'relative',
          aspectRatio: '1 / 1',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.35)',
          background: '#fff',
        }}
      >
        <img
          src={baseSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          draggable={false}
        />

        {overlayImage && overlayVisible && overlaySide === side && (
          <img
            src={overlayImage}
            alt=""
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              userSelect: 'none',
              opacity: 0.98,
            }}
            draggable={false}
          />
        )}

        {textLayers
          .filter((t) => (t?.visible ?? true) && (t?.side || 'front') === side)
          .map((t) => (
            <div
              key={t.id}
              style={{
                position: 'absolute',
                left: `${t.xPercent ?? 50}%`,
                top: `${t.yPercent ?? 50}%`,
                transform: `translate(-50%, -50%) rotate(${t.rotation || 0}deg) scale(${(t.scale || 1) * (size === 'sm' ? 0.65 : 1)})`,
                opacity: t.opacity ?? 1,
                zIndex: t.zIndex ?? 3,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontFamily: t.fontFamily || 'Arial',
                  fontSize: `${Math.max(6, Math.round((t.fontSize || 28) * dims.fontScale))}px`,
                  fontWeight: t.fontWeight || 600,
                  fontStyle: t.fontStyle || 'normal',
                  letterSpacing: `${(t.letterSpacing || 0) * dims.fontScale}px`,
                  lineHeight: t.lineHeight || 1.2,
                  color: t.color || '#111827',
                  textDecoration: t.textDecoration || 'none',
                  background: t.backgroundEnabled ? (t.backgroundColor || '#fff') : 'transparent',
                  padding: t.backgroundEnabled ? `${Math.max(1, Math.round((t.padding || 4) * dims.fontScale))}px` : '0px',
                  border: t.borderEnabled
                    ? `${Math.max(1, Math.round((t.borderWidth || 1) * dims.fontScale))}px ${t.borderStyle || 'solid'} ${t.borderColor || '#000'}`
                    : 'none',
                  boxShadow: t.shadowEnabled
                    ? `${(t.shadowX || 0) * dims.fontScale}px ${(t.shadowY || 0) * dims.fontScale}px ${(t.shadowBlur || 0) * dims.fontScale}px ${
                        t.shadowColor || 'rgba(0,0,0,0.3)'
                      }`
                    : 'none',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {t.content || ''}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CustomizationPreview;
