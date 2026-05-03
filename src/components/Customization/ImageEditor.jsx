import React, { useMemo, useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const cropToBlobUrl = async (imgEl, crop) => {
  const scaleX = imgEl.naturalWidth / imgEl.width;
  const scaleY = imgEl.naturalHeight / imgEl.height;

  const pixelCrop = {
    x: Math.round((crop.x || 0) * scaleX),
    y: Math.round((crop.y || 0) * scaleY),
    width: Math.round((crop.width || 0) * scaleX),
    height: Math.round((crop.height || 0) * scaleY),
  };

  const w = clamp(pixelCrop.width, 1, imgEl.naturalWidth);
  const h = clamp(pixelCrop.height, 1, imgEl.naturalHeight);
  const x = clamp(pixelCrop.x, 0, imgEl.naturalWidth - w);
  const y = clamp(pixelCrop.y, 0, imgEl.naturalHeight - h);

  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imgEl, x, y, w, h, 0, 0, w, h);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  if (!blob) return null;
  return URL.createObjectURL(blob);
};

const ImageEditor = ({ src, onConfirm, onCancel }) => {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [saving, setSaving] = useState(false);

  const info = useMemo(() => {
    const c = completedCrop || crop;
    if (!c) return null;
    return {
      x: Math.round(Number(c.x) || 0),
      y: Math.round(Number(c.y) || 0),
      w: Math.round(Number(c.width) || 0),
      h: Math.round(Number(c.height) || 0),
      unit: c.unit || '%',
    };
  }, [completedCrop, crop]);

  const handleConfirm = async () => {
    const imgEl = imgRef.current;
    if (!imgEl || !completedCrop || !completedCrop.width || !completedCrop.height) return;
    setSaving(true);
    try {
      const nextUrl = await cropToBlobUrl(imgEl, completedCrop);
      if (nextUrl) onConfirm?.(nextUrl);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cz-image-editor-overlay" role="dialog" aria-modal="true">
      <div className="cz-image-editor-modal">
        <div className="cz-image-editor-header">
          <div className="cz-image-editor-title">Recadrer l&apos;image</div>
          <div className="cz-image-editor-actions">
            <button type="button" className="cz-ie-btn cz-ie-btn-ghost" onClick={onCancel} disabled={saving}>
              Annuler
            </button>
            <button type="button" className="cz-ie-btn cz-ie-btn-primary" onClick={handleConfirm} disabled={saving}>
              {saving ? '...' : 'Confirmer'}
            </button>
          </div>
        </div>

        <div className="cz-image-editor-body">
          <ReactCrop crop={crop} onChange={(_, pc) => setCrop(pc)} onComplete={(c) => setCompletedCrop(c)}>
            <img ref={imgRef} alt="Aperçu" src={src} className="cz-image-editor-img" />
          </ReactCrop>
        </div>

        {info && (
          <div className="cz-image-editor-info">
            <span>X {info.x}{info.unit}</span>
            <span>Y {info.y}{info.unit}</span>
            <span>L {info.w}{info.unit}</span>
            <span>H {info.h}{info.unit}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;

