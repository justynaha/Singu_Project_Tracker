import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_PROPERTIES, getPropertyCountry, getPropertyCurrency } from "@/data/sampleProperties";

const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  PLN: 0.23,
  HUF: 0.0025,
  USD: 0.92,
};

const fmt = (v: number) => (v === 0 ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 0 }));
const fmtSigned = (v: number) => {
  if (v === 0) return "—";
  const s = Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v > 0 ? `+${s}` : `−${s}`;
};

// Deterministic per-property sample amounts (Budget LC in local currency).
// Numbers chosen to keep proportions credible and align with Mandatory v Spec tab.
const AMOUNTS: Record<string, { budgetLC: number; ongoing: number; planned3M: number }> = {
  "Mapletree Park Lyon": { budgetLC: 725000, ongoing: 0, planned3M: 180000 },
  "Mapletree Park Schiphol": { budgetLC: 105839, ongoing: 105839, planned3M: 30000 },
  "Mapletree Park Marseille": { budgetLC: 650000, ongoing: 0, planned3M: 160000 },
  "Mapletree Park Piotrków 1": { budgetLC: 10113, ongoing: 2326, planned3M: 3000 }, // PLN
  "Mapletree Park Piotrków 2": { budgetLC: 27804, ongoing: 6395, planned3M: 5000 }, // PLN
  "Mapletree Park Tilburg": { budgetLC: 42399, ongoing: 42399, planned3M: 12000 },
  "Mapletree Park Szczecin": { budgetLC: 2022, ongoing: 465, planned3M: 800 }, // PLN
  "Mapletree Park Fogars": { budgetLC: 2332908, ongoing: 130710, planned3M: 480000 },
  "Mapletree Park Sallent": { budgetLC: 3220614, ongoing: 73144, planned3M: 620000 },
  "Mapletree Park Valls": { budgetLC: 0, ongoing: 0, planned3M: 0 },
};

interface Row {
  site: string;
  country: string;
  budgetLC: number;
  budgetCurrency: string;
  budgetEUR: number;
  curCompleted: number;
  curOngoing: number;
  curPlanned3M: number;
  prevCompleted: number;
  prevOngoing: number;
  prevPlanned3M: number;
}

export default function SummaryReport() {
  const propertyRows = useMemo<Row[]>(() => {
    return SAMPLE_PROPERTIES.map((p) => {
      const a = AMOUNTS[p.property] ?? { budgetLC: 0, ongoing: 0, planned3M: 0 };
      const currency = getPropertyCurrency(p.property);
      const budgetEUR = Math.round(a.budgetLC * (FX_TO_EUR[currency] ?? 1));
      const curCompleted = Math.round(budgetEUR * 0.20);
      const curOngoing = Math.round(a.ongoing * (FX_TO_EUR[currency] ?? 1));
      const curPlanned3M = Math.round(a.planned3M * (FX_TO_EUR[currency] ?? 1));
      return {
        site: p.property,
        country: getPropertyCountry(p.property),
        budgetLC: a.budgetLC,
        budgetCurrency: currency,
        budgetEUR,
        curCompleted,
        curOngoing,
        curPlanned3M,
        prevCompleted: Math.round(curCompleted * 0.85),
        prevOngoing: Math.round(curOngoing * 0.95),
        prevPlanned3M: Math.round(curPlanned3M * 0.90),
      };
    });
  }, []);

  const grandTotal = useMemo(() => ({
    budgetEUR: propertyRows.reduce((s, r) => s + r.budgetEUR, 0),
    curCompleted: propertyRows.reduce((s, r) => s + r.curCompleted, 0),
    curOngoing: propertyRows.reduce((s, r) => s + r.curOngoing, 0),
    curPlanned3M: propertyRows.reduce((s, r) => s + r.curPlanned3M, 0),
    prevCompleted: propertyRows.reduce((s, r) => s + r.prevCompleted, 0),
    prevOngoing: propertyRows.reduce((s, r) => s + r.prevOngoing, 0),
    prevPlanned3M: propertyRows.reduce((s, r) => s + r.prevPlanned3M, 0),
  }), [propertyRows]);

  const curHeadCls = "bg-green-100 dark:bg-green-900/30";
  const curCellCls = "bg-green-50 dark:bg-green-900/15";
  const curSubCls = "bg-green-100 dark:bg-green-900/30";

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <div className="pb-3 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xl font-semibold">CAPEX Budget Breakdown</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse min-w-[1500px]">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr className="border-b border-border">
                <th rowSpan={2} className="text-left font-semibold px-4 h-10 align-middle sticky left-0 bg-muted z-20 border-r border-border min-w-[220px]">Property</th>
                <th rowSpan={2} className="text-left font-semibold px-4 h-10 align-middle sticky left-[220px] bg-muted z-20 border-r border-border min-w-[120px]">Country</th>
                <th colSpan={2} className="text-center font-semibold px-4 h-10 border-r border-border">Budget</th>
                <th colSpan={3} className={`text-center font-semibold px-4 h-10 border-r border-border ${curHeadCls}`}>Current</th>
                <th colSpan={3} className="text-center font-semibold px-4 h-10 border-r border-border">Previous Month</th>
                <th colSpan={3} className="text-center font-semibold px-4 h-10">Variance</th>
              </tr>
              <tr className="border-b border-border">
                <th className="text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px]">Budget LC</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground border-r border-border whitespace-nowrap min-w-[140px]">Budget EUR</th>
                <th className={`text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px] ${curHeadCls}`}>Completed (EUR)</th>
                <th className={`text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px] ${curHeadCls}`}>Ongoing (EUR)</th>
                <th className={`text-right font-medium px-4 h-10 text-muted-foreground border-r border-border whitespace-nowrap min-w-[160px] ${curHeadCls}`}>Planned 3M (EUR)</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px]">Completed (EUR)</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px]">Ongoing (EUR)</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground border-r border-border whitespace-nowrap min-w-[160px]">Planned 3M (EUR)</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px]">Completed (EUR)</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[140px]">Ongoing (EUR)</th>
                <th className="text-right font-medium px-4 h-10 text-muted-foreground whitespace-nowrap min-w-[160px]">Planned 3M (EUR)</th>
              </tr>
            </thead>
            <tbody>
              {propertyRows.map((r) => {
                const vCompleted = r.curCompleted - r.prevCompleted;
                const vOngoing = r.curOngoing - r.prevOngoing;
                const vPlanned = r.curPlanned3M - r.prevPlanned3M;
                return (
                  <tr key={r.site} className="border-b border-border bg-background hover:bg-muted/50 [&>td]:bg-inherit">
                    <td className="px-4 h-10 sticky left-0 z-10 border-r border-border whitespace-nowrap min-w-[220px]">{r.site}</td>
                    <td className="px-4 h-10 sticky left-[220px] z-10 border-r border-border whitespace-nowrap min-w-[120px]">{r.country}</td>
                    <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">
                      {r.budgetLC === 0 ? "—" : `${fmt(r.budgetLC)} ${r.budgetCurrency}`}
                    </td>
                    <td className="px-4 h-10 text-right tabular-nums border-r border-border">{fmt(r.budgetEUR)}</td>
                    <td className={`px-4 h-10 text-right tabular-nums ${curCellCls}`}>{fmt(r.curCompleted)}</td>
                    <td className={`px-4 h-10 text-right tabular-nums ${curCellCls}`}>{fmt(r.curOngoing)}</td>
                    <td className={`px-4 h-10 text-right tabular-nums border-r border-border ${curCellCls}`}>{fmt(r.curPlanned3M)}</td>
                    <td className="px-4 h-10 text-right tabular-nums">{fmt(r.prevCompleted)}</td>
                    <td className="px-4 h-10 text-right tabular-nums">{fmt(r.prevOngoing)}</td>
                    <td className="px-4 h-10 text-right tabular-nums border-r border-border">{fmt(r.prevPlanned3M)}</td>
                    <td className="px-4 h-10 text-right tabular-nums">{fmtSigned(vCompleted)}</td>
                    <td className="px-4 h-10 text-right tabular-nums">{fmtSigned(vOngoing)}</td>
                    <td className="px-4 h-10 text-right tabular-nums">{fmtSigned(vPlanned)}</td>
                  </tr>
                );
              })}
              <tr className="bg-muted font-bold border-t-2 border-border sticky bottom-0 z-20 [&>td]:bg-inherit">
                <td className="px-4 h-10 sticky left-0 z-30 border-r border-border whitespace-nowrap min-w-[220px]">Total</td>
                <td className="px-4 h-10 sticky left-[220px] z-30 border-r border-border min-w-[120px]"></td>
                <td className="px-4 h-10 text-right tabular-nums text-muted-foreground whitespace-nowrap">—</td>
                <td className="px-4 h-10 text-right tabular-nums border-r border-border">{fmt(grandTotal.budgetEUR)}</td>
                <td className={`px-4 h-10 text-right tabular-nums ${curSubCls}`}>{fmt(grandTotal.curCompleted)}</td>
                <td className={`px-4 h-10 text-right tabular-nums ${curSubCls}`}>{fmt(grandTotal.curOngoing)}</td>
                <td className={`px-4 h-10 text-right tabular-nums border-r border-border ${curSubCls}`}>{fmt(grandTotal.curPlanned3M)}</td>
                <td className="px-4 h-10 text-right tabular-nums">{fmt(grandTotal.prevCompleted)}</td>
                <td className="px-4 h-10 text-right tabular-nums">{fmt(grandTotal.prevOngoing)}</td>
                <td className="px-4 h-10 text-right tabular-nums border-r border-border">{fmt(grandTotal.prevPlanned3M)}</td>
                <td className="px-4 h-10 text-right tabular-nums">{fmtSigned(grandTotal.curCompleted - grandTotal.prevCompleted)}</td>
                <td className="px-4 h-10 text-right tabular-nums">{fmtSigned(grandTotal.curOngoing - grandTotal.prevOngoing)}</td>
                <td className="px-4 h-10 text-right tabular-nums">{fmtSigned(grandTotal.curPlanned3M - grandTotal.prevPlanned3M)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
