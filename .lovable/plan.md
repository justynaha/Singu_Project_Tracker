

## Plan: Add Contract creation + fix Budget/Currency alignment

### 1. `src/hooks/useProjectDetail.ts` — Add `createContract` function

- Add a `createContract` function that inserts into the `contracts` table with fields: `project_id`, `contract_number`, `contract_date`, `amount_lc`, `status`.
- Amount EUR will be left null for now (future FX conversion).
- Re-fetch contracts after insert.
- Export `createContract` from the hook.

### 2. `src/components/project-detail/ContractsTab.tsx` — Add "Add contract" button + modal

- Add an "Add contract" button at the top (same `Plus` icon + style as FilesTab).
- Add a Dialog modal with fields:
  - **Contract ID** — text input for the contract number.
  - **Date** — date input.
  - **Contract amount ({currency})** — formatted text input (same pattern as Budget field: `type="text"`, `inputMode="decimal"`, thousand separators).
  - **Local Currency** label with Info tooltip (same text as New Project modal).
  - **Status** — select with options: Draft, Signed, Active, Closed.
- Accept `onCreateContract` and `currency` props.
- Hide LC amount column when currency is EUR (already done), but always show the form field for amount in the selected currency.
- On submit, call `onCreateContract` and close modal.

### 3. `src/pages/ProjectDetail.tsx` — Wire up `createContract`

- Destructure `createContract` from the hook.
- Pass `onCreateContract={createContract}` and `currency` to `ContractsTab`.

### 4. `src/pages/Projects.tsx` — Fix Budget/Currency alignment

- The Budget label is single-line but the Local Currency label is multi-line (due to the tooltip icon). Fix by adding `flex items-center gap-1.5` to the Budget label as well, or ensuring both `<div>` wrappers have consistent height for their labels. The simplest fix: add a fixed height or `min-h` to both label containers, or make the Budget label also use `flex items-center` for consistent baseline alignment.

### No database changes needed.

