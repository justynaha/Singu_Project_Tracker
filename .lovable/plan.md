

## Plan: Add "Comments" column to contracts

### 1. Database migration
Add a text column to the `contracts` table:
```sql
ALTER TABLE public.contracts ADD COLUMN comments text;
```

### 2. `src/components/project-detail/ContractsTab.tsx`
- Add `comments: string | null` to the `Contract` interface
- Add "Comments" column to the table (after "Agreement Signed"), displaying the text or "—"
- In the Add Contract modal, add a "Comments" field (Textarea) at the bottom with an info icon and helper text: "Important: add info about phased payments"
- Pass `comments` in the `onCreateContract` payload
- Adjust footer `colSpan` for the new column

### 3. `src/pages/ContractsList.tsx`
- Add `comments` to the `ContractWithProject` interface
- Add "Comments" column header and cell (after "Agreement Signed")
- Update empty-state `colSpan` from 11 to 12

### 4. `src/hooks/useProjectDetail.ts`
- Include `comments` in the Supabase insert when creating a contract

