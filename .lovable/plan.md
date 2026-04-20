
## Plan: Przenieś toggle V1/V2 z Reports do zakładki projektu

### Krok 1: Wycofaj zmianę w Reports
W `src/pages/MonthlyBreakdownList.tsx`:
- Usuń stan `viewVersion` oraz dropdown "View" w toolbarze.
- Usuń warunkowe renderowanie wierszy summary (przywróć wszystkie: Contracted, Invoiced, Ongoing, Savings, Postponed jako zawsze widoczne).
- Usuń wiersz "Remaining to allocate".

### Krok 2: Dodaj toggle V1/V2 w zakładce Monthly Breakdown projektu
W `src/components/project-detail/MonthlyBreakdownTab.tsx`:

1. Dodaj stan: `const [viewVersion, setViewVersion] = useState<"V1" | "V2">("V2")`.
2. Dodaj `Select` (V1 / V2) w prawym górnym rogu nagłówka — obok przełącznika walut "Local currency / EUR".
3. **V2 (domyślny)** = bieżący widok bez zmian: pokazuje Budget, Contracted, Invoiced, Ongoing, Planned 3M, Savings, Postponed.
4. **V1 (uproszczony)** ukrywa: Contracted, Invoiced, Ongoing, Savings, Postponed. Zostają: Budget, Planned 3M.
5. W V1 dodaj nowy wiersz **"Remaining to allocate"** bezpośrednio pod Grand Total (nad Budget). Wartość = `totalBudget - total` (w aktualnej walucie). Czerwony jeśli ujemny.

### Pliki do edycji
- `src/pages/MonthlyBreakdownList.tsx` — wycofanie
- `src/components/project-detail/MonthlyBreakdownTab.tsx` — dodanie toggle + logika V1/V2
