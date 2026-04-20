

## Plan: Freeze group header, subtotal, and grand total rows during horizontal scroll

**Problem:** In Reports → Contract Tracker, when scrolling the table horizontally, the contents of these rows scroll with the table:
- Group header rows ("Western Europe", "Poland", "Hungary")
- Subtotal rows ("Subtotal — …")
- Grand Total row

They should stay visually fixed so the labels and subtotal amounts remain readable at all times.

### File
`src/pages/ContractsList.tsx`

### Changes

1. **Group header row** (line ~832‑839): the single `colSpan` cell becomes `sticky left-0 z-10` with a solid background (`bg-muted`). Because it spans the full width, sticking it to `left-0` means the label is always visible at the left edge regardless of horizontal scroll.

2. **Subtotal rows** (line ~884‑891):
   - The label cell (`colSpan={visibleBeforeFinancial}`) → `sticky left-0 z-10 bg-orange-100`.
   - The 3 financial cells (Contracted / Invoiced / Balance EUR) → `sticky right-0 z-10 bg-orange-100`, with cumulative `right-[Xpx]` offsets so all three stay pinned to the right edge.

3. **Grand Total row** (line ~899‑904):
   - Label cell → `sticky left-0 z-10 bg-amber-900`.
   - 3 financial cells → `sticky right-0 z-10 bg-amber-900`, cumulative right offsets.

4. **Background opacity**: ensure all sticky cells use opaque backgrounds (no `/40`, `/50`) so underlying scrolling rows don't bleed through. The group header currently uses `bg-muted/40` on the row — switch the sticky cell itself to opaque `bg-muted`.

### Out of scope
- Vertical sticky behavior (header/footer pinning during vertical scroll) — already in place via `sticky top-0` on `<TableHeader>`; not changing.
- Per-column sticky for data rows — already in place for the 5 frozen leftmost columns; not changing.

