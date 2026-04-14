

## Plan: Add project budget info to Monthly Breakdown

### Overview
Add a "Project Budget" row below the "Total" row (before summary rows), and show the budget % next to the total amount. Also pass `totalBudget` as a new prop and fix the existing ContractsTab build errors.

### Changes

**1. Fix `src/components/project-detail/ContractsTab.tsx` build errors**
- Lines ~637-638 have syntax errors from the previous edit. Review and fix the malformed JSX in that region.

**2. `src/components/project-detail/MonthlyBreakdownTab.tsx`**

- Add `totalBudget?: number` to `Props` interface.
- Modify the **Total row**: to the left of the total value, show `(X% of budget)` — calculated as `total / totalBudget * 100`.
- Add a **"Project Budget" row** right after Total, before Planned 3M. Same height as Total (`py-3`), but same font style as summary rows below (regular weight, `text-sm`, `text-muted-foreground`). It displays the budget value right-aligned with the currency label.

**3. `src/pages/ProjectDetail.tsx`**
- Pass `totalBudget={project?.total_budget || 0}` to `MonthlyBreakdownTab`.

### Files to edit
- `src/components/project-detail/ContractsTab.tsx` (fix build errors)
- `src/components/project-detail/MonthlyBreakdownTab.tsx` (~15 lines)
- `src/pages/ProjectDetail.tsx` (1 line)

