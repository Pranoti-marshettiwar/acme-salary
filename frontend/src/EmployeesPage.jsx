import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, TextField, LinearProgress,
} from '@mui/material';
import { api } from './api.js';
import { money } from './format.js';
import EmployeeDialog from './EmployeeDialog.jsx';

const COLUMNS = [
  { id: 'fullName', label: 'Name' },
  { id: 'country', label: 'Country' },
  { id: 'department', label: 'Department' },
  { id: 'jobTitle', label: 'Job title' },
  { id: 'salary', label: 'Annual salary', align: 'right' },
];

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function EmployeesPage({ meta, onChanged }) {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [department, setDepartment] = useState('');
  const [sortBy, setSortBy] = useState('fullName');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | employee
  const q = useDebounced(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.listEmployees({ q, country, department, sortBy, order, page: page + 1, pageSize }));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [q, country, department, sortBy, order, page, pageSize]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [q, country, department, pageSize]);

  const sort = (id) => {
    setOrder(sortBy === id && order === 'asc' ? 'desc' : 'asc');
    setSortBy(id);
  };

  const remove = async (e) => {
    if (!window.confirm(`Delete ${e.fullName}? This cannot be undone.`)) return;
    try { await api.deleteEmployee(e.id); onChanged(); load(); } catch (err) { setError(err.message); }
  };

  const saved = () => { setEditing(null); onChanged(); load(); };

  return (
    <Paper>
      <Box sx={{ display: 'flex', gap: 2, p: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" label="Search name or email" value={search} sx={{ minWidth: 260 }}
          onChange={(e) => setSearch(e.target.value)} helperText="Matches the start of a name or email" />
        <TextField select size="small" label="Country" value={country} sx={{ minWidth: 170 }}
          onChange={(e) => setCountry(e.target.value)}>
          <MenuItem value="">All countries</MenuItem>
          {Object.keys(meta.countries).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Department" value={department} sx={{ minWidth: 190 }}
          onChange={(e) => setDepartment(e.target.value)}>
          <MenuItem value="">All departments</MenuItem>
          {meta.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={() => setEditing('new')}>Add employee</Button>
      </Box>
      {loading ? <LinearProgress /> : <Box sx={{ height: 4 }} />}
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      <TableContainer>
        <Table size="small" aria-label="Employees">
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.id} align={c.align} sortDirection={sortBy === c.id ? order : false}>
                  <TableSortLabel active={sortBy === c.id} direction={sortBy === c.id ? order : 'asc'} onClick={() => sort(c.id)}>
                    {c.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>{e.fullName}<Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: 12 }}>{e.email}</Box></TableCell>
                <TableCell>{e.country}</TableCell>
                <TableCell>{e.department}</TableCell>
                <TableCell>{e.jobTitle}</TableCell>
                <TableCell align="right">{money(e.salary, e.currency)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setEditing(e)}>Edit</Button>
                  <Button size="small" color="secondary" onClick={() => remove(e)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && data.items.length === 0 && (
              <TableRow><TableCell colSpan={6} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                No employees match these filters. Clear the search or choose a different country or department.
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination component="div" count={data.total} page={page} rowsPerPage={pageSize}
        rowsPerPageOptions={[25, 50, 100]} onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))} />
      {editing && <EmployeeDialog meta={meta} employee={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)} onSaved={saved} />}
    </Paper>
  );
}
