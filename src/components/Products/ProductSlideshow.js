import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ProductSlideshow.css';

export default function ProductSlideshow({
  images = [],
  startIndex = 0,
  autoPlay = true,
  interval = 3000,
  transition = 'fade',
  onIndexChange,
}) {
  const [current, setCurrent] = useState(Math.max(0, Math.min(startIndex, Math.max(0, images.length - 1))));
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const timerRef = useRef(null);

  const safeImages = useMemo(() => Array.isArray(images) ? images : [], [images]);

  const getImageUrl = (img) => {
    if (!img) return '/api/placeholder/800/800';
    return typeof img === 'string' ? img : (img.url || '/api/placeholder/800/800');
  };

  useEffect(() => {
    // Synchroniser si le startIndex change (ex: vignettes cliquées)
    if (typeof startIndex === 'number' && startIndex !== current) {
      setCurrent(Math.max(0, Math.min(startIndex, Math.max(0, safeImages.length - 1))));
    }
  }, [startIndex, safeImages.length]);

  useEffect(() => {
    // Auto-play gestion
    if (isPlaying && safeImages.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % safeImages.length);
      }, interval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, interval, safeImages.length]);

  useEffect(() => {
    if (typeof onIndexChange === 'function') {
      onIndexChange(current);
    }
  }, [current, onIndexChange]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % Math.max(1, safeImages.length));
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + Math.max(1, safeImages.length)) % Math.max(1, safeImages.length));
  };

  const togglePlay = () => setIsPlaying((p) => !p);

  if (safeImages.length === 0) {
    return (
      <div className="slideshow empty">
        <img src={getImageUrl(null)} alt="Aperçu indisponible" />
      </div>
    );
  }

  return (
    <div className={`slideshow ${transition}`}>
      <div className="slides">
        {safeImages.map((img, idx) => (
          <div key={idx} className={`slide ${idx === current ? 'active' : ''}`}>
            <img src={getImageUrl(img)} alt={`Image ${idx + 1}`} />
          </div>
        ))}
      </div>

      <div className="slideshow-controls">
        <button className="control-btn" onClick={prev} aria-label="Précédent">◀</button>
        <button className="control-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Lecture'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="control-btn" onClick={next} aria-label="Suivant">▶</button>
      </div>

      <div className="slideshow-indicator">
        <span className="count">{current + 1} / {safeImages.length}</span>
        <div className="dots">
          {safeImages.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Aller à l'image ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}