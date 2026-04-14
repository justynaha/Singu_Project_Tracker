

## Plan: Fix sidebar compression when contracts side panel opens

### Problem
When the side panel opens on the `/contracts` page, the left navigation sidebar gets compressed because it lacks `flex-shrink-0` in the App layout. The sidebar labels get truncated ("dings" instead of "Buildings").

### Root cause
In `App.tsx`, the layout is `<div className="flex w-full min-h-screen">` containing `<AppSidebar />` and the main content area. The sidebar in `AppSidebar.tsx` uses `w-64` but no `flex-shrink-0`, so when the contracts page adds a 380px side panel, the flex layout shrinks the sidebar.

### Fix

**`src/components/AppSidebar.tsx`** (line 175):
- Add `flex-shrink-0` to the `<aside>` root element alongside the existing `w-64`/`w-16` classes.

This is a one-line change that prevents the sidebar from ever being compressed by flex layout pressure from any page's content.

### Files to edit
- `src/components/AppSidebar.tsx` — add `flex-shrink-0` to the aside element

