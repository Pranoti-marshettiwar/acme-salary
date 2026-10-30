import { useEffect, useState } from 'react';
import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import { api } from './api.js';
import EmployeesPage from './EmployeesPage.jsx';
import InsightsPage from './InsightsPage.jsx';

export default function App() {
  const [tab, setTab] = useState('employees');
  const [meta, setMeta] = useState(null);
  // Bumped after any write so the insights view refetches instead of showing stale figures.
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => { api.meta().then(setMeta).catch(() => setMeta({ countries: {}, departments: [] })); }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 3, flexWrap: 'wrap', mb: 2 }}>
        <Typography component="h1" variant="h1">ACME salaries</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Sections">
          <Tab value="employees" label="Employees" />
          <Tab value="insights" label="How we pay" />
        </Tabs>
      </Box>
      {meta && tab === 'employees' && <EmployeesPage meta={meta} onChanged={() => setDataVersion((v) => v + 1)} />}
      {meta && tab === 'insights' && <InsightsPage key={dataVersion} />}
    </Container>
  );
}
