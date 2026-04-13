

## Plan: Contracts Tab — Hide Contract ID Column, Restructure Side Panel

### Overview
Three changes: (1) remove Contract ID column from table, (2) restructure the side panel to show invoices first, then a clear financial summary (Contracted → Invoiced → Balance) at the bottom, (3) keep Contract ID visible only in the side panel details.

### Changes to `src/components/project-detail/ContractsTab.tsx`

#### 1. Remove Contract ID column from table
- Remove `<TableHead>Contract ID</TableHead>` from the header
- Remove the `<TableCell>{c.contract_number}</TableCell>` from each row
- Update the Total footer row: remove the extra empty `<TableCell />` and move the "Total" label accordingly

#### 2. Restructure side panel content order
Reorder the panel sections so invoices come first, then financials:

1. **Header** — "Contract Details" label + contractor name (unchanged)
2. **Details section** — Contract ID, Date, Contractor, Status, Agreement Signed, Description, Comments (remove the Contracted LC/EUR lines from here)
3. **Invoices section** — List of invoices with number, amounts, attachments, delete button (move above financials)
4. **Financial summary section** (new clear layout, always visible):
   - Contracted (LC) / Contracted (EUR) — stacked rows
   - Invoiced (LC) / Invoiced (EUR) — stacked rows (if invoices exist)
   - Balance (LC) / Balance (EUR) — stacked rows (if invoices exist)
   - Each row: label left, value right, clean spacing

### Files to edit
- `src/components/project-detail/ContractsTab.tsx`

