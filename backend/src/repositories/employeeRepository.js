import { ConflictError } from '../errors.js';

const SORT_COLUMNS = {
  fullName: 'full_name', email: 'email', country: 'country', department: 'department',
  jobTitle: 'job_title', salary: 'salary', hireDate: 'hire_date',
};

const COLUMNS = `id, full_name AS fullName, email, country, department, job_title AS jobTitle,
  currency, salary, hire_date AS hireDate`;

/** Thin SQL layer. All values are parameterised; sort columns come from a whitelist. */
export function createEmployeeRepository(pool) {
  return {
    async list({ q, country, department, sortBy = 'fullName', order = 'asc', limit, offset }) {
      const where = [];
      const params = [];
      if (q) {
        // Prefix match so the name/email indexes can be used (a %contains% scan is O(n)).
        where.push('(full_name LIKE ? OR email LIKE ?)');
        params.push(`${q}%`, `${q}%`);
      }
      if (country) { where.push('country = ?'); params.push(country); }
      if (department) { where.push('department = ?'); params.push(department); }
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const col = SORT_COLUMNS[sortBy] || 'full_name';
      const dir = order === 'desc' ? 'DESC' : 'ASC';

      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM employees ${clause}`, params);
      const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM employees ${clause} ORDER BY ${col} ${dir}, id ASC LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );
      return { rows, total };
    },

    async findById(id) {
      const [rows] = await pool.query(`SELECT ${COLUMNS} FROM employees WHERE id = ?`, [id]);
      return rows[0] || null;
    },

    async insert(e) {
      try {
        const [res] = await pool.query(
          `INSERT INTO employees (full_name, email, country, department, job_title, currency, salary, hire_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [e.fullName, e.email, e.country, e.department, e.jobTitle, e.currency, e.salary, e.hireDate],
        );
        return res.insertId;
      } catch (err) { throw mapDuplicate(err); }
    },

    async update(id, e) {
      try {
        const [res] = await pool.query(
          `UPDATE employees SET full_name=?, email=?, country=?, department=?, job_title=?, currency=?, salary=?, hire_date=?
           WHERE id = ?`,
          [e.fullName, e.email, e.country, e.department, e.jobTitle, e.currency, e.salary, e.hireDate, id],
        );
        return res.affectedRows > 0;
      } catch (err) { throw mapDuplicate(err); }
    },

    async remove(id) {
      const [res] = await pool.query('DELETE FROM employees WHERE id = ?', [id]);
      return res.affectedRows > 0;
    },

    /** Narrow projection for analytics: avoids pulling unused columns for 10k rows. */
    async listSalaryRows() {
      const [rows] = await pool.query(
        'SELECT id, full_name AS fullName, country, department, job_title AS jobTitle, currency, salary FROM employees',
      );
      return rows;
    },
  };
}

function mapDuplicate(err) {
  if (err && err.code === 'ER_DUP_ENTRY') return new ConflictError('An employee with this email already exists');
  return err;
}
