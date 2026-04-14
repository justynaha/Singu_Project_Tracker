

## Plan: Add EUR labels to summary rows

### MonthlyBreakdownList.tsx
1. **Total column header** (line 518): Change `Total` → `Total (EUR)`
2. **Grand Total label** (line 555): Change `Grand Total` → `Grand Total (EUR)`
3. **Budget label** (line 576): Change `Budget` → `Budget (EUR)`
4. **Planned 3M label** (line 585): Change `Planned 3M` → `Planned 3M (EUR)`
5. **Contracted label** (line 599): Change `Contracted` → `Contracted (EUR)`
6. **Invoiced label** (line 613): Change `Invoiced` → `Invoiced (EUR)`

### ContractsList.tsx
7. **Subtotal row** (line 855-857): Prepend `EUR ` before formatted amounts in contracted/invoiced/balance cells
8. **Grand Total row** (line 868-870): Prepend `EUR ` before formatted amounts in contracted/invoiced/balance cells

### Files to edit
- `src/pages/MonthlyBreakdownList.tsx` — 6 label changes
- `src/pages/ContractsList.tsx` — 6 value prefix changes (3 subtotal + 3 grand total)

