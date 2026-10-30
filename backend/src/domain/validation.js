import { COUNTRIES, RATES_PER_USD } from './fx.js';

export const DEPARTMENTS = Object.freeze([
  'Engineering', 'Product', 'Design', 'Sales', 'Marketing',
  'Finance', 'HR', 'Operations', 'Customer Support', 'Legal',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SALARY = 1_000_000_000;

/**
 * Validates and normalises employee input.
 * Returns { value, errors } where errors is a { field: message } map.
 */
export function validateEmployee(input = {}) {
  const errors = {};
  const str = (v) => (typeof v === 'string' ? v.trim() : '');

  const fullName = str(input.fullName);
  const email = str(input.email).toLowerCase();
  const country = str(input.country);
  const department = str(input.department);
  const jobTitle = str(input.jobTitle);
  const currency = str(input.currency) || COUNTRIES[country];
  const salary = Number(input.salary);
  const hireDate = str(input.hireDate);

  if (!fullName) errors.fullName = 'Full name is required';
  else if (fullName.length > 120) errors.fullName = 'Full name must be 120 characters or fewer';

  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!COUNTRIES[country]) errors.country = 'Choose a supported country';
  if (!DEPARTMENTS.includes(department)) errors.department = 'Choose a supported department';
  if (!jobTitle) errors.jobTitle = 'Job title is required';
  // Skip when country is already invalid: the currency error would just be noise.
  if (!RATES_PER_USD[currency] && (COUNTRIES[country] || str(input.currency))) errors.currency = 'Unsupported currency';

  if (input.salary === '' || input.salary == null || !Number.isFinite(salary)) {
    errors.salary = 'Salary must be a number';
  } else if (salary <= 0) {
    errors.salary = 'Salary must be greater than zero';
  } else if (salary > MAX_SALARY) {
    errors.salary = 'Salary is unrealistically large';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(hireDate) || Number.isNaN(Date.parse(hireDate))) {
    errors.hireDate = 'Hire date must be YYYY-MM-DD';
  }

  return {
    errors,
    value: { fullName, email, country, department, jobTitle, currency, salary: Math.round(salary * 100) / 100, hireDate },
  };
}
