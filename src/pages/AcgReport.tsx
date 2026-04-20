import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SAMPLE_PROPERTIES, getPropertyCountry } from "@/data/sampleProperties";

interface AcgRow {
  country: string;
  completed: number;
  ongoing: number;
  planned3m: number;
  savings: number;
  postponed: number;
  icBudget: number;
  socgenBudget: number;
}

const SEED: Record<string, Omit<AcgRow, "country">> = {
  France: { completed: 0, ongoing: 0, planned3m: 1_375_000, savings: 0, postponed: 0, icBudget: 1_375_000, socgenBudget: 1_375_000 },
  Netherlands: { completed: 0, ongoing: 148_238, planned3m: 0, savings: 0, postponed: 0, icBudget: 0, socgenBudget: 0 },
  Poland: { completed: 0, ongoing: 9_186, planned3m: 0, savings: 0, postponed: 0, icBudget: 0, socgenBudget: 0 },
  Spain: { completed: 47_305, ongoing: 156_549, planned3m: 0, savings: 0, postponed: 5_349_668, icBudget: 5_553_522, socgenBudget: 3_053_522 },
};

const fmt = (n: number) => (n === 0 ? "—" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n));
const pct = (num: number, den: number) => (den === 0 ? "NA" : `${Math.round((num / den) * 100)}%`);

export default function AcgReport() {
  const rows = useMemo<AcgRow[]>(() => {
    const countries = Array.from(new Set(SAMPLE_PROPERTIES.map((p) => getPropertyCountry(p.property)))).sort();
    return countries.map((country) => ({
      country,
      ...(SEED[country] ?? { completed: 0, ongoing: 0, planned3m: 0, savings: 0, postponed: 0, icBudget: 0, socgenBudget: 0 }),
    }));
  }, []);

  const totalOf = (r: AcgRow) => r.completed + r.ongoing + r.planned3m + r.savings + r.postponed;

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        completed: acc.completed + r.completed,
        ongoing: acc.ongoing + r.ongoing,
        planned3m: acc.planned3m + r.planned3m,
        savings: acc.savings + r.savings,
        postponed: acc.postponed + r.postponed,
        total: acc.total + totalOf(r),
        icBudget: acc.icBudget + r.icBudget,
        socgenBudget: acc.socgenBudget + r.socgenBudget,
      }),
      { completed: 0, ongoing: 0, planned3m: 0, savings: 0, postponed: 0, total: 0, icBudget: 0, socgenBudget: 0 },
    );
  }, [rows]);

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <div className="pb-3 flex-shrink-0 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Monthly CAPEX Update — ACG (Contracted Works)</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-auto">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 top-0 z-30 bg-background border-r border-border min-w-[180px] align-bottom"
                >
                  Country
                </TableHead>
                <TableHead
                  colSpan={5}
                  className="sticky top-0 z-20 bg-slate-700 text-white dark:bg-slate-800 text-center font-semibold"
                >
                  CONTRACTED WORKS
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="sticky top-0 z-20 bg-blue-100 dark:bg-blue-900/40 text-right font-semibold border-l-2 border-r-2 border-border align-bottom"
                >
                  Total (EUR)
                </TableHead>
                <TableHead rowSpan={2} className="sticky top-0 z-20 bg-background text-right align-bottom">
                  IC Budget (EUR)
                </TableHead>
                <TableHead rowSpan={2} className="sticky top-0 z-20 bg-background text-right align-bottom">
                  SocGen Budget *
                </TableHead>
                <TableHead rowSpan={2} className="sticky top-0 z-20 bg-background text-center align-bottom">
                  Contracted Works as a % of SocGen Requirement
                </TableHead>
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky top-12 z-20 bg-slate-700 text-white dark:bg-slate-800 text-right">Completed (EUR)</TableHead>
                <TableHead className="sticky top-12 z-20 bg-slate-700 text-white dark:bg-slate-800 text-right">Ongoing (EUR)</TableHead>
                <TableHead className="sticky top-12 z-20 bg-slate-700 text-white dark:bg-slate-800 text-right">Planned 3M (EUR)</TableHead>
                <TableHead className="sticky top-12 z-20 bg-slate-700 text-white dark:bg-slate-800 text-right">Savings (EUR)</TableHead>
                <TableHead className="sticky top-12 z-20 bg-slate-700 text-white dark:bg-slate-800 text-right">Postponed Works (EUR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const total = totalOf(r);
                return (
                  <TableRow key={r.country} className="h-10">
                    <TableCell className="sticky left-0 z-10 bg-background border-r border-border font-medium">
                      {r.country}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.completed)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.ongoing)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.planned3m)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.savings)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.postponed)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold bg-blue-50 dark:bg-blue-950/30 border-l-2 border-r-2 border-border">
                      {fmt(total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.icBudget)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.socgenBudget)}</TableCell>
                    <TableCell className="text-center tabular-nums">{pct(total, r.socgenBudget)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <tfoot>
              <TableRow className="h-10 sticky bottom-0 z-10 bg-muted font-semibold hover:bg-muted">
                <TableCell className="sticky left-0 z-20 bg-muted border-r border-border">Total</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.completed)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.ongoing)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.planned3m)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.savings)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.postponed)}</TableCell>
                <TableCell className="text-right tabular-nums bg-blue-100 dark:bg-blue-900/40 border-l-2 border-r-2 border-border">
                  {fmt(totals.total)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.icBudget)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(totals.socgenBudget)}</TableCell>
                <TableCell className="text-center tabular-nums">{pct(totals.total, totals.socgenBudget)}</TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic mt-2 flex-shrink-0">
        * SocGen Budget — minimum contracted works requirement per loan covenant.
      </p>
    </div>
  );
}
