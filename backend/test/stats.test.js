import test from 'node:test';
import assert from 'node:assert/strict';
import { percentile, summarize, summarizeBy, histogram } from '../src/domain/stats.js';

test('percentile interpolates between ranks', () => {
  assert.equal(percentile([10, 20, 30, 40], 50), 25);
  assert.equal(percentile([10, 20, 30, 40], 0), 10);
  assert.equal(percentile([10, 20, 30, 40], 100), 40);
});

test('percentile handles empty and single-value input', () => {
  assert.equal(percentile([], 50), null);
  assert.equal(percentile([7], 90), 7);
});

test('summarize computes min, median, mean, max regardless of input order', () => {
  const s = summarize([30, 10, 20]);
  assert.deepEqual(s, { count: 3, min: 10, p25: 15, median: 20, mean: 20, p75: 25, max: 30 });
});

test('summarize of nothing returns zero count and null stats', () => {
  assert.equal(summarize([]).count, 0);
  assert.equal(summarize([]).median, null);
});

test('summarize does not mutate its input', () => {
  const input = [3, 1, 2];
  summarize(input);
  assert.deepEqual(input, [3, 1, 2]);
});

test('summarizeBy groups and sorts by key', () => {
  const rows = [{ k: 'b', v: 2 }, { k: 'a', v: 1 }, { k: 'a', v: 3 }];
  const out = summarizeBy(rows, (r) => r.k, (r) => r.v);
  assert.deepEqual(out.map((g) => [g.key, g.count, g.median]), [['a', 2, 2], ['b', 1, 2]]);
});

test('histogram buckets values by fixed width', () => {
  const h = histogram([5, 10, 24, 25, 60], 25);
  assert.deepEqual(h.map((b) => b.count), [3, 1, 1]);
  assert.equal(h[2].from, 50);
});

test('histogram of nothing is empty', () => {
  assert.deepEqual(histogram([], 25), []);
});
