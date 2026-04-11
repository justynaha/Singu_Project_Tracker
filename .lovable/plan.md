

## Plan: Redesign FX Rate Display and Modal

### Changes

**`src/pages/ForeignExchange.tsx`**

1. **Table data**: Change currency pairs from "PLN → EUR" to "EUR/PLN" format. Update mock rates to represent how much 1 EUR costs in local currency (e.g. EUR/PLN = 4.2610, EUR/HUF = 403.23, EUR/CZK = 25.19).

2. **Add Rate modal**: Replace the single "Currency pair" dropdown with a layout:
   - Static label "1 EUR ="
   - Numeric input for the rate value
   - Currency dropdown (PLN, HUF, CZK)
   
   On save, the pair is constructed as `EUR/${selectedCurrency}`.

3. **Mock data update**: 4 rows with realistic rates (e.g. EUR/PLN 4.2610, EUR/PLN 4.3750, EUR/HUF 403.23, EUR/CZK 25.19).

