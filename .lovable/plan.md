

## Plan: Fix hover overlap on sticky cells in report tables

### Problem
W raportach sticky komórki (Property/Country sticky-left, Total/% sticky-bottom) mają tła typu `bg-background` / `bg-muted` / `bg-muted/70`. Na hover wiersza dodajemy `group-hover:bg-muted/30` na sticky komórkach — ale **niesticky komórki w tym samym wierszu nie mają własnego tła**, więc wyglądają przezroczyście. Gdy scrollujemy, content z sąsiednich wierszy prześwituje pod nimi i nakłada się wizualnie na tekst.

Dodatkowo wiersze stopki używają `bg-muted/70` (półprzezroczyste) — przy scrollu pod sticky-bottom widać przewijający się content.

### Pliki do naprawy
1. `src/pages/MandatoryVsSpeculativeReport.tsx`
2. `src/pages/MandatoryVsSpeculativeByCountryReport.tsx`
3. `src/pages/SummaryReport.tsx`
4. `src/pages/AcgReport.tsx`
5. `src/pages/CapexTracker.tsx` / `ContractTracker.tsx` — sprawdzę i jeśli mają ten sam wzorzec, naprawię tak samo.

### Naprawa (jeden spójny wzorzec)

**A. Wiersze danych — tło na `<tr>`, nie na pojedynczych komórkach**
- `<tr>`: `bg-background hover:bg-muted/50` (pełne, nieprzezroczyste)
- Sticky komórki w wierszu: zamiast `bg-background group-hover:bg-muted/30` → **dziedziczą przez `bg-inherit`** na sticky cells, plus `tr` ma solidne tło. Tam gdzie sticky musi mieć własny kolor (np. footer), używamy pełnego `bg-muted` (bez `/70`, bez `/30`).
- Usuwam wzorzec `group` + `group-hover:bg-muted/30` — zastępuję `bg-inherit` na sticky cells.

**B. Footer rows (Total / % …)**
- `bg-muted` zamiast `bg-muted/70` (pełna nieprzezroczystość, nic nie prześwituje)
- Sticky komórki w footerze: też `bg-inherit` (dziedziczy z `tr`)
- Wiersz "% …" dostaje osobny `bg-muted` (lub `bg-muted/95` jeśli chcemy lekko odróżnić od Total — ale solidne, nie półprzezroczyste)

**C. Header**
- `thead` sticky cells: zamienić `bg-muted` (jeśli `/xx`) na pełne kolory; nagłówki kolorowe (`bg-orange-200`, `bg-slate-700`) są już solidne — OK.
- Sticky-left nagłówek: pełne `bg-muted` (już jest).

### Wzorzec kodu (przed → po)

Przed:
```tsx
<tr className="border-b hover:bg-muted/30 group">
  <td className="sticky left-0 bg-background group-hover:bg-muted/30 ...">…</td>
  <td className="...">…</td>
</tr>
```

Po:
```tsx
<tr className="border-b bg-background hover:bg-muted/50 [&>td]:bg-inherit">
  <td className="sticky left-0 ...">…</td>
  <td className="...">…</td>
</tr>
```

Dzięki `[&>td]:bg-inherit` wszystkie `<td>` (w tym sticky) dziedziczą tło z `<tr>`, więc hover zmienia tło całego wiersza spójnie i sticky komórki nigdy nie są przezroczyste.

Footer analogicznie:
```tsx
<tr className="bg-muted font-bold sticky bottom-10 z-10 [&>td]:bg-inherit">
  …
</tr>
<tr className="bg-muted italic sticky bottom-0 z-10 [&>td]:bg-inherit">
  …
</tr>
```

### Sprawdzenie
- Otworzę każdy raport i przewinę z hoverem — żaden tekst nie powinien prześwitywać przez sticky komórki ani przez footer.

### Poza zakresem
- Zmiany kolorystyki / hierarchii wizualnej.
- Refaktor do wspólnego komponentu tabeli (zostawiamy lokalne tabele).

