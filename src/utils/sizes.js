// Utilitaire de tri des tailles selon ordre global
export const SIZE_ORDER = ['xs','s','m','l','xl','2xl','3xl','4xl','5xl','taille universelle'];

export const sizeIndex = (value) => {
  const v = String(value || '').toLowerCase();
  const idx = SIZE_ORDER.indexOf(v);
  return idx === -1 ? Number.POSITIVE_INFINITY : idx;
};

export const compareSizes = (a, b) => {
  return sizeIndex(a) - sizeIndex(b);
};

export const sortSizes = (arr) => {
  const list = Array.isArray(arr) ? arr.slice() : [];
  return list.sort(compareSizes);
};
