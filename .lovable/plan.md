

## Plan: Contracts list refinements

### `src/pages/ContractsList.tsx`

1. **Statuses** — The `statusVariant` function already only handles "completed" and "ongoing". No changes needed there. Ensure only these two values appear.

2. **Rename "Project ID" column to "Project Number"** — Change the header text. Instead of showing `project_id.slice(0, 8)`, generate a project number using the same pattern as the Projects page (`13536 + index`). To do this, fetch a consistent ordering of projects and assign numbers based on position.

3. **Make Project Number clickable and blue** — Style the Project Number cell with `text-primary font-medium cursor-pointer` (matching the Projects page style). On click, navigate to `/project/{project_id}`. Remove the whole-row `onClick` handler so only the project number is clickable.

4. **Remove row-level cursor-pointer** — Since only the project number should be clickable, remove `cursor-pointer` from `TableRow` and the row-level `onClick`.

### `src/integrations` — Fetch project ordering

To generate consistent project numbers, the ContractsList needs to know each project's position in the full project list. Fetch all projects ordered by `created_at` and assign `13536 + index` to each, building a `projectNumberMap` (project_id → number).

### No other files need changes.

