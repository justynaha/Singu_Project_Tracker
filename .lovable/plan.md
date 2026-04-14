

## Plan: Style subtotals, add collapse, project count, remove 3-dots icon

### Changes to `src/pages/ContractsList.tsx`

**1. Subtotal row — orange background**
- Change class from `bg-muted/20` to `bg-orange-100` (line 853)

**2. Grand Total row — brown background**
- Change footer row class to `bg-amber-900 text-white` (line 867)

**3. Collapse toggle on group header rows**
- Add `collapsedGroups` state: `useState<Set<string>>(new Set())`
- Add `ChevronDown`/`ChevronRight` icon before group label in the group header row (line 789-793)
- Clicking toggles the group key in `collapsedGroups`
- When collapsed, skip rendering `group.contracts.map(...)` data rows but still render the subtotal row

**4. Project count in group label**
- Count unique `project_id` values per group and display as e.g. `Western Europe (13 projects)` in the group header row

**5. Remove 3-dots (MoreVertical) action column**
- Remove the `<TableHead className="w-10 ...">` actions column header (line 765)
- Remove the `<TableCell>` with `DropdownMenu`/`MoreVertical` from each data row (lines 810-826)
- Remove the leading empty cell from subtotal and group header rows
- Adjust `visibleBeforeFinancial` calculation (subtract 1 for the removed actions column)

### Files to edit
- `src/pages/ContractsList.tsx` (~30 lines changed)

