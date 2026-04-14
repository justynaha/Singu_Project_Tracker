

## Plan: Red % when over budget + summary rows on capex tracker report

### Changes

**1. `src/components/project-detail/MonthlyBreakdownTab.tsx`** — Red % when over budget
- In the Total row, add conditional styling: if `total > totalBudget`, render the `(X% of budget)` text with `text-destructive` (red) instead of `text-muted-foreground`.

**2. `src/pages/MonthlyBreakdownList.tsx`** — Add summary rows below Grand Total
- Compute `grandBudget` by summing `total_budget` from all filtered projects.
- Compute `grandContracted` and `grandInvoiced` by summing `amount_lc` from contracts (fetch contracts data alongside breakdowns).
- After the "Grand Total" row, add four new rows with the same `h-10` styling and `text-sm text-muted-foreground`:
  - **Project Budget** — shows `grandBudget` in the Total column, with `(X% of budget)` next to Grand Total (red if over).
  - **Planned 3M** — sum of Apr+May+Jun across filtered projects, shows `(X% total)`.
  - **Contracted** — sum of all contract `amount_lc` for filtered projects, shows `(X% total)`.
  - **Invoiced** — sum of all invoice `amount_lc` for filtered projects, shows `(X% total)`.
- Fetch contracts and invoices data in a useEffect (similar to breakdowns fetch).

### Files to edit
- `src/components/project-detail/MonthlyBreakdownTab.tsx` (~2 lines)
- `src/pages/MonthlyBreakdownList.tsx` (~50 lines)

