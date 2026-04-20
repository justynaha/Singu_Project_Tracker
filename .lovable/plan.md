

## Plan: Split "Budget/Work category" into two columns

### File
`src/pages/Projects.tsx`

### Changes

1. **`visibleColumns` state + `columnDefs`**: replace the single `budget` key with two keys:
   - `budget: true` → label **"Budget"**
   - `workCategory: true` → label **"Work category"**

2. **Header row** (line 711): replace the single `<th>` with two:
   - `Work category` — `text-left`, width ~`w-44`
   - `Budget` — `text-right`, width `w-48`

3. **Skeleton row** (line 725): emit two `<td>` skeletons matching the two new columns.

4. **Data row** (lines 881–905): split into two cells.
   - **Work category cell** (`text-left`): renders the cyan `Badge` with `project.budget_line || "Unassigned"` (moved out of the budget block, shown even when there is no budget).
   - **Budget cell** (`text-right`): renders the amount line (`currency + total_budget`) and below it, in smaller `text-xs text-muted-foreground`, the existing `used: …(percent%)` line. If no budget → keep the existing italic "No budget" placeholder.

5. **"No projects found" `colSpan`**: already dynamic via `Object.values(visibleColumns).filter(Boolean).length` — works automatically once the state has the extra key.

6. **Columns popover**: no extra work — driven by `columnDefs`, so the new "Work category" toggle appears automatically.

### Visual result
```text
| … | Work category        | Budget                          |
|   | [ESG]                | EUR 100,000.00                  |
|   |                      | used: EUR 24,000.00 (24%)       |
```
- Work category: cyan badge, left-aligned.
- Budget: amount in normal weight, used line in small muted text, percent turns red if >100%.

### Out of scope
- No data model changes.
- No filter changes.
- No export changes.

