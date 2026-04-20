

## Plan: Ujednolicenie listy Property we wszystkich tabach Reports

### Cel
Lista 10 properties z tabu **Mandatory v Speculative** staje się jedynym źródłem prawdy dla sample data we wszystkich tabach Reports. Te same nazwy + te same kraje wszędzie.

### Kanoniczna lista (ze `MandatoryVsSpeculativeReport.tsx`)

| Property | Country |
|---|---|
| Mapletree Park Lyon | France |
| Mapletree Park Schiphol | Netherlands |
| Mapletree Park Marseille | France |
| Mapletree Park Piotrków 1 | Poland |
| Mapletree Park Piotrków 2 | Poland |
| Mapletree Park Tilburg | Netherlands |
| Mapletree Park Szczecin | Poland |
| Mapletree Park Fogars | Spain |
| Mapletree Park Sallent | Spain |
| Mapletree Park Valls | Spain |

### Krok 1 — Wyciągnięcie do współdzielonego modułu

Nowy plik: `src/data/sampleProperties.ts`
- Eksportuje `SAMPLE_PROPERTIES: { property: string; country: string; currency: string }[]` (waluty: France/Netherlands/Spain → EUR, Poland → PLN)
- Eksportuje też helpery: `getPropertyCountry(name)`, `getPropertyCurrency(name)`

### Krok 2 — Zaktualizowane pliki

**`src/pages/MandatoryVsSpeculativeReport.tsx`** — importuje z `sampleProperties.ts` zamiast lokalnej listy; kwoty zostają jak są (mapowane po nazwie).

**`src/pages/SummaryReport.tsx`** — zastępuje obecną listę properties (pochodzącą z `useProjects` / `siteToCountry`) statycznym sample setem z `sampleProperties.ts`. Kwoty Budget LC / Budget EUR / Current / Previous Month generowane deterministycznie per property (zachowane proporcje obecnych wartości — żeby tabela nadal wyglądała wiarygodnie).

**`src/pages/AcgReport.tsx`** — placeholder, brak zmian (nie ma jeszcze tabeli).

**CAPEX Tracker / Contract Tracker** — sprawdzę, czy używają własnych sample list. Jeżeli tak, podmieniam na `SAMPLE_PROPERTIES`. Jeżeli ciągną realne projekty z `useProjects`, dodaję komentarz, ale **nie** zmieniam (bo to nie jest sample data).

### Krok 3 — Zachowanie spójności

- Kolejność wierszy = kolejność w `SAMPLE_PROPERTIES` (żeby ten sam property był w tym samym miejscu w każdej tabeli).
- Country zawsze pobierane z helpera, nie hardkodowane per-tab.
- Waluta lokalna pobierana z helpera (rozwiązuje problem PLN vs EUR w Summary).

### Poza zakresem
- Zmiana danych w realnych modułach (Projects, Buildings) — tam właściciel danych to baza, nie sample set.
- Przepisywanie liczb na nowe (zachowuję bieżące proporcje, tylko mapuję po nowej liście properties).

