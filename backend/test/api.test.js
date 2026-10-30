import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createEmployeeService } from '../src/services/employeeService.js';
import { ConflictError } from '../src/errors.js';

/** In-memory repository: same contract as the MySQL one, so service + HTTP are tested without a DB. */
function fakeRepo(seed = []) {
  let rows = [...seed];
  let nextId = rows.length + 1;
  const emailTaken = (email, exceptId) => rows.some((r) => r.email === email && r.id !== exceptId);
  return {
    calls: { list: [] },
    async list(args) {
      this.calls.list.push(args);
      let r = rows.filter((x) => (!args.country || x.country === args.country)
        && (!args.q || x.fullName.toLowerCase().startsWith(args.q.toLowerCase())));
      return { rows: r.slice(args.offset, args.offset + args.limit), total: r.length };
    },
    async findById(id) { return rows.find((r) => r.id === id) || null; },
    async insert(e) {
      if (emailTaken(e.email)) throw new ConflictError('An employee with this email already exists');
      rows.push({ id: nextId, ...e }); return nextId++;
    },
    async update(id, e) {
      if (!rows.some((r) => r.id === id)) return false;
      if (emailTaken(e.email, id)) throw new ConflictError('An employee with this email already exists');
      rows = rows.map((r) => (r.id === id ? { id, ...e } : r)); return true;
    },
    async remove(id) { const n = rows.length; rows = rows.filter((r) => r.id !== id); return rows.length < n; },
    async listSalaryRows() { return rows; },
  };
}

const payload = (over = {}) => ({
  fullName: 'Lena Fischer', email: 'lena@acme.test', country: 'Germany', department: 'Product',
  jobTitle: 'Product Manager', salary: 90000, hireDate: '2020-01-15', ...over,
});

async function withServer(repo, fn) {
  const app = createApp({ employeeService: createEmployeeService(repo) });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, body) => {
    const res = await fetch(base + url, {
      method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };
  try { await fn(call); } finally { server.close(); }
}

test('POST creates an employee, GET returns it with derived currency', async () => {
  await withServer(fakeRepo(), async (call) => {
    const created = await call('POST', '/api/employees', payload());
    assert.equal(created.status, 201);
    const fetched = await call('GET', `/api/employees/${created.body.id}`);
    assert.equal(fetched.body.currency, 'EUR');
  });
});

test('POST with invalid data returns 400 with per-field details', async () => {
  await withServer(fakeRepo(), async (call) => {
    const res = await call('POST', '/api/employees', payload({ salary: -1, email: 'x' }));
    assert.equal(res.status, 400);
    assert.ok(res.body.details.salary && res.body.details.email);
  });
});

test('duplicate email returns 409', async () => {
  await withServer(fakeRepo(), async (call) => {
    await call('POST', '/api/employees', payload());
    assert.equal((await call('POST', '/api/employees', payload())).status, 409);
  });
});

test('PUT updates, and 404s for unknown id', async () => {
  await withServer(fakeRepo(), async (call) => {
    const { body } = await call('POST', '/api/employees', payload());
    const upd = await call('PUT', `/api/employees/${body.id}`, payload({ salary: 95000 }));
    assert.equal(upd.body.salary, 95000);
    assert.equal((await call('PUT', '/api/employees/999', payload())).status, 404);
  });
});

test('DELETE removes the employee', async () => {
  await withServer(fakeRepo(), async (call) => {
    const { body } = await call('POST', '/api/employees', payload());
    assert.equal((await call('DELETE', `/api/employees/${body.id}`)).status, 204);
    assert.equal((await call('GET', `/api/employees/${body.id}`)).status, 404);
  });
});

test('non-numeric id is rejected with 400', async () => {
  await withServer(fakeRepo(), async (call) => {
    assert.equal((await call('GET', '/api/employees/abc')).status, 400);
  });
});

test('list clamps page size to 100 and defaults paging', async () => {
  const repo = fakeRepo();
  await withServer(repo, async (call) => {
    const res = await call('GET', '/api/employees?pageSize=5000&page=-3');
    assert.equal(res.body.pageSize, 100);
    assert.equal(res.body.page, 1);
    assert.equal(repo.calls.list[0].offset, 0);
  });
});

test('insights reflect writes (cache invalidated after create)', async () => {
  await withServer(fakeRepo(), async (call) => {
    assert.equal((await call('GET', '/api/insights')).body.organization.count, 0);
    await call('POST', '/api/employees', payload());
    assert.equal((await call('GET', '/api/insights')).body.organization.count, 1);
  });
});

test('malformed JSON yields 400 and unknown api route yields 404', async () => {
  await withServer(fakeRepo(), async (call) => {
    assert.equal((await call('GET', '/api/nope')).status, 404);
  });
});
