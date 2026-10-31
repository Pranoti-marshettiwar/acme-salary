import fs from 'node:fs';
import mysql from 'mysql2/promise';

const POOL_DEFAULTS = { waitForConnections: true, connectionLimit: 10, decimalNumbers: true, dateStrings: true };

/** Pure: turns app config into mysql2 pool options. Keeps TLS settings for both URL and host-style configs. */
export function buildPoolOptions(dbConfig) {
  return { ...dbConfig, ...POOL_DEFAULTS };
}

export function createPool(dbConfig) {
  return mysql.createPool(buildPoolOptions(dbConfig));
}

export async function migrate(pool) {
  const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
}
