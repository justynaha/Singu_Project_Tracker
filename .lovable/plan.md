

## Plan: Update Budget field — formatting and label

### Changes to both `src/pages/Projects.tsx` and `src/components/project-detail/EditProjectModal.tsx`

1. **Rename label** from `Project budget` to `Budget (Estimated spend)`.

2. **Replace `type="number"` with `type="text"`** and add formatting logic:
   - On display: format the value with thousand separators (e.g. `1 000 000.00` or `1,000,000.00`).
   - On change: strip non-numeric characters (except decimal point), store raw number in state.
   - This removes the browser's native up/down spinner arrows.
   - Add `inputMode="decimal"` for mobile numeric keyboard.

### No database or hook changes needed.

