/** Linear-interpolated percentile (p in 0..100) of a sorted ascending array. */
export function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100);

export function summarize(values) {
  if (values.length === 0) {
    return { count: 0, min: null, p25: null, median: null, mean: null, p75: null, max: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    min: round2(sorted[0]),
    p25: round2(percentile(sorted, 25)),
    median: round2(percentile(sorted, 50)),
    mean: round2(sum / sorted.length),
    p75: round2(percentile(sorted, 75)),
    max: round2(sorted[sorted.length - 1]),
  };
}

/** Group items by keyFn and summarize valueFn for each group, sorted by key. */
export function summarizeBy(items, keyFn, valueFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(valueFn(item));
  }
  return [...groups.entries()]
    .map(([key, values]) => ({ key, ...summarize(values) }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Fixed-width histogram. Returns [{ from, to, count }]. */
export function histogram(values, bucketSize) {
  if (values.length === 0 || bucketSize <= 0) return [];
  let max = values[0];
  for (const v of values) if (v > max) max = v;
  const bucketCount = Math.floor(max / bucketSize) + 1;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    from: i * bucketSize, to: (i + 1) * bucketSize, count: 0,
  }));
  for (const v of values) buckets[Math.floor(v / bucketSize)].count += 1;
  return buckets;
}
