

## Plan: Rozbudowa tabeli Summary w Reports

### Plik
`src/pages/SummaryReport.tsx`

### Zmiany w strukturze kolumn

Nowy układ (lewo → prawo):

| Sekcja | Kolumna | Źródło / logika |
|---|---|---|
| — | Property | `project.site` |
| — | Country | `siteToCountry[site]` |
| **Budget** | Budget LC | `sum(project.total_budget)` per site, w lokalnej walucie |
| **Budget** | Budget EUR | Budget LC × kurs FX (PLN→EUR 0.23, HUF→EUR 0.0025, EUR→EUR 1.0) |
| **Current** (zielone tło) | Completed (EUR) | placeholder przykładowy (deterministyczny pseudo-random per site, ~10–30% Budget EUR) |
| **Current** (zielone tło) | Ongoing (EUR) | sum `contracts.amount_lc` ze statusem `Ongoing` |
| **Current** (zielone tło) | Planned 3M (EUR) | sum `monthly_breakdown` apr+may+jun |
| **Previous Month** | Completed (EUR) | przykładowe dane (~85% wartości Current Completed) |
| **Previous Month** | Ongoing (EUR) | przykładowe dane (~95% wartości Current Ongoing) |
| **Previous Month** | Planned 3M (EUR) | przykładowe dane (~90% wartości Current Planned 3M) |
| **Variance** | Completed (EUR) | Current − Previous (Completed) |
| **Variance** | Ongoing (EUR) | Current − Previous (Ongoing) |
| **Variance** | Planned 3M (EUR) | Current − Previous (Planned 3M) |

Łącznie: 13 kolumn (2 sticky-left identity + 2 Budget + 3 Current + 3 Previous Month + 3 Variance).

### Dane przykładowe (Previous Month)

Aby uniknąć "magic numbers" w UI i zachować wizualną spójność z Current, wartości wyliczane deterministycznie z Current per wiersz:

- `prev.completed = round(current.completed * 0.85)`
- `prev.ongoing = round(current.ongoing * 0.95)`
- `prev.planned3M = round(current.planned3M * 0.90)`

`current.completed` (nowy placeholder) wyliczany jako `round(budgetEur * 0.20)` — daje wiarygodną proporcję względem budżetu i niezerowe wariancje.

Subtotaly i Grand Total liczą się automatycznie ze wszystkich nowych kolumn (włącznie z Budget LC — uwaga: sumowanie LC ma sens tylko per kraj/grupa o tej samej walucie; w grand total Budget LC pokażemy `—`, w subtotalach też `—`, sumujemy tylko Budget EUR).

### FX rates (hardcoded fallback)

```ts
const FX_TO_EUR: Record<string, number> = {
  EUR: 1, PLN: 0.23, HUF: 0.0025, USD: 0.92,
};
```

Lokalna waluta brana z `project.currency` (PLN domyślnie). Jeśli wszystkie projekty na site mają tę samą walutę → pokaż w kolumnie LC, w innym przypadku `Mixed`.

### Styling sekcji Current

Bladozielone tło na nagłówkach grupy + komórkach danych całej sekcji Current (3 kolumny):

- nagłówek grupy: `bg-green-100` (light) — Tailwind klasa
- komórki danych w tych 3 kolumnach: `bg-green-50`
- separatory pionowe `border-r border-border` zachowane

Pozostałe sekcje: bez zmian (domyślne `bg-muted` na nagłówkach grup, białe tło komórek).

### Nagłówek tabeli (2-rzędowy)

Górny rząd:
- Property (rowSpan=2, sticky)
- Country (rowSpan=2)
- **Budget** (colSpan=2)
- **Current** (colSpan=3, bg-green-100)
- **Previous Month** (colSpan=3)
- **Variance** (colSpan=3)

Dolny rząd: nazwy podkolumn (Budget LC / Budget EUR / Completed / Ongoing / Planned 3M / Completed / Ongoing / Planned 3M / Completed / Ongoing / Planned 3M).

### Zmiany w wierszach

Wszystkie wiersze (data, subtotal, grand total) rozszerzone o nowe kolumny. Kolumny w sekcji Current dostają klasę `bg-green-50` (data) lub `bg-green-100` (subtotal/total — odcień ciemniejszy dla rozróżnienia).

`min-w-[1100px]` zwiększone do `min-w-[1500px]` z powodu 4 dodatkowych kolumn.

### Poza zakresem

- Brak realnego źródła Previous Month (nadal placeholdery, tylko teraz wypełnione liczbami zamiast `—`).
- Brak edycji kursów FX (hardcoded w komponencie, można później podmienić na hook z `fx_rates`).
- Brak zmian w pozostałych tabach Reports.

