## Replace "Mapletree" with "Verdant Parks"

### Scope
Replace all instances of the company name "Mapletree" with "Verdant Parks" across the codebase. Do not change any other logic, formatting, or data structure.

### Affected Files (8)
1. `src/pages/ContractsList.tsx`
2. `src/pages/SummaryReport.tsx`
3. `src/pages/Projects.tsx`
4. `src/data/mandatoryVsSpeculativeAmounts.ts`
5. `src/hooks/useDashboardData.ts`
6. `src/data/sampleProperties.ts`
7. `src/data/buildingsData.ts`
8. `src/pages/MonthlyBreakdownList.tsx`

### Approach
Use a project-wide find-and-replace (`sed` or similar) to swap "Mapletree" → "Verdant Parks" in all affected files in one operation. Verify with a post-replacement search to confirm zero remaining instances.

### Verification
- Search confirms no "Mapletree" or "Mapleree" strings remain.
- App builds successfully after changes.