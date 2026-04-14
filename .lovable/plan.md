

## Plan: Subtotal Rows, Missing Countries, New Filters, Budget Type/Classification Columns

### 1. Add subtotal rows per group in Contract Tracker (`src/pages/ContractsList.tsx`)
- After each group's contract rows, render a subtotal `TableRow` with summed Contracted/Invoiced/Balance EUR values
- Style: `bg-muted/20`, bold text, label like "Subtotal — Western Europe"
- Update XLS export to include subtotal rows per group

### 2. Add missing countries to `siteToCountry` mappings
- In both `ContractsList.tsx` and `MonthlyBreakdownList.tsx`, add entries for short site names used by newer projects:
  - `"Bedzin"` → Poland, `"Blonie 2"` → Poland, `"Gdańsk-Airport"` → Poland, `"Nadarzyn"` → Poland, `"Piotrków 1"` → Poland, `"Szczecin"` → Poland
  - `"Bologna Castel San Pietro"` → Italy, `"Fogars"` → Spain, `"Les Franqueses"` → Spain, `"Sallent"` → Spain, `"Valls"` → Spain
  - `"Százhalombatta"` → Hungary, `"Üllő"` → Hungary (already present in ContractsList but missing in MonthlyBreakdownList)

### 3. Add "Netherlands" and "France" countries
- Update `COUNTRY_TO_SITE_GROUP` in `src/hooks/useDashboardData.ts` to include `"Netherlands": "WE"`, `"France": "WE"`
- Update `siteToCountry` in both report files (no actual sites yet, but mapping ready)
- Insert 3-4 new projects via database with sites in Netherlands/France (e.g. "Tilburg", "Schiphol", "Lyon", "Marseille") with budget_type and budget_classification values set

### 4. Add filters for Budget Type and Budget Classification in Contract Tracker
- Fetch `budget_type` and `budget_classification` from projects query
- Add `ProjectInfo` fields: `budget_type`, `budget_classification`
- Add filter dropdowns: **Budget type** (IC / Ad Hoc / CAPEX / All), **Budget classification** (Mandatory / Speculative / All)
- Add pending/applied filter state and badge display

### 5. Add Budget Type and Budget Classification columns to Monthly Breakdown (capex tracker) (`src/pages/MonthlyBreakdownList.tsx`)
- Add two new columns after Project Name: "Budget Type" and "Budget Classification"
- Update column visibility controls and XLS export
- Also add the same two filter dropdowns to Monthly Breakdown's filter panel

### 6. Seed data: new projects for Netherlands and France
- Insert ~5 projects (2-3 per country) with sites, budget_type (IC/Ad Hoc/CAPEX), budget_classification (Mandatory/Speculative), contracts, milestones, monthly breakdowns

### Files to edit
- `src/hooks/useDashboardData.ts` — add Netherlands, France to COUNTRY_TO_SITE_GROUP
- `src/pages/ContractsList.tsx` — subtotal rows, missing countries, new filters, budget type/classification
- `src/pages/MonthlyBreakdownList.tsx` — missing countries, new columns, new filters
- Database — insert new projects for NL/FR with related data

