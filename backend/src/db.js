import fs from 'node:fs';
import mysql from 'mysql2/promise';

export function createPool(dbConfig) {
  const base = { waitForConnections: true, connectionLimit: 10, decimalNumbers: true, dateStrings: true };
  return dbConfig.uri ? mysql.createPool({ uri: dbConfig.uri, ...base }) : mysql.createPool({ ...dbConfig, ...base });
}

export async function migrate(pool) {
  const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
}
