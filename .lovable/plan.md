

## Plan: Add Country, Site, Project Name to column visibility toggles

### Changes in `src/pages/MonthlyBreakdownList.tsx`

1. **Expand `visibleExtraColumns` state** to include `country`, `site`, and `projectName` (all defaulting to `true`):
   ```ts
   { budgetType: true, budgetClassification: true, country: true, site: true, projectName: true }
   ```

2. **Add entries to `extraColumnDefs`** array (before Budget Type):
   ```ts
   { key: "country", label: "Country" },
   { key: "site", label: "Site" },
   { key: "projectName", label: "Project Name" },
   ```

3. **Conditionally render** the Country, Site, and Project Name `<TableHead>` and `<TableCell>` elements based on `visibleExtraColumns.country`, `.site`, `.projectName`.

4. **Update all `colSpan` and `colCount` calculations** to account for the three new toggleable columns instead of the current hardcoded `4` base count. The base becomes `1` (for #) plus conditionally added country/site/projectName.

5. **Update export logic** to conditionally include Country, Site, Project Name columns.

### Files to edit
- `src/pages/MonthlyBreakdownList.tsx`

