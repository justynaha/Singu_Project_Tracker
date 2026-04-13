

## Plan: Add "Agreement Signed" column

### 1. Database migration
Add a new column to the `contracts` table:
```sql
ALTER TABLE public.contracts ADD COLUMN agreement_signed boolean NOT NULL DEFAULT false;
```

### 2. `src/components/project-detail/ContractsTab.tsx`
- Add `agreement_signed` to the `Contract` interface (`agreement_signed: boolean`)
- Add "Agreement Signed" column to the table (after Status), displaying "Yes" or "No"
- Add `agreementSigned` state (default `false`) and a radio group (Yes/No) at the bottom of the Add Contract modal, below the Status field
- Pass `agreement_signed` in `onCreateContract` payload
- Update the `onCreateContract` type to include `agreement_signed?: boolean`
- Add "Agreement Signed" cell to the footer row (empty cell for alignment)

### 3. `src/pages/ContractsList.tsx`
- Add `agreement_signed` to the `ContractWithProject` interface
- Add "Agreement Signed" column header (after Status)
- Display "Yes" or "No" in each row
- Update `colSpan` in empty-state row from 10 to 11

### 4. `src/pages/ProjectDetail.tsx`
- Pass `agreement_signed` when calling the contract insert to Supabase

