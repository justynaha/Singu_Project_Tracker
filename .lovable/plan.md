

## Plan: Update New Project modal fields

### Changes to `src/pages/Projects.tsx`

1. **Import `useProjectTypes`** hook and `RadioGroup`/`RadioGroupItem` components.

2. **Replace "Budget line" with "Work category"**:
   - Remove the `budgetLineLabels` map and the combobox that allows free-text entry.
   - Fetch work categories via `useProjectTypes()`.
   - Replace with a `Select` dropdown populated from `projectTypes` (active only), no free-text input.
   - Rename `formData.budgetLine` usage to map to `budget_line` on submit (keep same DB column).

3. **Add "Budget type" radio field** below the "Project budget" + "Currency" row:
   - Two options: `IC` / `Ad Hoc` (radio buttons using `RadioGroup`).
   - Add `budgetType: ""` to `formData` state.

4. **Add "Budget classification" radio field** below "Budget type":
   - Two options: `Mandatory` / `Speculative` (radio buttons).
   - Add `budgetClassification: ""` to `formData` state.

5. **Update form reset** to clear the two new fields.

### Database

- Add two nullable text columns to `projects` table via migration:
  - `budget_type` (text, nullable)
  - `budget_classification` (text, nullable)

### `src/hooks/useProjects.ts`

- Add `budget_type` and `budget_classification` to `CreateProjectInput` and the insert call.

### `src/pages/Projects.tsx` — `handleFormSubmit`

- Pass `budget_type` and `budget_classification` values from formData.

