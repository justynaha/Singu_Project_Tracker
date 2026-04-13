

## Plan: Separate Project Tracker fields into own section

### Changes to `src/pages/buildings/SiteDetail.tsx`

1. Split `infoFields` into two arrays:
   - `infoFields`: all fields up to and including "Dictionary type"
   - `projectTrackerFields`: Fund ID, Legal Entity, CC Code, Area (sqm)

2. After the main info table, add a heading "Project Tracker" and render a second identical-style table with the 4 project tracker fields.

