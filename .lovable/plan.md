

## Plan: Split CAPEX Tracker groups into IC / Ad Hoc subsections

### What changes

Within each site group (Western Europe, Poland, Hungary, Other), split projects into two subsections based on their `budget_type` field: **IC** and **Ad Hoc**. Each subsection gets its own subtotal row, and each site group gets a total row aggregating both subsections.

### Visual result
```text
┌──────────────────────────────────────────────────────┐
│ ▼ Western Europe (5 projects)                        │  ← group header
│   IC                                                 │  ← subsection header (lighter bg)
│     #13536  Project A   100  200  ...  1,200.00      │
│     #13537  Project B   ...                          │
│     Subtotal IC — Western Europe     ...  2,000.00   │  ← subtle subtotal
│   Ad Hoc                                             │  ← subsection header
│     #13538  Project C   ...                          │
│     Subtotal Ad Hoc — Western Europe ...  1,600.00   │
│   Total — Western Europe             ...  3,600.00   │  ← orange bg (existing subtotal style)
│ ▼ Poland (3 projects)                                │
│   ...                                                │
└──────────────────────────────────────────────────────┘
```

### Implementation — single file: `src/pages/MonthlyBreakdownList.tsx`

**1. Update `groupedProjects` useMemo (~line 283)**
- Within each site group, split `gProjects` into two arrays: `icProjects` (budget_type === 'IC') and `adHocProjects` (budget_type === 'Ad Hoc')
- Calculate separate subtotals for IC and Ad Hoc (monthly + total)
- Keep the existing group-level subtotals as the "Total" for the whole section
- Return shape: `{ group, label, projects, subtotals, icProjects, icSubtotals, adHocProjects, adHocSubtotals }`

**2. Update table rendering (~line 570-623)**
- Replace the flat project list inside each group with two subsection blocks:
  - **IC subsection**: header row (text "IC", lighter bg like bg-muted/20), IC project rows, IC subtotal row (bg-orange-50 or similar, labeled "Subtotal IC — {group}")
  - **Ad Hoc subsection**: same pattern with "Ad Hoc" label
  - Skip a subsection entirely if it has no projects
- Rename the existing orange subtotal row to "Total — {group}" (keeps bg-orange-100)

**3. Update XLS export (~line 314-349)**
- Within each group, export IC header + IC projects + IC subtotal, then Ad Hoc header + Ad Hoc projects + Ad Hoc subtotal, then group total row

