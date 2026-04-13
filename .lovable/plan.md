

## Plan: Fix Add Contract button layout, editable currency, radio statuses

### 1. `src/components/project-detail/ContractsTab.tsx`

**Button layout** — Match FilesTab pattern: wrap in `<div className="p-4">` and place button in `<div className="mb-4">` without the counter/justify-between layout.

**Local Currency field** — Change from disabled `Input` to an editable `Select` dropdown (same currency options as in the New Project modal), defaulting to the project's currency prop.

**Status field** — Replace the `Select` dropdown with `RadioGroup`/`RadioGroupItem` components. Only two options: `Ongoing` and `Completed`. Default to `Ongoing`.

**Status badge mapping** — Update `statusVariant` to handle `ongoing` and `completed` instead of draft/signed/active/closed.

**Default status in state** — Change from `"Draft"` to `"Ongoing"`.

### No other file changes needed.

