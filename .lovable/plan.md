

## Plan: Add "Work Description" field to New Project modal and Details tab

### Database
- Add `work_description` column (text, nullable) to `projects` table via migration.

### `src/pages/Projects.tsx`
- Add `workDescription: ""` to `formData` state.
- After the Title field in the New Project dialog, add a Textarea for "Work Description (optional)" with `maxLength={500}` and a character counter (e.g. "123/500").
- Pass `description: formData.workDescription || undefined` in `handleFormSubmit` (map to the existing `description` column — or the new `work_description` column).
- Reset `workDescription` on close.

### `src/components/project-detail/OverviewTab.tsx`
- Add `work_description?: string | null` to the Project interface.
- Insert a `<DetailRow label="Work description" value={project.work_description} />` right after the "Name" row.

### `src/hooks/useProjects.ts`
- Add `work_description` to `CreateProjectInput` interface and to the insert call.

### `src/hooks/useProjectDetail.ts`
- Ensure `work_description` is selected from the `projects` table.

### `src/components/project-detail/EditProjectModal.tsx`
- Add editable `workDescription` field (Textarea, 500 char limit) so it can be updated after creation.

### Technical note
Using a new `work_description` column (not the existing `description`) to keep semantics clear. The migration adds: `ALTER TABLE projects ADD COLUMN work_description text;`

