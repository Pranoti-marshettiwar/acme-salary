import path from 'node:path';
import { loadConfig } from './config.js';
import { createPool, migrate } from './db.js';
import { createEmployeeRepository } from './repositories/employeeRepository.js';
import { createEmployeeService } from './services/employeeService.js';
import { createApp } from './app.js';

const config = loadConfig();
const pool = createPool(config.db);
await migrate(pool);

const app = createApp({
  employeeService: createEmployeeService(createEmployeeRepository(pool)),
  staticDir: path.resolve(config.staticDir),
});
app.listen(config.port, () => console.log(`API listening on :${config.port}`));
