// Fixed, documented FX rates: units of local currency per 1 USD.
// Deliberately static so numbers are reproducible. Edit here to update.
export const RATES_PER_USD = Object.freeze({
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83,
  CAD: 1.36,
  AUD: 1.52,
  SGD: 1.34,
  JPY: 150,
});

export const COUNTRIES = Object.freeze({
  'United States': 'USD',
  Germany: 'EUR',
  'United Kingdom': 'GBP',
  India: 'INR',
  Canada: 'CAD',
  Australia: 'AUD',
  Singapore: 'SGD',
  Japan: 'JPY',
});

export function toUsd(amount, currency) {
  const rate = RATES_PER_USD[currency];
  if (!rate) throw new Error(`Unsupported currency: ${currency}`);
  return amount / rate;
}
