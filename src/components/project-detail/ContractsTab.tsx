import { useState, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Info, CalendarIcon, Sparkles, Upload, Loader2, Pencil, Paperclip, Trash2, MoreVertical, X, FileSignature, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
  onUpdateContract?: (id: string, input: {
    contract_number?: string;
    contract_date?: string | null;
    amount_lc?: number | null;
    status?: string;
    contractor?: string | null;
    description?: string | null;
    agreement_signed?: boolean;
    comments?: string | null;
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
    case "completed": return "default";
    case "ongoing": return "secondary";
    default: return "secondary";
  }
};

const formatAmount = (amount: number | null) => {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const confidenceColor = (confidence: string) => {
  switch (confidence) {
    case "high": return "border-green-400 text-green-700 bg-green-50";
    case "medium": return "border-yellow-400 text-yellow-700 bg-yellow-50";
    case "low": return "border-red-400 text-red-700 bg-red-50";
    default: return "";
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

interface Invoice {
  id: string;
  contract_id: string;
  invoice_number: string;
  amount_lc: number;
  attachment_name: string | null;
  attachment_url: string | null;
  created_at: string;
}

export default function ContractsTab({ contracts, currency = "EUR", onCreateContract, onUpdateContract }: ContractsTabProps) {
  const showLcColumn = currency.toUpperCase() !== "EUR";

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    status: true,
    contractor: true,
    contractedLc: true,
    invoicedLc: true,
    balanceLc: true,
    contractedEur: true,
    invoicedEur: true,
    balanceEur: true,
  });

  // Create/Add contract modal state
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

  // V2 AI extraction state
  const [version, setVersion] = useState<"V1" | "V2">("V1");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContractNumber, setEditContractNumber] = useState("");
  const [editContractDate, setEditContractDate] = useState<Date | undefined>();
  const [editAmountRaw, setEditAmountRaw] = useState("");
  const [editSelectedCurrency, setEditSelectedCurrency] = useState(currency);
  const [editStatus, setEditStatus] = useState("Ongoing");
  const [editContractor, setEditContractor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAgreementSigned, setEditAgreementSigned] = useState(false);
  const [editComments, setEditComments] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteContractConfirm, setShowDeleteContractConfirm] = useState(false);
  const [deletingContract, setDeletingContract] = useState(false);

  // Invoice state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceContractId, setInvoiceContractId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmountRaw, setInvoiceAmountRaw] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  // Side panel state
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // FX rate
  const [fxRate, setFxRate] = useState<number | null>(null);

  const fetchInvoices = async () => {
    if (contracts.length === 0) return;
    const contractIds = contracts.map(c => c.id);
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .in("contract_id", contractIds)
      .order("created_at", { ascending: true });
    if (data) setInvoices(data as Invoice[]);
  };

  useEffect(() => { fetchInvoices(); }, [contracts]);

  useEffect(() => {
    if (showLcColumn) {
      supabase
        .from("fx_rates")
        .select("rate")
        .eq("currency", currency)
        .order("valid_from", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) setFxRate(data[0].rate);
        });
    }
  }, [currency, showLcColumn]);

  const convertToEur = (amountLc: number) => {
    if (!fxRate || fxRate === 0) return amountLc;
    return amountLc / fxRate;
  };

  const invoicesByContract = invoices.reduce<Record<string, Invoice[]>>((acc, inv) => {
    if (!acc[inv.contract_id]) acc[inv.contract_id] = [];
    acc[inv.contract_id].push(inv);
    return acc;
  }, {});

  const hasAnyInvoices = invoices.length > 0;

  const openInvoiceModal = (contractId: string) => {
    setInvoiceContractId(contractId);
    setInvoiceNumber("");
    setInvoiceAmountRaw("");
    setInvoiceFile(null);
    setShowInvoiceModal(true);
  };

  const handleInvoiceSubmit = async () => {
    if (!invoiceContractId || !invoiceNumber.trim()) return;
    setInvoiceSaving(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;

      if (invoiceFile) {
        const filePath = `${invoiceContractId}/${Date.now()}_${invoiceFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("contract-attachments")
          .upload(filePath, invoiceFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("contract-attachments")
          .getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        attachmentName = invoiceFile.name;
      }

      const { error } = await supabase.from("invoices").insert({
        contract_id: invoiceContractId,
        invoice_number: invoiceNumber.trim(),
        amount_lc: parseFloat(invoiceAmountRaw) || 0,
        attachment_name: attachmentName,
        attachment_url: attachmentUrl,
      });
      if (error) throw error;
      toast.success("Invoice added");
      setShowInvoiceModal(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add invoice");
    } finally {
      setInvoiceSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (error) {
      toast.error("Failed to delete invoice");
    } else {
      toast.success("Invoice deleted");
      fetchInvoices();
    }
  };

  const openEditModal = (contract: Contract) => {
    setEditingContract(contract);
    setEditContractNumber(contract.contract_number);
    setEditContractDate(contract.contract_date ? new Date(contract.contract_date) : undefined);
    setEditAmountRaw(contract.amount_lc != null ? String(contract.amount_lc) : "");
    setEditSelectedCurrency(currency);
    setEditStatus(contract.status);
    setEditContractor(contract.contractor || "");
    setEditDescription(contract.description || "");
    setEditAgreementSigned(contract.agreement_signed);
    setEditComments(contract.comments || "");
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingContract || !onUpdateContract) return;
    setEditSaving(true);
    const amount = editAmountRaw ? parseFloat(editAmountRaw) : null;
    await onUpdateContract(editingContract.id, {
      contract_number: editContractNumber.trim(),
      contract_date: editContractDate ? format(editContractDate, "yyyy-MM-dd") : null,
      amount_lc: amount,
      status: editStatus,
      contractor: editContractor.trim() || null,
      description: editDescription.trim() || null,
      agreement_signed: editAgreementSigned,
      comments: editComments.trim() || null,
    });
    setEditSaving(false);
    setShowEditModal(false);
    setEditingContract(null);
  };

  const handleDeleteContract = async () => {
    if (!editingContract) return;
    setDeletingContract(true);
    // Delete related invoices first
    await supabase.from("invoices").delete().eq("contract_id", editingContract.id);
    const { error } = await supabase.from("contracts").delete().eq("id", editingContract.id);
    setDeletingContract(false);
    if (error) {
      toast.error("Failed to delete contract");
      return;
    }
    toast.success("Contract deleted");
    setShowDeleteContractConfirm(false);
    setShowEditModal(false);
    setEditingContract(null);
    if (selectedContract?.id === editingContract.id) setSelectedContract(null);
    // Force reload by triggering a re-fetch — contracts come from parent, so we reload
    window.location.reload();
  };

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
    if (!open) { resetForm(); setVersion("V1"); }
    setShowModal(open);
  };

  const handleFileUpload = async (file: File) => {
    setAnalyzing(true);
    setUploadedFileName(file.name);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { const result = reader.result as string; resolve(result.split(",")[1]); };
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

      if (extracted.contract_number?.value) setContractNumber(extracted.contract_number.value);
      if (extracted.contract_date?.value) { try { setContractDate(new Date(extracted.contract_date.value)); } catch {} }
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

  // Side panel data
  const selectedInvoices = selectedContract ? (invoicesByContract[selectedContract.id] || []) : [];
  const selectedTotalInvoiced = selectedInvoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0);
  const selectedBalance = selectedContract ? (selectedContract.amount_lc || 0) - selectedTotalInvoiced : 0;

  return (
    <div className="flex h-full">
      {/* Main table area */}
      <div className="flex-1 min-w-0 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add contract
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Toggle columns</p>
              <div className="space-y-2">
                {([
                  { key: "date" as const, label: "Date" },
                  { key: "status" as const, label: "Status" },
                  { key: "contractor" as const, label: "Contractor" },
                  ...(showLcColumn ? [
                    { key: "contractedLc" as const, label: `Contracted (${currency})` },
                    { key: "invoicedLc" as const, label: `Invoiced (${currency})` },
                    { key: "balanceLc" as const, label: `Balance (${currency})` },
                  ] : []),
                  { key: "contractedEur" as const, label: showLcColumn ? "Contracted (EUR)" : "Contracted" },
                  { key: "invoicedEur" as const, label: showLcColumn ? "Invoiced (EUR)" : "Invoiced" },
                  { key: "balanceEur" as const, label: showLcColumn ? "Balance (EUR)" : "Balance" },
                ]).map((col) => (
                  <div key={col.key} className="flex items-center justify-between">
                    <span className="text-sm">{col.label}</span>
                    <Switch
                      checked={visibleColumns[col.key]}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((prev) => ({ ...prev, [col.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {contracts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No contracts yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                {visibleColumns.date && <TableHead>Date</TableHead>}
                {visibleColumns.status && <TableHead>Status</TableHead>}
                {visibleColumns.contractor && <TableHead>Contractor</TableHead>}
                {showLcColumn && visibleColumns.contractedLc && <TableHead className="text-right">Contracted ({currency})</TableHead>}
                {showLcColumn && visibleColumns.invoicedLc && <TableHead className="text-right">Invoiced ({currency})</TableHead>}
                {showLcColumn && visibleColumns.balanceLc && <TableHead className="text-right">Balance ({currency})</TableHead>}
                {visibleColumns.contractedEur && <TableHead className="text-right">{showLcColumn ? "Contracted (EUR)" : "Contracted"}</TableHead>}
                {visibleColumns.invoicedEur && <TableHead className="text-right">{showLcColumn ? "Invoiced (EUR)" : "Invoiced"}</TableHead>}
                {visibleColumns.balanceEur && <TableHead className="text-right">{showLcColumn ? "Balance (EUR)" : "Balance"}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const contractInvoices = invoicesByContract[c.id] || [];
                const totalInvoicedLc = contractInvoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0);
                const totalInvoicedEur = showLcColumn ? convertToEur(totalInvoicedLc) : totalInvoicedLc;
                const balanceLc = (c.amount_lc || 0) - totalInvoicedLc;
                const contractedEur = showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0);
                const balanceEur = contractedEur - totalInvoicedEur;
                const isSelected = selectedContract?.id === c.id;

                return (
                  <TableRow
                    key={c.id}
                    className={cn("cursor-pointer", isSelected && "bg-muted/50")}
                    onClick={() => setSelectedContract(isSelected ? null : c)}
                  >
                    <TableCell className="w-10 p-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEditModal(c)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openInvoiceModal(c.id)}>
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Add Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    
                    {visibleColumns.date && <TableCell>{c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "—"}</TableCell>}
                    {visibleColumns.status && <TableCell><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>}
                    {visibleColumns.contractor && <TableCell>{c.contractor || "—"}</TableCell>}
                    {showLcColumn && visibleColumns.contractedLc && <TableCell className="text-right">{formatAmount(c.amount_lc)}</TableCell>}
                    {showLcColumn && visibleColumns.invoicedLc && (
                      <TableCell className="text-right">{contractInvoices.length > 0 ? formatAmount(totalInvoicedLc) : "—"}</TableCell>
                    )}
                    {showLcColumn && visibleColumns.balanceLc && (
                      <TableCell className="text-right">{contractInvoices.length > 0 ? formatAmount(balanceLc) : "—"}</TableCell>
                    )}
                    {visibleColumns.contractedEur && <TableCell className="text-right">{formatAmount(contractedEur)}</TableCell>}
                    {visibleColumns.invoicedEur && (
                      <TableCell className="text-right">{contractInvoices.length > 0 ? formatAmount(totalInvoicedEur) : "—"}</TableCell>
                    )}
                    {visibleColumns.balanceEur && (
                      <TableCell className="text-right">{contractInvoices.length > 0 ? formatAmount(balanceEur) : "—"}</TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
            {contracts.length > 0 && (() => {
              const totalContractedLc = contracts.reduce((s, c) => s + (c.amount_lc || 0), 0);
              const totalContractedEur = showLcColumn ? convertToEur(totalContractedLc) : totalContractedLc;
              const totalInvLc = invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0);
              const totalInvEur = showLcColumn ? convertToEur(totalInvLc) : totalInvLc;
              const totalBalLc = totalContractedLc - totalInvLc;
              const totalBalEur = totalContractedEur - totalInvEur;
              return (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    {visibleColumns.date && <TableCell />}
                    {visibleColumns.status && <TableCell />}
                    {visibleColumns.contractor && <TableCell />}
                    {showLcColumn && visibleColumns.contractedLc && <TableCell className="text-right font-bold">{formatAmount(totalContractedLc)}</TableCell>}
                    {showLcColumn && visibleColumns.invoicedLc && <TableCell className="text-right font-bold">{formatAmount(totalInvLc)}</TableCell>}
                    {showLcColumn && visibleColumns.balanceLc && <TableCell className="text-right font-bold">{formatAmount(totalBalLc)}</TableCell>}
                    {visibleColumns.contractedEur && <TableCell className="text-right font-bold">{formatAmount(totalContractedEur)}</TableCell>}
                    {visibleColumns.invoicedEur && <TableCell className="text-right font-bold">{formatAmount(totalInvEur)}</TableCell>}
                    {visibleColumns.balanceEur && <TableCell className="text-right font-bold">{formatAmount(totalBalEur)}</TableCell>}
                  </TableRow>
                </TableFooter>
              );
            })()}
          </Table>
        )}
      </div>

        {contracts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No contracts yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contractor</TableHead>
                {showLcColumn && <TableHead className="text-right">Contracted ({currency})</TableHead>}
                <TableHead className="text-right">Contracted (EUR)</TableHead>
                {hasAnyInvoices && showLcColumn && <TableHead className="text-right">Invoiced ({currency})</TableHead>}
                {hasAnyInvoices && <TableHead className="text-right">Invoiced (EUR)</TableHead>}
                {hasAnyInvoices && showLcColumn && <TableHead className="text-right">Balance ({currency})</TableHead>}
                {hasAnyInvoices && <TableHead className="text-right">Balance (EUR)</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const contractInvoices = invoicesByContract[c.id] || [];
                const totalInvoicedLc = contractInvoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0);
                const totalInvoicedEur = showLcColumn ? convertToEur(totalInvoicedLc) : totalInvoicedLc;
                const balanceLc = (c.amount_lc || 0) - totalInvoicedLc;
                const contractedEur = showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0);
                const balanceEur = contractedEur - totalInvoicedEur;
                const isSelected = selectedContract?.id === c.id;

                return (
                  <TableRow
                    key={c.id}
                    className={cn("cursor-pointer", isSelected && "bg-muted/50")}
                    onClick={() => setSelectedContract(isSelected ? null : c)}
                  >
                    <TableCell className="w-10 p-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEditModal(c)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openInvoiceModal(c.id)}>
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Add Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    
                    <TableCell>{c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>
                    <TableCell>{c.contractor || "—"}</TableCell>
                    {showLcColumn && <TableCell className="text-right">{formatAmount(c.amount_lc)}</TableCell>}
                    <TableCell className="text-right">{formatAmount(showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0))}</TableCell>
                    {hasAnyInvoices && showLcColumn && (
                      <TableCell className="text-right">
                        {contractInvoices.length > 0 ? formatAmount(totalInvoicedLc) : "—"}
                      </TableCell>
                    )}
                    {hasAnyInvoices && (
                      <TableCell className="text-right">
                        {contractInvoices.length > 0 ? formatAmount(totalInvoicedEur) : "—"}
                      </TableCell>
                    )}
                    {hasAnyInvoices && showLcColumn && (
                      <TableCell className="text-right">
                        {contractInvoices.length > 0 ? formatAmount(balanceLc) : "—"}
                      </TableCell>
                    )}
                    {hasAnyInvoices && (
                      <TableCell className="text-right">
                        {contractInvoices.length > 0 ? formatAmount(balanceEur) : "—"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
            {contracts.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  {showLcColumn && (
                    <TableCell className="text-right font-bold">
                      {formatAmount(contracts.reduce((s, c) => s + (c.amount_lc || 0), 0))}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-bold">
                    {formatAmount(contracts.reduce((s, c) => s + (showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0)), 0))}
                  </TableCell>
                  {hasAnyInvoices && showLcColumn && (
                    <TableCell className="text-right font-bold">
                      {formatAmount(invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0))}
                    </TableCell>
                  )}
                  {hasAnyInvoices && (
                    <TableCell className="text-right font-bold">
                      {formatAmount(
                        showLcColumn
                          ? convertToEur(invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0))
                          : invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0)
                      )}
                    </TableCell>
                  )}
                  {hasAnyInvoices && showLcColumn && (
                    <TableCell className="text-right font-bold">
                      {formatAmount(
                        contracts.reduce((s, c) => s + (c.amount_lc || 0), 0) -
                        invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0)
                      )}
                    </TableCell>
                  )}
                  {hasAnyInvoices && (
                    <TableCell className="text-right font-bold">
                      {formatAmount(
                        contracts.reduce((s, c) => s + (showLcColumn ? convertToEur(c.amount_lc || 0) : (c.amount_lc || 0)), 0) -
                        (showLcColumn
                          ? convertToEur(invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0))
                          : invoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0))
                      )}
                    </TableCell>
                  )}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </div>

      {/* Side Detail Panel */}
      {selectedContract && (
        <div className="fixed top-16 right-0 bottom-0 w-[380px] border-l border-border bg-card flex flex-col z-40 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contract Details</p>
              <h3 className="text-base font-semibold mt-1 leading-snug">{selectedContract.contractor || "—"}</h3>
            </div>
            <button
              onClick={() => setSelectedContract(null)}
              className="shrink-0 h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors mt-0.5"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent px-5 pt-1 pb-0 h-auto justify-start gap-0">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 text-sm">Contract Details</TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 text-sm">Invoices ({selectedInvoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto mt-0">
              {/* Details */}
              <div className="px-5 py-4 border-b border-border space-y-3">
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contract ID</span>
                  <span className="text-sm font-medium">{selectedContract.contract_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-medium">
                    {selectedContract.contract_date ? format(new Date(selectedContract.contract_date), "dd MMM yyyy") : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contractor</span>
                  <span className="text-sm font-medium">{selectedContract.contractor || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={statusVariant(selectedContract.status)}>{selectedContract.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Agreement Signed</span>
                  <span className="text-sm font-medium">{selectedContract.agreement_signed ? "Yes" : "No"}</span>
                </div>
                {selectedContract.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="text-sm mt-1">{selectedContract.description}</p>
                  </div>
                )}
                {selectedContract.comments && (
                  <div>
                    <span className="text-sm text-muted-foreground">Comments</span>
                    <p className="text-sm mt-1">{selectedContract.comments}</p>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="px-5 py-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary</p>

                {/* Local Currency section (only if not EUR) */}
                {showLcColumn && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Contracted ({currency})</span>
                      <span className="text-sm font-semibold">{formatAmount(selectedContract.amount_lc)}</span>
                    </div>
                    {selectedInvoices.length > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Invoiced ({currency})</span>
                          <span className="text-sm font-semibold">{formatAmount(selectedTotalInvoiced)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-border">
                          <span className="text-sm font-semibold">Balance ({currency})</span>
                          <span className="text-sm font-semibold">{formatAmount(selectedBalance)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* EUR section */}
                {showLcColumn && <div className="h-2" />}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Contracted (EUR)</span>
                  <span className="text-sm font-semibold">{formatAmount(showLcColumn ? convertToEur(selectedContract.amount_lc || 0) : (selectedContract.amount_lc || 0))}</span>
                </div>
                {selectedInvoices.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Invoiced (EUR)</span>
                      <span className="text-sm font-semibold">{formatAmount(showLcColumn ? convertToEur(selectedTotalInvoiced) : selectedTotalInvoiced)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-border">
                      <span className="text-sm font-semibold">Balance (EUR)</span>
                      <span className="text-sm font-semibold">{formatAmount((showLcColumn ? convertToEur(selectedContract?.amount_lc || 0) : (selectedContract?.amount_lc || 0)) - (showLcColumn ? convertToEur(selectedTotalInvoiced) : selectedTotalInvoiced))}</span>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="flex-1 overflow-y-auto mt-0">
              <div className="px-5 py-4 space-y-3">
                {selectedInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
                ) : (
                  <div className="space-y-1">
                    {selectedInvoices.map((inv) => {
                      const invEur = showLcColumn ? convertToEur(inv.amount_lc) : inv.amount_lc;
                      return (
                        <div key={inv.id} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{inv.invoice_number}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {showLcColumn && <>{formatAmount(inv.amount_lc)} {currency} · </>}
                              {formatAmount(invEur)} EUR
                            </p>
                            {inv.attachment_url && (
                              <a
                                href={inv.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                <Paperclip className="h-3 w-3" />
                                {inv.attachment_name || "Attachment"}
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="shrink-0 h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => openInvoiceModal(selectedContract.id)}
                  className="flex items-center gap-1.5 w-full py-2.5 text-sm font-medium text-muted-foreground border border-dashed border-muted-foreground/30 rounded-lg justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Invoice
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
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

          {showUpload && (
            <div className="py-8">
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file) handleFileUpload(file); }}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Upload contract document</p>
                <p className="text-xs text-muted-foreground mt-1">Drag & drop a PDF or click to browse</p>
              </div>
            </div>
          )}

          {showAnalyzing && (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Analyzing {uploadedFileName}...</p>
              <p className="text-xs text-muted-foreground mt-1">AI is extracting contract data</p>
            </div>
          )}

          {showForm && (
            <div className="space-y-4 py-2">
              <div>
                <div className="flex items-center justify-between"><Label htmlFor="contractNumber">Contract ID</Label><AiLabel field={extractedData?.contract_number} /></div>
                <Input id="contractNumber" placeholder="e.g. 280141" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} className={cn(extractedData?.contract_number && "border-primary/30 bg-blue-50")} />
              </div>
              <div>
                <div className="flex items-center justify-between"><Label>Date</Label><AiLabel field={extractedData?.contract_date} /></div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !contractDate && "text-muted-foreground", extractedData?.contract_date && "border-primary/30 bg-blue-50")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {contractDate ? format(contractDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={contractDate} onSelect={setContractDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <div className="flex items-center justify-between"><Label htmlFor="contractor">Contractor</Label><AiLabel field={extractedData?.contractor} /></div>
                <Input id="contractor" placeholder="e.g. ABC Construction Ltd." value={contractor} onChange={(e) => setContractor(e.target.value)} className={cn(extractedData?.contractor && "border-primary/30 bg-blue-50")} />
              </div>
              <div>
                <div className="flex items-center justify-between"><Label htmlFor="contractDescription">Contract Description</Label><AiLabel field={extractedData?.description} /></div>
                <Textarea id="contractDescription" placeholder="Describe the contract scope..." value={description} onChange={(e) => setDescription(e.target.value)} rows={Math.max(3, Math.ceil((description?.length || 0) / 80))} className={cn(extractedData?.description && "border-primary/30 bg-blue-50")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between"><Label htmlFor="contractAmount" className="flex items-center gap-1.5">Contract amount ({selectedCurrency})</Label><AiLabel field={extractedData?.amount} /></div>
                  <Input id="contractAmount" type="text" inputMode="decimal" placeholder="0.00" value={amountRaw ? Number(amountRaw).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ""} onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); setAmountRaw(raw); }} className={cn(extractedData?.amount && "border-primary/30 bg-blue-50")} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">Local Currency
                      <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Local currency will be converted to EUR based on foreign exchange rates defined in the system.</TooltipContent></Tooltip></TooltipProvider>
                    </Label>
                    <AiLabel field={extractedData?.currency} />
                  </div>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className={cn(extractedData?.currency && "border-primary/30 bg-blue-50")}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PLN">PLN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between"><Label>Status</Label><AiLabel field={extractedData?.status} /></div>
                <RadioGroup value={status} onValueChange={setStatus} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Ongoing" id="status-ongoing" /><Label htmlFor="status-ongoing" className="font-normal cursor-pointer">Ongoing</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Completed" id="status-completed" /><Label htmlFor="status-completed" className="font-normal cursor-pointer">Completed</Label></div>
                </RadioGroup>
              </div>
              <div>
                <Label>Agreement Signed</Label>
                <RadioGroup value={agreementSigned ? "yes" : "no"} onValueChange={(v) => setAgreementSigned(v === "yes")} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="agreement-yes" /><Label htmlFor="agreement-yes" className="font-normal cursor-pointer">Yes</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="agreement-no" /><Label htmlFor="agreement-no" className="font-normal cursor-pointer">No</Label></div>
                </RadioGroup>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractComments" className="flex items-center gap-1.5">Comments
                    <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Important: add info about phased payments</TooltipContent></Tooltip></TooltipProvider>
                  </Label>
                  <AiLabel field={extractedData?.comments} />
                </div>
                <Textarea id="contractComments" placeholder="e.g. phased payments details..." value={comments} onChange={(e) => setComments(e.target.value)} rows={Math.max(3, Math.ceil((comments?.length || 0) / 80))} className={cn(extractedData?.comments && "border-primary/30 bg-blue-50")} />
              </div>
            </div>
          )}

          {showForm && (
            <DialogFooter>
              <Button variant="outline" onClick={() => handleModalClose(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!contractNumber.trim() || saving}>{saving ? "Adding..." : "Add Contract"}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Contract Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); setEditingContract(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Contract</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label htmlFor="editContractNumber">Contract ID</Label><Input id="editContractNumber" value={editContractNumber} onChange={(e) => setEditContractNumber(e.target.value)} /></div>
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editContractDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{editContractDate ? format(editContractDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={editContractDate} onSelect={setEditContractDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div><Label htmlFor="editContractor">Contractor</Label><Input id="editContractor" value={editContractor} onChange={(e) => setEditContractor(e.target.value)} /></div>
            <div><Label htmlFor="editDescription">Contract Description</Label><Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={Math.max(3, Math.ceil((editDescription?.length || 0) / 80))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editAmount">Contract amount ({editSelectedCurrency})</Label>
                <Input id="editAmount" type="text" inputMode="decimal" placeholder="0.00" value={editAmountRaw ? Number(editAmountRaw).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ""} onChange={(e) => { const raw = e.target.value.replace(/[^0-9.]/g, ""); setEditAmountRaw(raw); }} />
              </div>
              <div>
                <Label>Local Currency</Label>
                <Select value={editSelectedCurrency} onValueChange={setEditSelectedCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PLN">PLN</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <RadioGroup value={editStatus} onValueChange={setEditStatus} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="Ongoing" id="edit-status-ongoing" /><Label htmlFor="edit-status-ongoing" className="font-normal cursor-pointer">Ongoing</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="Completed" id="edit-status-completed" /><Label htmlFor="edit-status-completed" className="font-normal cursor-pointer">Completed</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Agreement Signed</Label>
              <RadioGroup value={editAgreementSigned ? "yes" : "no"} onValueChange={(v) => setEditAgreementSigned(v === "yes")} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="edit-agreement-yes" /><Label htmlFor="edit-agreement-yes" className="font-normal cursor-pointer">Yes</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="edit-agreement-no" /><Label htmlFor="edit-agreement-no" className="font-normal cursor-pointer">No</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="editComments" className="flex items-center gap-1.5">Comments
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Important: add info about phased payments</TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <Textarea id="editComments" value={editComments} onChange={(e) => setEditComments(e.target.value)} rows={Math.max(3, Math.ceil((editComments?.length || 0) / 80))} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteContractConfirm(true)} className="sm:mr-auto">
              <Trash2 className="h-4 w-4 mr-2" />Delete contract
            </Button>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingContract(null); }}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={!editContractNumber.trim() || editSaving}>{editSaving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteContractConfirm} onOpenChange={setShowDeleteContractConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete contract "{editingContract?.contract_number}"? This action cannot be undone and will permanently remove the contract along with all its invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingContract}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContract}
              disabled={deletingContract}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingContract ? "Deleting..." : "Delete contract"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label htmlFor="invoiceNumber">Invoice Number</Label><Input id="invoiceNumber" placeholder="e.g. INV-001" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
            <div><Label htmlFor="invoiceAmount">Amount ({currency})</Label><Input id="invoiceAmount" type="number" placeholder="0.00" value={invoiceAmountRaw} onChange={(e) => setInvoiceAmountRaw(e.target.value)} /></div>
            <div>
              <Label>Attachment (optional)</Label>
              <input ref={invoiceFileRef} type="file" className="hidden" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
              <Button variant="outline" className="w-full justify-start" onClick={() => invoiceFileRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-2" />{invoiceFile ? invoiceFile.name : "Choose file..."}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button onClick={handleInvoiceSubmit} disabled={!invoiceNumber.trim() || invoiceSaving}>{invoiceSaving ? "Saving..." : "Add Invoice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
