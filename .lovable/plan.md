

## Plan: XLS Export, Column Reorder, and Columns Button for Reports

### Changes

**1. `src/pages/ContractsList.tsx`** — XLS export, column reorder, Columns button

- **Column reorder**: Move "Status" and "Agreement Signed" columns to appear right after "Contractor" (before financial columns).
- **Columns button**: Add `visibleColumns` state with toggles for all table columns (matching the pattern from ContractsTab — Popover with Switch toggles). Place it in a toolbar row above the table, right-aligned.
- **XLS export button**: Add "Export XLS" button next to "Columns" button. On click, generate an XLSX file client-side using the `xlsx` library (SheetJS). Export all currently filtered rows with the same columns visible in the table. Include the footer totals row.
- **Footer row**: Update `colSpan` to match new column order.

**2. `src/pages/MonthlyBreakdownList.tsx`** — XLS export, Columns button

- **Columns button**: Add `visibleColumns` state for toggling month columns and Total column. Same Popover+Switch pattern.
- **XLS export button**: Add "Export XLS" button next to "Columns". Export all filtered projects with month values, total, and summary rows (Grand Total, Budget, Planned 3M, Contracted, Invoiced).
- Both buttons placed in a toolbar row between filters and the table, right-aligned.

**3. Install `xlsx` package** for client-side Excel generation (`npm install xlsx`).

### Column order for Contract Tracker (after change)
`[actions] | Contract ID | Project Number | Project Title | Site | Date | Contractor | Status | Agreement Signed | Contracted (EUR) | Invoiced (EUR) | Balance (EUR)`

### Files to edit
- `src/pages/ContractsList.tsx` (~80 lines changed)
- `src/pages/MonthlyBreakdownList.tsx` (~60 lines added)
- `package.json` (add `xlsx` dependency)

