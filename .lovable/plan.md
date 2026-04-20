

## Plan: Empty state + working Import from XLS flow

### 1. Update mock Excel data (`src/pages/Projects.tsx`)
Replace placeholder rows with realistic names matching their work category, all FY `2025/2026`, each with an Owner:

| Name | Site | Work category | FY | Budget | Currency | Owner | Type | Classification |
|---|---|---|---|---|---|---|---|---|
| LED Lighting Retrofit | Bedzin | ESG | 2025/2026 | 100000 | EUR | Anna Kowalska | IC | Mandatory |
| Main Switchgear Replacement | Bedzin | ELECTRICAL SYSTEMS | 2025/2026 | 100000 | EUR | Piotr Nowak | IC | Mandatory |
| Roof Solar Panel Installation | Marseille | Sustainability | 2025/2026 | 890000 | EUR | Claire Dubois | IC | Mandatory |
| Automated Gate Access System | Lyon | Building upgrading works | 2025/2026 | 350000 | EUR | Marc Lefevre | Ad Hoc | Speculative |
| Cross-Dock Area Expansion | Tilburg | Asset Enhancement Initiatives | 2025/2026 | 1250000 | EUR | Jeroen van Dijk | IC | Mandatory |
| EV Charging Station Network | Schiphol | Sustainability | 2025/2026 | 680000 | EUR | Sophie de Vries | IC | Mandatory |

Add **Owner** column to the headers list (red), so total columns become 10 (A–J).

### 2. Empty state on Projects list (`src/pages/Projects.tsx`)
Add session-level state `hasImported` (default `false`). When `false`, hide the real project list and render an empty state:
- Centered icon (e.g. `FolderOpen` from lucide), heading "No projects yet", subtext "Import projects from XLS or add your first project to get started."
- Existing `Add Project` and `Import from XLS` buttons stay in the header.

### 3. Excel preview close → return to Import modal with file attached
- When user closes the Excel preview, reopen the Import modal in an "uploaded" state (mock filename like `projects-template.xlsx`, ~28 KB) showing:
  - File chip with name, size, and a remove (X) button.
  - **Import** button (primary) at the bottom-right of the modal.
  - Cancel button on the left.

### 4. Import action
- Clicking **Import** → set `hasImported = true`, close modal, show toast "6 projects imported successfully", and render the projects list normally (existing data from Supabase).
- No DB writes; this is a visual flow only. The real projects already in the database appear once `hasImported` flips to true.

### Files
- `src/pages/Projects.tsx` (only file changed)

