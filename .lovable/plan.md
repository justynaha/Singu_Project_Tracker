

## Plan: Fix Page Responsiveness and Scroll Behavior

### Problem
Currently the sidebar scrolls with page content, the top bar and filters scroll horizontally with the table, and side panels may not stay anchored to the viewport right edge.

### Changes

**1. Sidebar — always fixed (`src/components/AppSidebar.tsx`)**
- Already has `sticky top-0 h-screen` — change to `fixed top-0 left-0 h-screen z-30`
- In `src/App.tsx`, add a matching left margin/padding on the main content wrapper so it doesn't sit under the sidebar (`ml-64` / `ml-16` depending on collapse state). Since collapse state lives in AppSidebar, we'll need to either lift that state to App or use CSS approach with a spacer div.
- Simplest: keep sidebar `sticky top-0` (which already works as fixed within flex) but ensure `flex-shrink-0` is set (it is). Actually `sticky top-0` within a flex row already behaves as fixed — the real issue may be the outer container. Let me re-check.

Actually, `sticky top-0 h-screen` in a flex parent with `min-h-screen` already pins the sidebar. The sidebar should not scroll. If it does, the fix is to ensure the parent `div.flex` doesn't have overflow set and the right-side content column handles its own scrolling.

**2. App layout (`src/App.tsx`)**
- Root flex container: `flex w-full h-screen overflow-hidden` (change from `min-h-screen`)
- Right column: `flex-1 flex flex-col min-w-0 h-screen overflow-hidden`
- `<main>`: `flex-1 overflow-y-auto overflow-x-hidden` — vertical scrolling for page content

**3. Reports page header/tabs/filters should NOT scroll horizontally (`src/pages/Reports.tsx` + `src/pages/ContractsList.tsx`)**
- In `ContractsList.tsx`: restructure so that search bar, filters, column toggles, and active filter badges are outside the horizontally scrollable container
- Only the `<Table>` wrapper div gets `overflow-x-auto`
- Filters row: change from `flex items-end gap-4` to `flex items-end gap-4 flex-wrap` so filters wrap on smaller screens

**4. Side panels anchored to viewport right edge**
- Side panels (CopilotPanel, contract detail, etc.) already use `fixed right-0` positioning — verify and keep as-is. The `fixed` positioning ensures they stay on viewport right edge regardless of scroll.

### Files to edit
- `src/App.tsx` — root layout overflow control
- `src/pages/ContractsList.tsx` — isolate horizontal scroll to table only, wrap filters
- `src/pages/Reports.tsx` — ensure page header doesn't scroll horizontally
- `src/pages/MonthlyBreakdownList.tsx` — same table scroll isolation treatment

