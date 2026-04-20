

## Plan: Rozszerz tabelę Monthly Breakdown na całą dostępną szerokość i wysokość

### Plik
`src/components/project-detail/MonthlyBreakdownTab.tsx`

### Problem
Aktualnie komponent ma `p-4 md:p-6` (padding wewnętrzny), przez co tabela nie sięga krawędzi obszaru z tabami. Dodatkowo tabela ma `min-w-[900px]` ale nie wypełnia całej dostępnej szerokości, a wysokość nie rozciąga się do dolnej krawędzi kontenera.

### Zmiany

1. **Kontener główny** (linia 188): zamień `<div className="p-4 md:p-6">` na `<div className="flex flex-col h-full">`. Tabela ma sięgać outline'u obszaru z tabami z każdej strony.

2. **Header (tytuł + przełączniki View/Currency)** — opakuj w `<div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 flex-shrink-0">`, aby zachować padding tylko wokół nagłówka.

3. **Pasek Export** — dołącz do tego samego paddowanego nagłówka albo wyrównaj z nim (`px-4 md:px-6 pb-3 flex-shrink-0`).

4. **Wrapper tabeli** — zmień z `rounded-lg border border-border overflow-hidden` na `flex-1 min-h-0 border-t border-border overflow-hidden flex flex-col`. Usuń `rounded-lg` (tabela ma stykać się z krawędzią karty taba) i boczne bordery (lewa/prawa krawędź = krawędź outline'u).

5. **Wewnętrzny scroll wrapper** — `<div className="overflow-x-auto">` → `<div className="flex-1 overflow-auto">` aby pionowy scroll też działał wewnątrz.

6. **Tabela** — z `min-w-[900px]` → `w-full min-w-[900px]`, czyli zachowaj minimalną szerokość dla scrolla horyzontalnego, ale w trybie szerokim rozciągnij na 100% dostępnego miejsca. Kolumny miesięcy z `min-w-[90px]` automatycznie podzielą resztę przestrzeni równo.

### Wynik wizualny
- Lewa, prawa i górna krawędź tabeli stykają się z outline'em obszaru z tabami.
- Tabela rozciąga się na pełną wysokość kontenera (puste wiersze/scroll wypełniają dół).
- 12 kolumn miesięcy rozkłada się równomiernie na całej szerokości na desktopie (1136px viewport → ~90px na kolumnę + sticky lewa kolumna, bez horyzontalnego scrolla).
- Padding pozostaje tylko wokół nagłówka (Monthly Breakdown + przełączniki + Export).

### Poza zakresem
- Brak zmian w logice danych, walut, eksportu.
- Brak zmian w innych tabach (Cashflow, Timeline itd.).

