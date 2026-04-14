

## Plan: Fix CAPEX Tracker alignment and sticky first column

### Issues identified

1. **Text alignment**: `TableCell` in `table.tsx` uses `align-middle` but no explicit `text-left`. Some cells (especially those with `colSpan`) may not be left-aligned consistently. Subsection headers ("IC", "Ad Hoc"), subtotal labels, and group headers all use `colSpan` which can cause centering.

2. **First column not fixed**: The `#` column is sticky at `left-0` with `z-10`, but Country and Site columns are not sticky, so they scroll. The user wants the `#` column to remain fixed (it already is sticky, but may need verification that it works properly with correct width).

### Changes — single file: `src/pages/MonthlyBreakdownList.tsx`

**1. Ensure all text cells are left-aligned**
- Add `text-left` to all `TableCell` elements that contain text labels (subsection headers, subtotal labels, group headers, summary rows)
- Specifically target: group header row (line 612), subsection header (line 627), subtotal label (line 662), group total label (line 681), grand total (line 709), budget/contracted/invoiced labels

**2. Verify first column stickiness**
- The `#` column already has `sticky left-0 bg-background z-10` — confirm this is applied consistently across ALL row types (project rows, subtotal rows, group headers, separator rows)
- For group header rows and subsection headers that use `colSpan={colCount}`, the sticky behavior applies to the whole merged cell — add `sticky left-0 z-10` to these as well if missing

### Also in `src/components/ui/table.tsx`

**3. Add `text-left` to TableCell default class**
- Change `TableCell` className to include `text-left` so all cells default to left alignment unless overridden (e.g. `text-right` for numeric columns)

