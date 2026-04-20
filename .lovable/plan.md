

## Plan: Hide Finance column by default on Project Detail

### File
`src/components/project-detail/TimelineV2Tab.tsx`

### Change
In `DEFAULT_COLUMNS` (lines 63‑82), set the `cashflow` ("Finance") group's `visible` to `false`. Its children stay `visible: true`, so when the user toggles Finance back on, all four sub‑columns (Forecasted, Contracted, Invoiced, Remaining) appear as before.

```ts
{ 
  id: "cashflow", 
  label: "Finance", 
  visible: false,   // was true
  children: [ … unchanged … ]
}
```

### Notes
- Other columns (Name, Status, Responsible, Start Date, End Date, Comments, Files) remain visible by default.
- Users with a previously persisted preference in localStorage (if any) will keep their saved setting; only the fresh default changes.

