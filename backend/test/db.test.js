import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPoolOptions } from '../src/db.js';
import { loadConfig } from '../src/config.js';

test('TLS settings survive when a DATABASE_URL is used', () => {
  const opts = buildPoolOptions(loadConfig({ DATABASE_URL: 'mysql://u:p@h:4000/d', DB_SSL: 'true' }).db);
  assert.equal(opts.uri, 'mysql://u:p@h:4000/d');
  assert.equal(opts.ssl.minVersion, 'TLSv1.2');
  assert.equal(opts.decimalNumbers, true);
});

test('no TLS options are added unless DB_SSL=true', () => {
  const opts = buildPoolOptions(loadConfig({ DATABASE_URL: 'mysql://u:p@h:4000/d' }).db);
  assert.equal(opts.ssl, undefined);
});

test('host-style config keeps TLS too', () => {
  const opts = buildPoolOptions(loadConfig({ DB_HOST: 'h', DB_SSL: 'true' }).db);
  assert.equal(opts.host, 'h');
  assert.ok(opts.ssl);
});
