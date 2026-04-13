

## Plan: Add Contracts tab to Project Detail

### Database

- Create `contracts` table via migration:
  - `id` uuid PK (default `gen_random_uuid()`)
  - `project_id` uuid NOT NULL
  - `contract_number` text NOT NULL
  - `contract_date` date
  - `amount_lc` numeric (local currency value)
  - `amount_eur` numeric (EUR value)
  - `status` text NOT NULL DEFAULT 'Draft'
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()
- Enable RLS with public access policies (matching existing pattern).
- Insert sample data for the current project (contract_number like `280141`, `280142`, etc.).

### New file: `src/components/project-detail/ContractsTab.tsx`

- Table with columns: Contract ID, Date, Amount (LC), Amount (EUR), Status.
- Status rendered as a badge.
- Simple read-only list for now.

### `src/hooks/useProjectDetail.ts`

- Fetch contracts from the `contracts` table filtered by `project_id`.
- Return `contracts` array.

### `src/pages/ProjectDetail.tsx`

- Import `ContractsTab` and add a `FileSignature` icon from lucide.
- Insert `{ id: "contracts", label: "Contracts", icon: FileSignature }` as the second tab (after Overview).
- Render `ContractsTab` when active, passing contracts data.

