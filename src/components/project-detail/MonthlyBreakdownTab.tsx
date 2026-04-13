import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const MONTH_KEYS = ["apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "jan", "feb", "mar"] as const;
const MONTH_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

type MonthKey = typeof MONTH_KEYS[number];

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
    return `${m} ${year}`;
  });
}

function rowTotal(row: BreakdownRow) {
  return MONTH_KEYS.reduce((sum, k) => sum + Number(row[k] || 0), 0);
}

interface Props {
  projectId: string;
  fiscalYear: string | null;
}

export default function MonthlyBreakdownTab({ projectId, fiscalYear }: Props) {
  const [row, setRow] = useState<BreakdownRow | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Auto-create the single row
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

  useEffect(() => { fetchOrCreateRow(); }, [fetchOrCreateRow]);

  const updateField = async (field: string, value: number) => {
    if (!row) return;
    const { error } = await supabase
      .from("monthly_breakdown")
      .update({ [field]: value } as any)
      .eq("id", row.id);
    if (error) toast.error("Failed to save");
  };

  const handleChange = (field: MonthKey, value: string) => {
    if (!row) return;
    setRow({ ...row, [field]: parseFloat(value) || 0 });
  };

  const handleBlur = (field: MonthKey, value: string) => {
    updateField(field, parseFloat(value) || 0);
  };

  const formatNum = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Monthly Breakdown — FY {fy}</h3>

      <div className="border border-border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h} className="min-w-[100px] text-right">{h}</TableHead>
              ))}
              <TableHead className="min-w-[110px] text-right font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || !row ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  {loading ? "Loading…" : "Error loading data"}
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                {MONTH_KEYS.map((k) => (
                  <TableCell key={k} className="p-1">
                    <Input
                      type="number"
                      value={row[k] || ""}
                      onChange={(e) => handleChange(k, e.target.value)}
                      onBlur={(e) => handleBlur(k, e.target.value)}
                      className="h-8 text-sm text-right"
                      placeholder="0"
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold pr-4">
                  {formatNum(rowTotal(row))}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
