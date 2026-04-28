## Goal
Make "Budget classification" in the Add Project modal conditional on the selected Property, with options driven by that property's fund.

## Behavior
1. **Hidden by default** — The "Budget classification" field is not rendered until a Property (Site) is selected.
2. **Once Property is selected** — The field appears with:
   - An "i" info icon next to the label.
   - Tooltip text: *"Available classification options depend on the fund of the selected property."*
3. **Options based on fund** — Look up the selected site in `src/data/buildingsData.ts` and read `fundId`/fund name:
   - **MUSEL** (treat sites whose name maps to the MUSEL fund — currently we only display "MUSEL" in the UI, so map all `fundId` starting with `S13` to MUSEL for the prototype): show **Mandatory / Speculative**.
   - **Other funds (FundName1, FundName2)**: show generic options **Standard / Custom**.
4. **Reset on Property change** — If the user changes the Property and the new fund doesn't include the previously selected option, clear `formData.budgetClassification`.
5. **Submit guard** — `Add project` button stays disabled until a classification is picked (existing rule unchanged).

## Technical notes
- File: `src/pages/Projects.tsx` (modal section ~lines 1049 and 1249–1265).
- Add a helper `getFundForSite(siteName)` and `getClassificationOptions(fund)` near the top of the component.
- Use existing `Tooltip`/`TooltipProvider`/`Info` imports already used for the Currency field (line ~1207).
- Wrap the entire `<div>` containing the "Budget classification" label and `RadioGroup` in `{formData.site && (...)}`.
- Replace the hardcoded radio items with a `.map()` over the dynamic options array.
- Add a `useEffect` (or inline check inside the site `onValueChange`) to reset `budgetClassification` when the new property's fund options don't include it.

## Out of scope
- No changes to the Edit Project modal, project list filters, or reports.
- No DB schema changes (classification stays a free string).
