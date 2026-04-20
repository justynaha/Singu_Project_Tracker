

## Plan: Zwijane filtry pod przyciskiem "Filters" w CapEx Tracker i Contract Tracker

### Problem
W `MonthlyBreakdownList.tsx` i `ContractsList.tsx` (osadzonych w Reports):
- Pomiędzy zakładkami a polem Search jest spory padding (`mt-4` + `mb-4` = ~32px luki).
- Wszystkie filtry (Property group, Country, Work category, Status, Fiscal year, Budget type, Budget classification) są stale widoczne — zajmują dużo miejsca.

### Pliki
- `src/pages/MonthlyBreakdownList.tsx`
- `src/pages/ContractsList.tsx`

### Zmiany

**1. Zmniejszyć padding nad searchem**
- Wiersz searcha (linie 423 / 608): `flex items-center gap-4 mb-4 mt-4` → `flex items-center gap-3 mb-3`. Usunąć `mt-4`, zmniejszyć `mb-4`→`mb-3`, `gap-4`→`gap-3`.

**2. Dodać przycisk "Filters" po prawej stronie searcha**
W tym samym wierszu co Search Input dołożyć przycisk:
```tsx
<Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)} className="gap-2">
  <Filter className="h-4 w-4" />
  Filters
  {hasAppliedFilters && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{appliedCount}</Badge>}
  <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
</Button>
```
- Import `Filter` z `lucide-react`.
- `appliedCount` = liczba aktywnych filtrów (suma niepustych `filter*` + `filterSiteGroups.length > 0 ? 1 : 0`) — daje użytkownikowi wskazówkę, że filtry są aktywne mimo zwiniętej sekcji.

**3. Zwijać sekcję filtrów**
- Stan `showFilters` już istnieje w obu plikach (linia 109 w MonthlyBreakdownList, 226 w ContractsList) i jest domyślnie `false` — dokładnie tak jak user prosi.
- Owinąć cały blok `<div className="mb-4">…</div>` (linie 430-… / 620-…) warunkiem:
  ```tsx
  {showFilters && (
    <div className="mb-3">
      {/* istniejący content filtrów bez zmian */}
    </div>
  )}
  ```
- Zmienić `mb-4` → `mb-3`, żeby też pomiędzy filtrami a tabelą było ciaśniej.

**4. Aktywne badge'e filtrów (chips) — zostają widoczne nawet gdy sekcja zwinięta**
Gdy `hasAppliedFilters && !showFilters`, chcemy jednak pokazać użytkownikowi co jest aktywne. Wyciągnąć blok chipów (`{hasAppliedFilters && (<div…>…</div>)}`, linie 521+/710+) **poza** `{showFilters && …}` — tak by chipy były zawsze widoczne pod paskiem search/Filters, niezależnie od stanu rozwinięcia. Chipy `× Clear` nadal działają i czyszczą filtr od razu.

### Wynik
- Domyślnie: tabs → mniejszy odstęp → wiersz [Search …………… Filters ▾] → (opcjonalnie chipy aktywnych filtrów) → tabela.
- Klik Filters → rozwija pełny panel filtrów; ponowny klik → zwija. Stan zachowany per komponent (oba raporty mają niezależny stan, ale identyczne zachowanie).
- Reszta UI bez zmian (Columns popover, Export, paginacja, sticky header z poprzedniej iteracji).

### Sprawdzenie
- Reports → CapEx Tracker: domyślnie zwinięte; klik Filters rozwija; po wyborze filtra i klik Search panel można zwinąć, chipy zostają widoczne.
- Reports → Contract Tracker: identycznie.
- Inne raporty (Summary, ACG, Mandatory v Speculative) — bez filtrów, więc bez zmian.

### Poza zakresem
- Refaktor wspólnego komponentu filtrów (na przyszłość).
- Zmiany w innych zakładkach.

