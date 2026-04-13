import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

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
    const year = i < 9 ? fiscalYear : fiscalYear + 1; // Apr-Dec = fiscalYear, Jan-Mar = fiscalYear+1
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
  const [rows, setRows] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fy = parseInt(fiscalYear || new Date().getFullYear().toString(), 10);
  const headers = getMonthHeaders(fy);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("monthly_breakdown")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Failed to load monthly breakdown");
    } else {
      setRows((data || []) as unknown as BreakdownRow[]);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const addRow = async () => {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), -1);
    const { data, error } = await supabase
      .from("monthly_breakdown")
      .insert({ project_id: projectId, label: "", sort_order: maxOrder + 1 } as any)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add row");
    } else {
      setRows((prev) => [...prev, data as unknown as BreakdownRow]);
    }
  };

  const deleteRow = async (id: string) => {
    const { error } = await supabase.from("monthly_breakdown").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete row");
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateField = async (id: string, field: string, value: string | number) => {
    const { error } = await supabase
      .from("monthly_breakdown")
      .update({ [field]: value } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to save");
    }
  };

  const handleCellChange = (id: string, field: string, value: string) => {
    const numValue = field === "label" ? value : (parseFloat(value) || 0);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: numValue } : r))
    );
  };

  const handleCellBlur = (id: string, field: string, value: string) => {
    const numValue = field === "label" ? value : (parseFloat(value) || 0);
    updateField(id, field, numValue);
  };

  const columnTotals = MONTH_KEYS.map((k) =>
    rows.reduce((sum, r) => sum + Number(r[k] || 0), 0)
  );
  const grandTotal = columnTotals.reduce((a, b) => a + b, 0);

  const formatNum = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Monthly Breakdown — FY {fy}</h3>
        <Button size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add Row
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="min-w-[140px]">Label</TableHead>
              {headers.map((h) => (
                <TableHead key={h} className="min-w-[100px] text-right">{h}</TableHead>
              ))}
              <TableHead className="min-w-[110px] text-right font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground py-8">Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground py-8">
                  No rows yet. Click "Add Row" to start.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-2">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={row.label}
                      onChange={(e) => handleCellChange(row.id, "label", e.target.value)}
                      onBlur={(e) => handleCellBlur(row.id, "label", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Row label"
                    />
                  </TableCell>
                  {MONTH_KEYS.map((k) => (
                    <TableCell key={k} className="p-1">
                      <Input
                        type="number"
                        value={row[k] || ""}
                        onChange={(e) => handleCellChange(row.id, k, e.target.value)}
                        onBlur={(e) => handleCellBlur(row.id, k, e.target.value)}
                        className="h-8 text-sm text-right"
                        placeholder="0"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium pr-4">
                    {formatNum(rowTotal(row))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell />
                <TableCell className="font-bold">Total</TableCell>
                {columnTotals.map((t, i) => (
                  <TableCell key={i} className="text-right font-bold">
                    {formatNum(t)}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold pr-4">
                  {formatNum(grandTotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
