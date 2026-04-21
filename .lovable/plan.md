
## Add card background behind Milestone + Budget widgets

Currently the Milestone Status and Budget widgets sit directly on the page background (transparent strip above the tabs). The goal is to wrap that strip in a card surface that matches the look of the tab card below it — same border, radius, and background — so the area above the tabs reads as a unified panel consistent with the rest of the UI.

### Change

In `src/pages/ProjectDetail.tsx`, the wrapper around the two widgets:

```tsx
<div className="flex mb-6">
  <MilestoneStatusWidget ... />
  <BudgetWidget ... />
</div>
```

becomes a card-styled container, mirroring the classes used on the tabs container right below (`bg-card border border-border rounded-lg`):

```tsx
<div className="flex mb-6 bg-card border border-border rounded-lg overflow-hidden">
  <MilestoneStatusWidget ... />
  <BudgetWidget ... />
</div>
```

### Details

- `bg-card` + `border border-border` + `rounded-lg` — identical tokens to the tab card below, ensuring visual consistency (same surface color in light/dark mode, same 1px border, same corner radius).
- `overflow-hidden` — clips the inner widgets to the rounded corners so the existing `border-l` divider between Milestones and Budget doesn't poke past the card edge.
- `flex` and `mb-6` are preserved so the two widgets keep their side-by-side layout and spacing above the tabs.
- No changes inside `MilestoneStatusWidget` or `BudgetWidget` — their internal padding, divider, and typography stay intact.

### Result

The Milestone Status + Budget strip now sits on a card surface that visually matches the tab card directly beneath it. The two stacked panels (widgets card + tabs card) share the same border, radius, and background, giving the project view a consistent paneled look.

### Files touched

- `src/pages/ProjectDetail.tsx` — single className change on the widget wrapper div.
