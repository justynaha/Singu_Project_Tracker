

## Plan: Add "Monthly Breakdown" tab

### Overview
Add a new tab "Monthly Breakdown" after "Contracts" showing a table with monthly columns for the fiscal year (April–March). Users can enter amounts per row, with a Total column on the right. Data is stored in a new database table.

### 1. Database migration
Create a new table `monthly_breakdown` to store row-level monthly data:
```sql
CREATE TABLE public.monthly_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  label text NOT NULL DEFAULT '',
  apr numeric DEFAULT 0, may numeric DEFAULT 0, jun numeric DEFAULT 0,
  jul numeric DEFAULT 0, aug numeric DEFAULT 0, sep numeric DEFAULT 0,
  oct numeric DEFAULT 0, nov numeric DEFAULT 0, dec numeric DEFAULT 0,
  jan numeric DEFAULT 0, feb numeric DEFAULT 0, mar numeric DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.monthly_breakdown FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON public.monthly_breakdown FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.monthly_breakdown FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete" ON public.monthly_breakdown FOR DELETE TO public USING (true);
```

### 2. New component: `src/components/project-detail/MonthlyBreakdownTab.tsx`
- Props: `projectId`, `fiscalYear` (e.g. "2026")
- Generates column headers: "Apr 2026", "May 2026", ..., "Mar 2027"
- Each row has a label cell (editable text) + 12 month cells (editable number inputs) + Total column (read-only sum)
- "Add Row" button to insert a new row
- Delete row button (trash icon)
- Auto-saves on blur (upsert to `monthly_breakdown` table)
- Footer row showing column totals

### 3. `src/hooks/useProjectDetail.ts`
- Add CRUD functions for `monthly_breakdown`: fetch rows, create row, update row, delete row
- Return them from the hook

### 4. `src/pages/ProjectDetail.tsx`
- Import `MonthlyBreakdownTab` and `CalendarRange` icon
- Add tab `{ id: "monthly", label: "Monthly Breakdown", icon: CalendarRange }` after "contracts"
- Render `MonthlyBreakdownTab` with `projectId` and `fiscalYear` from project data

### Files to create/edit
- **Migration**: new table `monthly_breakdown`
- **Create**: `src/components/project-detail/MonthlyBreakdownTab.tsx`
- **Edit**: `src/hooks/useProjectDetail.ts`, `src/pages/ProjectDetail.tsx`

