import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MONTH_KEYS = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"] as const;
const MONTH_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

type MonthKey = (typeof MONTH_KEYS)[number];
type Currency = "local" | "EUR";

interface BreakdownRow {
  id: string;
  project_id: string;
  label: string;
  apr: number; may: number; jun: number;
  jul: number; aug: number; sep: number;
  oct: number; nov: number; dec: number;
  jan: number; feb: number; mar: number;
  sort_order: number;
}

function getMonthHeaders(fiscalYear: number) {
  return MONTH_LABELS.map((m, i) => {
    const year = i < 9 ? fiscalYear : fiscalYear + 1;
    const shortYear = String(year).slice(2);
    return `${m} ${shortYear}`;
  });
}

function rowTotal(row: BreakdownRow) {
  return MONTH_KEYS.reduce((sum, k) => sum + Number(row[k] || 0), 0);
}

interface Props {
  projectId: string;
  fiscalYear: string | null;
  projectCurrency?: string;
  totalContracted?: number;
  totalInvoiced?: number;
  totalBudget?: number;
}

// Hardcoded FX rate for demo — in production, fetch from fx_rates table
const EUR_RATE = 0.23;

function fmt(value: number): string {
  return value.toLocaleString("pl-PL");
}

function convertValue(value: number, currency: Currency): number {
  return currency === "EUR" ? Math.round(value * EUR_RATE) : value;
}

function SummaryRow({
  label,
  value,
  total,
  currency,
  currencyLabel,
  colCount,
}: {
  label: string;
  value: number;
  total: number;
  currency: Currency;
  currencyLabel: string;
  colCount: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <tr className="border-t border-border bg-muted/30">
      <td className="sticky left-0 z-10 bg-muted/30 px-3 py-1.5 text-sm font-medium text-muted-foreground border-r border-border">
        {label}
      </td>
      <td colSpan={colCount} className="px-3 py-1.5 text-right text-sm text-muted-foreground">
        <span className="text-muted-foreground/60">({pct}% total)</span>{" "}
        {fmt(convertValue(value, currency))} {currencyLabel}
      </td>
    </tr>
  );
}

export default function MonthlyBreakdownTab({ projectId, fiscalYear, projectCurrency, totalContracted, totalInvoiced, totalBudget }: Props) {
  const [row, setRow] = useState<BreakdownRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>("local");
  const [locked, setLocked] = useState(false);

  const localCurrencyCode = projectCurrency || "PLN";
  const currencyLabel = currency === "EUR" ? "EUR" : localCurrencyCode;

  const fy = parseInt(fiscalYear || new Date().getFullYear().toString(), 10);
  const headers = getMonthHeaders(fy);

  const fetchOrCreateRow = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("monthly_breakdown")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (error) {
      toast.error("Failed to load monthly breakdown");
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setRow(data[0] as unknown as BreakdownRow);
    } else {
      const { data: newRow, error: insertError } = await supabase
        .from("monthly_breakdown")
        .insert({ project_id: projectId, label: "", sort_order: 0 } as any)
        .select()
        .single();
      if (insertError) {
        toast.error("Failed to initialize monthly breakdown");
      } else {
        setRow(newRow as unknown as BreakdownRow);
      }
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchOrCreateRow();
  }, [fetchOrCreateRow]);

  const updateField = async (field: string, value: number) => {
    if (!row) return;
    const { error } = await supabase
      .from("monthly_breakdown")
      .update({ [field]: value } as any)
      .eq("id", row.id);
    if (error) toast.error("Failed to save");
  };

  const handleChange = (field: MonthKey, rawValue: string) => {
    if (!row) return;
    const num = parseInt(rawValue.replace(/\s/g, "").replace(/,/g, ""), 10);
    const val = isNaN(num) ? 0 : num;
    // If viewing EUR, convert back to local
    const localVal = currency === "EUR" ? Math.round(val / EUR_RATE) : val;
    setRow({ ...row, [field]: localVal });
  };

  const handleBlur = (field: MonthKey) => {
    if (!row) return;
    updateField(field, row[field]);
  };

  const total = useMemo(() => (row ? rowTotal(row) : 0), [row]);
  const planned3M = useMemo(
    () => (row ? MONTH_KEYS.slice(0, 3).reduce((s, k) => s + Number(row[k] || 0), 0) : 0),
    [row]
  );
  const contracted = totalContracted ?? Math.round(total * 0.75);
  const invoiced = totalInvoiced ?? Math.round(total * 0.5);

  const handleExport = () => {
    if (!row) return;
    const csvHeaders = ["", ...headers.map(h => `${h} (${currencyLabel})`)].join(",");
    const csvValues = [
      "Amount",
      ...MONTH_KEYS.map(k => String(convertValue(row[k] || 0, currency))),
    ].join(",");
    const csvTotal = ["Total", ...Array(headers.length - 1).fill(""), `${fmt(convertValue(total, currency))} ${currencyLabel}`].join(",");
    const csv = [csvHeaders, csvValues, csvTotal].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly_breakdown_FY${fy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Monthly Breakdown</h2>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setCurrency("local")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              currency === "local"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-accent"
            }`}
          >
            Local currency
          </button>
          <button
            onClick={() => setCurrency("EUR")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              currency === "EUR"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-accent"
            }`}
          >
            EUR
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="mb-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-muted">
                <th className="sticky left-0 z-20 bg-muted px-3 py-2 text-left font-semibold text-foreground w-[120px] min-w-[120px] border-r border-border" />
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-right font-semibold text-foreground min-w-[90px] border-r border-border last:border-r-0"
                  >
                    {h}
                    <br />
                    <span className="font-normal text-muted-foreground">({currencyLabel})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading || !row ? (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="text-center text-muted-foreground py-8"
                  >
                    {loading ? "Loading…" : "Error loading data"}
                  </td>
                </tr>
              ) : (
                <>
                  {/* Amount row */}
                  <tr className="border-t border-border">
                    <td className="sticky left-0 z-10 bg-background px-3 py-1.5 font-medium text-foreground border-r border-border">
                      <span className="flex items-center gap-1.5">
                        Forecasted
                        <button
                          onClick={() => setLocked((l) => !l)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {locked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <LockOpen className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </span>
                    </td>
                    {MONTH_KEYS.map((k) => (
                      <td key={k} className="px-0 py-0 border-r border-border last:border-r-0">
                        {locked ? (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <input
                                  type="text"
                                  readOnly
                                  className="w-full h-full px-2 py-1.5 text-right text-sm bg-muted/40 text-foreground border-0 outline-none cursor-not-allowed"
                                  value={fmt(convertValue(row[k] || 0, currency))}
                                />
                              </TooltipTrigger>
                              <TooltipContent>Unlock to edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <input
                            type="text"
                            className="w-full h-full px-2 py-1.5 text-right text-sm bg-muted/40 text-foreground border-0 outline-none focus:bg-accent focus:ring-1 focus:ring-ring"
                            value={fmt(convertValue(row[k] || 0, currency))}
                            onChange={(e) => handleChange(k, e.target.value)}
                            onFocus={(e) => {
                              const v = convertValue(row[k] || 0, currency);
                              e.target.value = String(v);
                              e.target.select();
                            }}
                            onBlur={() => handleBlur(k)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Total row */}
                  <tr className="border-t-2 border-border">
                    <td className="sticky left-0 z-10 bg-background px-3 py-3 font-bold text-foreground text-lg border-r border-border">
                      Total
                    </td>
                    <td
                      colSpan={headers.length}
                      className="px-3 py-3 text-right font-bold text-foreground text-lg"
                    >
                      {totalBudget && totalBudget > 0 && (
                        <span className={cn("text-sm mr-2", convertValue(total, currency) > convertValue(totalBudget, currency) ? "text-destructive font-bold" : "text-muted-foreground font-normal")}>
                          ({Math.round((convertValue(total, currency) / convertValue(totalBudget, currency)) * 100)}% of budget)
                        </span>
                      )}
                      {fmt(convertValue(total, currency))} {currencyLabel}
                    </td>
                  </tr>

                  {/* Project Budget row */}
                  {totalBudget != null && totalBudget > 0 && (
                    <tr className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-background px-3 py-3 text-sm text-muted-foreground border-r border-border">
                        Project Budget
                      </td>
                      <td
                        colSpan={headers.length}
                        className="px-3 py-3 text-right text-sm text-muted-foreground"
                      >
                        {fmt(convertValue(totalBudget, currency))} {currencyLabel}
                      </td>
                    </tr>
                  )}

                  {/* Summary rows */}
                  <SummaryRow
                    label="Planned 3M"
                    value={planned3M}
                    total={total}
                    currency={currency}
                    currencyLabel={currencyLabel}
                    colCount={headers.length}
                  />
                  <SummaryRow
                    label="Contracted"
                    value={contracted}
                    total={total}
                    currency={currency}
                    currencyLabel={currencyLabel}
                    colCount={headers.length}
                  />
                  <SummaryRow
                    label="Invoiced"
                    value={invoiced}
                    total={total}
                    currency={currency}
                    currencyLabel={currencyLabel}
                    colCount={headers.length}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
