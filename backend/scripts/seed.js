import { loadConfig } from '../src/config.js';
import { createPool, migrate } from '../src/db.js';
import { generateEmployees } from './generate.js';

const COUNT = Number(process.argv[2]) || 10_000;
const BATCH = 1_000;

const pool = createPool(loadConfig().db);
await migrate(pool);
await pool.query('TRUNCATE TABLE employees'); // idempotent: re-running yields the same dataset

const started = Date.now();
const employees = generateEmployees(COUNT);
for (let i = 0; i < employees.length; i += BATCH) {
  const values = employees.slice(i, i + BATCH).map((e) =>
    [e.fullName, e.email, e.country, e.department, e.jobTitle, e.currency, e.salary, e.hireDate]);
  await pool.query(
    'INSERT INTO employees (full_name, email, country, department, job_title, currency, salary, hire_date) VALUES ?',
    [values],
  );
}
console.log(`Seeded ${COUNT} employees in ${Date.now() - started} ms`);
await pool.end();
