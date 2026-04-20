

## Plan: Add V1/V2 view switcher to Monthly Breakdown (CAPEX Tracker)

### What
Add a version dropdown (V1 / V2) in the top-right toolbar of the CAPEX Tracker. V2 = current full view (default). V1 = simplified view that hides several summary rows.

### V1 hides (below Grand Total):
- Contracted
- Invoiced
- Ongoing
- Savings
- Postponed

### V1 keeps:
- Budget
- Planned 3M
- A new row **"Remaining to allocate"** added right after Grand Total (above Budget). Value = `summaryTotals.grandBudget − grandTotals.total` (formatted in EUR, with same styling as other summary rows; red if negative).

### V2 (current behavior, unchanged):
- Shows all existing rows: Budget, Contracted, Invoiced, Ongoing, Planned 3M, Savings, Postponed.
- Does NOT show "Remaining to allocate".

### Implementation in `src/pages/MonthlyBreakdownList.tsx`
1. Add state: `const [viewVersion, setViewVersion] = useState<"V1" | "V2">("V2")`.
2. Add a `Select` (or compact dropdown) in the toolbar area near the existing Columns popover (line ~550), aligned right, labeled "View" with options V1 / V2.
3. Wrap the five summary rows (Contracted, Invoiced, Ongoing, Savings, Postponed) with `{viewVersion === "V2" && (...)}`.
4. Add new "Remaining to allocate" row directly after the Grand Total row, rendered only when `viewVersion === "V1"`. Same `<TableRow className="h-10">` pattern as other summary rows; sticky left + sticky right total cell.
5. No changes to export logic, data fetching, or column toggles.

### Files to edit
- `src/pages/MonthlyBreakdownList.tsx`

