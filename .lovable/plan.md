

## Plan: Build Foreign Exchange Screen

### Overview
Create a full Foreign Exchange page with a rates table and an "Add rate" modal, using mock data. Replace the placeholder route.

### Files to Create

**`src/pages/ForeignExchange.tsx`**
- Page with heading "Foreign Exchange" and "Add rate" button (top-right)
- Table with columns: Currency pair, Rate, Valid from, Added by, Note / source
- Mock data with 4 existing rates (e.g. PLN→EUR twice, HUF→EUR, CZK→EUR)
- Most recent rate per currency pair gets a "Current" badge and bold text
- "Add FX Rate" dialog with:
  - Currency pair dropdown (PLN → EUR, HUF → EUR, CZK → EUR)
  - Rate numeric input (step 0.000001, required)
  - Valid from date picker (defaults to today, required)
  - Note / source text input (optional, placeholder "e.g. NBP rate Q1 2026")
  - Info banner below form: "This rate will apply to new cost entries only. Existing project data will not be recalculated."
  - Cancel and Save buttons
- Save adds to local state (no persistence)

### Files to Modify

**`src/App.tsx`**
- Import `ForeignExchange` component
- Replace placeholder route at `/master-data/foreign-exchange` with `<ForeignExchange />`

