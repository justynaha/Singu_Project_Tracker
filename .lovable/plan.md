

## Plan: Ukryj wiersz Total, gdy kolumny Finance są ukryte

### Plik
`src/components/project-detail/TimelineV2Tab.tsx` (linie 1358‑1397)

### Logika
Wiersz Total ma sens tylko, gdy widać kolumny finansowe (`forecasted`, `contracted`, `invoiced`, `remaining`). Domyślnie grupa Finance jest ukryta, więc wiersz Total również powinien zniknąć. Gdy użytkownik włączy Finance w popoverze Columns, Total ma się pojawić ponownie.

### Zmiana
Tuż przed wierszem Total (linia 1358) policz, czy widoczna jest którakolwiek z kolumn finansowych:

```tsx
const hasFinanceColumns = visibleColumns.some((colId) =>
  ["forecasted", "contracted", "invoiced", "remaining"].includes(colId)
);
```

Następnie owiń wiersz Total warunkiem:

```tsx
{hasFinanceColumns && (
  <tr className="bg-muted/50 font-semibold border-t-2 border-border">
    {/* ...existing Total row content... */}
  </tr>
)}
```

### Wynik
- Domyślny stan (Finance off) → brak wiersza Total na dole.
- Po włączeniu Finance w Columns popover → wiersz Total pojawia się automatycznie z sumami forecasted/contracted/invoiced/remaining.

### Poza zakresem
- Brak zmian w logice obliczania `totals` (nadal liczone, używane też przez BudgetWidget powyżej).
- Brak zmian w domyślnej widoczności kolumn (już ustawione w poprzednim kroku).

