

## Plan: Group Monthly Breakdown by Site Group with collapsible headers

### What changes

Group the project rows in the Monthly Breakdown report table by Site Group (Western Europe, Poland, Hungary, Other) — the same grouping logic used in Contract Tracker. Each group gets a collapsible header row with a chevron icon, group name, and project count in parentheses.

### Implementation

**File: `src/pages/MonthlyBreakdownList.tsx`**

1. **Add state for collapsed groups**
   - `collapsedGroups` (Set) + `toggleGroup` function — same pattern as ContractsList

2. **Add `SITE_GROUP_DISPLAY` map** (already exists in ContractsList):
   ```
   WE → "Western Europe", PL → "Poland", HU → "Hungary"
   ```

3. **Add `groupedProjects` useMemo** — group `filteredProjects` by site group:
   - For each project, determine country from `siteToCountry`, then site group from `COUNTRY_TO_SITE_GROUP`
   - Group into `{ group, label, projects }[]` ordered WE → PL → HU → Other
   - Calculate per-group subtotals for monthly values and total

4. **Replace flat project rows with grouped rendering**:
   - For each group, render a collapsible header row (bg-muted/40, chevron icon, label + project count)
   - When expanded, render the project rows within that group
   - After each group's projects, render a **Subtotal** row (bg-orange-100, same style as Contract Tracker subtotals) showing sum of monthly columns and total for that group

5. **Keep existing summary rows** (Grand Total, Budget, Contracted, etc.) unchanged at the bottom

6. **Update XLS export** to include group headers and subtotals in the exported data

### Visual result
```text
┌──────────────────────────────────────────────────┐
│ ▼ Western Europe (3 projects)                    │  ← collapsible header
│   #13536  Project A   100  200  ...  1,200.00    │
│   #13537  Project B   ...                        │
│   #13538  Project C   ...                        │
│   Subtotal — Western Europe    ...  3,600.00     │  ← orange bg
│ ▼ Poland (2 projects)                            │
│   #13539  Project D   ...                        │
│   #13540  Project E   ...                        │
│   Subtotal — Poland            ...  2,400.00     │
│ Grand Total (EUR)              ...  6,000.00     │
│ Budget (EUR)                       10,000.00     │
│ ...                                              │
└──────────────────────────────────────────────────┘
```

