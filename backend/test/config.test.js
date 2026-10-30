import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('defaults to local MySQL without TLS', () => {
  const c = loadConfig({});
  assert.equal(c.db.host, '127.0.0.1');
  assert.equal(c.db.ssl, undefined);
  assert.equal(c.port, 4000);
});

test('DATABASE_URL takes precedence and DB_SSL=true enables TLS', () => {
  const c = loadConfig({ DATABASE_URL: 'mysql://u:p@h:3306/d', DB_SSL: 'true', PORT: '8080' });
  assert.equal(c.db.uri, 'mysql://u:p@h:3306/d');
  assert.equal(c.db.ssl.minVersion, 'TLSv1.2');
  assert.equal(c.port, 8080);
});
