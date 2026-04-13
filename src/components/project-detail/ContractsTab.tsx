import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Info, CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface Contract {
  id: string;
  project_id: string;
  contract_number: string;
  contract_date: string | null;
  amount_lc: number | null;
  amount_eur: number | null;
  status: string;
  contractor: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ContractsTabProps {
  contracts: Contract[];
  currency?: string;
  onCreateContract?: (input: {
    contract_number: string;
    contract_date?: string;
    amount_lc?: number;
    status?: string;
    contractor?: string;
    description?: string;
  }) => Promise<any>;
}

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "default";
    case "ongoing":
      return "secondary";
    default:
      return "secondary";
  }
};

const formatAmount = (amount: number | null) => {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ContractsTab({ contracts, currency = "EUR", onCreateContract }: ContractsTabProps) {
  const showLcColumn = currency.toUpperCase() !== "EUR";
  const [showModal, setShowModal] = useState(false);
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState<Date | undefined>();
  const [amountRaw, setAmountRaw] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [status, setStatus] = useState("Ongoing");
  const [contractor, setContractor] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setContractNumber("");
    setContractDate(undefined);
    setAmountRaw("");
    setSelectedCurrency(currency);
    setStatus("Ongoing");
    setContractor("");
    setDescription("");
  };

  const handleSubmit = async () => {
    if (!contractNumber.trim() || !onCreateContract) return;
    setSaving(true);
    const amount = amountRaw ? parseFloat(amountRaw) : undefined;
    await onCreateContract({
      contract_number: contractNumber.trim(),
      contract_date: contractDate ? format(contractDate, "yyyy-MM-dd") : undefined,
      amount_lc: amount,
      status,
      contractor: contractor.trim() || undefined,
      description: description.trim() || undefined,
    });
    setSaving(false);
    resetForm();
    setShowModal(false);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add contract
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No contracts yet
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Contractor</TableHead>
              <TableHead>Description</TableHead>
              {showLcColumn && <TableHead className="text-right">Contracted ({currency})</TableHead>}
              <TableHead className="text-right">Contracted (EUR)</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.contract_number}</TableCell>
                <TableCell>
                  {c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "—"}
                </TableCell>
                <TableCell>{c.contractor || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{c.description || "—"}</TableCell>
                {showLcColumn && <TableCell className="text-right">{formatAmount(c.amount_lc)}</TableCell>}
                <TableCell className="text-right">{formatAmount(c.amount_eur)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add Contract Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="contractNumber">Contract ID</Label>
              <Input
                id="contractNumber"
                placeholder="e.g. 280141"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
              />
            </div>

            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !contractDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contractDate ? format(contractDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={contractDate}
                    onSelect={setContractDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="contractor">Contractor</Label>
              <Input
                id="contractor"
                placeholder="e.g. ABC Construction Ltd."
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contractDescription">Contract Description</Label>
              <Textarea
                id="contractDescription"
                placeholder="Describe the contract scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractAmount" className="flex items-center gap-1.5">
                  Contract amount ({selectedCurrency})
                </Label>
                <Input
                  id="contractAmount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountRaw ? Number(amountRaw).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    setAmountRaw(raw);
                  }}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  Local Currency
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        Local currency will be converted to EUR based on foreign exchange rates defined in the system.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLN">PLN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <RadioGroup value={status} onValueChange={setStatus} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ongoing" id="status-ongoing" />
                  <Label htmlFor="status-ongoing" className="font-normal cursor-pointer">Ongoing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Completed" id="status-completed" />
                  <Label htmlFor="status-completed" className="font-normal cursor-pointer">Completed</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!contractNumber.trim() || saving}>
              {saving ? "Adding..." : "Add Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
