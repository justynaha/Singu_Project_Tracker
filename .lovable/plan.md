

## Plan: Side Panel Position, Layout, and LC Amount Columns

### Overview
Three changes: (1) make the side panel span full height starting under the app bar, (2) adjust panel content order and hide contract ID, (3) add three local-currency amount columns to the table.

### Changes to `src/components/project-detail/ContractsTab.tsx`

#### 1. Side panel — full height from app bar
Change the side panel from a flex child to a `fixed` positioned element anchored at `top-16 right-0 bottom-0` (16 = 4rem = app bar height). This makes it overlay the content starting directly under the top app bar.

#### 2. Side panel content adjustments
- **Remove** the contract ID from the header (the `h3` showing `selectedContract.contract_number`). Replace with the contractor name or just "Contract Details" label.
- **Reorder details section**: move Contractor before Status.

#### 3. Add 3 LC columns to table (when `showLcColumn` is true)
Add these columns next to their EUR counterparts:
- **Invoiced (LC)** — sum of invoice `amount_lc` values, shown when invoices exist
- **Balance (LC)** — `contracted LC - invoiced LC`, shown when invoices exist
- These join the existing `Contracted (LC)` column

Update the footer Total row to include sums for all three LC columns.

### Files to edit
- `src/components/project-detail/ContractsTab.tsx`

