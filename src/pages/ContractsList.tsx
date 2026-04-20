import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Plus, Pencil, X, Trash2, Paperclip, ChevronsUpDown, Check, Download, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
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
import { CalendarIcon } from "lucide-react";
import * as XLSX from "xlsx";

interface ProjectInfo {
  id: string;
  name: string;
  site: string | null;
  currency: string | null;
  budget_line: string | null;
  fiscal_year: string | null;
  budget_type: string | null;
  budget_classification: string | null;
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

const siteToLegalEntity: Record<string, string> = {
  // Poland
  "Mapletree Park Bedzin": "AlexandraLog PLC01",
  "Bedzin": "AlexandraLog PLC01",
  "Mapletree Park Blonie 2": "AlexandraLog PLC03",
  "Blonie 2": "AlexandraLog PLC03",
  "Mapletree Park Gdańsk-Airport": "AlexandraLog PLC05",
  "Gdańsk-Airport": "AlexandraLog PLC05",
  "Mapletree Park Nadarzyn": "AlexandraLog PLC07",
  "Nadarzyn": "AlexandraLog PLC07",
  "Mapletree Park Piotrków 1": "AlexandraLog PLC08",
  "Piotrków 1": "AlexandraLog PLC08",
  "Mapletree Park Piotrków 2": "AlexandraLog PLC09",
  "Mapletree Park Szczecin": "AlexandraLog PLC10",
  "Szczecin": "AlexandraLog PLC10",
  // Italy
  "Mapletree Park Bologna Castel San Pietro": "AlexandraLog PLIT01",
  "Bologna Castel San Pietro": "AlexandraLog PLIT01",
  // Spain
  "Mapletree Park Fogars": "AlexandraLog SPNE01",
  "Fogars": "AlexandraLog SPNE01",
  "Mapletree Park Les Franqueses": "AlexandraLog SPNE02",
  "Les Franqueses": "AlexandraLog SPNE02",
  "Mapletree Park Sallent": "AlexandraLog SPNE03",
  "Sallent": "AlexandraLog SPNE03",
  "Mapletree Park Valls": "AlexandraLog SPNE04",
  "Valls": "AlexandraLog SPNE04",
  // Hungary
  "Százhalombatta": "AlexandraLog PLHU01",
  "Üllő": "AlexandraLog PLHU02",
  // Netherlands
  "Mapletree Park Tilburg": "AlexandraLog NL01",
  "Tilburg": "AlexandraLog NL01",
  "Mapletree Park Schiphol": "AlexandraLog NL02",
  "Schiphol": "AlexandraLog NL02",
  // France
  "Mapletree Park Lyon": "AlexandraLog FR01",
  "Lyon": "AlexandraLog FR01",
  "Mapletree Park Marseille": "AlexandraLog FR02",
  "Marseille": "AlexandraLog FR02",
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

  const [projectNumberMap, setProjectNumberMap] = useState<Map<string, number>>(new Map());
  const [projectMap, setProjectMap] = useState<Map<string, ProjectInfo>>(new Map());

  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);

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

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceContractId, setInvoiceContractId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmountRaw, setInvoiceAmountRaw] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [pendingSiteGroups, setPendingSiteGroups] = useState<string[]>([]);
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingSite, setPendingSite] = useState("");
   const [pendingBudgetLine, setPendingBudgetLine] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingFiscalYear, setPendingFiscalYear] = useState("2026");
  const [pendingBudgetType, setPendingBudgetType] = useState("");
  const [pendingBudgetClassification, setPendingBudgetClassification] = useState("");

  const [filterSiteGroups, setFilterSiteGroups] = useState<string[]>([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterBudgetLine, setFilterBudgetLine] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFiscalYear, setFilterFiscalYear] = useState("2026");
  const [filterBudgetType, setFilterBudgetType] = useState("");
  const [filterBudgetClassification, setFilterBudgetClassification] = useState("");

  const [visibleColumns, setVisibleColumns] = useState({
    contractId: true,
    country: true,
    site: true,
    legalEntity: true,
    budgetType: true,
    contractor: true,
    description: false,
    projectNumber: false,
    projectTitle: false,
    date: false,
    status: false,
    agreementSigned: false,
    contracted: true,
    invoiced: true,
    balance: true,
  });

  const columnDefs: { key: keyof typeof visibleColumns; label: string }[] = [
    { key: "contractId", label: "Contract ID" },
    { key: "country", label: "Country" },
    { key: "site", label: "Site" },
    { key: "legalEntity", label: "Legal entity" },
    { key: "budgetType", label: "Budget type" },
    { key: "contractor", label: "Contractor" },
    { key: "description", label: "Contract description" },
    { key: "projectNumber", label: "Project Number" },
    { key: "projectTitle", label: "Project Title" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
    { key: "agreementSigned", label: "Agreement Signed" },
    { key: "contracted", label: "Contracted (EUR)" },
    { key: "invoiced", label: "Invoiced (EUR)" },
    { key: "balance", label: "Balance (EUR)" },
  ];

  const SITE_GROUP_DISPLAY: Record<string, string> = {
    WE: "Western Europe",
    PL: "Poland",
    HU: "Hungary",
  };

  const hasAppliedFilters = filterCountry || filterSite || filterBudgetLine || filterStatus || filterFiscalYear || filterSiteGroups.length > 0 || filterBudgetType || filterBudgetClassification;

  const applyFilters = () => {
    setFilterSiteGroups(pendingSiteGroups);
    setFilterCountry(pendingCountry);
    setFilterSite(pendingSite);
    setFilterBudgetLine(pendingBudgetLine);
    setFilterStatus(pendingStatus);
    setFilterFiscalYear(pendingFiscalYear);
    setFilterBudgetType(pendingBudgetType);
    setFilterBudgetClassification(pendingBudgetClassification);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPendingSiteGroups([]); setPendingCountry(""); setPendingSite("");
    setPendingBudgetLine(""); setPendingStatus(""); setPendingFiscalYear("");
    setPendingBudgetType(""); setPendingBudgetClassification("");
    setFilterSiteGroups([]); setFilterCountry(""); setFilterSite("");
    setFilterBudgetLine(""); setFilterStatus(""); setFilterFiscalYear("");
    setFilterBudgetType(""); setFilterBudgetClassification("");
  };

  const togglePendingSiteGroup = (group: string) => {
    setPendingSiteGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const fetchData = async () => {
    setLoading(true);
    const [projectsRes, contractsRes, invoicesRes, fxRes] = await Promise.all([
      supabase.from("projects").select("id, name, site, currency, budget_line, fiscal_year, budget_type, budget_classification, created_at").order("created_at", { ascending: true }),
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

  const invoicesByContract = useMemo(() => {
    return invoices.reduce<Record<string, Invoice[]>>((acc, inv) => {
      if (!acc[inv.contract_id]) acc[inv.contract_id] = [];
      acc[inv.contract_id].push(inv);
      return acc;
    }, {});
  }, [invoices]);

  const filterOptions = useMemo(() => {
    const sites = [...new Set(projects.map(p => p.site).filter(Boolean))].sort() as string[];
    const countries = [...new Set(sites.map(s => siteToCountry[s] || "Unknown"))].sort();
    const budgetLines = [...new Set(projects.map(p => p.budget_line).filter(Boolean))].sort() as string[];
    const fiscalYears = [...new Set(projects.map(p => p.fiscal_year).filter(Boolean))].sort() as string[];
    const budgetTypes = [...new Set(projects.map(p => p.budget_type).filter(Boolean))].sort() as string[];
    const budgetClassifications = [...new Set(projects.map(p => p.budget_classification).filter(Boolean))].sort() as string[];
    return { sites, countries, budgetLines, fiscalYears, budgetTypes, budgetClassifications };
  }, [projects]);

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      const proj = projectMap.get(c.project_id);
      if (!proj) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = c.contract_number.toLowerCase().includes(q) ||
          proj.name.toLowerCase().includes(q) ||
          (c.contractor && c.contractor.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      const projectCountry = proj.site ? siteToCountry[proj.site] : null;
      if (filterSiteGroups.length > 0 && !(projectCountry && filterSiteGroups.includes(COUNTRY_TO_SITE_GROUP[projectCountry] || ""))) return false;
      if (filterCountry && projectCountry !== filterCountry) return false;
      if (filterSite && proj.site !== filterSite) return false;
      if (filterBudgetLine && proj.budget_line !== filterBudgetLine) return false;
      if (filterFiscalYear && proj.fiscal_year !== filterFiscalYear) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterBudgetType && proj.budget_type !== filterBudgetType) return false;
      if (filterBudgetClassification && proj.budget_classification !== filterBudgetClassification) return false;
      return true;
    });
  }, [contracts, projectMap, searchQuery, filterSiteGroups, filterCountry, filterSite, filterBudgetLine, filterFiscalYear, filterStatus, filterBudgetType, filterBudgetClassification]);

  const groupedFiltered = useMemo(() => {
    const groups: Record<string, ContractRow[]> = {};
    filtered.forEach(c => {
      const proj = projectMap.get(c.project_id);
      const country = proj?.site ? siteToCountry[proj.site] : null;
      const sg = country ? (COUNTRY_TO_SITE_GROUP[country] || "Other") : "Other";
      if (!groups[sg]) groups[sg] = [];
      groups[sg].push(c);
    });
    const order = ["WE", "PL", "HU", "Other"];
    return order.filter(k => groups[k]?.length).map(k => {
      let contracted = 0, invoiced = 0;
      groups[k].forEach(c => {
        const proj = projectMap.get(c.project_id);
        const cur = proj?.currency || "EUR";
        contracted += convertToEur(c.amount_lc || 0, cur);
        const cInvoices = invoicesByContract[c.id] || [];
        invoiced += cInvoices.reduce((s, inv) => s + convertToEur(inv.amount_lc, cur), 0);
      });
      return { group: k, label: SITE_GROUP_DISPLAY[k] || k, contracts: groups[k], subtotals: { contracted, invoiced, balance: contracted - invoiced } };
    });
  }, [filtered, projectMap, invoicesByContract, fxRates]);

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

  const handleExportXls = () => {
    const rows = filtered.map(c => {
      const proj = projectMap.get(c.project_id);
      const cur = proj?.currency || "EUR";
      const contractedEur = convertToEur(c.amount_lc || 0, cur);
      const cInvoices = invoicesByContract[c.id] || [];
      const invoicedEur = cInvoices.reduce((s, inv) => s + convertToEur(inv.amount_lc, cur), 0);
      const balanceEur = contractedEur - invoicedEur;
      const row: Record<string, any> = {};
      if (visibleColumns.contractId) row["Contract ID"] = c.contract_number;
      if (visibleColumns.projectNumber) row["Project Number"] = projectNumberMap.get(c.project_id) ?? "";
      if (visibleColumns.projectTitle) row["Project Title"] = proj?.name || "";
      if (visibleColumns.site) row["Site"] = proj?.site || "";
      if (visibleColumns.country) row["Country"] = proj?.site ? siteToCountry[proj.site] || "" : "";
      if (visibleColumns.date) row["Date"] = c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "";
      if (visibleColumns.contractor) row["Contractor"] = c.contractor || "";
      if (visibleColumns.status) row["Status"] = c.status;
      if (visibleColumns.agreementSigned) row["Agreement Signed"] = c.agreement_signed ? "Yes" : "No";
      if (visibleColumns.description) row["Description"] = c.description || "";
      if (visibleColumns.contracted) row["Contracted (EUR)"] = contractedEur;
      if (visibleColumns.invoiced) row["Invoiced (EUR)"] = invoicedEur;
      if (visibleColumns.balance) row["Balance (EUR)"] = balanceEur;
      return row;
    });
    const totalRow: Record<string, any> = {};
    const firstVisibleKey = columnDefs.find(c => visibleColumns[c.key])?.label;
    if (firstVisibleKey) totalRow[firstVisibleKey] = "Total";
    if (visibleColumns.contracted) totalRow["Contracted (EUR)"] = totals.contracted;
    if (visibleColumns.invoiced) totalRow["Invoiced (EUR)"] = totals.invoiced;
    if (visibleColumns.balance) totalRow["Balance (EUR)"] = totals.balance;
    rows.push(totalRow);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contracts");
    XLSX.writeFile(wb, "contracts_report.xlsx");
  };

  const selectedProj = selectedContract ? projectMap.get(selectedContract.project_id) : null;
  const selectedCurrency = selectedProj?.currency || "EUR";
  const selectedShowLc = selectedCurrency.toUpperCase() !== "EUR";
  const selectedInvoices = selectedContract ? (invoicesByContract[selectedContract.id] || []) : [];
  const selectedTotalInvoicedLc = selectedInvoices.reduce((s, inv) => s + Number(inv.amount_lc || 0), 0);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const visibleBeforeFinancial = [
    visibleColumns.contractId,
    visibleColumns.country,
    visibleColumns.site,
    visibleColumns.legalEntity,
    visibleColumns.budgetType,
    visibleColumns.contractor,
    visibleColumns.description,
    visibleColumns.projectNumber,
    visibleColumns.projectTitle,
    visibleColumns.date,
    visibleColumns.status,
    visibleColumns.agreementSigned,
  ].filter(Boolean).length;

  return (
    <div className={embedded ? "" : "bg-background"}>
      <div className={embedded ? "flex overflow-hidden" : "flex h-[calc(100vh-64px)] overflow-hidden"}>
        <div className={cn("flex-1 min-w-0 overflow-y-auto", embedded ? "p-4" : "p-6")}>
          {!embedded && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Contracts</h1>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4 mt-4">
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

          <div className="mb-4">
              <div className="space-y-4">
              <div className="flex items-end gap-3 flex-wrap">
                  <div className="min-w-[120px]">
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
                  <div className="min-w-[110px] flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Country</Label>
                    <Select value={pendingCountry || "all"} onValueChange={v => setPendingCountry(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All countries" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All countries</SelectItem>
                        {filterOptions.countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[110px] flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Work category</Label>
                    <Select value={pendingBudgetLine || "all"} onValueChange={v => setPendingBudgetLine(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {filterOptions.budgetLines.map(bl => <SelectItem key={bl} value={bl}>{bl}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[100px] flex-1">
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
                  <div className="min-w-[100px] flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Fiscal year</Label>
                    <Select value={pendingFiscalYear || "all"} onValueChange={v => setPendingFiscalYear(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All years" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All years</SelectItem>
                        {filterOptions.fiscalYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[100px] flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Budget type</Label>
                    <Select value={pendingBudgetType || "all"} onValueChange={v => setPendingBudgetType(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {filterOptions.budgetTypes.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[110px] flex-1">
                    <Label className="text-xs text-muted-foreground mb-2 block">Budget classification</Label>
                    <Select value={pendingBudgetClassification || "all"} onValueChange={v => setPendingBudgetClassification(v === "all" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="All classifications" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classifications</SelectItem>
                        {filterOptions.budgetClassifications.map(bc => <SelectItem key={bc} value={bc}>{bc}</SelectItem>)}
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
                        {filterBudgetLine}
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
                    {filterBudgetType && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        Type: {filterBudgetType}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetType(""); setPendingBudgetType(""); }} />
                      </Badge>
                    )}
                    {filterBudgetClassification && (
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                        {filterBudgetClassification}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetClassification(""); setPendingBudgetClassification(""); }} />
                      </Badge>
                    )}
                    <button className="text-sm text-primary hover:underline font-medium" onClick={clearFilters}>Clear</button>
                  </div>
                )}
              </div>
          </div>

          <div className="flex items-center justify-end gap-2 mb-3 pr-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-2">
                  {columnDefs.map(col => (
                    <div key={col.key} className="flex items-center justify-between">
                      <span className="text-sm">{col.label}</span>
                      <Switch
                        checked={visibleColumns[col.key]}
                        onCheckedChange={(checked) =>
                          setVisibleColumns(prev => ({ ...prev, [col.key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={handleExportXls}>
              <Download className="h-4 w-4 mr-2" />Export XLS
            </Button>
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
                      {visibleColumns.contractId && <TableHead className="h-10 py-0 px-3 sticky left-0 bg-card z-20 min-w-[140px]">Contract ID</TableHead>}
                      {visibleColumns.country && <TableHead className="h-10 py-0 px-3 sticky left-[140px] bg-card z-20 min-w-[120px]">Country</TableHead>}
                      {visibleColumns.site && <TableHead className="h-10 py-0 px-3 sticky left-[260px] bg-card z-20 min-w-[160px]">Site</TableHead>}
                      {visibleColumns.legalEntity && <TableHead className="h-10 py-0 px-3 sticky left-[420px] bg-card z-20 min-w-[140px]">Legal entity</TableHead>}
                      {visibleColumns.budgetType && <TableHead className="h-10 py-0 px-3 sticky left-[560px] bg-card z-20 min-w-[120px]">Budget type</TableHead>}
                      {visibleColumns.contractor && <TableHead className="h-10 py-0 px-3">Contractor</TableHead>}
                      {visibleColumns.description && <TableHead className="h-10 py-0 px-3">Contract description</TableHead>}
                      {visibleColumns.projectNumber && <TableHead className="h-10 py-0 px-3">Project Number</TableHead>}
                      {visibleColumns.projectTitle && <TableHead className="h-10 py-0 px-3">Project Title</TableHead>}
                      {visibleColumns.date && <TableHead className="h-10 py-0 px-3">Date</TableHead>}
                      {visibleColumns.status && <TableHead className="h-10 py-0 px-3">Status</TableHead>}
                      {visibleColumns.agreementSigned && <TableHead className="h-10 py-0 px-3">Agreement Signed</TableHead>}
                      {visibleColumns.contracted && <TableHead className="h-10 py-0 px-3 text-right">Contracted (EUR)</TableHead>}
                      {visibleColumns.invoiced && <TableHead className="h-10 py-0 px-3 text-right">Invoiced (EUR)</TableHead>}
                      {visibleColumns.balance && <TableHead className="h-10 py-0 px-3 text-right">Balance (EUR)</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center text-muted-foreground py-12">No contracts found</TableCell>
                      </TableRow>
                    ) : (
                      groupedFiltered.map((group) => {
                        const projectCount = new Set(group.contracts.map(c => c.project_id)).size;
                        const isCollapsed = collapsedGroups.has(group.group);
                        return (
                        <>
                          <TableRow key={`group-${group.group}`} className="h-10 cursor-pointer" onClick={() => toggleGroup(group.group)}>
                            <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-0 px-3 font-bold text-sm sticky left-0 z-10 bg-muted">
                              <span className="inline-flex items-center gap-1.5">
                                <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed && "-rotate-90")} />
                                {group.label} ({group.contracts.length} contract{group.contracts.length !== 1 ? "s" : ""})
                              </span>
                            </TableCell>
                          </TableRow>
                          {!isCollapsed && group.contracts.map((c) => {
                            const proj = projectMap.get(c.project_id);
                            const cur = proj?.currency || "EUR";
                            const contractedEur = convertToEur(c.amount_lc || 0, cur);
                            const cInvoices = invoicesByContract[c.id] || [];
                            const invoicedEur = cInvoices.reduce((s, inv) => s + convertToEur(inv.amount_lc, cur), 0);
                            const balanceEur = contractedEur - invoicedEur;
                            const isSelected = selectedContract?.id === c.id;
                            const country = proj?.site ? siteToCountry[proj.site] || "—" : "—";

                            return (
                              <TableRow
                                key={c.id}
                                className={cn("h-10 cursor-pointer", isSelected && "bg-muted/50")}
                                onClick={() => setSelectedContract(isSelected ? null : c)}
                              >
                                {visibleColumns.contractId && <TableCell className={cn("py-0 px-3 font-medium sticky left-0 z-10 min-w-[140px]", isSelected ? "bg-muted" : "bg-card")}>{c.contract_number}</TableCell>}
                                {visibleColumns.country && <TableCell className={cn("py-0 px-3 sticky left-[140px] z-10 min-w-[120px]", isSelected ? "bg-muted" : "bg-card")}>{country}</TableCell>}
                                {visibleColumns.site && <TableCell className={cn("py-0 px-3 sticky left-[260px] z-10 min-w-[160px]", isSelected ? "bg-muted" : "bg-card")}>{proj?.site || "—"}</TableCell>}
                                {visibleColumns.legalEntity && <TableCell className={cn("py-0 px-3 sticky left-[420px] z-10 min-w-[140px]", isSelected ? "bg-muted" : "bg-card")}>{(proj?.site && siteToLegalEntity[proj.site]) || "—"}</TableCell>}
                                {visibleColumns.budgetType && <TableCell className={cn("py-0 px-3 sticky left-[560px] z-10 min-w-[120px]", isSelected ? "bg-muted" : "bg-card")}>{proj?.budget_type || "—"}</TableCell>}
                                {visibleColumns.contractor && <TableCell className="py-0 px-3">{c.contractor || "—"}</TableCell>}
                                {visibleColumns.description && <TableCell className="py-0 px-3 max-w-[200px] truncate">{c.description || "—"}</TableCell>}
                                {visibleColumns.projectNumber && (
                                  <TableCell className="py-0 px-3">
                                    <span
                                      className="text-primary font-medium cursor-pointer hover:underline"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/project/${c.project_id}`); }}
                                    >
                                      {projectNumberMap.get(c.project_id) ?? "—"}
                                    </span>
                                  </TableCell>
                                )}
                                {visibleColumns.projectTitle && <TableCell className="py-0 px-3">{proj?.name || "Unknown"}</TableCell>}
                                {visibleColumns.date && <TableCell className="py-0 px-3">{c.contract_date ? format(new Date(c.contract_date), "dd MMM yyyy") : "—"}</TableCell>}
                                {visibleColumns.status && <TableCell className="py-0 px-3"><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>}
                                {visibleColumns.agreementSigned && <TableCell className="py-0 px-3">{c.agreement_signed ? "Yes" : "No"}</TableCell>}
                                {visibleColumns.contracted && <TableCell className="py-0 px-3 text-right">{formatAmount(contractedEur)}</TableCell>}
                                {visibleColumns.invoiced && <TableCell className="py-0 px-3 text-right">{cInvoices.length > 0 ? formatAmount(invoicedEur) : "—"}</TableCell>}
                                {visibleColumns.balance && <TableCell className="py-0 px-3 text-right">{cInvoices.length > 0 ? formatAmount(balanceEur) : "—"}</TableCell>}
                              </TableRow>
                            );
                          })}
                          {/* Subtotal row for group */}
                          <TableRow key={`subtotal-${group.group}`} className="h-10">
                            <TableCell colSpan={visibleBeforeFinancial} className="py-0 px-3 font-semibold text-sm italic sticky left-0 z-10 bg-orange-100">
                              Subtotal — {group.label}
                            </TableCell>
                            {visibleColumns.contracted && <TableCell className="py-0 px-3 text-right sticky right-[280px] z-10 bg-orange-100 min-w-[140px]"><span className="font-normal text-xs mr-1.5">EUR</span><span className="font-semibold">{formatAmount(group.subtotals.contracted)}</span></TableCell>}
                            {visibleColumns.invoiced && <TableCell className="py-0 px-3 text-right sticky right-[140px] z-10 bg-orange-100 min-w-[140px]"><span className="font-normal text-xs mr-1.5">EUR</span><span className="font-semibold">{formatAmount(group.subtotals.invoiced)}</span></TableCell>}
                            {visibleColumns.balance && <TableCell className="py-0 px-3 text-right sticky right-0 z-10 bg-orange-100 min-w-[140px]"><span className="font-normal text-xs mr-1.5">EUR</span><span className="font-semibold">{formatAmount(group.subtotals.balance)}</span></TableCell>}
                          </TableRow>
                        </>
                        );
                      })
                    )}
                  </TableBody>
                  {filtered.length > 0 && (
                    <TableFooter>
                      <TableRow className="h-10 text-white">
                        <TableCell colSpan={visibleBeforeFinancial} className="py-0 px-3 font-bold text-white sticky left-0 z-10 bg-amber-900">Grand Total</TableCell>
                        {visibleColumns.contracted && <TableCell className="py-0 px-3 text-right text-white sticky right-[280px] z-10 bg-amber-900 min-w-[140px]"><span className="font-normal text-xs mr-1.5">EUR</span><span className="font-bold">{formatAmount(totals.contracted)}</span></TableCell>}
                        {visibleColumns.invoiced && <TableCell className="py-0 px-3 text-right text-white sticky right-[140px] z-10 bg-amber-900 min-w-[140px]"><span className="font-normal text-xs mr-1.5">EUR</span><span className="font-bold">{formatAmount(totals.invoiced)}</span></TableCell>}
                        {visibleColumns.balance && <TableCell className="py-0 px-3 text-right text-white sticky right-0 z-10 bg-amber-900 min-w-[140px]"><span className="font-normal text-xs mr-1.5">EUR</span><span className="font-bold">{formatAmount(totals.balance)}</span></TableCell>}
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
            </>
          )}
        </div>

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
                </div>

                <div className="px-5 py-4 border-b border-border space-y-3">
                  {selectedShowLc && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Financial ({selectedCurrency})</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Contracted</span>
                        <span className="text-sm font-medium">{formatAmount(selectedContract.amount_lc)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Invoiced</span>
                        <span className="text-sm font-medium">{formatAmount(selectedTotalInvoicedLc)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <span className="text-sm font-medium">{formatAmount((selectedContract.amount_lc || 0) - selectedTotalInvoicedLc)}</span>
                      </div>
                    </>
                  )}

                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{selectedShowLc ? "Financial (EUR)" : "Financial"}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contracted</span>
                    <span className="text-sm font-medium">{formatAmount(convertToEur(selectedContract.amount_lc || 0, selectedCurrency))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Invoiced</span>
                    <span className="text-sm font-medium">{formatAmount(convertToEur(selectedTotalInvoicedLc, selectedCurrency))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="text-sm font-medium">{formatAmount(convertToEur((selectedContract.amount_lc || 0) - selectedTotalInvoicedLc, selectedCurrency))}</span>
                  </div>
                </div>

                {selectedContract.description && (
                  <div className="px-5 py-4 border-b border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{selectedContract.description}</p>
                  </div>
                )}
                {selectedContract.comments && (
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Comments</p>
                    <p className="text-sm">{selectedContract.comments}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="flex-1 overflow-y-auto mt-0">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium">{selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? "s" : ""}</span>
                  <Button size="sm" variant="outline" onClick={() => openInvoiceModal(selectedContract.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add
                  </Button>
                </div>
                {selectedInvoices.length === 0 ? (
                  <div className="px-5 py-12 text-center text-muted-foreground text-sm">No invoices yet</div>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedInvoices.map(inv => (
                      <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{formatAmount(inv.amount_lc)} {selectedCurrency}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {inv.attachment_url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={inv.attachment_url} target="_blank" rel="noopener noreferrer" className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted">
                                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>{inv.attachment_name || "Attachment"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteInvoice(inv.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); setEditingContract(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Contract Number</Label>
              <Input value={editContractNumber} onChange={e => setEditContractNumber(e.target.value)} />
            </div>
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editContractDate ? format(editContractDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editContractDate} onSelect={setEditContractDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Amount ({editSelectedCurrency})</Label>
              <Input type="number" value={editAmountRaw} onChange={e => setEditAmountRaw(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <RadioGroup value={editStatus} onValueChange={setEditStatus} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="Ongoing" id="edit-ongoing" /><Label htmlFor="edit-ongoing">Ongoing</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="Completed" id="edit-completed" /><Label htmlFor="edit-completed">Completed</Label></div>
              </RadioGroup>
            </div>
            <div>
              <Label>Contractor</Label>
              <Input value={editContractor} onChange={e => setEditContractor(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editAgreementSigned} onChange={e => setEditAgreementSigned(e.target.checked)} id="edit-agreement" className="rounded border-input" />
              <Label htmlFor="edit-agreement">Agreement Signed</Label>
            </div>
            <div>
              <Label>Comments</Label>
              <Textarea value={editComments} onChange={e => setEditComments(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteContractConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-1" />Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingContract(null); }}>Cancel</Button>
              <Button onClick={handleEditSubmit} disabled={editSaving}>{editSaving ? "Saving..." : "Save"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteContractConfirm} onOpenChange={setShowDeleteContractConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this contract and all associated invoices.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContract} disabled={deletingContract} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingContract ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showInvoiceModal} onOpenChange={(open) => { if (!open) setShowInvoiceModal(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Invoice Number</Label>
              <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={invoiceAmountRaw} onChange={e => setInvoiceAmountRaw(e.target.value)} />
            </div>
            <div>
              <Label>Attachment</Label>
              <Input ref={invoiceFileRef} type="file" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button onClick={handleInvoiceSubmit} disabled={invoiceSaving || !invoiceNumber.trim()}>{invoiceSaving ? "Saving..." : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
