import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { AppError, ValidationError } from './errors.js';
import { COUNTRIES, RATES_PER_USD } from './domain/fx.js';
import { DEPARTMENTS } from './domain/validation.js';

const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError({ id: 'Id must be a positive integer' });
  return id;
};

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export function createApp({ employeeService: svc, staticDir }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/meta', (_req, res) =>
    res.json({ countries: COUNTRIES, departments: DEPARTMENTS, rates: RATES_PER_USD }));

  app.get('/api/employees', wrap(async (req, res) => res.json(await svc.list(req.query))));
  app.get('/api/employees/:id', wrap(async (req, res) => res.json(await svc.get(parseId(req.params.id)))));
  app.post('/api/employees', wrap(async (req, res) => res.status(201).json(await svc.create(req.body))));
  app.put('/api/employees/:id', wrap(async (req, res) =>
    res.json(await svc.update(parseId(req.params.id), req.body))));
  app.delete('/api/employees/:id', wrap(async (req, res) => {
    await svc.remove(parseId(req.params.id));
    res.status(204).end();
  }));
  app.get('/api/insights', wrap(async (_req, res) => res.json(await svc.insights())));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get('*', (_req, res) => res.sendFile(path.resolve(staticDir, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message, details: err.details });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
