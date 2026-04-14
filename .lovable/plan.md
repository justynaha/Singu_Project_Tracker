

## Plan: Fix transparent backgrounds on sticky columns

### Problem
Sticky columns (#, Project Name, Total) use semi-transparent or inherited backgrounds (`bg-muted/30`), so when scrolling horizontally, non-sticky cell content shows through behind them.

### Fix
Replace all semi-transparent backgrounds on sticky cells with opaque equivalents:

**In `src/pages/MonthlyBreakdownList.tsx`:**

1. **Total column in project rows** (line 653): `bg-muted/30` → `bg-gray-100` (opaque equivalent)
2. **Total column header** (line 594): `bg-muted/30` → `bg-gray-100`
3. **Total column in subtotal rows** (lines ~666, 682): already have colored bg from subsection — verify they're opaque (bg-blue-50, bg-orange-50, bg-orange-100 are all opaque ✓)
4. **Total column in Grand Total row** (~line 707): verify opaque bg
5. **Total column in summary rows** (Budget, Contracted, etc. ~lines 721, 727, 738, 749, 760, 771, 781): `bg-muted/30` → `bg-gray-100`
6. **Country & Site columns in project rows** (lines 645-646): not sticky, so no issue — but if they should also be sticky, they'd need `bg-background`

All sticky cells will get fully opaque backgrounds so content underneath doesn't bleed through.

