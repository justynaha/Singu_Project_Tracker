

## Plan: Importowane projekty = dokładnie 6 wierszy z mock Excela

Obecnie po kliknięciu **Import** lista pokazuje wszystkie projekty z bazy Supabase. Zamiast tego, lista ma pokazać dokładnie te 6 projektów, które były widoczne w mock Excelu.

### Zmiany w `src/pages/Projects.tsx`

1. Wyciągnij dane z `sampleRows` (te same 6 wierszy co w Excelu) do stałej współdzielonej między mock Excelem a listą po imporcie:
   - LED Lighting Retrofit — Bedzin — ESG — Anna Kowalska
   - Main Switchgear Replacement — Bedzin — ELECTRICAL SYSTEMS — Piotr Nowak
   - Roof Solar Panel Installation — Marseille — Sustainability — Claire Dubois
   - Automated Gate Access System — Lyon — Building upgrading works — Marc Lefevre
   - Cross-Dock Area Expansion — Tilburg — Asset Enhancement Initiatives — Jeroen van Dijk
   - EV Charging Station Network — Schiphol — Sustainability — Sophie de Vries
   
   Wszystkie: FY `2025/2026`, currency `EUR`, status `Open`.

2. Po `hasImported === true`, **zignoruj `projects` z hooka `useProjects`** i renderuj listę zbudowaną z tych 6 mockowych obiektów (zmapowanych do kształtu `Project` z polami: `id` (np. `mock-1`…`mock-6`), `name`, `site`, `budget_line`, `total_budget`, `currency`, `fiscal_year`, `budget_type`, `budget_classification`, `status`, `created_at = now()`, owner trzymany w lokalnym polu pomocniczym lub w `description`).

3. Toast po imporcie: zostaje "6 projects imported successfully".

4. **Brak zapisów do bazy** — to nadal flow czysto wizualny. Kliknięcie wiersza projektu na liście może otwierać szczegóły tylko jeśli istnieje route, w przeciwnym razie zostaw bez akcji (zgodnie z bieżącym zachowaniem listy).

### Plik
- `src/pages/Projects.tsx`

