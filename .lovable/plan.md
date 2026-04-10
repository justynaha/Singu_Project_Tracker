

## Plan: Add Fund ID, Legal Entity, CC Code, and Area fields to Site Information

### Changes

**1. `src/data/buildingsData.ts`**
- Add 4 new fields to the `Site` interface: `fundId`, `legalEntity`, `ccCode`, `areaSqm`
- Populate each site with realistic values following the formats from the screenshot:
  - Fund ID: e.g. `"S13 (EU)"`, `"SII1 (EU)"`
  - Legal Entity: e.g. `"AlexandraLog PLC01 Sp. Z.o.o."`, `"AlexandraLog SPNE02 S.L."`
  - CC Code: e.g. `"CC9541002"`, `"CC9548002"`
  - Area: e.g. `"41,795"`, `"35,634"`

**2. `src/pages/buildings/SiteDetail.tsx`**
- Add 4 new rows to the `infoFields` array: "Fund ID", "Legal Entity", "CC Code", "Area (sqm)"

