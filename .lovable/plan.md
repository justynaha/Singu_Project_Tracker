

## Plan: Add summary rows (Ongoing, Savings, Postponed) and reorder

### What changes

**1. Add `savings` and `postponed` columns to `projects` table**
- Database migration adding two nullable numeric columns: `savings` (default 0) and `postponed` (default 0)
- These will be populated per-project in a future step

**2. Update `summaryTotals` computation in `MonthlyBreakdownList.tsx`**
- Add `grandOngoing`: sum of `amount_lc` from contracts where `status = 'Ongoing'` for filtered projects
- Add `grandSavings`: sum of `savings` from filtered projects
- Add `grandPostponed`: sum of `postponed` from filtered projects

**3. Reorder and add summary rows in the table (lines ~531-606)**

New order:
1. **Grand Total (EUR)** — bold, bg-muted/50 (existing)
2. **Budget (EUR)** — existing
3. **Contracted (EUR)** — existing
4. **Invoiced (EUR)** — existing
5. **Ongoing (EUR)** — NEW, sum of contracts with status 'Ongoing'
6. **Planned 3M (EUR)** — existing
7. **Savings (EUR)** — NEW, sum of `projects.savings`
8. **Postponed (EUR)** — NEW, sum of `projects.postponed`

Each new row follows the same pattern: label in sticky column, percentage of total + value in the Total column.

**4. Update XLS export** (lines ~290-312)
- Add Ongoing, Savings, Postponed rows and reorder to match the table

**5. Update `MonthlyBreakdownTab.tsx` (per-project view)**
- Reorder summary rows to match: Total, Budget, Contracted, Invoiced, Ongoing, Planned 3M, Savings, Postponed
- Add Ongoing row (filter contracts for that project with status 'Ongoing')
- Add Savings and Postponed rows reading from project fields

### Technical details
- Migration: `ALTER TABLE projects ADD COLUMN savings numeric DEFAULT 0; ALTER TABLE projects ADD COLUMN postponed numeric DEFAULT 0;`
- Ongoing contracts filter: `contracts.filter(c => filteredIds.has(c.project_id) && c.status === 'Ongoing').reduce(...)`
- The Supabase types will auto-update after migration

