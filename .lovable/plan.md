

## Plan: Dynamic currency column, label rename, and tooltip

### 1. `src/components/project-detail/ContractsTab.tsx`

- Add `currency` prop (string, e.g. "PLN", "EUR").
- Rename column header from `Amount (LC)` to `Amount ({currency})`.
- If `currency === "EUR"`, hide the `Amount (LC)` column entirely (header + cells), since it would duplicate Amount (EUR).

### 2. `src/pages/ProjectDetail.tsx`

- Pass `project.currency` (or fallback "EUR") to `ContractsTab`:
  ```
  <ContractsTab contracts={contracts} currency={project?.currency || "EUR"} />
  ```

### 3. `src/pages/Projects.tsx` — New Project modal

- Change label from `Currency` to `Local Currency`.
- Add an `Info` icon (from lucide) next to the label, wrapped in a `Tooltip` that shows: *"Local currency will be converted to EUR based on foreign exchange rates defined in the system."*

### 4. `src/components/project-detail/EditProjectModal.tsx`

- Same label change: `Currency` → `Local Currency` with the same tooltip.

### No database changes needed.

