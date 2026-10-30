import { COUNTRIES } from '../src/domain/fx.js';
import { DEPARTMENTS } from '../src/domain/validation.js';

/** Deterministic PRNG (mulberry32) so seeds are reproducible and tests are stable. */
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav', 'Priya', 'Liam', 'Emma', 'Noah', 'Olivia', 'Hiroshi', 'Yuki', 'Lena', 'Max', 'Sofia', 'Mateo',
  'Aisha', 'Omar', 'Chloe', 'Ethan', 'Mei', 'Wei', 'Anika', 'Rohan', 'Isla', 'Jack', 'Zara', 'Kabir', 'Hana', 'Felix'];
const LAST = ['Sharma', 'Patel', 'Smith', 'Johnson', 'Tanaka', 'Sato', 'Fischer', 'Müller', 'Brown', 'Wilson', 'Nguyen',
  'Tan', 'Singh', 'Khan', 'Lee', 'Chen', 'Walker', 'Clarke', 'Rao', 'Iyer', 'Murphy', 'Schmidt', 'Kumar', 'Evans'];

// Titles per department with a seniority base multiplier.
const TITLES = {
  Engineering: [['Software Engineer', 1], ['Senior Software Engineer', 1.4], ['Staff Engineer', 1.8], ['Engineering Manager', 1.7]],
  Product: [['Product Manager', 1.2], ['Senior Product Manager', 1.55], ['Director of Product', 2.1]],
  Design: [['Product Designer', 1], ['Senior Designer', 1.3], ['Design Lead', 1.6]],
  Sales: [['Account Executive', 0.9], ['Sales Manager', 1.3], ['Sales Director', 1.9]],
  Marketing: [['Marketing Specialist', 0.8], ['Marketing Manager', 1.15], ['Head of Marketing', 1.8]],
  Finance: [['Financial Analyst', 0.9], ['Senior Accountant', 1.1], ['Finance Manager', 1.5]],
  HR: [['HR Generalist', 0.75], ['Recruiter', 0.8], ['HR Business Partner', 1.2]],
  Operations: [['Operations Analyst', 0.8], ['Operations Manager', 1.3], ['Logistics Coordinator', 0.7]],
  'Customer Support': [['Support Agent', 0.55], ['Senior Support Agent', 0.7], ['Support Team Lead', 1]],
  Legal: [['Legal Counsel', 1.4], ['Paralegal', 0.75], ['General Counsel', 2.3]],
};

// Base annual pay in USD for a 1.0 role, scaled by country cost/pay level.
const BASE_USD = 80_000;
const COUNTRY_FACTOR = {
  'United States': 1.25, Germany: 0.95, 'United Kingdom': 0.9, India: 0.3,
  Canada: 0.95, Australia: 1.0, Singapore: 1.0, Japan: 0.8,
};
const COUNTRY_WEIGHTS = [
  ['United States', 24], ['India', 28], ['Germany', 10], ['United Kingdom', 10],
  ['Canada', 6], ['Australia', 5], ['Singapore', 5], ['Japan', 12],
];
const DEPT_WEIGHTS = [
  ['Engineering', 34], ['Sales', 15], ['Customer Support', 12], ['Operations', 10], ['Product', 7],
  ['Marketing', 6], ['Finance', 6], ['Design', 4], ['HR', 3], ['Legal', 3],
];
const RATES = { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83, CAD: 1.36, AUD: 1.52, SGD: 1.34, JPY: 150 };

function weightedPick(rng, pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [item, w] of pairs) { if ((r -= w) < 0) return item; }
  return pairs[pairs.length - 1][0];
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Produces `count` valid employee records. Pure + deterministic for a given seed. */
export function generateEmployees(count, seed = 42) {
  const rng = createRng(seed);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const country = weightedPick(rng, COUNTRY_WEIGHTS);
    const department = weightedPick(rng, DEPT_WEIGHTS);
    const [jobTitle, level] = pick(rng, TITLES[department]);
    const currency = COUNTRIES[country];
    const noise = 0.85 + rng() * 0.3; // +/-15% individual variation
    const usd = BASE_USD * level * COUNTRY_FACTOR[country] * noise;
    const local = usd * RATES[currency];
    // Round to a human-looking figure: nearest 1,000 (nearest 100,000 for INR/JPY are too coarse -> 10,000).
    const step = currency === 'INR' || currency === 'JPY' ? 10_000 : 1_000;
    const salary = Math.max(step, Math.round(local / step) * step);

    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    const year = 2012 + Math.floor(rng() * 14);
    const month = 1 + Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 28);
    out.push({
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${i + 1}@acme.example`.toLowerCase().replace(/[^a-z0-9.@]/g, ''),
      country, department, jobTitle, currency, salary,
      hireDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }
  return out;
}
