

## Plan: Add Summary and ACG tabs to Reports + Summary table

### Files
- `src/pages/Reports.tsx` — add 2 new tabs at the start of tabs array
- `src/pages/SummaryReport.tsx` — new component for Summary tab content
- `src/pages/AcgReport.tsx` — new placeholder component for ACG tab

### Tab order (left → right)
1. **Summary** (new, default active)
2. **ACG** (new, placeholder)
3. CAPEX Tracker (existing)
4. Contract Tracker (existing)

Default `activeTab` in `Reports.tsx` changes from `monthly-breakdown` to `summary`.

### Summary tab content — property-level table

Reuses the same data hooks as MonthlyBreakdownList (`useProjects`, `monthly_breakdown`, `contracts`, `invoices`) and aggregates by **property (site)**, then groups by region (WE / PL / HU) like the CAPEX Tracker, with subtotals + grand total row at the bottom (matches the "MUSEL TOTAL" styling from the screenshot).

#### Columns
| Group | Column | Source |
|---|---|---|
| — | Property | `project.site` (deduped) |
| — | Country | `siteToCountry[site]` |
| Current | Ongoing (EUR) | sum of `contracts.amount_lc` where status = `Ongoing` for projects on that site |
| Current | Planned 3M (EUR) | sum of next 3 months from `monthly_breakdown` (apr+may+jun for FY2026) |
| Previous Month | Completed (EUR) | placeholder `—` (hardcoded, matching screenshot's blue "copy-paste" cells) |
| Previous Month | Ongoing (EUR) | placeholder `—` |
| Previous Month | Planned 3M (EUR) | placeholder `—` |
| Variance | Completed (EUR) | placeholder `—` (or computed as 0 where prev = 0) |
| Variance | Ongoing (EUR) | current Ongoing − prev Ongoing (= current when prev is 0) |
| Variance | Planned 3M (EUR) | current Planned 3M − prev Planned 3M |

Two-row header: top row spans the 3 column groups (Current implicit / `PREVIOUS MONTH` / `VARIANCE`), bottom row has the individual labels. This matches the screenshot.

#### Rows
- Grouped by region (Western Europe / Poland / Hungary) using existing `COUNTRY_TO_SITE_GROUP`, with collapsible group headers and per-group subtotal rows — same pattern as CAPEX Tracker.
- Final **Grand Total** row styled with `bg-muted/50 font-semibold` (matching "MUSEL TOTAL" dark band in screenshot).
- Empty/zero values rendered as `—` (matching screenshot dashes).

#### Styling — consistent with other report tabs
- `Table` from `@/components/ui/table` with `h-10` rows and sticky header
- Region group header rows: same `bg-muted` styling as CAPEX Tracker
- Grand total row: `bg-muted/50 font-semibold border-t-2`
- Numbers right-aligned, formatted with `toLocaleString("en-US")`, "—" for zero/null
- Property + Country columns sticky-left (like CAPEX Tracker's first columns)
- Header section above table: title "Summary" + Export button (placeholder, no-op for now)
- Outer wrapper matches `MonthlyBreakdownList` `embedded` mode (no own padding, inherits from `Reports.tsx`)

### ACG tab
Empty placeholder card with text "ACG report — coming soon" using same outer layout (`p-4 md:p-6`). No data wiring.

### Out of scope
- Real "previous month" data source — using placeholders matching the screenshot's hardcoded blue cells.
- Excel export for Summary tab (button is a non-functional placeholder for visual parity).
- Filters / search in Summary tab (can be added later if requested).

