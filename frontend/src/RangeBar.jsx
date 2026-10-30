import { Box } from '@mui/material';

/** Min–max strip with the middle 50% (p25–p75) shaded and a marker at the median. */
export default function RangeBar({ stats, domainMax }) {
  const pct = (v) => `${(v / domainMax) * 100}%`;
  const label = `Range ${stats.min} to ${stats.max}, median ${stats.median}`;
  return (
    <Box role="img" aria-label={label} sx={{ position: 'relative', height: 14, minWidth: 160 }}>
      <Box sx={{ position: 'absolute', top: 6, height: 2, bgcolor: 'divider', left: pct(stats.min), width: `calc(${pct(stats.max)} - ${pct(stats.min)})` }} />
      <Box sx={{ position: 'absolute', top: 2, height: 10, bgcolor: 'rgba(11,107,99,0.35)', left: pct(stats.p25), width: `calc(${pct(stats.p75)} - ${pct(stats.p25)})` }} />
      <Box sx={{ position: 'absolute', top: 0, height: 14, width: 3, bgcolor: 'primary.main', left: `calc(${pct(stats.median)} - 1px)` }} />
    </Box>
  );
}
