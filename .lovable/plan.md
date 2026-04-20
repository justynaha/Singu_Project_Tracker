

## Plan: Add "Monthly CAPEX Update — Mandatory v Speculative" tab

### Files
- `src/pages/Reports.tsx` — insert new tab after Summary
- `src/pages/MandatoryVsSpeculativeReport.tsx` — new component

### Tab order
1. Summary
2. **Monthly CAPEX Update — Mandatory v Speculative** (new)
3. ACG
4. CAPEX Tracker
5. Contract Tracker

Tab label shortened in nav: **"Mandatory v Speculative"** (full title used as `<h2>` heading inside the tab to avoid breaking the tab bar layout).

### Table structure

Columns (8 total):

| Group | Column | Notes |
|---|---|---|
| — | Property | sticky left, `min-w-[220px]` |
| — | Country | sticky left-[220px], `min-w-[120px]` |
| **FY25/26 Budget (EUR)** — orange header band | Mandatory | right-aligned, tabular-nums |
| | Speculative | |
| | Budget | = Mandatory + Speculative (subtle blue tint cell, matches screenshot) |
| **Contracted (EUR)** — dark slate header band | Mandatory | |
| | Speculative | |
| | Contracted | = Mandatory + Speculative (subtle blue tint cell) |

Footer rows (sticky bottom, opaque):
- **Total** row — sums all numeric columns, bold, `bg-muted`
- **% Breakdown** row — italic, computed:
  - Budget Mandatory % = Mandatory / Budget
  - Budget Speculative % = Speculative / Budget
  - Budget = 100%
  - Contracted Mandatory % = Mandatory / Contracted (guard div/0 → "—")
  - Contracted Speculative % = Speculative / Contracted (guard div/0 → "—")
  - Contracted = 100% if Contracted>0 else "—"

### Header styling

Two-row header:
- Row 1: Property (rowSpan=2, sticky), Country (rowSpan=2, sticky), "FY25/26 Budget (EUR)" (colSpan=3, orange bg `bg-orange-200 dark:bg-orange-900/40`, white-ish text), "Contracted (EUR)" (colSpan=3, slate bg `bg-slate-700 text-white dark:bg-slate-800`)
- Row 2: Mandatory / Speculative / Budget / Mandatory / Speculative / Contracted

Subtle blue tint on the "Budget" and "Contracted" total columns: `bg-blue-50 dark:bg-blue-900/15` on data cells, slightly darker on subtotal/total.

### Sample data (10 properties, EUR)

Reuse property names already in the prototype (from `siteToCountry` map) — no fabricated names. Values mirror the proportions in the screenshot:

| Property | Country | Mand. Budget | Spec. Budget | Mand. Contracted | Spec. Contracted |
|---|---|---:|---:|---:|---:|
| Mapletree Park Lyon | France | 725 000 | 0 | 0 | 0 |
| Mapletree Park Schiphol | Netherlands | 105 839 | 0 | 105 839 | 0 |
| Mapletree Park Marseille | France | 650 000 | 0 | 0 | 0 |
| Mapletree Park Piotrków 1 | Poland | 2 326 | 0 | 2 326 | 0 |
| Mapletree Park Piotrków 2 | Poland | 1 163 | 0 | 6 395 | 0 |
| Mapletree Park Tilburg | Netherlands | 42 399 | 0 | 42 399 | 0 |
| Mapletree Park Szczecin | Poland | 465 | 0 | 465 | 0 |
| Mapletree Park Fogars | Spain | 2 332 908 | 0 | 130 710 | 0 |
| Mapletree Park Sallent | Spain | 3 220 614 | 0 | 73 144 | 0 |
| Mapletree Park Valls | Spain | 0 | 0 | 0 | 0 |

Total Budget Mandatory ≈ 7 080 714, Contracted Mandatory ≈ 361 278 (matching screenshot proportions). Speculative column intentionally all zeros to mirror screenshot; "—" rendered for zeros via existing `fmt()` helper.

Data is hardcoded inside the component (`const SAMPLE_DATA = [...]`) — no DB wiring. Easy to swap to real source later.

### Layout & behavior

- Outer container: same as Summary (`p-4 md:p-6 flex flex-col h-full`)
- Heading: `<h2>Monthly CAPEX Update — Mandatory v Speculative</h2>` + Export button (visual only)
- Table wrapper: `min-w-[1100px]`, sticky header (top-0), sticky Total + % Breakdown rows (bottom-0/-1), sticky Property + Country columns
- No grouping/subtotals (per recent Summary direction)
- Word "MUSEL" replaced with **"Total"** (and removed from `% Breakdown` row leading cell — leading cell shows just "% Breakdown" with empty Country cell)

### Out of scope
- Real backend wiring (sample data only)
- Functional Excel export (placeholder button)
- Filters / column show-hide

