

## Plan: Reorder + change default visibility of columns in Contract Tracker

### File
- `src/pages/ContractsList.tsx`

### Changes

1. **Add two new columns to `visibleColumns` state and `columnDefs`**:
   - `legalEntity` — label "Legal entity"
   - `budgetType` — label "Budget type"
   
   Both use data from the linked project (`projectMap`). Note: there's no `legal_entity` field on projects today, so the cell will render `"—"` as a placeholder until that field exists. `budget_type` already exists on `projects` and will render the actual value.

2. **New default visibility** (the `useState` initializer):
   - Visible by default: `contractId`, `country`, `site`, `legalEntity`, `budgetType`, `contractor`, `contracted`, `invoiced`, `balance`
   - Hidden by default: `projectNumber`, `projectTitle`, `description`, `date`, `status`, `agreementSigned`
   
   All remain toggleable via the existing **Columns** popover.

3. **New column order** in both `<TableHeader>` and `<TableBody>` rows (left→right):
   1. Contract ID
   2. Country
   3. Site
   4. Legal entity
   5. Budget type
   6. Contractor
   7. Contract description (= existing `description` column)
   8. Project Number
   9. Project Title
   10. Date
   11. Status
   12. Agreement Signed
   13. Contracted (EUR)
   14. Invoiced (EUR)
   15. Balance (EUR)
   
   The same order is mirrored in `columnDefs` so the Columns popover lists them in the same sequence.

4. **Sticky (frozen) leftmost columns**: Contract ID, Country, Site, Legal entity, Budget type.
   - Add `sticky left-[Xpx] bg-card z-10` classes on those `<TableHead>` and `<TableCell>` cells with cumulative `left` offsets.
   - Wrapping `div` already has `overflow-auto`, so horizontal scrolling will reveal the non-sticky columns while the 5 leftmost stay fixed.
   - The group header row and subtotal/grand-total rows that use `colSpan` continue to span the full width — no sticky needed for them.

5. **No changes to**: filtering, totals/subtotals math, export logic (export already iterates the visible-column set, so it picks up the new defaults automatically), side panel.

### Note for the user
"Legal entity" doesn't exist as a field on projects yet, so its cell will show `—`. Let me know when you want to add a real Legal entity field (on projects or sites) and I'll wire it in.

