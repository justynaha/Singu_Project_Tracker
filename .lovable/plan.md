

## Plan: Klikalne mock projekty otwierają pełny widok szczegółów

### Problem
Po imporcie kliknięcie w mockowy projekt prowadzi do `/project/mock-1`, gdzie `useProjectDetail` szuka rekordu w bazie po UUID i nie znajduje → "No project found". Mock projekty nie mają też żadnych milestones/tasks.

### Rozwiązanie
Po kliknięciu **Import** stwórz realne rekordy w bazie (Supabase) z 6 mockowych wierszy razem z domyślnym zestawem milestones/tasks w `timeline_items`. Każdy zaimportowany projekt dostanie prawdziwe UUID i otworzy się przez istniejący `ProjectDetail` z pełnym zakresem zakładek (Project Plan, Monthly Breakdown, Contracts, Files, Details, History).

### Zmiany

**1. `src/pages/Projects.tsx`**
- Usuń `MOCK_IMPORTED_PROJECTS` jako źródło renderu listy.
- Zachowaj `hasImported` tylko jako flagę kontrolującą empty state PRZED pierwszym importem.
- Handler `Import` (async):
  1. `INSERT` do `projects` 6 rekordów z polami: `name`, `site`, `budget_line` (= work category), `total_budget`, `currency='EUR'`, `fiscal_year='2025/2026'`, `budget_type`, `budget_classification`, `status='Open'`, `description='Owner: Anna Snow'`. Zwróć `id`.
  2. Dla każdego nowego `project_id` `INSERT` domyślnego szablonu do `timeline_items` (patrz krok 2).
  3. `setHasImported(true)`, refetch listy (`useProjects`), toast "6 projects imported successfully", zamknij modal.
- Lista renderuje `dbProjects` z `useProjects` jak dotychczas; "Owner" w kolumnie zawsze pokazuje "Anna Snow" (na razie hardcode, jak dziś).

**2. Domyślny szablon Project Plan (nowa stała w `src/pages/Projects.tsx` lub `src/data/defaultProjectPlan.ts`)**
Zestaw milestones + tasks tworzonych dla każdego importowanego projektu, mirroring tego, co użytkownik dostaje przy ręcznym tworzeniu projektu. Struktura (parent → children, `type='milestone'` / `'task'`, `sort_order` rosnący, `status='not-started'`):
- **Initiation** — Define scope, Assign owner, Kickoff meeting
- **Design & Approval** — Concept design, Cost estimate, Internal approval
- **Procurement** — Tender, Contract signing
- **Execution** — Site preparation, Main works, Quality checks
- **Closeout** — Final inspection, Handover, Documentation archive

(Dokładna lista do potwierdzenia — biorę powyższy generyczny zestaw zgodny z konwencją projektu. Jeśli istnieje już zdefiniowany szablon w kodzie, użyj go zamiast tego.)

**3. Empty state**
Pozostaje, dopóki `dbProjects.length === 0` AND `!hasImported`. Po imporcie lista pokazuje 6 świeżo utworzonych rekordów (i ewentualne kolejne dodane ręcznie).

### Uwagi techniczne
- Wszystkie INSERTy idą przez istniejący `supabase` client; RLS na `projects` i `timeline_items` jest publiczny.
- Brak migracji DB.
- `description='Owner: Anna Snow'` zachowuje spójność z obecnym hardcoded ownerem w UI; w przyszłości zastąpimy realnym polem `owner`.
- Kliknięcie w nazwę projektu używa istniejącego routingu `/project/:id` → `ProjectDetail` → `useProjectDetail` zadziała natychmiast, bo rekordy będą realne.

### Plik
- `src/pages/Projects.tsx`

