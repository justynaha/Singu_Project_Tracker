import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, MoreVertical, Plus, Pencil, X, Trash2, Paperclip, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SITE_GROUP_OPTIONS, COUNTRY_TO_SITE_GROUP } from "@/hooks/useDashboardData";
import { CalendarIcon, Info } from "lucide-react";

interface ProjectInfo {
  id: string;
  name: string;
  site: string | null;
  currency: string | null;
  budget_line: string | null;
  fiscal_year: string | null;
  created_at: string;
}

interface ContractRow {
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

interface Invoice {
  id: string;
  contract_id: string;
  invoice_number: string;
  amount_lc: number;
  attachment_name: string | null;
  attachment_url: string | null;
  created_at: string;
}

interface FxRate {
  currency: string;
  rate: number;
  valid_from: string;
}

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
};

const budgetLineLabels: Record<string, string> = {
  common_areas: "Common Areas",
  tenant_fitout: "Tenant Fit-Out",
  building_upgrades: "Building Upgrades",
  sustainability: "Sustainability",
  safety_compliance: "Safety & Compliance",
};

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed": return "default" as const;
    case "ongoing": return "secondary" as const;
    default: return "secondary" as const;
  }
};

const formatAmount = (amount: number | null) => {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ContractsList({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [fxRates, setFxRates] = useState<FxRate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Project number map
  const [projectNumberMap, setProjectNumberMap] = useState<Map<string, number>>(new Map());
  const [projectMap, setProjectMap] = useState<Map<string, ProjectInfo>>(new Map());

  // Side panel
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);

  // Edit modal
  const [editingContract, setEditingContract] = useState<ContractRow | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContractNumber, setEditContractNumber] = useState("");
  const [editContractDate, setEditContractDate] = useState<Date | undefined>();
  const [editAmountRaw, setEditAmountRaw] = useState("");
  const [editSelectedCurrency, setEditSelectedCurrency] = useState("EUR");
  const [editStatus, setEditStatus] = useState("Ongoing");
  const [editContractor, setEditContractor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAgreementSigned, setEditAgreementSigned] = useState(false);
  const [editComments, setEditComments] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteContractConfirm, setShowDeleteContractConfirm] = useState(false);
  const [deletingContract, setDeletingContract] = useState(false);

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceContractId, setInvoiceContractId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmountRaw, setInvoiceAmountRaw] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [pendingSiteGroups, setPendingSiteGroups] = useState<string[]>([]);
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingSite, setPendingSite] = useState("");
  const [pendingBudgetLine, setPendingBudgetLine] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingFiscalYear, setPendingFiscalYear] = useState("");

  const [filterSiteGroups, setFilterSiteGroups] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterBudgetLine, setFilterBudgetLine] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFiscalYear, setFilterFiscalYear] = useState("");

  const hasAppliedFilters = filterCountry || filterSite || filterBudgetLine || filterStatus || filterFiscalYear || filterSiteGroups.length > 0;

  const applyFilters = () => {
    setFilterSiteGroups(pendingSiteGroups);
    setFilterCountry(pendingCountry);
    setFilterSite(pendingSite);
    setFilterBudgetLine(pendingBudgetLine);
    setFilterStatus(pendingStatus);
    setFilterFiscalYear(pendingFiscalYear);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPendingSiteGroups([]); setPendingCountry(""); setPendingSite("");
    setPendingBudgetLine(""); setPendingStatus(""); setPendingFiscalYear("");
    setFilterSiteGroups([]); setFilterCountry(""); setFilterSite("");
    setFilterBudgetLine(""); setFilterStatus(""); setFilterFiscalYear("");
  };

  const togglePendingSiteGroup = (group: string) => {
    setPendingSiteGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, contractsRes, invoicesRes, fxRes] = await Promise.all([
      supabase.from("projects").select("id, name, site, currency, budget_line, fiscal_year, created_at").order("created_at", { ascending: true }),
      supabase.from("contracts").select("*").order("contract_date", { ascending: false }),
      supabase.from("invoices").select("*").order("created_at", { ascending: true }),
      supabase.from("fx_rates").select("currency, rate, valid_from").order("valid_from", { ascending: false }),
    ]);

    const allProjects = (projectsRes.data || []) as ProjectInfo[];
    const numMap = new Map<string, number>();
    const pMap = new Map<string, ProjectInfo>();
    allProjects.forEach((p, idx) => { numMap.set(p.id, 13536 + idx); pMap.set(p.id, p); });
    setProjectNumberMap(numMap);
    setProjectMap(pMap);
    setProjects(allProjects);
    setContracts((contractsRes.data || []) as ContractRow[]);
    setInvoices((invoicesRes.data || []) as Invoice[]);
    setFxRates((fxRes.data || []) as FxRate[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // FX helpers
  const getFxRate = (currency: string): number | null => {
    if (!currency || currency === "EUR") return 1;
    const rate = fxRates.find(r => r.currency === currency);
    return rate ? rate.rate : null;
  };

  const convertToEur = (amountLc: number, currency: string): number => {
    const rate = getFxRate(currency);
    if (!rate || rate === 0) return amountLc;
    if (currency === "EUR") return amountLc;
    return amountLc / rate;
  };

  // Invoice helpers
  const invoicesByContract = useMemo(() => {
    return invoices.reduce<Record<string, Invoice[]>>((acc, inv) => {
      if (!acc[inv.contract_id]) acc[inv.contract_id] = [];
      acc[inv.contract_id].push(inv);
      return acc;
    }, {});
  }, [invoices]);

  // Filter options from projects
  const filterOptions = useMemo(() => {
    const sites = [...new Set(projects.map(p => p.site).filter(Boolean))].sort() as string[];
    const countries = [...new Set(sites.map(s => siteToCountry[s] || "Unknown"))].sort();
    const budgetLines = [...new Set(projects.map(p => p.budget_line).filter(Boolean))].sort() as string[];
    const fiscalYears = [...new Set(projects.map(p => p.fiscal_year).filter(Boolean))].sort() as string[];
    return { sites, countries, budgetLines, fiscalYears };
  }, [projects]);

  // Filtered contracts
  const filtered = useMemo(() => {
    return contracts.filter(c => {
      const proj = projectMap.get(c.project_id);
      if (!proj) return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = c.contract_number.toLowerCase().includes(q) ||
          proj.name.toLowerCase().includes(q) ||
          (c.contractor && c.contractor.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Filter by project's site -> country -> site group
      const projectCountry = proj.site ? siteToCountry[proj.site] : null;
      if (filterSiteGroups.length > 0 && !(projectCountry && filterSiteGroups.includes(COUNTRY_TO_SITE_GROUP[projectCountry] || ""))) return false;
      if (filterCountry && projectCountry !== filterCountry) return false;
      if (filterSite && proj.site !== filterSite) return false;
      if (filterBudgetLine && proj.budget_line !== filterBudgetLine) return false;
      if (filterFiscalYear && proj.fiscal_year !== filterFiscalYear) return false;
      // Status filter applies to CONTRACT status
      if (filterStatus && c.status !== filterStatus) return false;

      return true;
    });
  }, [contracts, projectMap, searchQuery, filterSiteGroups, filterCountry, filterSite, filterBudgetLine, filterFiscalYear, filterStatus]);

  const totalPages = 1; // unused, kept for reference

  // Totals
  const totals = useMemo(() => {
    let contracted = 0, invoiced = 0;
    filtered.forEach(c => {
      const proj = projectMap.get(c.project_id);
      const cur = proj?.currency || "EUR";
      contracted += convertToEur(c.amount_lc || 0, cur);
      const cInvoices = invoicesByContract[c.id] || [];
      invoiced += cInvoices.reduce((s, inv) => s + convertToEur(inv.amount_lc, cur), 0);
    });
    return { contracted, invoiced, balance: contracted - invoiced };
  }, [filtered, projectMap, invoicesByContract, fxRates]);

  // Edit modal
  const openEditModal = (contract: ContractRow) => {
    const proj = projectMap.get(contract.project_id);
    setEditingContract(contract);
    setEditContractNumber(contract.contract_number);
    setEditContractDate(contract.contract_date ? new Date(contract.contract_date) : undefined);
    setEditAmountRaw(contract.amount_lc != null ? String(contract.amount_lc) : "");
    setEditSelectedCurrency(proj?.currency || "EUR");
    setEditStatus(contract.status);
    setEditContractor(contract.contractor || "");
    setEditDescription(contract.description || "");
    setEditAgreementSigned(contract.agreement_signed);
    setEditComments(contract.comments || "");
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingContract) return;
    setEditSaving(true);
    const amount = editAmountRaw ? parseFloat(editAmountRaw) : null;
    const { error } = await supabase.from("contracts").update({
      contract_number: editContractNumber.trim(),
      contract_date: editContractDate ? format(editContractDate, "yyyy-MM-dd") : null,
      amount_lc: amount,
      status: editStatus,
      contractor: editContractor.trim() || null,
      description: editDescription.trim() || null,
      agreement_signed: editAgreementSigned,
      comments: editComments.trim() || null,
    }).eq("id", editingContract.id);
    setEditSaving(false);
    if (error) { toast.error("Failed to update contract"); return; }
    toast.success("Contract updated");
    setShowEditModal(false);
    setEditingContract(null);
    fetchData();
  };

  const handleDeleteContract = async () => {
    if (!editingContract) return;
    setDeletingContract(true);
    await supabase.from("invoices").delete().eq("contract_id", editingContract.id);
    const { error } = await supabase.from("contracts").delete().eq("id", editingContract.id);
    setDeletingContract(false);
    if (error) { toast.error("Failed to delete contract"); return; }
    toast.success("Contract deleted");
    setShowDeleteContractConfirm(false);
    setShowEditModal(false);
    setEditingContract(null);
    if (selectedContract?.id === editingContract.id) setSelectedContract(null);
    fetchData();
  };

  // Invoice modal
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
        const { error: uploadError } = await supabase.storage.from("contract-attachments").upload(filePath, invoiceFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("contract-attachments").getPublicUrl(filePath);
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
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add invoice");
    } finally {
      setInvoiceSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (error) { toast.error("Failed to delete invoice"); return; }
    toast.success("Invoice deleted");
    fetchData();
  };

  // Side panel data
  const selectedProj = selectedContract ? projectMap.get(selectedContract.project_id) : null;
  const selectedCurrency = selectedProj?.currency || "EUR";
  const selectedShowLc = selectedCurrency.toUpperCase() !== "EUR";
  const selectedInvoices = selectedContract ? (invoicesByContract[selectedContract.id] || []) : [];
  const selectedTotalInvoicedLc = selectedInvoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0);

  return (
    <div className={embedded ? "" : "bg-background"}>
      <div className={embedded ? "flex overflow-hidden" : "flex h-[calc(100vh-64px)] overflow-hidden"}>
        {/* Main content */}
        <div className={cn("flex-1 min-w-0 overflow-y-auto", embedded ? "p-0" : "p-6")}>
          {!embedded && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Contracts</h1>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="mb-2">
              Filters
              <ChevronLeft className={cn("h-4 w-4 ml-2 transition-transform", !showFilters && "-rotate-90")} />
            </Button>

            {showFilters && (
              <div className="p-4 border border-border rounded-lg bg-card space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Site group</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between text-sm font-normal">
                          {pendingSiteGroups.length === 0 ? "All groups" : pendingSiteGroups.join(", ")}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-2" align="start">
                        {SITE_GROUP_OPTIONS.map(opt => (
                          <div key={opt.value} className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-sm" onClick={() => togglePendingSiteGroup(opt.value)}>
                            <div className={cn("h-4 w-4 rounded border flex items-center justify-center", pendingSiteGroups.includes(opt.value) ? "bg-primary border-primary" : "border-input")}>
                              {pendingSiteGroups.includes(opt.value) && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            {opt.label}
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Country</Label>
                    <Select value={pendingCountry || "all"} onValueChange={v => setPendingCountry(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All countries" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All countries</SelectItem>
                        {filterOptions.countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Site</Label>
                    <Select value={pendingSite || "all"} onValueChange={v => setPendingSite(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All sites" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sites</SelectItem>
                        {filterOptions.sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Budget line</Label>
                    <Select value={pendingBudgetLine || "all"} onValueChange={v => setPendingBudgetLine(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All budget lines" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All budget lines</SelectItem>
                        {filterOptions.budgetLines.map(bl => <SelectItem key={bl} value={bl}>{budgetLineLabels[bl] || bl}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                    <Select value={pendingStatus || "all"} onValueChange={v => setPendingStatus(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Fiscal year</Label>
                    <Select value={pendingFiscalYear || "all"} onValueChange={v => setPendingFiscalYear(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All years</SelectItem>
                        {filterOptions.fiscalYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="shrink-0" onClick={applyFilters}>
                    <Search className="h-4 w-4 mr-2" />Search
                  </Button>
                </div>

                {hasAppliedFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {filterSiteGroups.length > 0 && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        Site group: {filterSiteGroups.join(", ")}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterSiteGroups([]); setPendingSiteGroups([]); }} />
                      </Badge>
                    )}
                    {filterCountry && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        {filterCountry}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterCountry(""); setPendingCountry(""); }} />
                      </Badge>
                    )}
                    {filterSite && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        {filterSite}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterSite(""); setPendingSite(""); }} />
                      </Badge>
                    )}
                    {filterBudgetLine && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        {budgetLineLabels[filterBudgetLine] || filterBudgetLine}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetLine(""); setPendingBudgetLine(""); }} />
                      </Badge>
                    )}
                    {filterStatus && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        {filterStatus}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterStatus(""); setPendingStatus(""); }} />
                      </Badge>
                    )}
                    {filterFiscalYear && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        {filterFiscalYear}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterFiscalYear(""); setPendingFiscalYear(""); }} />
                      </Badge>
                    )}
                    <button className="text-sm text-primary hover:underline font-medium" onClick={clearFilters}>Clear</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <div className="border border-border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-10">
                      <TableHead className="w-10 h-10 py-0 px-3" />
                      <TableHead className="h-10 py-0 px-3">Contract ID</TableHead>
                      <TableHead className="h-10 py-0 px-3">Project Number</TableHead>
                      <TableHead className="h-10 py-0 px-3">Project Title</TableHead>
                      <TableHead className="h-10 py-0 px-3">Site</TableHead>
                      <TableHead className="h-10 py-0 px-3">Date</TableHead>
                      <TableHead className="h-10 py-0 px-3">Contractor</TableHead>
                      <TableHead className="h-10 py-0 px-3 text-right">Contracted (EUR)</TableHead>
                      <TableHead className="h-10 py-0 px-3 text-right">Invoiced (EUR)</TableHead>
                      <TableHead className="h-10 py-0 px-3 text-right">Balance (EUR)</TableHead>
                      <TableHead className="h-10 py-0 px-3">Status</TableHead>
                      <TableHead className="h-10 py-0 px-3">Agreement Signed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-12">No contracts found</TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((c) => {
                        const proj = projectMap.get(c.project_id);
                        const cur = proj?.currency || "EUR";
                        const contractedEur = convertToEur(c.amount_lc || 0, cur);
                        const cInvoices = invoicesByContract[c.id] || [];
                        const invoicedEur = cInvoices.reduce((s, inv) => s + convertToEur(inv.amount_lc, cur), 0);
                        const balanceEur = contractedEur - invoicedEur;
                        const isSelected = selectedContract?.id === c.id;

                        return (
                          <TableRow
                            key={c.id}
                            className={cn("h-10 cursor-pointer", isSelected && "bg-muted/50")}
                            onClick={() => setSelectedContract(isSelected ? null : c)}
                          >
                            <TableCell className="w-10 py-0 px-1" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={() => openEditModal(c)}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openInvoiceModal(c.id)}>
                                    <Plus className="h-3.5 w-3.5 mr-2" />Add Invoice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell className="py-0 px-3 font-medium">{c.contract_number}</TableCell>
                            <TableCell className="py-0 px-3">
                              <span
                                className="text-primary font-medium cursor-pointer hover:underline"
                                onClick={(e) => { e.stopPropagation(); navigate(`/project/${c.project_id}`); }}
                              >
                                {projectNumberMap.get(c.project_id) ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="py-0 px-3">{proj?.name || "Unknown"}</TableCell>
                            <TableCell className="py-0 px-3">{proj?.site || "—"}</TableCell>
                            <TableCell className="py-0 px-3">{c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="py-0 px-3">{c.contractor || "—"}</TableCell>
                            <TableCell className="py-0 px-3 text-right">{formatAmount(contractedEur)}</TableCell>
                            <TableCell className="py-0 px-3 text-right">{cInvoices.length > 0 ? formatAmount(invoicedEur) : "—"}</TableCell>
                            <TableCell className="py-0 px-3 text-right">{cInvoices.length > 0 ? formatAmount(balanceEur) : "—"}</TableCell>
                            <TableCell className="py-0 px-3"><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>
                            <TableCell className="py-0 px-3">{c.agreement_signed ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                  {filtered.length > 0 && (
                    <TableFooter>
                      <TableRow className="h-10">
                        <TableCell colSpan={7} className="py-0 px-3 font-bold">Total</TableCell>
                        <TableCell className="py-0 px-3 text-right font-bold">{formatAmount(totals.contracted)}</TableCell>
                        <TableCell className="py-0 px-3 text-right font-bold">{formatAmount(totals.invoiced)}</TableCell>
                        <TableCell className="py-0 px-3 text-right font-bold">{formatAmount(totals.balance)}</TableCell>
                        <TableCell className="py-0 px-3" />
                        <TableCell className="py-0 px-3" />
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Side Detail Panel */}
        {selectedContract && (
          <div className="w-[380px] flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contract Details</p>
                <h3 className="text-base font-semibold mt-1 leading-snug">{selectedContract.contractor || "—"}</h3>
              </div>
              <button onClick={() => setSelectedContract(null)} className="shrink-0 h-7 w-7 rounded flex items-center justify-center hover:bg-muted transition-colors mt-0.5">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full rounded-none border-b border-border bg-transparent px-5 pt-1 pb-0 h-auto justify-start gap-0">
                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 text-sm">Contract Details</TabsTrigger>
                <TabsTrigger value="invoices" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 pb-2 text-sm">Invoices ({selectedInvoices.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-y-auto mt-0">
                <div className="px-5 py-4 border-b border-border space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contract ID</span>
                    <span className="text-sm font-medium">{selectedContract.contract_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">{selectedContract.contract_date ? format(new Date(selectedContract.contract_date), "dd MMM yyyy") : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contractor</span>
                    <span className="text-sm font-medium">{selectedContract.contractor || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Project</span>
                    <span className="text-sm font-medium text-primary cursor-pointer hover:underline" onClick={() => navigate(`/project/${selectedContract.project_id}`)}>
                      {projectNumberMap.get(selectedContract.project_id) ?? "—"} — {selectedProj?.name || "Unknown"}
                    </span>
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

                <div className="px-5 py-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Financial Summary</p>

                  {/* Local Currency section (only if not EUR) */}
                  {selectedShowLc && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Contracted ({selectedCurrency})</span>
                        <span className="text-sm font-semibold">{formatAmount(selectedContract.amount_lc)}</span>
                      </div>
                      {selectedInvoices.length > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Invoiced ({selectedCurrency})</span>
                            <span className="text-sm font-semibold">{formatAmount(selectedTotalInvoicedLc)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-border">
                            <span className="text-sm font-semibold">Balance ({selectedCurrency})</span>
                            <span className="text-sm font-semibold">{formatAmount((selectedContract.amount_lc || 0) - selectedTotalInvoicedLc)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* EUR section */}
                  {selectedShowLc && <div className="h-2" />}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contracted (EUR)</span>
                    <span className="text-sm font-semibold">{formatAmount(convertToEur(selectedContract.amount_lc || 0, selectedCurrency))}</span>
                  </div>
                  {selectedInvoices.length > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Invoiced (EUR)</span>
                        <span className="text-sm font-semibold">{formatAmount(convertToEur(selectedTotalInvoicedLc, selectedCurrency))}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-border">
                        <span className="text-sm font-semibold">Balance (EUR)</span>
                        <span className="text-sm font-semibold">{formatAmount(convertToEur((selectedContract.amount_lc || 0) - selectedTotalInvoicedLc, selectedCurrency))}</span>
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
                      {selectedInvoices.map(inv => {
                        const invEur = convertToEur(inv.amount_lc, selectedCurrency);
                        return (
                          <div key={inv.id} className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{inv.invoice_number}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {selectedShowLc && <>{formatAmount(inv.amount_lc)} {selectedCurrency} · </>}
                                {formatAmount(invEur)} EUR
                              </p>
                              {inv.attachment_url && (
                                <a href={inv.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                                  <Paperclip className="h-3 w-3" />{inv.attachment_name || "Attachment"}
                                </a>
                              )}
                            </div>
                            <button onClick={() => handleDeleteInvoice(inv.id)} className="shrink-0 h-6 w-6 rounded flex items-center justify-center hover:bg-muted transition-colors text-destructive">
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
                    <Plus className="h-3.5 w-3.5" />Add Invoice
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Edit Contract Modal */}
      <Dialog open={showEditModal} onOpenChange={open => { if (!open) { setShowEditModal(false); setEditingContract(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Contract</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label htmlFor="editContractNumber">Contract ID</Label><Input id="editContractNumber" value={editContractNumber} onChange={e => setEditContractNumber(e.target.value)} /></div>
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
            <div><Label htmlFor="editContractor">Contractor</Label><Input id="editContractor" value={editContractor} onChange={e => setEditContractor(e.target.value)} /></div>
            <div><Label htmlFor="editDescription">Contract Description</Label><Textarea id="editDescription" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={Math.max(3, Math.ceil((editDescription?.length || 0) / 80))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editAmount">Contract amount ({editSelectedCurrency})</Label>
                <Input id="editAmount" type="text" inputMode="decimal" placeholder="0.00" value={editAmountRaw ? Number(editAmountRaw).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ""} onChange={e => { const raw = e.target.value.replace(/[^0-9.]/g, ""); setEditAmountRaw(raw); }} />
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
              <RadioGroup value={editAgreementSigned ? "yes" : "no"} onValueChange={v => setEditAgreementSigned(v === "yes")} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="edit-agreement-yes" /><Label htmlFor="edit-agreement-yes" className="font-normal cursor-pointer">Yes</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="edit-agreement-no" /><Label htmlFor="edit-agreement-no" className="font-normal cursor-pointer">No</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="editComments" className="flex items-center gap-1.5">Comments
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-xs">Important: add info about phased payments</TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <Textarea id="editComments" value={editComments} onChange={e => setEditComments(e.target.value)} rows={Math.max(3, Math.ceil((editComments?.length || 0) / 80))} />
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
            <AlertDialogAction onClick={handleDeleteContract} disabled={deletingContract} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            <div><Label htmlFor="invoiceNumber">Invoice Number</Label><Input id="invoiceNumber" placeholder="e.g. INV-001" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /></div>
            <div>
              <Label htmlFor="invoiceAmount">Amount ({(() => { const c = contracts.find(ct => ct.id === invoiceContractId); const p = c ? projectMap.get(c.project_id) : null; return p?.currency || "EUR"; })()})</Label>
              <Input id="invoiceAmount" type="number" placeholder="0.00" value={invoiceAmountRaw} onChange={e => setInvoiceAmountRaw(e.target.value)} />
            </div>
            <div>
              <Label>Attachment (optional)</Label>
              <input ref={invoiceFileRef} type="file" className="hidden" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
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
