

## Plan: Fix sticky rows & populate monthly breakdown data

### Part 1: Fix sticky rows for Site Group headers and IC/Ad Hoc subsection headers

**Problem**: Group headers (e.g. "Western Europe"), IC/Ad Hoc subsection headers, and subtotal rows use `colSpan` across the full row but scroll horizontally instead of staying pinned.

**Fix in `src/pages/MonthlyBreakdownList.tsx`**:

- **Group header row** (line 617-624): The `TableCell` with `colSpan` already has `sticky left-0` but uses `bg-muted/40` (semi-transparent). Change to opaque `bg-gray-100`.
- **IC/Ad Hoc subsection header** (line 632-636): Same issue — `sticky left-0` with semi-transparent `bg-blue-50`/`bg-orange-50`. These are already opaque colors, but the `TableRow` bg and `TableCell` bg may not match. Ensure `TableCell` explicitly gets the same opaque bg class.
- **Subtotal rows** (line 664-676): The sticky cell has the correct bg, but month cells don't — ensure consistency.
- **Grand Total row** (line 705-722): Sticky cell uses `bg-muted/50` (semi-transparent). Change to opaque `bg-gray-200`.
- **Summary rows** (Budget, Contracted, etc. lines 724-793): Already use `bg-background` — these should be fine.

The key fix: replace all `bg-muted/40` and `bg-muted/50` on sticky cells with opaque equivalents like `bg-gray-100` or `bg-gray-200`.

### Part 2: Insert monthly breakdown data for 24 projects

Use the database insert tool to add monthly_breakdown rows for these 24 projects that currently have no data. Amounts will be distributed across months summing to ~70-90% of each project's total_budget, with realistic distribution patterns (not uniform).

### Files to edit
- `src/pages/MonthlyBreakdownList.tsx` — opaque backgrounds on sticky group/subsection rows

### Data changes
- Insert 24 rows into `monthly_breakdown` table with realistic monthly distributions

