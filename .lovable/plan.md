

## Plan: Create Reports page with Contract Tracker and Monthly Breakdown tabs

### Overview
Create a new `Reports` page that wraps `ContractsList` and `MonthlyBreakdownList` as tab content. Update routing and sidebar accordingly.

### Changes

**1. `src/pages/Reports.tsx`** — New file
- Simple page with two tabs using the existing `Tabs` component
- Tab 1: "Contract Tracker" — renders `ContractsList` (adapted as embedded component)
- Tab 2: "Monthly Breakdown" — renders `MonthlyBreakdownList` (adapted as embedded component)

**2. `src/pages/ContractsList.tsx`** — Minor change
- Accept an optional `embedded` prop (boolean). When true, skip any outer page wrapper/padding so it fits inside the Reports tab seamlessly.

**3. `src/pages/MonthlyBreakdownList.tsx`** — Minor change
- Same `embedded` prop pattern as ContractsList.

**4. `src/App.tsx`** — Update routes
- Add `import Reports from "./pages/Reports"`
- Change `/reports` route to render `<Reports />`
- Keep `/contracts` and `/monthly-breakdown` routes as redirects to `/reports` (or remove them if not needed elsewhere)

**5. `src/components/AppSidebar.tsx`** — Update sidebar
- Remove "Contracts" and "Monthly Breakdown" from Project Tracker submenu
- Update "Reports" menu item to have submenu with:
  - "Contract Tracker" → `/reports` (or `/reports?tab=contracts`)
  - "Monthly Breakdown" → `/reports?tab=monthly-breakdown`
- Or simpler: just make "Reports" a single link to `/reports` with no submenu, and the tabs handle navigation within the page

### No database changes needed

### Files to edit
- `src/pages/Reports.tsx` (new)
- `src/pages/ContractsList.tsx` (minor)
- `src/pages/MonthlyBreakdownList.tsx` (minor)
- `src/App.tsx`
- `src/components/AppSidebar.tsx`

