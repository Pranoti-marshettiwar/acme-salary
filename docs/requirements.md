# Requirements: ACME Salary Management

**Persona:** HR Manager at ACME (10,000 employees, multiple countries). Today: Excel files.

## Goal
Replace the spreadsheets with a web app where one HR manager can (1) find and maintain any employee's salary record in seconds and (2) answer "how do we pay people?" without building a pivot table.

## Success looks like
- Find an employee by name/email, or filter by country/department, in under a second on 10k rows.
- Add, edit, delete an employee's record with validation (no negative salaries, no duplicate emails, valid currency).
- Answer these questions on one screen: What is our median salary overall, by country, by department? How wide is the pay range for a given job title? Who are the top-paid people? What does the pay distribution look like?

## In scope (v1)
| Feature | Why |
|---|---|
| Employee list: server-side pagination, sort, search, country/department filters | 10k rows cannot be shipped to the browser |
| Create / edit / delete employee | Replaces Excel editing |
| Insights: org summary, by country, by department, by job title, salary bands | The "answer questions" half of the brief |
| Multi-currency: salary stored in local currency; org-wide comparisons normalised to USD with fixed, documented rates | Employees are in multiple countries; mixing currencies silently would give wrong answers |
| Seed script: 10,000 deterministic, realistic employees | Demo and perf testing |

## Deliberately left out (and why)
- **Authentication / roles:** one persona; adds weeks of surface area. Would be first follow-up before real data (salary data is sensitive). The app must not be exposed publicly with real data until added.
- **Payroll, tax, benefits, bonuses/equity:** different problem (payment vs. record + analysis).
- **Salary history / audit trail:** valuable, but needs its own data model. Noted as v2.
- **Live FX rates:** adds an external dependency and non-reproducible numbers; static rates are explicit and editable in one file.
- **Excel import/export:** tempting, but migration is a one-off; the seed script stands in for it.
- **Fancy charts library:** summary tables and simple bars answer the questions with less code.

## Assumptions
- One salary figure per employee (annual base, local currency).
- Departments and countries are free text validated against a small known list in v1.
- Data volume stays in the tens of thousands, so analytics can be computed on demand without a warehouse.

## Non-functional
- List/search < 200 ms server-side at 10k rows (indexed, paginated). Insights computed in a single pass over narrow rows.
- Business logic isolated from HTTP and SQL so it is unit-testable without a database.
