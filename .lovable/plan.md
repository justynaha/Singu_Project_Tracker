

## Plan: Add Country, Description columns + Group by Site Group in Contract Tracker

### Changes to `src/pages/ContractsList.tsx`

**1. Add new columns to `visibleColumns` and `columnDefs`**
- Add `country` (derived from `siteToCountry[proj.site]`) after `site`
- Add `description` (from `contract.description`) after `agreementSigned`

**2. Group rows by Site Group**
- After filtering, sort/group `filtered` contracts by site group (using `COUNTRY_TO_SITE_GROUP` mapping: WE → "Western Europe", HU → "Hungary", PL → "Poland")
- Render a group header row (`TableRow` spanning all columns with the site group name in bold, light background) before each group's contracts
- Site group display names map: `WE` → "Western Europe", `PL` → "Poland", `HU` → "Hungary"

**3. Update table rendering**
- In the `<TableHeader>`, add `Country` and `Description` heads at the right positions
- In the body, iterate over grouped data: for each group, render a header row then the contract rows
- In each contract row, add the `country` and `description` cells
- Update `visibleBeforeFinancial` to account for the two new columns
- Update footer `colSpan` accordingly

**4. Update XLS export**
- Include `Country` and `Description` columns in the exported data (respecting visibility)

### Column order (after change)
`[actions] | Contract ID | Project Number | Project Title | Site | Country | Date | Contractor | Status | Agreement Signed | Description | Contracted (EUR) | Invoiced (EUR) | Balance (EUR)`

### Files to edit
- `src/pages/ContractsList.tsx` (~60 lines changed/added)

