

## Plan: Zafiksuj górny wiersz nagłówka w CAPEX Tracker i Contract Tracker

### Problem
W `MonthlyBreakdownList.tsx` i `ContractsList.tsx` (osadzone w `Reports.tsx`) nagłówek tabeli nie przykleja się przy pionowym scrollu, ponieważ:
1. Pionowy scroll dzieje się w `overflow-y-auto` w `Reports.tsx` (linia 50).
2. Pomiędzy nim a `<thead>` jest `<div className="overflow-hidden">` / `overflow-x-auto` — każdy `overflow` przerywa kontekst `position: sticky`, więc sticky nie ma do czego się przykleić.
3. W CAPEX Trackerze `sticky top-0` jest na `<tr>`, a nie na `<th>` — w wielu przeglądarkach to nie działa.

### Pliki
- `src/pages/MonthlyBreakdownList.tsx`
- `src/pages/ContractsList.tsx`
- `src/pages/Reports.tsx` (drobna zmiana kontenera scrolla)

### Zmiany

**1. `Reports.tsx`**
- Linia 50: kontener z `overflow-y-auto` → `overflow-hidden flex flex-col`. Pionowy scroll przeniesiemy do wnętrza raportów, żeby tabela sama była ancestorem sticky.

**2. `MonthlyBreakdownList.tsx` (linie ~588–602)**
- Zewnętrzny wrapper toolbarów zostawić; wrapper tabeli zmienić tak, żeby był jednocześnie scrollerem pionowym i poziomym:
  ```tsx
  <div className="border border-border rounded-lg flex-1 min-h-0 overflow-auto">
    <Table>
      <TableHeader className="sticky top-0 z-30 bg-background">
        <TableRow className="h-10 [&>th]:bg-background">
          <TableHead className="... sticky left-0 z-40 bg-background">#</TableHead>
          ...
          <TableHead className="... bg-green-100 dark:bg-green-900/30">Apr 2026</TableHead>
          ...
        </TableRow>
      </TableHeader>
  ```
- Usunąć wewnętrzny `<div className="overflow-x-auto">`.
- `sticky top-0` przenieść z `<tr>` na `<TableHeader>` (lub na każde `<th>`); zwiększyć `z-index` (`z-30`); zachować `bg-background` na każdym `<th>` (zielone kolumny już mają własne tło).
- Strona musi mieć `flex flex-col` żeby wrapper tabeli wypełnił przestrzeń (główny `<div>` strony — sprawdzić, czy ma `h-full flex flex-col`; jeśli nie, dodać).

**3. `ContractsList.tsx` (linie ~800–820)**
- Analogicznie: `<div className="border ... overflow-hidden">` → `overflow-auto flex-1 min-h-0`.
- `<TableHeader className="sticky top-0 z-30 bg-card">`, na sticky-left `<th>` podnieść `z-index` do `z-40`, żeby przy scrollu w obu osiach narożnik był nad innymi sticky komórkami.
- Strona / wrapper tabu też musi pozwolić tabeli wypełnić przestrzeń (`flex-1 min-h-0`).

### Sprawdzenie
- Otworzyć Reports → CAPEX Tracker, scroll w dół: nagłówek miesięcy + sticky lewa kolumna `#` muszą być widoczne cały czas.
- Otworzyć Reports → Contract Tracker, scroll w dół i w bok: górny wiersz oraz sticky lewe kolumny (Contract ID / Country / Property / Legal entity / Budget type) trzymają się na miejscu.
- Footery/sticky-bottom (Total / Grand Total) muszą działać dalej — nie ruszamy ich.

### Poza zakresem
- Zmiany w innych raportach (Summary, ACG, Mandatory v Speculative) — tam sticky header już działa lub jest tematem osobnym.
- Refaktor wspólnego komponentu tabeli.

