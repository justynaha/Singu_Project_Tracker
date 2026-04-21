

## Match widget area background to page

The Status + Budget widget bar above the tabs still looks like a separate white/panel block. The goal is to make that strip blend seamlessly with the page background — exactly the same look as the empty area surrounding the tab card (second screenshot).

### Change

In `src/pages/ProjectDetail.tsx`, the wrapper around `MilestoneStatusWidget` + `BudgetWidget` currently is:

```tsx
<div className="flex mb-6 p-4 bg-background rounded-lg">
```

Although `bg-background` matches the page token, the explicit `bg-background rounded-lg p-4` still renders as a distinct block. Make it transparent and drop the panel framing so it sits directly on the page surface:

```tsx
<div className="flex mb-6">
```

(Keep internal spacing/padding unchanged inside the two widget components themselves.)

### Result

- No visible panel/card behind the milestones + budget row.
- That area visually equals the page background — identical to the gutter around the tab card shown in the second screenshot.
- No other visual regressions: widgets keep their own internal layout (the divider line between Milestones and Budget remains via `border-l` inside `BudgetWidget`).

### Files touched

- `src/pages/ProjectDetail.tsx` — single className change on the widget wrapper div.

