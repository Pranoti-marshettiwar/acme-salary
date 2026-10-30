import { validateEmployee } from '../domain/validation.js';
import { buildInsights } from './insightsService.js';
import { NotFoundError, ValidationError } from '../errors.js';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

const toInt = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function createEmployeeService(repo) {
  let insightsCache = null; // invalidated on every write; analytics are cheap at this scale

  const invalidate = () => { insightsCache = null; };
  const requireValid = (input) => {
    const { errors, value } = validateEmployee(input);
    if (Object.keys(errors).length) throw new ValidationError(errors);
    return value;
  };

  return {
    async list(query = {}) {
      const page = toInt(query.page, 1);
      const pageSize = Math.min(toInt(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
      const { rows, total } = await repo.list({
        q: (query.q || '').trim() || undefined,
        country: query.country || undefined,
        department: query.department || undefined,
        sortBy: query.sortBy,
        order: query.order === 'desc' ? 'desc' : 'asc',
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      return { items: rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },

    async get(id) {
      const found = await repo.findById(id);
      if (!found) throw new NotFoundError();
      return found;
    },

    async create(input) {
      const value = requireValid(input);
      const id = await repo.insert(value);
      invalidate();
      return { id, ...value };
    },

    async update(id, input) {
      const value = requireValid(input);
      if (!(await repo.update(id, value))) throw new NotFoundError();
      invalidate();
      return { id, ...value };
    },

    async remove(id) {
      if (!(await repo.remove(id))) throw new NotFoundError();
      invalidate();
    },

    async insights() {
      if (!insightsCache) insightsCache = buildInsights(await repo.listSalaryRows());
      return insightsCache;
    },
  };
}
