

## CAPEX Tracker — recolor month columns + conditional grouping

Two changes in `src/pages/MonthlyBreakdownList.tsx`.

### 1. Light green → light gray on month columns

Replace the `bg-green-100 dark:bg-green-900/30` classes used on month cells with neutral light gray (`bg-gray-100 dark:bg-gray-800/40`). Affects:

- Month header cells (line 620)
- Project row month cells (line 678)
- Subsection subtotal month cells (line 690)
- Group total month cells (line 706)
- Grand Total month cells (line 731)

Result: month columns blend with the rest of the table instead of standing out in green.

### 2. Conditional grouping by Property Group

Currently the table is always grouped into `Western Europe / Poland / Hungary` sections (with subsections IC / Ad Hoc, subtotals, group total). Change the behavior based on the `filterSiteGroups` filter:

- **No "Property Group" filter applied** (`filterSiteGroups.length === 0`):
  - Render a flat list — no group header row, no group total row, no separator row.
  - Keep the IC / Ad Hoc subsections inside the flat list (one IC block, one Ad Hoc block, each with its subtotal). The subtotal label changes from `"Subtotal IC — Western Europe"` to just `"Subtotal IC"` / `"Subtotal Ad Hoc"`.
  - Grand Total row stays at the bottom.

- **One or more groups selected** (e.g. Western Europe):
  - Keep current behavior: a section header row appears at the top of each selected group, followed by IC / Ad Hoc subsections, group subtotals, then group total. Only the selected groups are shown (already handled by the existing filter).

### Implementation detail

In the rendering block (around lines 631–720), branch on `filterSiteGroups.length === 0`:

- Flat mode: aggregate ALL filtered projects once into IC / Ad Hoc buckets (compute via existing `calculateSubtotals`) and render only the two subsection blocks + subtotals (no group header, no group total, no separator). Subtotal label uses just the subsection name.
- Grouped mode: render existing `groupedProjects.map(...)` block unchanged.

XLS export (`handleExportXls`) gets the same branching so the exported file matches the on-screen structure.

### Files touched

- `src/pages/MonthlyBreakdownList.tsx` — color token swap + conditional grouping in render and export.

