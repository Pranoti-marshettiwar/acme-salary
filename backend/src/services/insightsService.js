import { toUsd } from '../domain/fx.js';
import { summarize, summarizeBy, histogram } from '../domain/stats.js';

const BUCKET_USD = 25_000;
const TOP_N = 10;
const MIN_GROUP_FOR_TITLE = 5;

/**
 * Builds the HR insights payload from narrow salary rows.
 * rows: [{ id, fullName, country, department, jobTitle, currency, salary }]
 * Org-wide and cross-country comparisons use USD; by-country uses local currency.
 */
export function buildInsights(rows) {
  const withUsd = rows.map((r) => ({ ...r, usd: toUsd(r.salary, r.currency) }));

  const currencyOf = new Map(withUsd.map((r) => [r.country, r.currency]));
  const byCountry = summarizeBy(withUsd, (r) => r.country, (r) => r.salary)
    .map((g) => ({ ...g, currency: currencyOf.get(g.key) }));

  const byJobTitle = summarizeBy(withUsd, (r) => `${r.department} / ${r.jobTitle}`, (r) => r.usd)
    .filter((g) => g.count >= MIN_GROUP_FOR_TITLE);

  const topPaid = [...withUsd]
    .sort((a, b) => b.usd - a.usd || a.id - b.id)
    .slice(0, TOP_N)
    .map((r) => ({
      id: r.id, fullName: r.fullName, country: r.country, department: r.department,
      jobTitle: r.jobTitle, salaryUsd: Math.round(r.usd * 100) / 100,
    }));

  return {
    currency: 'USD',
    organization: summarize(withUsd.map((r) => r.usd)),
    byCountry,
    byDepartment: summarizeBy(withUsd, (r) => r.department, (r) => r.usd),
    byJobTitle,
    distribution: histogram(withUsd.map((r) => r.usd), BUCKET_USD),
    topPaid,
  };
}
