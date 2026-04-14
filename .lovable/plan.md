

## Plan: Reorder columns by currency group + add Columns visibility button

### Overview
Reorder the contract table columns so financial values are grouped by currency (all LC columns first, then all EUR columns), and add a "Columns" popover button above the table letting users toggle column visibility.

### Changes

**1. `src/components/project-detail/ContractsTab.tsx`**

**Column reordering** — Change header and body column order from the current interleaved pattern to:
- `Date | Status | Contractor | Contracted (PLN) | Invoiced (PLN) | Balance (PLN) | Contracted (EUR) | Invoiced (EUR) | Balance (EUR)`
- When currency is EUR, only show one set: `Contracted | Invoiced | Balance`

**Column visibility state** — Add state:
```tsx
const [visibleColumns, setVisibleColumns] = useState({
  date: true,
  status: true,
  contractor: true,
  contractedLc: true,
  invoicedLc: true,
  balanceLc: true,
  contractedEur: true,
  invoicedEur: true,
  balanceEur: true,
});
```

**Columns button** — Add a `Popover` with a "Columns" button (styled like the screenshot — blue with a grid icon) next to the "Add contract" button. The popover lists each column with a `Switch` toggle. Column labels are context-appropriate: "Date", "Status", "Contractor", "Contracted (PLN)", "Invoiced (PLN)", "Balance (PLN)", "Contracted (EUR)", "Invoiced (EUR)", "Balance (EUR)". When currency is EUR, LC columns are hidden from the popover.

**Conditional rendering** — Wrap each `<TableHead>` and corresponding `<TableCell>` / footer cell with `{visibleColumns.xxx && (...)}`.

### Files to edit
- `src/components/project-detail/ContractsTab.tsx`

