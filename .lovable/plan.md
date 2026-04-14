

## Plan: Fix side panel layout on Contracts page to prevent horizontal scroll

### Problem
When the side panel opens on `/contracts`, the table's many columns cause horizontal scroll instead of the main content area shrinking responsively.

### Changes to `src/pages/ContractsList.tsx`

1. **Remove outer `min-h-screen` wrapper** (line 416) — replace with just `className="bg-background"` or merge into the flex container directly. The `h-[calc(100vh-64px)]` on the inner flex already handles height.

2. **Add `overflow-x-auto`** to the table's container div (line 575: `<div className="border border-border rounded-lg overflow-hidden">`) → change to `overflow-auto` so the table scrolls horizontally within the main content area if needed, rather than pushing the whole page wider.

3. **Add `overflow-hidden`** to the outer flex container (line 417) to prevent any content from escaping: `<div className="flex h-[calc(100vh-64px)] overflow-hidden">`

These three small changes ensure the side panel compresses the main area and any table overflow is handled within bounds.

### Files to edit
- `src/pages/ContractsList.tsx` (3 lines)

