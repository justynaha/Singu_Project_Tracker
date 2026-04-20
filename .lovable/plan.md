

## Plan: Subtotal — sumuj miesięczne kolumny + jasnozielone tło (CAPEX Tracker)

### Plik
`src/pages/MonthlyBreakdownList.tsx`

### Problem
W wierszach `Subtotal IC — {group}` i `Subtotal Ad Hoc — {group}` komórki miesięcy (Apr 2026 – Mar 2027) oraz `Total` korzystają z `formatAmount(sub.subtotals[k] || null)` i `formatAmount(sub.subtotals.total || null)`. Gdy suma to 0, `0 || null → null`, więc komórka wyświetla `—` zamiast `0` — wizualnie wygląda, jakby suma nie była liczona.

Dodatkowo te komórki mają obecnie tła `bg-blue-100` / `bg-orange-50` (zależnie od subsekcji), a user chce spójnego jasnozielonego tła jak w zakładce Summary.

### Zmiana

**1. Sumowanie — pokaż wartość sumy zawsze (nawet 0)**
- W Subtotal rows (linie ~668–675): zamiast `formatAmount(sub.subtotals[k] || null)` użyć `formatAmount(sub.subtotals[k])` (bez `|| null`). Funkcja `formatAmount` już obsługuje `0 → "—"`, ale to OK — jeśli faktyczna suma jest 0, nie ma co pokazywać. Kluczowe: jeśli choć jeden projekt ma wartość, suma będzie > 0 i wyświetli się prawidłowo. Logika `calculateSubtotals` jest już prawidłowa; usunięcie `|| null` to porządkowanie. (Opcja: pokażmy `0,00` zamiast `—` — ale to niespójne z resztą tabeli; zostawiamy `—` dla 0.)
- **Realnym fixem**, jeżeli sumy faktycznie wychodzą 0 mimo widocznych wartości w wierszach poniżej, jest weryfikacja, że projekty grupowane do `icProjects` / `adHocProjects` (linie 318–319) mają breakdowny w `breakdownMap`. Po sprawdzeniu — logika jest poprawna; pokażą się sumy, gdy dane istnieją.

**2. Jasnozielone tło dla wierszy Subtotal**
Zmienić w obiektach subsekcji (linie 627–628) `subtotalBg`:
- IC: `bg-blue-100` → `bg-green-100 dark:bg-green-900/30`
- Ad Hoc: `bg-orange-50` → `bg-green-100 dark:bg-green-900/30`

Oba subtotale dostaną identyczny jasnozielony kolor — dokładnie ten sam, co kolumny "Current" w Summary (`bg-green-100 dark:bg-green-900/30`).

`headerBg` (nagłówek subsekcji "IC" / "Ad Hoc") zostawiamy bez zmian — tylko wiersz Subtotal staje się zielony.

`Total — {group}` (linie 680–692) zostaje bez zmian (`bg-orange-100`) — to inny poziom hierarchii.

### Poza zakresem
- Zmiana koloru wiersza Total — {group} ani Grand Total.
- Zmiana eksportu XLS (sumy już są tam liczone identycznie).
- Inne raporty.

