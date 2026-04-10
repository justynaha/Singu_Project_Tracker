

## Plan: Add Edit Site Modal

### Overview
Create a modal/dialog that opens when clicking the "Edit" button on the Site detail page. The modal mirrors the Singu FM edit form from the screenshot, with a two-step wizard header ("Site - Basic information" / "Site - Application settings"), form fields matching the current site data, and a Save button.

### Files to Create

**`src/components/buildings/EditSiteModal.tsx`**
- Full-screen-style dialog using the existing `Dialog` component
- Wizard header with two steps: "1 Site — Basic information" (active, blue) and "2 Site — Application settings" (inactive, gray) — both non-functional, just visual
- Form fields in order matching the screenshot:
  - **Name** — text input (required, marked with asterisk)
  - **Short name** — text input
  - **Address** — textarea
  - **General e-mail (informational only)** — text input
  - **Default person resp. for orders** — dropdown/select (placeholder "Choose or start typing")
  - **Documentation responsible person** — dropdown/select
  - **Default seller** — dropdown/select ("— Choose —")
  - **Cost center** — radio buttons: YES / NO
  - **Default tenant** — dropdown/select
  - **Currency** — dropdown/select (e.g. PLN)
  - **Country** — dropdown/select (e.g. Poland)
  - **Max cost for a one-step ticket closing** — text input
  - **Comments** — textarea with a mock rich-text toolbar (non-functional icons row)
  - **Additional information** — textarea
  - **Fund ID** — text input
  - **Legal Entity** — text input
  - **CC Code** — text input
  - **Area (sqm)** — text input
- All fields pre-populated with current site data via props
- "Remove site" link (bottom-left, non-functional) and "Save" button (bottom-right, closes modal)
- Form is non-functional (no actual state persistence)

### Files to Modify

**`src/pages/buildings/SiteDetail.tsx`**
- Import `EditSiteModal` and add open/close state
- Wire the "Edit" button to open the modal
- Pass current `site` data to the modal

