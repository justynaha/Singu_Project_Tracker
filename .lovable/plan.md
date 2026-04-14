

## Plan: Rebuild `/contracts` page with full ContractsTab features

### Overview
Replace the current simple `ContractsList` page with a full-featured version that mirrors the project-level `ContractsTab`, including: table with action menus, side panel with tabs (Contract Details / Invoices), edit/delete modals, invoice management, and filters matching the Projects page (minus "Tracking"). Each row adds Project Number, Project Title, and Site columns.

### Key design decisions
- Fetch all contracts + all projects + all invoices + FX rates upfront
- Each contract's currency comes from its parent project's `currency` field
- Since contracts span multiple currencies, always show EUR amounts (convert per-project FX rate)
- Side panel is the same fixed-position panel as in ContractsTab
- Filters: Site group, Country, Site, Budget line, Status (contract status: Ongoing/Completed), Fiscal year
- Project Number uses the same `13536 + index` scheme
- Clicking Project Number navigates to `/project/:id`

### Changes

**`src/pages/ContractsList.tsx`** — Full rewrite (~800 lines)

1. **Data fetching**: Fetch `projects` (all fields needed for filters), `contracts`, `invoices`, `fx_rates` from Supabase
2. **Filter UI**: Copy the filter bar pattern from `Projects.tsx` — Site group (multi-select), Country, Site, Budget line, Status (Ongoing/Completed instead of project statuses), Fiscal year. Remove "Tracking". Use pending/applied filter pattern with chips.
3. **Table columns**: Action menu (3-dot) | Contract ID | Project Number (clickable link) | Project Title | Site | Date | Contractor | Contracted (EUR) | Invoiced (EUR) | Balance (EUR) | Status | Agreement Signed
4. **Row click** opens side panel (same as ContractsTab): fixed right panel with Contract Details tab and Invoices tab
5. **Action menu**: Edit, Add Invoice (same modals as ContractsTab)
6. **Edit modal** with delete functionality (same as ContractsTab)
7. **Invoice modal** with file upload (same as ContractsTab)
8. **Footer totals** for Contracted, Invoiced, Balance
9. **Pagination** (10 per page)
10. **FX conversion**: For each contract, look up its project's currency, fetch matching FX rate, convert to EUR

### No other files need changes
- Routing already exists in `App.tsx` (`/contracts` -> `ContractsList`)
- No database changes needed

### Files to edit
- `src/pages/ContractsList.tsx`

