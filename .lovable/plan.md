

## Plan: Sumowanie miesięcznych kolumn w wierszach Subtotal (CAPEX Tracker)

### Problem
W `src/pages/MonthlyBreakdownList.tsx` wiersze `Subtotal IC — {group}` i `Subtotal Ad Hoc — {group}` renderują kolumny miesięcy (Apr 2026 – Mar 2027) z `formatAmount(sub.subtotals[k] || null)`. `formatAmount` zwraca `—` dla `0` / `null` — i prawdopodobnie funkcja `calculateSubtotals` nie sumuje miesięcy z `breakdownMap` poprawnie (sumuje tylko `total`/`contracted`/itp., a miesięczne pola idą zerami).

### Plik
- `src/pages/MonthlyBreakdownList.tsx`

### Zmiany

**1. `calculateSubtotals` — dosumować miesiące**
W funkcji agregującej dla każdego projektu w grupie pobrać jego wiersz z `breakdownMap` i dodać każdy klucz miesiąca (`apr`…`mar`) do akumulatora `subtotals[k]`. Wynik: `sub.subtotals.apr`, `sub.subtotals.may`, … `sub.subtotals.mar` zawierają realne sumy.

**2. Render Subtotal row — pokazać sumę zamiast `—` przy 0**
W komórkach miesięcznych Subtotal usunąć `|| null`:
```tsx
{MONTH_KEYS.map((k) => visibleMonths[k] && (
  <td key={k} className="... bg-green-100 dark:bg-green-900/30">
    {formatAmount(sub.subtotals[k])}
  </td>
))}
```
(Dla 0 nadal pokaże `—` — spójne z resztą tabeli; gdy projekty mają wartości, suma będzie > 0.)

**3. Group Total row (Total — {group}) — analogicznie**
Upewnić się, że `groupTotals[k]` też sumuje miesiące z wszystkich projektów IC + Ad Hoc w grupie i jest renderowany w komórkach miesięcznych.

**4. Grand Total row — analogicznie**
Suma wszystkich `groupTotals[k]` po wszystkich grupach, renderowana w komórkach miesięcznych.

### Sprawdzenie
- Otworzyć CAPEX Tracker → każdy `Subtotal IC — …`, `Subtotal Ad Hoc — …`, `Total — …` i `Grand Total` powinien w kolumnach Apr 2026 – Mar 2027 pokazywać sumę kwot z wierszy projektów powyżej.
- Eksport XLS — sumy spójne z UI (logika eksportu używa tych samych funkcji agregujących, więc po fixie zadziała automatycznie).

### Poza zakresem
- Zmiana stylu / kolorów (zielone tło już jest).
- Inne raporty.

