

## Plan: Add Edit Contract functionality

### Overview
Add a pencil icon on the left side of each contract row that opens an "Edit Contract" modal with the same fields as the Add Contract form (V1 mode). Changes are saved via a new `updateContract` function.

### Changes

#### 1. `src/hooks/useProjectDetail.ts`
- Add `updateContract` function that updates a contract by ID in the `contracts` table and updates local state
- Add it to the return object

#### 2. `src/components/project-detail/ContractsTab.tsx`
- Import `Pencil` icon from lucide-react
- Add `onUpdateContract` prop to `ContractsTabProps`
- Add `editingContract` state (`Contract | null`) and `showEditModal` state
- Add a new column (first column) with pencil icon button in each row; clicking sets `editingContract` and opens the edit modal
- Add an "Edit Contract" dialog that reuses the same form fields as V1 (no V1/V2 toggle — edit is always manual). Pre-fill all fields from the selected contract
- On save, call `onUpdateContract` with the contract ID and updated fields, then close the modal
- Add empty `<TableCell />` in the footer for the new column

#### 3. `src/pages/ProjectDetail.tsx`
- Pass `onUpdateContract` prop to ContractsTab, wired to the new `updateContract` from the hook

### Files to edit
- `src/hooks/useProjectDetail.ts`
- `src/components/project-detail/ContractsTab.tsx`
- `src/pages/ProjectDetail.tsx`

