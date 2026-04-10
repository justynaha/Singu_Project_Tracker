import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
  pair: string;
  rate: number;
  validFrom: string;
  addedBy: string;
  note: string;
}

const CURRENCY_PAIRS = ["PLN → EUR", "HUF → EUR", "CZK → EUR"];

const initialRates: FxRate[] = [
  { id: "1", pair: "PLN → EUR", rate: 0.232100, validFrom: "2026-04-01", addedBy: "Anna Kowalska", note: "NBP rate Q2 2026" },
  { id: "2", pair: "PLN → EUR", rate: 0.228500, validFrom: "2026-01-02", addedBy: "Jan Nowak", note: "NBP rate Q1 2026" },
  { id: "3", pair: "HUF → EUR", rate: 0.002480, validFrom: "2026-03-15", addedBy: "Anna Kowalska", note: "MNB mid-market" },
  { id: "4", pair: "CZK → EUR", rate: 0.039700, validFrom: "2026-02-10", addedBy: "Tomasz Wiśniewski", note: "CNB daily fix" },
];

function getMostRecentIds(rates: FxRate[]): Set<string> {
  const latest = new Map<string, FxRate>();
  for (const r of rates) {
    const cur = latest.get(r.pair);
    if (!cur || r.validFrom > cur.validFrom) latest.set(r.pair, r);
  }
  return new Set([...latest.values()].map((r) => r.id));
}

export default function ForeignExchange() {
  const [rates, setRates] = useState<FxRate[]>(initialRates);
  const [open, setOpen] = useState(false);
  const [pair, setPair] = useState("");
  const [rate, setRate] = useState("");
  const [validFrom, setValidFrom] = useState<Date | undefined>(new Date());
  const [note, setNote] = useState("");

  const currentIds = getMostRecentIds(rates);

  const handleSave = () => {
    if (!pair || !rate || !validFrom) return;
    setRates((prev) => [
      {
        id: crypto.randomUUID(),
        pair,
        rate: parseFloat(rate),
        validFrom: format(validFrom, "yyyy-MM-dd"),
        addedBy: "Current User",
        note,
      },
      ...prev,
    ]);
    setOpen(false);
    setPair("");
    setRate("");
    setValidFrom(new Date());
    setNote("");
  };

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
            {rates
              .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
              .map((r) => {
                const isCurrent = currentIds.has(r.id);
                return (
                  <TableRow key={r.id} className={isCurrent ? "font-semibold" : ""}>
                    <TableCell>
                      {r.pair}
                      {isCurrent && (
                        <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                      )}
                    </TableCell>
                    <TableCell>{r.rate.toFixed(6)}</TableCell>
                    <TableCell>{format(new Date(r.validFrom), "dd MMM yyyy")}</TableCell>
                    <TableCell>{r.addedBy}</TableCell>
                    <TableCell className="text-muted-foreground">{r.note}</TableCell>
                  </TableRow>
                );
              })}
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
              <label className="text-sm font-medium">Currency pair</label>
              <Select value={pair} onValueChange={setPair}>
                <SelectTrigger><SelectValue placeholder="Select pair" /></SelectTrigger>
                <SelectContent>
                  {CURRENCY_PAIRS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate</label>
              <Input
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.000000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
              />
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
            <Button onClick={handleSave} disabled={!pair || !rate || !validFrom}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
