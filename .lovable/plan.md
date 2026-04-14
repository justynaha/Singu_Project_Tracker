

## Plan: Fix header width, unify row height, and prevent text wrapping in tables

### Changes

**1. `src/components/AppHeader.tsx`** — Prevent horizontal scroll on header
- Add `overflow-hidden` and `min-w-0` to the header element so it never exceeds the available width and stays pinned regardless of content below.

**2. `src/components/ui/table.tsx`** — Global table cell styling
- Add `whitespace-nowrap` to `TableCell` and `TableHead` defaults so text never wraps.
- Add `truncate` (which includes `overflow-hidden text-ellipsis`) to `TableCell` so long text gets trimmed with "...".
- Set `max-w-[200px]` on `TableCell` as a default constraint for truncation to kick in.

**3. `src/pages/ContractsList.tsx`** — Unified 40px row height
- Add `h-10` (40px) to each `TableRow` in both `TableHeader` and `TableBody`.
- Reduce cell padding: override `TableCell` with `py-0 px-3` to fit within 40px.
- Same for `TableHead`: `h-10 py-0 px-3`.
- On the `TableFooter` row, apply same height.

**4. `src/pages/MonthlyBreakdownList.tsx`** — Unified 40px row height
- Same `h-10` and compact padding treatment on all table rows, headers, and cells.

### Files to edit
- `src/components/AppHeader.tsx` (1 line)
- `src/components/ui/table.tsx` (2 lines)
- `src/pages/ContractsList.tsx` (~15 lines)
- `src/pages/MonthlyBreakdownList.tsx` (~8 lines)

