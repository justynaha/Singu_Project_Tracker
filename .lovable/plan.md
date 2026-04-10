

## Plan: Add Work Categories page and Foreign Exchange page, remove Templates

### Overview
Copy the Work Categories page from the reference project (with its hook and DB table), remove the "Templates" sidebar entry, and add an empty "Foreign Exchange" page under Master data > Project Tracker.

### Steps

**1. Create database table `project_types`**
- Migration to create `project_types` table with columns: `id` (uuid), `name` (text, unique), `description` (text nullable), `default_template_id` (uuid nullable), `status` (text default 'active'), `parent_id` (uuid nullable self-ref), `created_at` (timestamptz)
- RLS: allow all operations for now (public-facing master data management, no auth yet)

**2. Copy `src/hooks/useProjectTypes.ts`**
- Adapt from reference project — the hook fetches from `project_types`, builds a tree, and provides CRUD functions
- Remove references to `project_templates` and `projects.project_type` (those tables don't exist here yet) — usage_count will just be 0

**3. Copy `src/pages/ProjectTypes.tsx`**
- Adapt from reference project — the full Work Categories page with tree view, expand/collapse, add/edit/delete modals
- Remove `useViewSettings` context references (doesn't exist in this project) and the empty-state toggle logic

**4. Update `src/App.tsx`**
- Add route `/master-data/project-types` pointing to `ProjectTypes`
- Add route `/master-data/foreign-exchange` with empty placeholder
- Remove route `/master-data/templates`

**5. Update `src/components/AppSidebar.tsx`**
- Under Master data > Project Tracker children: keep "Work categories", remove "Templates", add "Foreign Exchange"

