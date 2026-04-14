

## Plan: Visual improvements to CAPEX Tracker table

### What changes

1. **Add empty separator row between site groups** — a blank row after each group's Total row to visually split sections
2. **Color-code IC subsections blue** — IC header row and IC subtotal row get blue background (`bg-blue-50` / `bg-blue-100`)
3. **Color-code Ad Hoc subsections orange** — Ad Hoc header and subtotal keep orange (`bg-orange-50`)
4. **Add Country and Site columns** — insert two new columns between `#` and `Project Name` in the table header, project rows, and all summary/subtotal rows. Values come from the project's `site` field and the `siteToCountry` mapping.

### Implementation — single file: `src/pages/MonthlyBreakdownList.tsx`

**1. Table header (~line 580-587)**
- Add `<TableHead>Country</TableHead>` and `<TableHead>Site</TableHead>` after the `#` column
- Update `colCount` calculation (+2)
- Update sticky `left` offset for Project Name column

**2. Project rows (~line 629-643)**
- Add Country and Site cells after `#` cell
- Country = `siteToCountry[p.site]` or "—"
- Site = `p.site` or "—"

**3. Subsection styling (~line 618, 646)**
- IC header: `bg-blue-50` instead of `bg-muted/20`
- IC subtotal: `bg-blue-100` instead of `bg-orange-50`
- Ad Hoc header: keep `bg-orange-50`
- Ad Hoc subtotal: keep `bg-orange-50`

**4. Separator row (~after line 676)**
- After each group's Total row, render an empty `<TableRow>` with reduced height (`h-4`) and no border

**5. Summary/subtotal rows**
- Add empty Country and Site cells to all subtotal, total, and grand total rows to maintain column alignment

**6. XLS export (~line 323-400)**
- Add Country and Site columns to exported rows
- Maintain separator rows in export

