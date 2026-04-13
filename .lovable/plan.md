

## Plan: Sync BudgetCard "Contracted" with actual contracts total + show LC budget

### Problem
The BudgetCard widget on the Overview tab uses `cashflowTotals.contracted` from the milestone_cashflow table, not the actual sum of contracts. The user wants the "Contracted" value in BudgetCard to always equal the Total from the Contracts tab (sum of `amount_eur`). Additionally, the Budget line in BudgetCard should show the local currency amount below the EUR amount.

### Changes

#### 1. `src/pages/ProjectDetail.tsx`
- Compute `totalContracted` from `contracts` array: `contracts.reduce((s, c) => s + (c.amount_eur || 0), 0)` instead of `cashflowTotals.contracted`.
- Pass `budgetLc` (project's `total_budget`) and `localCurrency` (project's `currency`) to `BudgetCard` so it can display the local currency value below EUR.
- The budget in EUR needs to be derived — if the project currency is already EUR, `budgetLc` equals budget; otherwise we need the EUR equivalent. Since `total_budget` is stored in local currency, we'll pass both `total_budget` and `currency` to BudgetCard.

#### 2. `src/components/project-detail/BudgetCard.tsx`
- Add props: `budgetLc?: number`, `localCurrency?: string`.
- Below the Budget EUR value (line 43), render a smaller line showing the local currency amount (only if `localCurrency` differs from "EUR").
- The `contracted` prop will now receive the contracts total (EUR) from ProjectDetail.

#### 3. `src/components/project-detail/TimelineV2Tab.tsx`
- Update the `contracted` prop it receives — no changes needed in this file since ProjectDetail already passes the value.

### Technical detail
- `totalContracted` = `contracts.reduce((sum, c) => sum + Number(c.amount_eur || 0), 0)`
- BudgetCard gets new optional props `budgetLc` and `localCurrency`
- Local currency line rendered with `text-xs text-muted-foreground` below the EUR budget value

