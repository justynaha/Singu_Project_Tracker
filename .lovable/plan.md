

## Plan: Fix Grand Total background, freeze header row, unfreeze Project Name column

### Changes in `src/pages/MonthlyBreakdownList.tsx`

**1. Grand Total row — opaque background on sticky Total cell (line 707)**
- Change `bg-background` → `bg-muted/50` to match the row's background, ensuring it's opaque and consistent (bg-muted/50 is the row bg). Actually `bg-muted/50` is semi-transparent. Use a fully opaque color like `bg-gray-200` or keep `bg-background` but the row itself uses `bg-muted/50`. The issue is the monthly data cells in Grand Total row have no explicit bg, so they show through. Fix: add `bg-muted/50` to the Grand Total's sticky Total cell — but that's semi-transparent too. Better: use `bg-gray-100` for the Total cell, matching what was done for other rows. Or even simpler: the Grand Total row bg is `bg-muted/50` — the sticky cell needs an opaque bg. Use `bg-gray-200` to approximate the muted look.

Actually let me re-check: the problem is the Grand Total monthly cells don't have backgrounds, so when scrolling, they show through the sticky Total column. The fix is to give the sticky Total cell in Grand Total an opaque background. `bg-gray-100` should work.

**2. Freeze header row (sticky top)**
- Add `sticky top-0 z-20` to `<TableHeader>` or to the header `<TableRow>` so it stays visible during vertical scrolling
- The header cells already have `bg-background`, so they won't be transparent

**3. Remove sticky from Project Name column**
- Remove `sticky left-[60px] bg-background z-10` from the Project Name `<TableHead>` (line 590) and `<TableCell>` (line 647)
- Keep it as a normal scrollable column

### Technical details

| Line | Change |
|------|--------|
| 586 | Add `sticky top-0 z-20 bg-background` to header `<TableRow>` |
| 590 | Remove `sticky left-[60px] bg-background z-10` from Project Name header |
| 647 | Remove `sticky left-[60px] bg-background z-10` from Project Name data cells |
| 707 | Change `bg-background` to `bg-gray-100` on Grand Total sticky Total cell |

