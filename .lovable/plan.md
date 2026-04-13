

## Plan: Make Site name clickable in Details tab

### What changes
In `src/components/project-detail/OverviewTab.tsx`:

1. Import `useNavigate` from `react-router-dom` and `sites` from `@/data/buildingsData`
2. Replace the plain `DetailRow` for "Site" with a custom row that renders the site name as a blue, clickable link
3. On click, find the matching site by name in `sites` array and navigate to `/buildings/sites/:siteId`
4. If no matching site is found, render as plain text (no link)

### Technical detail
- The `DetailRow` component only renders plain text. For the Site row, we'll render a custom `div` with the same layout but use a `<button>` or `<span>` styled as a link (`text-primary hover:underline cursor-pointer`)
- Site matching: `sites.find(s => s.name === project.site)` — sites use the `name` field which matches what's stored in the project's `site` field

### Files to edit
- `src/components/project-detail/OverviewTab.tsx`

