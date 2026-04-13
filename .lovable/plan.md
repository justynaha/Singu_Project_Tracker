

## Plan: Fix Contracted column to use amount_lc (converted to EUR) instead of amount_eur

### Problem
The "Contract amount" field in the add/edit modal saves to `amount_lc`, but the table's "Contracted (EUR)" column reads from `amount_eur`, which is never set. This causes the Contracted column to show 0 or stale values.

### Solution
Replace all references to `c.amount_eur` with `convertToEur(c.amount_lc)` (when `showLcColumn` is true) or `c.amount_lc` (when currency is EUR). This ensures the displayed value matches what the user enters in the modal.

### Changes to `src/components/project-detail/ContractsTab.tsx`

1. **Table rows** (line ~494): Change `c.amount_eur` → `showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0)`

2. **Balance EUR calculation** (line ~461): Change `(c.amount_eur || 0) - totalInvoicedEur` → `(showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0)) - totalInvoicedEur`

3. **Total footer — Contracted EUR** (line ~532): Replace `contracts.reduce((s, c) => s + (c.amount_eur || 0), 0)` with `contracts.reduce((s, c) => s + (showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0)), 0)`

4. **Total footer — Balance EUR** (lines ~559): Same pattern for the balance total

5. **Side panel — Financial Summary "Contracted (EUR)"** (line ~641): Change `selectedContract.amount_eur` → `showLcColumn ? convertToEur(selectedContract.amount_lc || 0) : (selectedContract.amount_lc || 0)`

6. **Side panel — Balance (EUR)** (line ~663): Same fix

### Also in `src/pages/ProjectDetail.tsx`
The `totalContracted` calculation (line using `contracts.reduce(... c.amount_eur ...)`) should also use `amount_lc` to stay consistent.

### No database changes needed

### Files to edit
- `src/components/project-detail/ContractsTab.tsx`
- `src/pages/ProjectDetail.tsx`

