

## Plan: Add Invoices to Contracts

### Overview
Each contract can have invoices. Below each contract row, show its invoices and a "+ Add Invoice" button. An "Add Invoice" modal collects Amount (LC), Invoice Number, and optional attachment. A "Balance" row shows the difference between contracted amount and total invoiced.

### 1. Database migration
Create `invoices` table:
```sql
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  invoice_number text NOT NULL,
  amount_lc numeric NOT NULL DEFAULT 0,
  attachment_name text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.invoices FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON public.invoices FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.invoices FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete" ON public.invoices FOR DELETE TO public USING (true);
```

### 2. `src/components/project-detail/ContractsTab.tsx`
- Fetch invoices for all contract IDs on mount (grouped by `contract_id`)
- Replace flat `contracts.map` with an expanded layout: for each contract, render:
  1. The existing contract row
  2. Sub-rows for each invoice (indented, showing invoice number, amount LC, attachment link)
  3. A **Balance** row: `contracted amount_lc - sum(invoice amounts)`
  4. A `+ Add Invoice` button row
- Add an "Add Invoice" modal with fields: Invoice Number (text, required), Amount LC (number, required), Attachment (file input, optional)
- On submit, insert into `invoices` table and refresh local state
- Attachment: upload to a storage bucket or store as base64 — since the user said "optional attachment", we'll create a `contract-attachments` storage bucket for file uploads

### 3. Storage bucket (for attachments)
Create a public storage bucket `contract-attachments` via migration for invoice file uploads.

### Files to create/edit
- **Migration**: new `invoices` table + `contract-attachments` storage bucket
- **Edit**: `src/components/project-detail/ContractsTab.tsx`

