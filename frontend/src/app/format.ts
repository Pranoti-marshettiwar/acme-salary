export function money(amount: number, currency: string, compact = false): string {
  return new Intl.NumberFormat('en', {
    style: 'currency', currency, maximumFractionDigits: 0,
    ...(compact ? { notation: 'compact' as const, maximumFractionDigits: 1 } : {}),
  }).format(amount);
}

/** Position of a value along a 0..domainMax axis, as a CSS percentage string. */
export function pct(value: number, domainMax: number): string {
  return `${Math.max(0, Math.min(100, (value / domainMax) * 100))}%`;
}
