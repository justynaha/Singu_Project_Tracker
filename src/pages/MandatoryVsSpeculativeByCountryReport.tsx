import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_PROPERTIES, getPropertyCountry } from "@/data/sampleProperties";
import { MAND_SPEC_AMOUNTS, ZERO_AMOUNTS, type MandSpecAmounts } from "@/data/mandatoryVsSpeculativeAmounts";

const fmt = (v: number) => (v === 0 ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 0 }));
const pct = (num: number, den: number) => {
  if (!den) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
};

interface CountryRow extends MandSpecAmounts {
  country: string;
}

const orangeHead = "bg-orange-200 dark:bg-orange-900/40 text-foreground";
const slateHead = "bg-slate-700 text-white dark:bg-slate-800";
const totalCol = "bg-blue-50 dark:bg-blue-950/30";
const totalColStrong = "bg-blue-100 dark:bg-blue-900/40";

export default function MandatoryVsSpeculativeByCountryReport() {
  const rows = useMemo<CountryRow[]>(() => {
    const map = new Map<string, MandSpecAmounts>();
    for (const p of SAMPLE_PROPERTIES) {
      const country = getPropertyCountry(p.property);
      const a = MAND_SPEC_AMOUNTS[p.property] ?? ZERO_AMOUNTS;
      const cur = map.get(country) ?? { ...ZERO_AMOUNTS };
      cur.mandBudget += a.mandBudget;
      cur.specBudget += a.specBudget;
      cur.mandContracted += a.mandContracted;
      cur.specContracted += a.specContracted;
      map.set(country, cur);
    }
    return Array.from(map.entries())
      .map(([country, a]) => ({ country, ...a }))
      .sort((a, b) => a.country.localeCompare(b.country));
  }, []);

  const totals = rows.reduce(
    (acc, r) => ({
      mandBudget: acc.mandBudget + r.mandBudget,
      specBudget: acc.specBudget + r.specBudget,
      mandContracted: acc.mandContracted + r.mandContracted,
      specContracted: acc.specContracted + r.specContracted,
    }),
    { ...ZERO_AMOUNTS }
  );
  const totalBudget = totals.mandBudget + totals.specBudget;
  const totalContracted = totals.mandContracted + totals.specContracted;

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <div className="pb-3 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Monthly CAPEX Update — Mandatory v Speculative by Country</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr className="border-b border-border">
                <th rowSpan={2} className="text-left font-semibold px-4 h-10 align-middle sticky left-0 bg-muted z-20 border-r border-border min-w-[200px]">Country</th>
                <th colSpan={3} className={`text-center font-semibold px-4 h-10 border-r border-border ${orangeHead}`}>FY25/26 Budget (EUR)</th>
                <th colSpan={3} className={`text-center font-semibold px-4 h-10 ${slateHead}`}>Contracted (EUR)</th>
              </tr>
              <tr className="border-b border-border">
                <th className={`text-right font-medium px-4 h-10 ${orangeHead}`}>Mandatory</th>
                <th className={`text-right font-medium px-4 h-10 ${orangeHead}`}>Speculative</th>
                <th className={`text-right font-medium px-4 h-10 border-r border-border ${orangeHead} ${totalColStrong}`}>Budget</th>
                <th className={`text-right font-medium px-4 h-10 ${slateHead}`}>Mandatory</th>
                <th className={`text-right font-medium px-4 h-10 ${slateHead}`}>Speculative</th>
                <th className={`text-right font-medium px-4 h-10 ${slateHead} ${totalColStrong}`}>Contracted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const budget = r.mandBudget + r.specBudget;
                const contracted = r.mandContracted + r.specContracted;
                return (
                  <tr key={r.country} className="border-b border-border bg-background hover:bg-muted/50 [&>td]:bg-inherit">
                    <td className="px-4 h-10 sticky left-0 border-r border-border whitespace-nowrap min-w-[200px] font-medium">{r.country}</td>
                    <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(r.mandBudget)}</td>
                    <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(r.specBudget)}</td>
                    <td className={`px-4 h-10 text-right tabular-nums whitespace-nowrap border-r border-border ${totalCol}`}>{fmt(budget)}</td>
                    <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(r.mandContracted)}</td>
                    <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(r.specContracted)}</td>
                    <td className={`px-4 h-10 text-right tabular-nums whitespace-nowrap ${totalCol}`}>{fmt(contracted)}</td>
                  </tr>
                );
              })}
              <tr className="bg-muted font-bold border-t-2 border-border sticky bottom-10 z-10 [&>td]:bg-inherit">
                <td className="px-4 h-10 sticky left-0 z-20 border-r border-border whitespace-nowrap min-w-[200px]">Total</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(totals.mandBudget)}</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(totals.specBudget)}</td>
                <td className={`px-4 h-10 text-right tabular-nums whitespace-nowrap border-r border-border ${totalColStrong}`}>{fmt(totalBudget)}</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(totals.mandContracted)}</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{fmt(totals.specContracted)}</td>
                <td className={`px-4 h-10 text-right tabular-nums whitespace-nowrap ${totalColStrong}`}>{fmt(totalContracted)}</td>
              </tr>
              <tr className="bg-muted italic border-t border-border sticky bottom-0 z-10 [&>td]:bg-inherit">
                <td className="px-4 h-10 sticky left-0 z-20 border-r border-border whitespace-nowrap min-w-[200px]">% Contracted</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{pct(totals.mandContracted, totals.mandBudget)}</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{pct(totals.specContracted, totals.specBudget)}</td>
                <td className={`px-4 h-10 text-right tabular-nums whitespace-nowrap border-r border-border ${totalCol}`}>{pct(totalContracted, totalBudget)}</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{pct(totals.mandContracted, totals.mandBudget)}</td>
                <td className="px-4 h-10 text-right tabular-nums whitespace-nowrap">{pct(totals.specContracted, totals.specBudget)}</td>
                <td className={`px-4 h-10 text-right tabular-nums whitespace-nowrap ${totalCol}`}>{pct(totalContracted, totalBudget)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}