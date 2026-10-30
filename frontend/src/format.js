export const money = (amount, currency, compact = false) =>
  new Intl.NumberFormat('en', {
    style: 'currency', currency, maximumFractionDigits: 0,
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
  }).format(amount);
