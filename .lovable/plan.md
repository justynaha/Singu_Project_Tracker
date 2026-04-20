

## Plan: Rozszerzyć kolumny w Summary, żeby nagłówki nie zawijały się

### Problem
W `SummaryReport.tsx` nagłówki sub-kolumn typu "Completed (EUR)", "Ongoing (EUR)", "Planned 3M (EUR)" zawijają się do dwóch wierszy, bo komórki nie mają `whitespace-nowrap` ani `min-w-*`.

### Plik
- `src/pages/SummaryReport.tsx`

### Zmiana
Do wszystkich `<th>` w drugim rzędzie nagłówka (sub-kolumny pod Budget / Current / Previous Month / Variance) dodać:
- `whitespace-nowrap`
- `min-w-[140px]` dla "Completed (EUR)" / "Ongoing (EUR)"
- `min-w-[160px]` dla "Planned 3M (EUR)" (dłuższy tekst)
- `min-w-[140px]` dla "Budget LC" / "Budget EUR"

Analogicznie do komórek `<td>` w wierszach danych i footerze dodać `whitespace-nowrap` (większość ma `tabular-nums`, ale brakuje `whitespace-nowrap` na komórkach numerycznych).

Tabela już ma `min-w-[1500px]` — po dodaniu min-width na kolumny realna szerokość urośnie odpowiednio i pozioma rolka zadziała poprawnie (kontener ma `overflow-auto`).

### Poza zakresem
- Zmiana stylu nagłówków, kolorów grup, wysokości wierszy
- Inne raporty (tylko Summary, jak prosi user)

