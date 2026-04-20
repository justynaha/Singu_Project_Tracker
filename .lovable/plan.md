

## Plan: Mock Excel preview after clicking Download

When the user clicks **Download** in the "Import from XLS" modal, instead of downloading a file, replace the modal contents with a full-screen mock Excel preview showing the template with 6 sample rows pulled from real project data.

### Implementation

**File to edit:** `src/pages/Projects.tsx`

1. Add state `const [showExcelPreview, setShowExcelPreview] = useState(false)` and update the Download button to set it true (also close the import modal, or render the preview as a separate large Dialog).

2. Add a new `<Dialog>` with `DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden"` rendering an Excel-like grid.

3. **Excel mock structure** (mimic screenshot styling):
   - Dark gray (`bg-zinc-800 text-white`) top column-letter row: A, B, C, … J
   - Light gray (`bg-zinc-100`) left row-number column: 1–34
   - Row 1 = header row, bold, centered. Color rules per column:
     - Red (`text-red-600`): **Name**, **Site**, **Currency**, **Owner**
     - Black: **Description**, **Work category**, **Fiscal year**, **Budget**, **Budget type**, **Budget classification**
   - Rows 2–7 prefilled with 6 projects from the database:

| Name | Site | Work category | FY | Budget | Currency | Budget type | Classification |
|---|---|---|---|---|---|---|---|
| Test 1 | Bedzin | ESG | 2026 | 100000 | EUR | IC | Mandatory |
| Test 1 | Bedzin | ELECTRICAL SYSTEMS | 2026 | 100000 | EUR | IC | Mandatory |
| Roof Solar Panel Installation | Marseille | Sustainability | 2025/2026 | 890000 | EUR | IC | Mandatory |
| Automated Gate Access System | Lyon | Building upgrading works | 2025/2026 | 350000 | EUR | Ad Hoc | Speculative |
| Cross-Dock Area Expansion | Tilburg | Asset Enhancement Initiatives | 2025/2026 | 1250000 | EUR | IC | Mandatory |
| EV Charging Station Network | Schiphol | Sustainability | 2025/2026 | 680000 | EUR | IC | Mandatory |

   - Description and Owner left empty for sample rows (template fields).
   - Rows 8–34 empty.
   - Use `border border-zinc-300`, `text-xs`, monospace-ish look (`font-sans`), cell height ~24px, white bg.

4. Keep it purely visual (no real .xlsx download). Add a small "Close" button in the top-right corner of the preview.

