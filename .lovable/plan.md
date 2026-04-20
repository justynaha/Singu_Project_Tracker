

## Plan: Move "Remaining to allocate" to last row + add Savings/Postponed buttons (V1)

### Changes in `src/components/project-detail/MonthlyBreakdownTab.tsx`

1. **Reorder rows in V1 view** so the table sequence becomes:
   - Forecasted (input row)
   - Total
   - Budget
   - Planned 3M
   - **Remaining to allocate** (last row)

2. **Update the "Remaining to allocate" cell** (right side, where the amount is shown):
   - Render the existing amount (`{fmt(remaining)} {currencyLabel}`).
   - When `remaining !== 0`, render two small buttons immediately next to the amount (left of it, inside the same right-aligned cell): **Savings** and **Postponed**.
   - When `remaining === 0`, hide both buttons (only the amount shows).
   - Buttons: `<Button variant="outline" size="sm">` with no `onClick` handler (no-op for now). Use compact styling consistent with the table.

3. **No other behavior changes**: V2 view stays untouched; logic for `remaining` calculation stays the same.

### File
- `src/components/project-detail/MonthlyBreakdownTab.tsx`

