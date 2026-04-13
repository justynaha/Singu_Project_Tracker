

## Plan: Global Contracts page + Add contractor/description fields

### Database migration

Add two new columns to the `contracts` table:
- `contractor` text, nullable
- `description` text, nullable

### 1. Database migration — add columns

```sql
ALTER TABLE public.contracts ADD COLUMN contractor text;
ALTER TABLE public.contracts ADD COLUMN description text;
```

### 2. `src/components/project-detail/ContractsTab.tsx` — Update form and table

**Add Contract modal**: Add two new fields:
- **Contractor** — text input
- **Contract Description** — textarea

**Table columns**: Add `Contractor` and `Description` columns to the table. Rename `Amount ({currency})` → `Contracted ({currency})` and `Amount (EUR)` → `Contracted (EUR)`.

**Props**: Update `onCreateContract` to accept `contractor` and `description` fields.

### 3. `src/hooks/useProjectDetail.ts` — Update Contract interface and createContract

- Add `contractor` and `description` to the Contract-related types.
- Pass new fields in the insert call.

### 4. `src/pages/ContractsList.tsx` — New global Contracts page

Create a new page that fetches all contracts joined with project data (project name, site). Display a table with columns:
- Contract ID, Project ID, Project Title, Site, Date, Contracted LC, Contracted EUR, Status, Contractor, Contract Description

Use the same table styling and layout patterns as `Projects.tsx` (search, pagination).

### 5. `src/components/AppSidebar.tsx` — Add "Contracts" submenu item

Add a `Contracts` entry under the "Project Tracker" submenu (after "Projects"), using the `FileSignature` icon, linking to `/contracts`.

### 6. `src/App.tsx` — Add route

Add `<Route path="/contracts" element={<ContractsList />} />`.

### 7. Update sidebar active detection

Update `isGroupActive` for "Project Tracker" to also match `/contracts`.

