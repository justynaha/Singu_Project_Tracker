

## Plan: Split contract side panel into two tabs — "Contract Details" and "Invoices (n)"

### Overview
Add tabs at the top of the contract side panel. The first tab ("Contract Details") keeps the details section and financial summary. The second tab ("Invoices (n)") shows the invoices list and add invoice button.

### Changes to `src/components/project-detail/ContractsTab.tsx`

1. **Add Tabs import** from `@/components/ui/tabs` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`)

2. **Restructure the side panel content** (lines ~574–720):
   - After the header (Contract Details title + contractor name + close button), add a `<Tabs defaultValue="details">` wrapper
   - `<TabsList>` with two triggers:
     - `<TabsTrigger value="details">Contract Details</TabsTrigger>`
     - `<TabsTrigger value="invoices">Invoices ({selectedInvoices.length})</TabsTrigger>`
   - `<TabsContent value="details">` — contains the existing Details section (lines 590–626) and Financial Summary section (lines 682–718)
   - `<TabsContent value="invoices">` — contains the existing Invoices list (lines 629–679, the invoice items and "+ Add Invoice" button)

3. **Styling**: TabsList gets `w-full` styling to span the panel width, placed right below the header border.

### No database changes needed

### Files to edit
- `src/components/project-detail/ContractsTab.tsx`

