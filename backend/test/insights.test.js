import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights } from '../src/services/insightsService.js';
import { toUsd } from '../src/domain/fx.js';

const row = (id, country, currency, salary, department = 'Engineering', jobTitle = 'Engineer') =>
  ({ id, fullName: `E${id}`, country, currency, salary, department, jobTitle });

test('toUsd converts using fixed rates and rejects unknown currencies', () => {
  assert.equal(toUsd(8300, 'INR'), 100);
  assert.equal(toUsd(100, 'USD'), 100);
  assert.throws(() => toUsd(1, 'XYZ'), /Unsupported currency/);
});

test('by-country stats stay in local currency; org stats are in USD', () => {
  const out = buildInsights([
    row(1, 'India', 'INR', 8_300_000), // $100k
    row(2, 'United States', 'USD', 200_000),
  ]);
  const india = out.byCountry.find((c) => c.key === 'India');
  assert.equal(india.currency, 'INR');
  assert.equal(india.median, 8_300_000);
  assert.equal(out.organization.count, 2);
  assert.equal(out.organization.median, 150_000);
  assert.equal(out.currency, 'USD');
});

test('top paid are ranked by USD, not local amount', () => {
  const out = buildInsights([
    row(1, 'India', 'INR', 9_000_000),      // ~$108k
    row(2, 'United States', 'USD', 150_000), // $150k despite smaller number
  ]);
  assert.deepEqual(out.topPaid.map((p) => p.id), [2, 1]);
});

test('job title bands only appear for groups of 5 or more', () => {
  const few = Array.from({ length: 4 }, (_, i) => row(i, 'United States', 'USD', 100_000));
  assert.equal(buildInsights(few).byJobTitle.length, 0);
  const enough = Array.from({ length: 5 }, (_, i) => row(i, 'United States', 'USD', 100_000));
  assert.equal(buildInsights(enough).byJobTitle[0].key, 'Engineering / Engineer');
});

test('empty dataset yields empty, well-formed insights', () => {
  const out = buildInsights([]);
  assert.equal(out.organization.count, 0);
  assert.deepEqual(out.byCountry, []);
  assert.deepEqual(out.distribution, []);
});
