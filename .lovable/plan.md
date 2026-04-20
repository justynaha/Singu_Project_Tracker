

## Plan: Make "Columns" button on Projects list functional

### Problem
On the Projects list, the **Columns** button is a static `<Button>` with no handler. Other places (e.g. Contract Tracker) open a popover with a switch per column. Make Projects behave the same.

### File
`src/pages/Projects.tsx`

### Changes

1. **Replace the lucide icon** import: swap `Settings2` for `Columns3` (consistent with Contract Tracker), and add `Popover, PopoverContent, PopoverTrigger` (already imported).

2. **Add `visibleColumns` state** (right next to the other table state). Default: all true.
   ```ts
   const [visibleColumns, setVisibleColumns] = useState({
     no: true,
     title: true,
     property: true,
     owner: true,
     milestones: true,
     progress: true,
     fiscalYear: true,
     budget: true,
   });
   const columnDefs = [
     { key: "no", label: "No." },
     { key: "title", label: "Title" },
     { key: "property", label: "Property" },
     { key: "owner", label: "Owner" },
     { key: "milestones", label: "Milestones" },
     { key: "progress", label: "Progress" },
     { key: "fiscalYear", label: "Fiscal year" },
     { key: "budget", label: "Budget/Work category" },
   ];
   ```

3. **Replace the static Columns `<Button>`** (lines 655‑658) with a `Popover` whose trigger is the same button (using `Columns3` icon to match the Contract Tracker visual). The popover content is a vertical list of `label + Switch` rows toggling `visibleColumns[col.key]`. Use the exact same markup pattern as `ContractsList.tsx` lines ~768‑783 for visual consistency.

4. **Conditionally render header cells** (`<thead>` block, lines 664‑673): wrap each `<th>` in `{visibleColumns.<key> && ( ... )}`.

5. **Conditionally render body cells**:
   - Skeleton row (lines 678‑687): wrap each `<td>` the same way.
   - "No projects found" row (lines 690‑694): change `colSpan={8}` to `colSpan={Object.values(visibleColumns).filter(Boolean).length}`.
   - Real data rows (the 8 `<td>` cells inside the `.map(...)` further below): wrap each in `{visibleColumns.<key> && ( ... )}`.

### Out of scope
- No persistence (matches Contract Tracker — state resets on reload).
- Export logic, filtering, pagination, totals — unchanged.
- No column reordering.

