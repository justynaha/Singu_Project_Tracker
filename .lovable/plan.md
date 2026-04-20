

## Plan: Wyraźna prawa krawędź ostatniej sticky kolumny (wszystkie raporty)

### Problem
Sticky lewe kolumny (np. `#` w CapEx Tracker, `Contract ID / Country / Property / Legal entity / Budget type` w Contract Tracker, kolumny opisowe w Summary / ACG / Mandatory v Speculative) wizualnie zlewają się ze scrollowaną częścią tabeli. Użytkownik nie widzi, gdzie kończy się sekcja sticky, a zaczyna scrollowalna.

### Rozwiązanie
Na **ostatniej** sticky-left komórce w każdym wierszu (header, body, footer) dodać wyraźny prawy border + delikatny cień rzucany w prawo. Cień daje efekt „odklejania się" reszty tabeli przy scrollu w bok.

Klasy:
```
border-r-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]
```
W dark mode cień delikatniejszy: `dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.5)]`.

### Pliki i zmiany

**1. `src/pages/MonthlyBreakdownList.tsx` (CapEx Tracker)**
- Ostatnia sticky kolumna: `#` (jedyna sticky-left). Dodać `border-r-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]` na `<th>` w `TableHeader`, `<td>` w wierszach projektów oraz w wierszach Subtotal / Total / Grand Total.

**2. `src/pages/ContractsList.tsx` (Contract Tracker)**
- Sticky-left kolumny: `Contract ID`, `Country`, `Property`, `Legal entity`, `Budget type`. Wyróżnić **tylko ostatnią** (`Budget type`) tymi samymi klasami — header, body, footer.
- Pozostałe sticky kolumny zostawić bez zmian (mają już swoje `left-*`).

**3. `src/pages/SummaryReport.tsx`**
- Sprawdzić, która kolumna jest ostatnią sticky-left (typowo kolumna opisowa / kategoria) i dodać te same klasy na header + body + footer.

**4. `src/pages/AcgReport.tsx`**
- Analogicznie: ostatnia sticky-left kolumna → border-r-2 + shadow.

**5. `src/pages/MandatoryVsSpeculativeReport.tsx` i `src/pages/MandatoryVsSpeculativeByCountryReport.tsx`**
- Analogicznie: ostatnia sticky-left kolumna → border-r-2 + shadow.

### Uwagi
- Sticky-bottom (Total / Grand Total) nadal działa — komórka będąca jednocześnie sticky-left i sticky-bottom zachowuje wszystkie klasy, dodajemy tylko border + shadow.
- Z-index bez zmian (sticky-left = `z-20/z-30`, intersection sticky-left+top = `z-40`).
- Tło sticky komórek bez zmian (już ustawione w poprzednich iteracjach).

### Sprawdzenie
- W każdym raporcie scroll w prawo: prawa krawędź ostatniej sticky kolumny ma wyraźną linię + delikatny cień; pozostałe kolumny przesuwają się „pod" nią.
- Na początku scrolla (scrollLeft = 0) cień jest dyskretny i nie razi.
- Dark mode: krawędź widoczna, cień nie za ciężki.

### Poza zakresem
- Dynamiczne ukrywanie cienia gdy `scrollLeft === 0` (wymagałoby JS / IntersectionObserver) — zostawiamy statyczny, subtelny cień.
- Refaktor sticky-column logic do wspólnego komponentu.

