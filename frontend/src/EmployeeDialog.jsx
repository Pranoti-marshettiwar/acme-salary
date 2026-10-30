import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { api } from './api.js';

const EMPTY = { fullName: '', email: '', country: '', department: '', jobTitle: '', salary: '', hireDate: '' };

export default function EmployeeDialog({ meta, employee, onClose, onSaved }) {
  const [form, setForm] = useState(employee ? { ...employee, salary: String(employee.salary) } : EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const currency = meta.countries[form.country];

  const submit = async () => {
    setSaving(true); setErrors({}); setFormError('');
    try {
      const body = { ...form, salary: form.salary === '' ? '' : Number(form.salary) };
      if (employee) await api.updateEmployee(employee.id, body); else await api.createEmployee(body);
      onSaved();
    } catch (e) {
      setErrors(e.details || {});
      setFormError(Object.keys(e.details || {}).length ? '' : e.message);
      if (e.details && e.details.email == null && e.message.includes('email')) setErrors({ email: e.message });
    } finally { setSaving(false); }
  };

  const field = (k, label, props = {}) => (
    <TextField label={label} value={form[k]} onChange={set(k)} error={!!errors[k]} helperText={errors[k]}
      size="small" fullWidth {...props} />
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{employee ? `Edit ${employee.fullName}` : 'Add employee'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          {field('fullName', 'Full name')}
          {field('email', 'Email')}
          {field('country', 'Country', { select: true, children: Object.keys(meta.countries).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>) })}
          {field('department', 'Department', { select: true, children: meta.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>) })}
          {field('jobTitle', 'Job title')}
          {field('salary', `Annual salary${currency ? ` (${currency})` : ''}`, { type: 'number', inputProps: { min: 0, step: 'any' } })}
          {field('hireDate', 'Hire date', { type: 'date', InputLabelProps: { shrink: true } })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>{employee ? 'Save changes' : 'Add employee'}</Button>
      </DialogActions>
    </Dialog>
  );
}
