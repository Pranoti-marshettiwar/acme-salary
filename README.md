# ACME Salary Manager

Web app for an HR manager to maintain salary records for 10,000 employees across 8 countries and to answer "how do we pay people?".
Node.js (Express) + MySQL 8 + Angular 20 (Angular Material).

- Requirements: [docs/requirements.md](docs/requirements.md)
- Design, trade-offs, performance: [docs/design.md](docs/design.md)
- How AI was used: [docs/ai-usage.md](docs/ai-usage.md)

## Run with Docker (app + MySQL)
```
docker compose up --build
docker compose exec app node scripts/seed.js     # loads 10,000 employees
open http://localhost:4000
```

## Run locally for development
```
# MySQL running locally; defaults: root / no password / db "acme_salary" (see backend/src/config.js)
cd backend && npm install && npm run seed && npm start      # API on :4000
cd frontend && npm install && npm start                     # UI on :4200 via `ng serve`, proxies /api
```
Set `DATABASE_URL=mysql://user:pass@host:3306/db` to use a hosted database.

## Tests
```
cd backend && npm test      # 32 tests, no database needed, runs in about a second
```

## Deploying
The `Dockerfile` produces one image serving API and UI. On Render/Railway/Fly: create a web service from this repo, attach a MySQL
database (Railway MySQL, PlanetScale, Aiven free tier), set `DATABASE_URL`, then run `node scripts/seed.js` once from a shell.
**No authentication in v1: do not deploy with real salary data.** The seed data is synthetic.

## API
`GET/POST /api/employees`, `GET/PUT/DELETE /api/employees/:id`, `GET /api/insights`, `GET /api/meta`.
List params: `q`, `country`, `department`, `sortBy`, `order`, `page`, `pageSize` (max 100).

## Deploying on Render + hosted MySQL
1. Create a MySQL-compatible database (e.g. TiDB Cloud Serverless or Aiven free MySQL) and copy its connection URL.
2. Render: New > Web Service > this repo > Runtime "Docker".
3. Environment variables: `DATABASE_URL=<connection url>`, `DB_SSL=true`.
4. Seed once from your machine: set the same two variables, then `cd backend && npm install && npm run seed`.
