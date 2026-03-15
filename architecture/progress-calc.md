# Progress Calculation SOP

## 1. Goal
Define how a project's completion percentage is determined.

## 2. The Formula
`Progress % = (Count of tickets with status 'done') / (Total count of tickets) * 100`

## 3. Constraints
- **Zero Division Safety:** If Total count of tickets is 0, Progress % is 0.
- **Server/Client Locality:** The calculation should be performed in the deterministic `src/lib/progress.ts` tool.
- **Refresh Triggers:** The calculation must run whenever:
  1. A new `ticket` is created.
  2. A `ticket` status changes.
  3. A `ticket` is deleted.
- **Number formatting:** Truncate to whole integers using `Math.round()`.
