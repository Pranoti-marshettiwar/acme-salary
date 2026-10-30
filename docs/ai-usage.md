# How AI was used

Built with Claude as an agentic pair. The workflow, in order:

1. **Frame first.** Asked for a plan and the open decisions before code; chose stack (Node + MySQL) explicitly.
2. **Requirements before code.** Had the one-page requirements doc written and committed before any implementation; scope exclusions were argued, not defaulted.
3. **Domain first, tests alongside.** Pure logic (validation, stats, FX, insights) written with tests, then wired to HTTP and SQL.
4. **Review of AI output.** Test run caught a real defect (a bad country also produced a misleading currency error); fixed in validation and kept the test.
5. **Verification.** Measured insights time at 10k rows instead of assuming; confirmed the UI builds. Frontend was first built in React, then rebuilt in Angular 20 + Angular Material when the stack requirement changed (backend untouched, which validated the API boundary).

Example prompts (condensed):
- "Write a one-page requirements doc for an HR salary tool: goal, scope, deliberate exclusions with reasons."
- "Design validation, stats and insights as pure functions; write fast deterministic tests first."
- "Make the repository a thin SQL layer; keep all business rules in services so tests need no database."
- "Seed 10,000 realistic employees deterministically; every record must pass the API's validation."

Things I did not delegate blindly: currency semantics (what is compared in USD vs local), privacy threshold for small groups, and what to cut from scope.
