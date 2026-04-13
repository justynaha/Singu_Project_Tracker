

## Plan: Fixed full-height side panels for Comments and Files

### Problem
Side panels (Comments, Files) currently render inline within the page content area. They should instead span the full viewport height (below the top app bar), be fixed-width, pinned to the right edge, and responsively compress the main content area. The sidebar menu should remain untouched.

### Approach
Move the side panels out of the inner `flex` container and make them fixed-position overlays that shrink the main content area.

### Changes to `src/pages/ProjectDetail.tsx`

1. **Move panels outside the tab flex container** — Currently panels sit inside `<div className="flex">` alongside tab content. Move them to a higher level in the component tree.

2. **Use a layout wrapper**: Wrap the entire page content in a flex row. The main content area gets `flex-1 min-w-0` and the side panel gets a fixed width (e.g. `w-[400px] flex-shrink-0`).

3. **Full viewport height**: The outer wrapper uses `h-[calc(100vh-64px)]` (64px = header height) so both the main content and side panel fill the available viewport below the app bar.

4. **Structure**:
```text
<div className="flex h-[calc(100vh-64px)]">
  <!-- Main scrollable content -->
  <div className="flex-1 min-w-0 overflow-y-auto">
    <div className="p-6">
      <ProjectHeader ... />
      <div className="bg-card border ...">
        <!-- tabs + tab content -->
      </div>
    </div>
    <!-- modals -->
  </div>

  <!-- Side panel (fixed width, full height, pinned right) -->
  {commentsPanelItem && <CommentsPanel ... />}
  {filesPanelItem && <FilesPanelComponent ... />}
</div>
```

5. **Remove old `hasSidePanel` border adjustments** — no longer needed since panels are separate from the tab card.

### Changes to `src/components/project-detail/CommentsPanel.tsx` and `FilesPanel.tsx`

- Ensure root element uses `h-full` (not a fixed `h-full` from parent) and `w-[400px] flex-shrink-0 border-l border-border bg-card`.
- Both panels already have similar structure; just ensure consistent sizing and `overflow-y-auto` on the scroll area.

### No database changes needed

### Files to edit
- `src/pages/ProjectDetail.tsx`
- `src/components/project-detail/CommentsPanel.tsx`
- `src/components/project-detail/FilesPanel.tsx`

