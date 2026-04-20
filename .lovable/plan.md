

## Plan: Dodać tab "Mandatory v Speculative — by Country"

### Pozycja w nawigacji Reports
1. Summary
2. Mandatory v Speculative
3. **Mandatory v Speculative — by Country** (nowy)
4. ACG
5. CAPEX Tracker
6. Contract Tracker

Etykieta tabu w pasku: **"By Country"** (krótka), pełny tytuł jako `<h2>` w środku.

### Plik
- Nowy: `src/pages/MandatoryVsSpeculativeByCountryReport.tsx`
- Edytowany: `src/pages/Reports.tsx` (dodanie wpisu i renderowania)

### Struktura tabeli (lustrzane odbicie tabu Mandatory v Speculative, ale agregacja po Country)

Kolumny (7):
| Group | Column |
|---|---|
| — | Country (sticky left, `min-w-[200px]`) |
| **FY25/26 Budget (EUR)** — pomarańczowy nagłówek | Mandatory |
| | Speculative |
| | Budget (subtelny niebieski tint, = Mand + Spec) |
| **Contracted (EUR)** — slate nagłówek | Mandatory |
| | Speculative |
| | Contracted (subtelny niebieski tint, = Mand + Spec) |

Brak kolumny Property — to jest widok zagregowany.

### Źródło danych
Agregacja w pamięci z istniejących kwot zdefiniowanych w `MandatoryVsSpeculativeReport.tsx` (mapa `AMOUNTS`). Żeby nie duplikować liczb, **wyciągam mapę `AMOUNTS` do współdzielonego pliku**:

- Nowy plik: `src/data/mandatoryVsSpeculativeAmounts.ts`
  - eksportuje `MAND_SPEC_AMOUNTS: Record<string, { mandBudget; specBudget; mandContracted; specContracted }>`
- `MandatoryVsSpeculativeReport.tsx` importuje z tego pliku zamiast definiować lokalnie.
- Nowy tab agreguje per Country używając `getPropertyCountry()` z `sampleProperties.ts`.

### Country na ekranie
Pokazane są **wszystkie kraje obecne w `SAMPLE_PROPERTIES`** (czyli France, Netherlands, Poland, Spain — bez Germany/Hungary/Italy ze screena, bo nie ma tam żadnych nieruchomości w sample secie). Trzymamy się jednego źródła prawdy — nie dodajemy fikcyjnych krajów. Kolejność alfabetyczna.

### Wiersze stopki (sticky bottom, opaque)
- **Total** — sumy wszystkich kolumn liczbowych, bold, `bg-muted`. (Słowo "MUSEL" ze screena → "Total".)
- **% Contracted** — italic. Per kolumna: `Contracted / Budget`. Dla par (Mandatory budget vs Mandatory contracted itd.). Guard div/0 → "—" (bez `#DIV/0!` jak na screenie).

### Styling
- Identyczne klasy nagłówków co w Mandatory v Speculative:
  - `bg-orange-200 dark:bg-orange-900/40` dla bloku Budget
  - `bg-slate-700 text-white dark:bg-slate-800` dla bloku Contracted
  - `bg-blue-50` / `bg-blue-100` dla kolumn sumarycznych Budget i Contracted
- Wysokość wiersza `h-10`, `tabular-nums`, `whitespace-nowrap`, sticky header (top-0), sticky Country (left-0), sticky Total + % Contracted (bottom-0/-1).
- Kontener: `p-4 md:p-6 flex flex-col h-full`, `min-w-[900px]`.

### Eksport
Przycisk Export — wizualny placeholder (jak w innych tabach).

### Poza zakresem
- Realne podpięcie do bazy.
- Działający eksport .xlsx.
- Dodawanie krajów spoza sample setu (Germany/Hungary/Italy).

