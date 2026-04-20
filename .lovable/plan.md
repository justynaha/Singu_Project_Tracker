

## Plan: ACG tab — odwzorowanie tabeli ze screena

### Plik
- Edytowany: `src/pages/AcgReport.tsx` (obecnie placeholder)

### Tytuł i layout
- `<h2>Monthly CAPEX Update — ACG (Contracted Works)</h2>` + przycisk Export (placeholder)
- Kontener: `p-4 md:p-6 flex flex-col h-full`, scroll w środku, `min-w-[1200px]`

### Struktura tabeli

Kolumny (9):
| Group | Column | Notes |
|---|---|---|
| — | Country | sticky left, `min-w-[180px]` |
| **CONTRACTED WORKS** — slate header band (colSpan=5) | Completed (EUR) | tabular-nums, right-align |
| | Ongoing (EUR) | |
| | Planned 3M (EUR) | |
| | Savings (EUR) | |
| | Postponed Works (EUR) | |
| — | **Total (EUR)** | bold, blue tint (`bg-blue-50`), border-x dla efektu „ramki" jak na screenie |
| — | IC Budget (EUR) | |
| — | SocGen Budget * | |
| — | Contracted Works as a % of SocGen Requirement | center-align, formatted as `%` lub `NA` |

Header dwurzędowy:
- Row 1: Country (rowSpan=2), "CONTRACTED WORKS" (colSpan=5, slate `bg-slate-700 text-white`), Total (rowSpan=2, blue tint), IC Budget (rowSpan=2), SocGen Budget * (rowSpan=2), % of SocGen Requirement (rowSpan=2)
- Row 2: Completed / Ongoing / Planned 3M / Savings / Postponed Works

### Wiersze (countries)
Tylko kraje z `SAMPLE_PROPERTIES` (France, Netherlands, Poland, Spain) — sortowane alfabetycznie. **Bez Germany / Hungary / Italy** (zgodnie z zasadą jednego źródła prawdy ustaloną przy poprzednim tabie).

### Sample data (EUR) — proporcje ze screena, zachowane dla obecnych krajów

| Country | Completed | Ongoing | Planned 3M | Savings | Postponed | IC Budget | SocGen Budget |
|---|---:|---:|---:|---:|---:|---:|---:|
| France | 0 | 0 | 1 375 000 | 0 | 0 | 1 375 000 | 1 375 000 |
| Netherlands | 0 | 148 238 | 0 | 0 | 0 | 0 | 0 |
| Poland | 0 | 9 186 | 0 | 0 | 0 | 0 | 0 |
| Spain | 47 305 | 156 549 | 0 | 0 | 5 349 668 | 5 553 522 | 3 053 522 |

Liczone w runtime:
- **Total (EUR)** = Completed + Ongoing + Planned 3M + Savings + Postponed
- **% of SocGen Requirement** = Total / SocGen Budget; jeśli SocGen Budget = 0 → `NA`; w innym razie format `0%` (zaokrąglone)

### Footer (sticky bottom, opaque)
- **Total** row — sumy każdej kolumny liczbowej (Completed, Ongoing, Planned 3M, Savings, Postponed, Total, IC Budget, SocGen Budget) + wyliczone % na końcu (Total Total / Total SocGen). Bold, `bg-muted`, sticky `bottom-0`.

(Pomijamy wiersze "Check" i "Column AE/AG/..." ze screena — to artefakty Excela, nie data.)

### Styling (spójny z innymi reportami)
- Slate header band: `bg-slate-700 text-white dark:bg-slate-800`
- Total column tint: `bg-blue-50 dark:bg-blue-950/30` (cell), `bg-blue-100 dark:bg-blue-900/40` na nagłówku i w footerze, plus `border-l-2 border-r-2 border-border` dla efektu „pogrubionej ramki" widocznej na screenie wokół kolumny Total
- Wiersz: `h-10`, `tabular-nums`, `whitespace-nowrap`
- Sticky Country (left-0) + sticky header (top-0) + sticky Total row (bottom-0)
- `fmt(0)` → `—` (jak w pozostałych reportach), `pct(num, den)` → `NA` jeśli `den===0`, inaczej `${Math.round(...)}%`

### Footnote
Mała linijka pod tabelą: `* SocGen Budget — minimum contracted works requirement per loan covenant.` — kursywa, `text-xs text-muted-foreground`.

### Poza zakresem
- Realne podpięcie do bazy (sample data only)
- Funkcjonalny eksport .xlsx
- Edycja/inline-edit komórek

