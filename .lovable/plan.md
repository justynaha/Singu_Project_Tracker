

## Plan: Buildings Module with Sites and Buildings Sub-tabs

### Overview
Build a "Buildings" section mirroring the Singu FM screenshots. The sidebar "Buildings" item becomes a collapsible menu with clickable "Sites" and "Buildings" sub-links. Each sub-page shows a list view, and clicking a name navigates to a detail page.

### Data Approach
Use hardcoded/mock data (no new DB tables). The sites already exist in the project data (`SITE_TO_COUNTRY` mapping). Buildings will be mock data referencing those sites.

### Files to Create

1. **`src/data/buildingsData.ts`** -- Mock data for sites and buildings
   - Sites array: name, country, address, documentation responsible person (based on existing `SITE_TO_COUNTRY` + addresses from screenshots)
   - Buildings array: name, address, property manager, site (parent), type, customer, active status, etc.

2. **`src/pages/buildings/SitesList.tsx`** -- Sites list page
   - Search bar + Filters button (non-functional)
   - "Rows X to Y out of Z" counter
   - Table with columns: Name (clickable link), Country, Address, Documentation responsible person
   - Pagination

3. **`src/pages/buildings/SiteDetail.tsx`** -- Site detail page
   - Breadcrumb: "Sites / Site Name"
   - Tabs: Information, Shifts, SLA, Buildings, Evacuation confirmation template (only Information active)
   - Information tab: key-value pairs (Name, Address, Default person resp. for orders, Documentation responsible person, Default seller, General e-mail, Mailbox, Info, Cost center, Default tenant, Currency, Country)
   - Edit button (non-functional)

4. **`src/pages/buildings/BuildingsList.tsx`** -- Buildings list page
   - Search bar + Advanced/Value/Building filter buttons (non-functional) + Saved filters link
   - Pagination ("Rows 1 to 30 out of 104")
   - Table columns: Name (clickable), Address, Property Manager, Site, Customer

5. **`src/pages/buildings/BuildingDetail.tsx`** -- Building detail page
   - Breadcrumb: "Buildings / Building Name"
   - Tabs: Information, Taxes, Locations, Tenants, Files, Tickets, Equipment, Plans, Access zones (only Information active)
   - Sub-tabs: General information, Building, Departments
   - Sections: Property data (Name, Site link, Type, Customer, Property Manager, etc.), Value section, Address section, Certificates section
   - Edit button (non-functional)

6. **`src/pages/Buildings.tsx`** -- Wrapper page that renders Sites or Buildings based on active sub-route

### Files to Modify

7. **`src/components/AppSidebar.tsx`**
   - Change Buildings from `hasSubmenu: true` to actual `submenu` array with Sites, Buildings, Locations, Documentation, Checkpoints, Evacuation confirmation (matching screenshot)
   - Only Sites and Buildings will be clickable; others render as disabled

8. **`src/App.tsx`** -- Add routes:
   - `/buildings/sites` -- SitesList
   - `/buildings/sites/:siteName` -- SiteDetail
   - `/buildings` -- BuildingsList
   - `/buildings/:buildingName` -- BuildingDetail

### Technical Details
- All data is hardcoded mock data in `buildingsData.ts`
- Site detail shows a placeholder building image grid (gray boxes) matching the screenshot
- Building detail includes the full form layout with sections and yellow-highlighted section headers
- Navigation between sites list ↔ site detail and buildings list ↔ building detail via React Router
- Clicking site name in building detail links to the site detail page
- Sidebar active state detection updated for `/buildings/*` paths

