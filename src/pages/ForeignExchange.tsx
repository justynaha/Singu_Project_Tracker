import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

interface FxRate {
  id: string;
  currency: string;
  rate: number;
  valid_from: string;
  added_by: string | null;
  note: string | null;
  created_at: string;
}

const CURRENCIES = ["PLN", "HUF", "CZK"];

function getMostRecentIds(rates: FxRate[]): Set<string> {
  const latest = new Map<string, FxRate>();
  for (const r of rates) {
    const cur = latest.get(r.currency);
    if (!cur || r.valid_from > cur.valid_from) latest.set(r.currency, r);
  }
  return new Set([...latest.values()].map((r) => r.id));
}

export default function ForeignExchange() {
  const [rates, setRates] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [validFrom, setValidFrom] = useState<Date | undefined>(new Date());
  const [note, setNote] = useState("");

  const fetchRates = useCallback(async () => {
    const { data, error } = await supabase
      .from("fx_rates")
      .select("*")
      .order("valid_from", { ascending: false });
    if (error) {
      toast.error("Failed to load FX rates");
      return;
    }
    setRates(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleSave = async () => {
    if (!currency || !rate || !validFrom) return;
    const { error } = await supabase.from("fx_rates").insert({
      currency,
      rate: parseFloat(rate),
      valid_from: format(validFrom, "yyyy-MM-dd"),
      added_by: "Current User",
      note: note || null,
    });
    if (error) {
      toast.error("Failed to save FX rate");
      return;
    }
    toast.success("FX rate saved");
    setOpen(false);
    setCurrency("");
    setRate("");
    setValidFrom(new Date());
    setNote("");
    fetchRates();
  };

  const currentIds = getMostRecentIds(rates);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Foreign Exchange</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add rate
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Currency pair</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Valid from</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead>Note / source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No rates yet</TableCell>
              </TableRow>
            ) : (
              rates.map((r) => {
                const isCurrent = currentIds.has(r.id);
                return (
                  <TableRow key={r.id} className={isCurrent ? "font-semibold" : ""}>
                    <TableCell>
                      EUR/{r.currency}
                      {isCurrent && (
                        <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                      )}
                    </TableCell>
                    <TableCell>{r.rate.toFixed(4)}</TableCell>
                    <TableCell>{format(new Date(r.valid_from), "dd MMM yyyy")}</TableCell>
                    <TableCell>{r.added_by || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.note || "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add FX Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">1 EUR =</span>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.0000"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="flex-1"
                  required
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Valid from</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validFrom ? format(validFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validFrom}
                    onSelect={setValidFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Note / source</label>
              <Input
                placeholder="e.g. NBP rate Q1 2026"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This rate will apply to new cost entries only. Existing project data will not be recalculated.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!currency || !rate || !validFrom}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
