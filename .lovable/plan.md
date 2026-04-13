

## Plan: Add Comments, Responsible, Start Date, Files columns to Project Plan

### Overview
Add three new columns (Comments, Responsible, Start Date) to the Project Plan table, matching the pattern from [Project Tracker Base](/projects/58776ceb-2a8f-4fe6-95c8-e3cece811f67). This requires a database migration to add the fields to `timeline_items`, plus UI updates in `TimelineV2Tab.tsx`.

### Database Migration
Add three columns to the `timeline_items` table:
```sql
ALTER TABLE public.timeline_items 
  ADD COLUMN comments text,
  ADD COLUMN responsible text,
  ADD COLUMN start_date date;
```

### Changes to `src/components/project-detail/TimelineV2Tab.tsx`

1. **Add columns to `DEFAULT_COLUMNS`** — insert `responsible`, `start_date`, and `comments` between existing columns (after Status, before Due Date/Files):
   - `{ id: "responsible", label: "Responsible", visible: true }`
   - `{ id: "start_date", label: "Start Date", visible: true }`
   - `{ id: "comments", label: "Comments", visible: true }`

2. **Add `renderCellValue` cases**:
   - `"responsible"` — `EditableTextCell` saving to `timeline_items.responsible`
   - `"start_date"` — `DatePickerCell` saving to `timeline_items.start_date`
   - `"comments"` — `EditableTextCell` saving to `timeline_items.comments`

3. **Add handler callbacks** for `start_date`, `responsible`, `comments` — calling `onUpdateItem(id, { field: value })`.

4. **Column width hints** in the header: `min-w-[140px]` for start_date, `min-w-[120px]` for responsible, `min-w-[150px]` for comments.

### Changes to `src/hooks/useProjectDetail.ts`
Update the `TimelineItem` interface to include the new fields:
- `comments: string | null`
- `responsible: string | null`  
- `start_date: string | null`

### Files to edit
- **Migration**: new SQL migration for `timeline_items` columns
- **Edit**: `src/hooks/useProjectDetail.ts` (TimelineItem interface)
- **Edit**: `src/components/project-detail/TimelineV2Tab.tsx` (columns, cell rendering, handlers)

