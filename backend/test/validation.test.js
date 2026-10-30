import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmployee } from '../src/domain/validation.js';

const valid = {
  fullName: '  Asha Rao ', email: 'ASHA@acme.test', country: 'India', department: 'Engineering',
  jobTitle: 'Software Engineer', salary: '2400000.456', hireDate: '2021-04-12',
};

test('accepts valid input and normalises it', () => {
  const { errors, value } = validateEmployee(valid);
  assert.deepEqual(errors, {});
  assert.equal(value.fullName, 'Asha Rao');
  assert.equal(value.email, 'asha@acme.test');
  assert.equal(value.salary, 2400000.46);
});

test('currency defaults from country', () => {
  assert.equal(validateEmployee(valid).value.currency, 'INR');
  assert.equal(validateEmployee({ ...valid, country: 'Germany' }).value.currency, 'EUR');
});

test('rejects non-positive, non-numeric and missing salary', () => {
  for (const salary of [0, -5, 'abc', '', undefined, null]) {
    assert.ok(validateEmployee({ ...valid, salary }).errors.salary, `salary=${salary}`);
  }
});

test('rejects bad email, country, department, title and date', () => {
  const { errors } = validateEmployee({
    ...valid, email: 'nope', country: 'Atlantis', department: 'Wizardry', jobTitle: ' ', hireDate: '12/04/2021',
  });
  assert.deepEqual(Object.keys(errors).sort(), ['country', 'department', 'email', 'hireDate', 'jobTitle']);
});

test('rejects unsupported currency override', () => {
  assert.ok(validateEmployee({ ...valid, currency: 'XYZ' }).errors.currency);
});

test('empty input reports every required field', () => {
  assert.ok(Object.keys(validateEmployee({}).errors).length >= 6);
});
