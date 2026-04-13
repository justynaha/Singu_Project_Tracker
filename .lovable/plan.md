

## Plan: Add totals row to Contracts table

### `src/components/project-detail/ContractsTab.tsx`

Add a `<TableFooter>` after `<TableBody>` with a totals row that sums:
- **Contracted (LC)** column — sum of all `amount_lc` values (only if `showLcColumn` is true)
- **Contracted (EUR)** column — sum of all `amount_eur` values

The row will span the non-numeric columns with a bold "Total" label and display formatted sums in the amount columns. Uses the same `formatAmount` helper already in the file.

### Technical detail

- Import `TableFooter` from `@/components/ui/table`
- Calculate `totalLc = contracts.reduce((s, c) => s + (c.amount_lc || 0), 0)`
- Calculate `totalEur = contracts.reduce((s, c) => s + (c.amount_eur || 0), 0)`
- Insert `<TableFooter>` between lines 170-171, right after `</TableBody>`
- The "Total" label cell uses `colSpan={4}` (or 3 if no description) to align with the amount columns

