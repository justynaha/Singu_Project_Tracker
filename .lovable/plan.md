

## Plan: Redesign Contracts Tab with Side Panel

### Overview
Simplify the contracts table to show only key columns. Clicking a row opens a detail side panel (inspired by `RowDetailDrawer` from Project Tracker Base). Actions (edit, add invoice) are accessed via a three-dot menu on the left. Invoiced and Balance columns appear dynamically.

### Changes

#### 1. `src/components/project-detail/ContractsTab.tsx` — full rewrite of layout

**Table columns (simplified):**
- Three-dot menu icon (left) — dropdown with "Edit" and "Add Invoice" actions
- Contract ID
- Date
- Status (badge)
- Contractor
- Contracted (LC) — hidden if currency is EUR
- Contracted (EUR)
- Invoiced (EUR) — only shown if any contract has invoices
- Balance (EUR) — only shown if any contract has invoices

**Row click** → opens side panel for that contract (sets `selectedContract` state).

**Side panel** (right side, ~380px, slides in from right, similar to `RowDetailDrawer`):
- Header: Contract number + close button
- Details section: Date, Status, Contractor, Description, Agreement Signed, Comments, Contracted LC, Contracted EUR
- Invoices section: List of invoices with invoice number, amount LC, amount EUR, attachment link, delete button
- Balance display at bottom of invoices section

**Three-dot menu** (using `DropdownMenu`):
- "Edit" → opens existing edit modal
- "Add Invoice" → opens existing invoice modal

**Footer row**: Total row with sums (same as before, left-aligned label)

#### 2. Component structure
- No new files needed — everything stays in `ContractsTab.tsx`
- The side panel is rendered conditionally within the component, using the same pattern as `RowDetailDrawer`: a `div` with `w-[380px] border-l` that slides in
- The table + panel are wrapped in a `flex` container

### Files to edit
- **Edit**: `src/components/project-detail/ContractsTab.tsx`

