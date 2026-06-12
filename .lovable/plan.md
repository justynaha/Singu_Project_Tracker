
## Add "+ Add" Tab + Report Configuration Modal

### Scope
On the Reports page (`src/pages/Reports.tsx`), add a new tab entry rendered as a blue clickable "+ Add" text button next to "Contract Tracker". Clicking it opens a modal styled like the uploaded Widget Configuration screenshot, adapted for creating **Reports** in our CAPEX/projects context. This is UI-only (no persistence yet) — the modal collects inputs and closes on Save (toast confirmation).

### Tab change (`src/pages/Reports.tsx`)
- Render existing tabs unchanged.
- After the last tab, render a `+ Add` button (not a real tab — no active state, no route param). Styling: `text-primary` (blue), same vertical padding as tabs, hover underline. No bottom border indicator.
- On click → `setShowAddReportModal(true)`.

### New component: `src/components/reports/AddReportModal.tsx`
Dialog (shadcn `Dialog`) with title **"Report Configuration"** and subtitle "Configure your report by selecting data and visualization options". Top-right `Import` button (visual only).

Sections + fields (adapted to our context):

**Data Selection** (with `Presets` button top-right, visual only)
- **View** (Select): Projects, Contracts, Invoices, Monthly Breakdown, CAPEX Tracker, Mandatory vs Speculative
- **Metric** (Select): Count, Total Budget, Contracted Value, Invoiced Value, Forecasted, Savings, Variance
- **Filters**: "+ Add filter" button (visual placeholder, no rows yet)
- **Breakdown Dimension (Optional)** (Select): None, Country, Site, Region, Work Category, Budget Type, Classification, Fiscal Year, Currency

**Visualization**
- **Name** (Input, default: `"{Metric} ({View})"`)
- **Description** (Input, default: `"Shows the {metric} of {view}"`)
- **Chart Type** (Select with icons): Table, Line Chart, Bar Chart, Stacked Bar, Pie Chart, KPI Card
- **Fiscal Year** (Select): FY 2024, FY 2025, **FY 2026 (default)**, FY 2027 — replaces the screenshot's "Date Range" since our reports are FY-scoped per project memory.

**Footer**: Full-width dark **"Save Report"** button. On click → `toast.success("Report created")` and close. (No backend wiring in this step.)

### Files
- Edit: `src/pages/Reports.tsx` (add button + modal state + mount modal)
- Add: `src/components/reports/AddReportModal.tsx`

### Out of scope
- Persisting reports to DB
- Wiring the created report into the tab list
- Real filter row builder
