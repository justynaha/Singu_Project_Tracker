

## Plan: Global "Monthly Breakdown" page

### Overview
Create a new page at `/monthly-breakdown` accessible from the sidebar under "Contracts" in the Project Tracker group. It displays a cross-project table with all projects' monthly breakdown data, project number, project name, month columns (Apr 2026–Mar 2027), row totals, and a Grand Total row. Filters match those on the Projects page.

### Changes

#### 1. `src/components/AppSidebar.tsx`
- Add a new submenu item `{ title: "Monthly Breakdown", icon: CalendarRange, path: "/monthly-breakdown" }` after the "Contracts" entry in the Project Tracker group
- Import `CalendarRange` from lucide-react
- Update `isGroupActive` to include `/monthly-breakdown`

#### 2. `src/pages/MonthlyBreakdownList.tsx` (new file)
- Fetch all projects via `useProjects()` hook
- Fetch all rows from `monthly_breakdown` table (joined by `project_id`)
- Generate project numbers using the same `13536 + index` logic as ContractsList
- **Filters section**: Replicate the same filter UI from Projects page (Site group, Country, Site, Budget line, Status, Fiscal year, Tracking) with pending/applied pattern
- **Table**: Columns: `#` (project number, clickable link), `Project Name`, then 12 month columns (Apr 2026–Mar 2027), then `Total`
- Each cell shows the monthly value from the breakdown row for that project (read-only display, not editable)
- **Grand Total row**: Last row sums all values per column across all filtered projects
- Project number links to `/project/:id`

#### 3. `src/App.tsx`
- Import `MonthlyBreakdownList` and add route `<Route path="/monthly-breakdown" element={<MonthlyBreakdownList />} />`

### Technical notes
- Month columns are hardcoded to FY2026 headers (Apr 2026–Mar 2027) matching the current data; each project's row uses its `monthly_breakdown` record
- Reuses `useProjects`, `siteToCountry`, `SITE_GROUP_OPTIONS`, `COUNTRY_TO_SITE_GROUP` from existing code
- The filter logic is copied from Projects page for consistency

### Files to create/edit
- **Create**: `src/pages/MonthlyBreakdownList.tsx`
- **Edit**: `src/components/AppSidebar.tsx`, `src/App.tsx`

