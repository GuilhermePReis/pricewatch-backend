// PriceWatch — utils/format.js

export function formatPrice(value, currency = 'BRL') {
  if (value == null || isNaN(value)) return '--';
  const val = parseFloat(value);
  if (currency === 'BRL') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (currency === 'USD') return `USD ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${val.toFixed(2)} ${currency}`;
}

export function formatVolume(v) {
  if (!v) return '--';
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

export function formatPct(v) {
  if (v == null) return '--';
  const val = parseFloat(v);
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}
