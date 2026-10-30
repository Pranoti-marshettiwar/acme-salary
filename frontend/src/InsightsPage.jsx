import { useEffect, useState } from 'react';
import {
  Alert, Box, CircularProgress, Paper, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography,
} from '@mui/material';
import { api } from './api.js';
import { money } from './format.js';
import RangeBar from './RangeBar.jsx';

const GROUPS = [
  { id: 'byCountry', label: 'Country', title: 'Country' },
  { id: 'byDepartment', label: 'Department', title: 'Department' },
  { id: 'byJobTitle', label: 'Job title', title: 'Department / title' },
];

function Stat({ label, value }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
    </Box>
  );
}

function GroupTable({ rows, usdOnly, title }) {
  const sharedMax = Math.max(...rows.map((r) => r.max), 1);
  return (
    <Table size="small" aria-label={`Pay by ${title}`}>
      <TableHead>
        <TableRow>
          <TableCell>{title}</TableCell>
          <TableCell align="right">People</TableCell>
          <TableCell>Range, middle half, median</TableCell>
          <TableCell align="right">Median</TableCell>
          <TableCell align="right">Middle half</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => {
          const cur = usdOnly ? 'USD' : r.currency;
          return (
            <TableRow key={r.key} hover>
              <TableCell>{r.key}</TableCell>
              <TableCell align="right">{r.count.toLocaleString()}</TableCell>
              {/* Country rows are in different currencies, so each strip scales to its own max. */}
              <TableCell><RangeBar stats={r} domainMax={usdOnly ? sharedMax : r.max} /></TableCell>
              <TableCell align="right">{money(r.median, cur)}</TableCell>
              <TableCell align="right">{money(r.p25, cur, true)} – {money(r.p75, cur, true)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [group, setGroup] = useState('byCountry');

  useEffect(() => { api.insights().then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress aria-label="Loading insights" />;

  const org = data.organization;
  const maxBucket = Math.max(...data.distribution.map((b) => b.count), 1);
  const active = GROUPS.find((g) => g.id === group);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Paper sx={{ p: 2.5 }}>
        <Typography component="h2" variant="h2" sx={{ mb: 2 }}>Across the organization (USD)</Typography>
        <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Stat label="People" value={org.count.toLocaleString()} />
          <Stat label="Median salary" value={money(org.median, 'USD')} />
          <Stat label="Average salary" value={money(org.mean, 'USD')} />
          <Stat label="Middle half earn" value={`${money(org.p25, 'USD', true)} – ${money(org.p75, 'USD', true)}`} />
          <Stat label="Lowest to highest" value={`${money(org.min, 'USD', true)} – ${money(org.max, 'USD', true)}`} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 640 }}>
          Cross-country figures convert local pay to USD at fixed rates, so comparisons are consistent but not market exchange rates.
        </Typography>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography component="h2" variant="h2" sx={{ mb: 1.5 }}>How many people earn what (USD)</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 140 }} role="img"
          aria-label="Salary distribution histogram">
          {data.distribution.map((b) => (
            <Box key={b.from} title={`${money(b.from, 'USD', true)}–${money(b.to, 'USD', true)}: ${b.count.toLocaleString()} people`}
              sx={{ flex: 1, bgcolor: 'primary.main', height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count ? 2 : 0 }} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: 12, mt: 0.5 }}>
          <span>{money(0, 'USD')}</span>
          <span>{money(data.distribution.at(-1)?.to ?? 0, 'USD', true)}</span>
        </Box>
      </Paper>

      <Paper>
        <Box sx={{ px: 2.5, pt: 2 }}>
          <Typography component="h2" variant="h2">Pay by group</Typography>
          <Tabs value={group} onChange={(_, v) => setGroup(v)} sx={{ mt: 1 }}>
            {GROUPS.map((g) => <Tab key={g.id} value={g.id} label={g.label} />)}
          </Tabs>
        </Box>
        <GroupTable rows={data[group]} usdOnly={group !== 'byCountry'} title={active.title} />
        {group === 'byJobTitle' && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Only titles held by five or more people are shown.</Typography>
        )}
      </Paper>

      <Paper>
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}><Typography component="h2" variant="h2">Ten highest paid (USD)</Typography></Box>
        <Table size="small" aria-label="Top paid employees">
          <TableBody>
            {data.topPaid.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.fullName}</TableCell>
                <TableCell>{p.jobTitle}, {p.department}</TableCell>
                <TableCell>{p.country}</TableCell>
                <TableCell align="right">{money(p.salaryUsd, 'USD')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
