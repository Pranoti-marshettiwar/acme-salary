import test from 'node:test';
import assert from 'node:assert/strict';
import { generateEmployees } from '../scripts/generate.js';
import { validateEmployee } from '../src/domain/validation.js';

test('generates exactly the requested count, deterministically', () => {
  const a = generateEmployees(200, 7);
  const b = generateEmployees(200, 7);
  assert.equal(a.length, 200);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, generateEmployees(200, 8));
});

test('every generated record passes the same validation as the API', () => {
  for (const e of generateEmployees(500)) {
    assert.deepEqual(validateEmployee(e).errors, {}, JSON.stringify(e));
  }
});

test('emails are unique across a full 10,000 run', () => {
  const emails = new Set(generateEmployees(10_000).map((e) => e.email));
  assert.equal(emails.size, 10_000);
});

test('pay is realistic: US engineers out-earn Indian engineers in USD terms', () => {
  const rows = generateEmployees(10_000);
  const avgUsd = (country) => {
    const r = rows.filter((e) => e.country === country && e.department === 'Engineering');
    const rate = { 'United States': 1, India: 83 }[country];
    return r.reduce((s, e) => s + e.salary / rate, 0) / r.length;
  };
  assert.ok(avgUsd('United States') > avgUsd('India') * 2);
});
