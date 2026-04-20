

## Plan: Highlight in‑progress milestone diamond with blue background

### File
`src/components/project-detail/TimelineV2Tab.tsx` (lines ~628‑642)

### Change
Add a third visual state for the milestone diamond when `milestone.status === "in-progress"`. Currently only two states exist: `done` (green) and everything else (muted gray). The in‑progress state should match the blue "In progress" label already shown below the diamond.

### Updated rendering logic
```tsx
<div
  className={cn(
    "w-8 h-8 flex items-center justify-center mb-2 transition-colors rotate-45",
    isDone
      ? "bg-success text-success-foreground"
      : isInProgress
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground"
  )}
>
  {isDone ? (
    <Check className="h-4 w-4 -rotate-45" />
  ) : (
    <span className="-rotate-45 text-xs font-medium">{idx + 1}</span>
  )}
</div>
```

### Visual result
- **Done** → green diamond with check (unchanged)
- **In progress** → blue diamond (`bg-primary`) with white number, matching the blue "In progress" status text below
- **Open / not started** → muted gray diamond (unchanged)

### Out of scope
- No change to label colors, status text, or progress line.
- No change to `ProjectStatusTimeline.tsx` (a different component for project-level status).

