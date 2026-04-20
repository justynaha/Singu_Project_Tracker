import { useState, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { COUNTRY_TO_SITE_GROUP } from "@/hooks/useDashboardData";

const siteToCountry: Record<string, string> = {
  "Mapletree Park Bedzin": "Poland",
  "Mapletree Park Blonie 2": "Poland",
  "Mapletree Park Gdańsk-Airport": "Poland",
  "Mapletree Park Nadarzyn": "Poland",
  "Mapletree Park Piotrków 1": "Poland",
  "Mapletree Park Piotrków 2": "Poland",
  "Mapletree Park Szczecin": "Poland",
  "Mapletree Park Bologna Castel San Pietro": "Italy",
  "Mapletree Park Fogars": "Spain",
  "Mapletree Park Les Franqueses": "Spain",
  "Mapletree Park Sallent": "Spain",
  "Mapletree Park Valls": "Spain",
  "Százhalombatta": "Hungary",
  "Üllő": "Hungary",
  "Bedzin": "Poland",
  "Blonie 2": "Poland",
  "Gdańsk-Airport": "Poland",
  "Nadarzyn": "Poland",
  "Piotrków 1": "Poland",
  "Szczecin": "Poland",
  "Bologna Castel San Pietro": "Italy",
  "Fogars": "Spain",
  "Les Franqueses": "Spain",
  "Sallent": "Spain",
  "Valls": "Spain",
  "Mapletree Park Tilburg": "Netherlands",
  "Mapletree Park Schiphol": "Netherlands",
  "Tilburg": "Netherlands",
  "Schiphol": "Netherlands",
  "Mapletree Park Lyon": "France",
  "Mapletree Park Marseille": "France",
  "Lyon": "France",
  "Marseille": "France",
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  Poland: "PLN",
  Hungary: "HUF",
  Italy: "EUR",
  Spain: "EUR",
  Netherlands: "EUR",
  France: "EUR",
};

const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  PLN: 0.23,
  HUF: 0.0025,
  USD: 0.92,
};

const SITE_GROUP_DISPLAY: Record<string, string> = {
  WE: "Western Europe",
  PL: "Poland",
  HU: "Hungary",
  Other: "Other",
};

const fmt = (v: number) => (v === 0 ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: 0 }));
const fmtSigned = (v: number) => {
  if (v === 0) return "—";
  const s = Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return v > 0 ? `+${s}` : `−${s}`;
};

interface BreakdownRow {
  project_id: string;
  apr: number | null; may: number | null; jun: number | null;
  jul: number | null; aug: number | null; sep: number | null;
  oct: number | null; nov: number | null; dec: number | null;
  jan: number | null; feb: number | null; mar: number | null;
}
interface ContractRow { project_id: string; amount_lc: number | null; status: string; }

export default function SummaryReport() {
  const { projects, loading: projectsLoading } = useProjects();
  const [breakdowns, setBreakdowns] = useState<BreakdownRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [bdLoading, setBdLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAll = async () => {
      setBdLoading(true);
      const [bdRes, cRes] = await Promise.all([
        supabase.from("monthly_breakdown").select("project_id, apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar"),
        supabase.from("contracts").select("project_id, amount_lc, status"),
      ]);
      if (!bdRes.error) setBreakdowns((bdRes.data || []) as BreakdownRow[]);
      if (!cRes.error) setContracts((cRes.data || []) as ContractRow[]);
      setBdLoading(false);
    };
    fetchAll();
  }, []);

  const breakdownMap = useMemo(() => {
    const m = new Map<string, BreakdownRow>();
    breakdowns.forEach((b) => m.set(b.project_id, b));
    return m;
  }, [breakdowns]);

  const propertyRows = useMemo(() => {
    type Row = {
      site: string; country: string; group: string;
      budgetLC: number; budgetCurrency: string; budgetMixed: boolean;
      budgetEUR: number;
      curCompleted: number; curOngoing: number; curPlanned3M: number;
      prevCompleted: number; prevOngoing: number; prevPlanned3M: number;
    };
    const map = new Map<string, Row>();
    projects.forEach((p) => {
      if (!p.site) return;
      const country = siteToCountry[p.site] || "Other";
      const group = COUNTRY_TO_SITE_GROUP[country] || "Other";
      const defaultCurrency = COUNTRY_TO_CURRENCY[country] || "EUR";
      const currency = (p.currency || defaultCurrency).toUpperCase();
      if (!map.has(p.site)) {
        map.set(p.site, {
          site: p.site, country, group,
          budgetLC: 0, budgetCurrency: currency, budgetMixed: false,
          budgetEUR: 0,
          curCompleted: 0, curOngoing: 0, curPlanned3M: 0,
          prevCompleted: 0, prevOngoing: 0, prevPlanned3M: 0,
        });
      }
      const row = map.get(p.site)!;
      if (row.budgetCurrency !== currency) row.budgetMixed = true;
      const tb = Number(p.total_budget) || 0;
      row.budgetLC += tb;
      row.budgetEUR += tb * (FX_TO_EUR[currency] ?? 1);
      const bd = breakdownMap.get(p.id);
      if (bd) {
        row.curPlanned3M += (bd.apr || 0) + (bd.may || 0) + (bd.jun || 0);
      }
    });
    contracts.forEach((c) => {
      if (c.status !== "Ongoing") return;
      const proj = projects.find((p) => p.id === c.project_id);
      if (!proj?.site) return;
      const row = map.get(proj.site);
      if (row) row.curOngoing += c.amount_lc || 0;
    });
    // derive completed and previous month placeholders
    map.forEach((row) => {
      row.curCompleted = Math.round(row.budgetEUR * 0.20);
      row.prevCompleted = Math.round(row.curCompleted * 0.85);
      row.prevOngoing = Math.round(row.curOngoing * 0.95);
      row.prevPlanned3M = Math.round(row.curPlanned3M * 0.90);
    });
    return Array.from(map.values()).sort((a, b) => a.site.localeCompare(b.site));
  }, [projects, contracts, breakdownMap]);

  const groupedRows = useMemo(() => {
    const groups: Record<string, typeof propertyRows> = {};
    propertyRows.forEach((r) => {
      if (!groups[r.group]) groups[r.group] = [];
      groups[r.group].push(r);
    });
    const order = ["WE", "PL", "HU", "Other"];
    return order
      .filter((k) => groups[k]?.length)
      .map((k) => {
        const rows = groups[k];
        const subtotal = {
          budgetEUR: rows.reduce((s, r) => s + r.budgetEUR, 0),
          curCompleted: rows.reduce((s, r) => s + r.curCompleted, 0),
          curOngoing: rows.reduce((s, r) => s + r.curOngoing, 0),
          curPlanned3M: rows.reduce((s, r) => s + r.curPlanned3M, 0),
          prevCompleted: rows.reduce((s, r) => s + r.prevCompleted, 0),
          prevOngoing: rows.reduce((s, r) => s + r.prevOngoing, 0),
          prevPlanned3M: rows.reduce((s, r) => s + r.prevPlanned3M, 0),
        };
        return { group: k, label: SITE_GROUP_DISPLAY[k] || k, rows, subtotal };
      });
  }, [propertyRows]);

  const grandTotal = useMemo(() => ({
    budgetEUR: propertyRows.reduce((s, r) => s + r.budgetEUR, 0),
    curCompleted: propertyRows.reduce((s, r) => s + r.curCompleted, 0),
    curOngoing: propertyRows.reduce((s, r) => s + r.curOngoing, 0),
    curPlanned3M: propertyRows.reduce((s, r) => s + r.curPlanned3M, 0),
    prevCompleted: propertyRows.reduce((s, r) => s + r.prevCompleted, 0),
    prevOngoing: propertyRows.reduce((s, r) => s + r.prevOngoing, 0),
    prevPlanned3M: propertyRows.reduce((s, r) => s + r.prevPlanned3M, 0),
  }), [propertyRows]);

  const toggleGroup = (g: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const loading = projectsLoading || bdLoading;

  // tailwind classes for green section
  const curHeadCls = "bg-green-100 dark:bg-green-900/30";
  const curCellCls = "bg-green-50 dark:bg-green-900/15";
  const curSubCls = "bg-green-100 dark:bg-green-900/30";

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <div className="pb-3 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Summary</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse min-w-[1500px]">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="border-b border-border">
                  <th rowSpan={2} className="text-left font-semibold px-4 h-10 align-middle sticky left-0 bg-muted z-20 border-r border-border">Property</th>
                  <th rowSpan={2} className="text-left font-semibold px-4 h-10 align-middle border-r border-border">Country</th>
                  <th colSpan={2} className="text-center font-semibold px-4 h-10 border-r border-border">Budget</th>
                  <th colSpan={3} className={`text-center font-semibold px-4 h-10 border-r border-border ${curHeadCls}`}>Current</th>
                  <th colSpan={3} className="text-center font-semibold px-4 h-10 border-r border-border">Previous Month</th>
                  <th colSpan={3} className="text-center font-semibold px-4 h-10">Variance</th>
                </tr>
                <tr className="border-b border-border">
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground">Budget LC</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground border-r border-border">Budget EUR</th>
                  <th className={`text-right font-medium px-4 h-10 text-muted-foreground ${curHeadCls}`}>Completed (EUR)</th>
                  <th className={`text-right font-medium px-4 h-10 text-muted-foreground ${curHeadCls}`}>Ongoing (EUR)</th>
                  <th className={`text-right font-medium px-4 h-10 text-muted-foreground border-r border-border ${curHeadCls}`}>Planned 3M (EUR)</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground">Completed (EUR)</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground">Ongoing (EUR)</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground border-r border-border">Planned 3M (EUR)</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground">Completed (EUR)</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground">Ongoing (EUR)</th>
                  <th className="text-right font-medium px-4 h-10 text-muted-foreground">Planned 3M (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {propertyRows.map((r) => {
                  const vCompleted = r.curCompleted - r.prevCompleted;
                  const vOngoing = r.curOngoing - r.prevOngoing;
                  const vPlanned = r.curPlanned3M - r.prevPlanned3M;
                  return (
                    <tr key={r.site} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 h-10 sticky left-0 bg-background border-r border-border">{r.site}</td>
                      <td className="px-4 h-10 border-r border-border">{r.country}</td>
                      <td className="px-4 h-10 text-right tabular-nums">
                        {r.budgetMixed ? "Mixed" : `${fmt(r.budgetLC)} ${r.budgetCurrency}`}
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
                <tr className="bg-muted/70 font-bold border-t-2 border-border sticky bottom-0">
                  <td className="px-4 h-10 sticky left-0 bg-muted/70 border-r border-border uppercase">MUSEL Total</td>
                  <td className="px-4 h-10 border-r border-border"></td>
                  <td className="px-4 h-10 text-right tabular-nums text-muted-foreground">—</td>
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
          )}
        </div>
      </div>
    </div>
  );
}
