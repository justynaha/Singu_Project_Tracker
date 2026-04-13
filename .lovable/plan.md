

## Plan: Clean up New Project and Edit Project modals

### Changes to `src/pages/Projects.tsx` (New Project modal)

1. **Remove the character counter** (`{formData.workDescription.length}/500`) below the Work Description textarea.

2. **Wrap Building and Tenant fields** inside a collapsible "Advanced" section:
   - Add a `showAdvanced` state toggle (default `false`).
   - Render a `<Button variant="ghost">` labeled "Advanced" with a chevron icon that toggles `showAdvanced`.
   - When expanded, show the Building and Tenant select fields.

### Changes to `src/components/project-detail/EditProjectModal.tsx` (Edit Project modal)

Apply the same two changes:
1. Remove the `{workDescription.length}/500` counter line.
2. Wrap Building and Tenant fields under an "Advanced" toggle button.

### No database or hook changes needed.

