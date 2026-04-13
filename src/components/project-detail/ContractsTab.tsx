import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Info, CalendarIcon, Sparkles, Upload, Loader2 } from "lucide-react";
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
import { format, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  agreement_signed: boolean;
  comments: string | null;
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
    agreement_signed?: boolean;
    comments?: string;
  }) => Promise<any>;
}

interface ExtractedField<T = string> {
  value: T;
  confidence: "high" | "medium" | "low";
}

interface ExtractedData {
  contract_number?: ExtractedField;
  contract_date?: ExtractedField;
  amount?: ExtractedField<number>;
  currency?: ExtractedField;
  contractor?: ExtractedField;
  description?: ExtractedField;
  status?: ExtractedField;
  comments?: ExtractedField;
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

const confidenceColor = (confidence: string) => {
  switch (confidence) {
    case "high":
      return "border-green-400 text-green-700 bg-green-50";
    case "medium":
      return "border-yellow-400 text-yellow-700 bg-yellow-50";
    case "low":
      return "border-red-400 text-red-700 bg-red-50";
    default:
      return "";
  }
};

const AiLabel = ({ field }: { field?: ExtractedField<any> }) => {
  if (!field) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
        <Sparkles className="h-3 w-3" /> AI suggested
      </span>
      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", confidenceColor(field.confidence))}>
        {field.confidence}
      </Badge>
    </div>
  );
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
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [comments, setComments] = useState("");

  // V2 state
  const [version, setVersion] = useState<"V1" | "V2">("V1");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setContractNumber("");
    setContractDate(undefined);
    setAmountRaw("");
    setSelectedCurrency(currency);
    setStatus("Ongoing");
    setContractor("");
    setDescription("");
    setAgreementSigned(false);
    setComments("");
    setExtractedData(null);
    setUploadedFileName("");
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetForm();
      setVersion("V1");
    }
    setShowModal(open);
  };

  const handleFileUpload = async (file: File) => {
    setAnalyzing(true);
    setUploadedFileName(file.name);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-contract", {
        body: { fileBase64: base64, fileName: file.name },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted: ExtractedData = data.data;
      setExtractedData(extracted);

      // Pre-fill form
      if (extracted.contract_number?.value) setContractNumber(extracted.contract_number.value);
      if (extracted.contract_date?.value) {
        try {
          setContractDate(new Date(extracted.contract_date.value));
        } catch { /* ignore parse error */ }
      }
      if (extracted.amount?.value != null) setAmountRaw(String(extracted.amount.value));
      if (extracted.currency?.value) setSelectedCurrency(extracted.currency.value);
      if (extracted.contractor?.value) setContractor(extracted.contractor.value);
      if (extracted.description?.value) setDescription(extracted.description.value);
      if (extracted.status?.value) setStatus(extracted.status.value);
      if (extracted.comments?.value) setComments(extracted.comments.value);

      toast.success("Contract data extracted successfully");
    } catch (err: any) {
      console.error("AI extraction error:", err);
      toast.error(err?.message || "Failed to analyze contract document");
    } finally {
      setAnalyzing(false);
    }
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
      agreement_signed: agreementSigned,
      comments: comments.trim() || undefined,
    });
    setSaving(false);
    resetForm();
    setShowModal(false);
  };

  const showForm = version === "V1" || (version === "V2" && extractedData !== null);
  const showUpload = version === "V2" && extractedData === null && !analyzing;
  const showAnalyzing = version === "V2" && analyzing;

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
              <TableHead>Agreement Signed</TableHead>
              <TableHead>Comments</TableHead>
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
                <TableCell>{c.agreement_signed ? "Yes" : "No"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{c.comments || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {contracts.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-bold text-right">Total</TableCell>
                {showLcColumn && (
                  <TableCell className="text-right font-bold">
                    {formatAmount(contracts.reduce((s, c) => s + (c.amount_lc || 0), 0))}
                  </TableCell>
                )}
                <TableCell className="text-right font-bold">
                  {formatAmount(contracts.reduce((s, c) => s + (c.amount_eur || 0), 0))}
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}

      {/* Add Contract Modal */}
      <Dialog open={showModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Add Contract</DialogTitle>
              <Select value={version} onValueChange={(v) => { setVersion(v as "V1" | "V2"); resetForm(); }}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V1">V1</SelectItem>
                  <SelectItem value="V2">V2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogHeader>

          {/* V2 Upload Step */}
          {showUpload && (
            <div className="py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Upload contract document</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag & drop a PDF or click to browse
                </p>
              </div>
            </div>
          )}

          {/* V2 Analyzing */}
          {showAnalyzing && (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Analyzing {uploadedFileName}...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is extracting contract data</p>
            </div>
          )}

          {/* Form (V1 always, V2 after extraction) */}
          {showForm && (
            <div className="space-y-4 py-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractNumber">Contract ID</Label>
                  <AiLabel field={extractedData?.contract_number} />
                </div>
                <Input
                  id="contractNumber"
                  placeholder="e.g. 280141"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className={cn(extractedData?.contract_number && "border-primary/30 bg-blue-50")}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Date</Label>
                  <AiLabel field={extractedData?.contract_date} />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !contractDate && "text-muted-foreground",
                        extractedData?.contract_date && "border-primary/30 bg-blue-50"
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractor">Contractor</Label>
                  <AiLabel field={extractedData?.contractor} />
                </div>
                <Input
                  id="contractor"
                  placeholder="e.g. ABC Construction Ltd."
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  className={cn(extractedData?.contractor && "border-primary/30 bg-blue-50")}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractDescription">Contract Description</Label>
                  <AiLabel field={extractedData?.description} />
                </div>
                <Textarea
                  id="contractDescription"
                  placeholder="Describe the contract scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={Math.max(3, Math.ceil((description?.length || 0) / 80))}
                  className={cn(extractedData?.description && "border-primary/30 bg-blue-50")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="contractAmount" className="flex items-center gap-1.5">
                      Contract amount ({selectedCurrency})
                    </Label>
                    <AiLabel field={extractedData?.amount} />
                  </div>
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
                    className={cn(extractedData?.amount && "border-primary/30 bg-blue-50")}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
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
                    <AiLabel field={extractedData?.currency} />
                  </div>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className={cn(extractedData?.currency && "border-primary/30 bg-blue-50")}>
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
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <AiLabel field={extractedData?.status} />
                </div>
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

              <div>
                <Label>Agreement Signed</Label>
                <RadioGroup value={agreementSigned ? "yes" : "no"} onValueChange={(v) => setAgreementSigned(v === "yes")} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="agreement-yes" />
                    <Label htmlFor="agreement-yes" className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="agreement-no" />
                    <Label htmlFor="agreement-no" className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractComments" className="flex items-center gap-1.5">
                    Comments
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          Important: add info about phased payments
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <AiLabel field={extractedData?.comments} />
                </div>
                <Textarea
                  id="contractComments"
                  placeholder="e.g. phased payments details..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={Math.max(3, Math.ceil((comments?.length || 0) / 80))}
                  className={cn(extractedData?.comments && "border-primary/30 bg-blue-50")}
                />
              </div>
            </div>
          )}

          {showForm && (
            <DialogFooter>
              <Button variant="outline" onClick={() => handleModalClose(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!contractNumber.trim() || saving}>
                {saving ? "Adding..." : "Add Contract"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
