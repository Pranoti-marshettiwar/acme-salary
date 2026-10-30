# Design notes

## Architecture
```
React (MUI)  --/api-->  Express routes  -->  services (validation, paging, insights, cache)  -->  repository  -->  MySQL
                                                  |
                                          domain (pure): fx, validation, stats
```
Rule: `domain/` and `services/` never import SQL or HTTP. They are tested with plain data and an in-memory repository,
so the test suite needs no database and runs in about a second.

## Decisions and trade-offs
| Decision | Why | Cost / what I'd revisit |
|---|---|---|
| Salary stored in local currency; USD derived with fixed rates | Source of truth matches the contract; analytics are reproducible | Rates are stale by design. Next step: a dated rates table |
| Insights computed in JS over a narrow projection | Median/percentiles are awkward in MySQL and trivial in JS. Measured ~60 ms for 10k rows | Beyond ~100k rows, move to SQL window functions or a materialised summary |
| Insights cached in memory, cleared on any write | Single-process, single-user tool. Always correct after edits | Multi-instance deploy would need a shared cache or short TTL |
| Search is prefix match (`LIKE 'abc%'`) | Uses the name/email indexes | No "contains" search. Full-text index is the upgrade |
| Sort column from a whitelist; all values parameterised | Prevents SQL injection via `sortBy` | None |
| Job-title bands hidden under 5 people | A "range" of 1-2 people reveals individuals and is not statistically meaningful | Threshold is a constant |
| No auth | Out of scope for v1 (see requirements) | Must come first before real data |

## Performance
- Employees table: server-side pagination (max 100/page), composite indexes `(country, salary)` and `(department, salary)`.
- Count + page are two queries; fine at this scale.
- Seed inserts in batches of 1,000 (10 round trips for 10k rows).

## Testing strategy
- Unit: statistics (percentiles, histogram), validation, FX conversion, insights, seed generator (determinism, validity, uniqueness).
- HTTP: full request/response through Express with an in-memory repository (status codes, validation details, 404/409, paging clamp, cache invalidation).
- Not covered: the SQL in `employeeRepository.js` (needs a live MySQL; see "Known gaps").

## Known gaps
- SQL repository has no automated test; it is thin and parameterised, but an integration test against MySQL (e.g. in CI service container) is the next addition.
- No UI tests.
