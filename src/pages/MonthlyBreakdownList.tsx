import React, { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronDown, Check, ChevronsUpDown, X, Download, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { SITE_GROUP_OPTIONS, COUNTRY_TO_SITE_GROUP } from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

const MONTH_KEYS = ["apr","may","jun","jul","aug","sep","oct","nov","dec","jan","feb","mar"] as const;
const MONTH_HEADERS = [
  "Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026","Sep 2026",
  "Oct 2026","Nov 2026","Dec 2026","Jan 2027","Feb 2027","Mar 2027",
];

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

const budgetLineLabels: Record<string, string> = {
  common_areas: "Common Areas",
  tenant_fitout: "Tenant Fit-Out",
  building_upgrades: "Building Upgrades",
  sustainability: "Sustainability",
  safety_compliance: "Safety & Compliance",
};

const formatAmount = (v: number | null) => {
  if (v == null || v === 0) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface BreakdownRow {
  project_id: string;
  apr: number | null; may: number | null; jun: number | null;
  jul: number | null; aug: number | null; sep: number | null;
  oct: number | null; nov: number | null; dec: number | null;
  jan: number | null; feb: number | null; mar: number | null;
}

interface ContractRow {
  project_id: string;
  amount_lc: number | null;
  status: string;
}

interface InvoiceWithProject {
  amount_lc: number;
  project_id: string;
}

const SITE_GROUP_DISPLAY: Record<string, string> = {
  WE: "Western Europe",
  PL: "Poland",
  HU: "Hungary",
};

export default function MonthlyBreakdownList({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const [breakdowns, setBreakdowns] = useState<BreakdownRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [invoicesWithProject, setInvoicesWithProject] = useState<InvoiceWithProject[]>([]);
  const [bdLoading, setBdLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  // Pending / applied filter state
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingBudgetLine, setPendingBudgetLine] = useState("");
  const [pendingSite, setPendingSite] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingFiscalYear, setPendingFiscalYear] = useState("2026");
  const [pendingSiteGroups, setPendingSiteGroups] = useState<string[]>([]);
  const [pendingBudgetType, setPendingBudgetType] = useState("");
  const [pendingBudgetClassification, setPendingBudgetClassification] = useState("");

  const [filterCountry, setFilterCountry] = useState("");
  const [filterBudgetLine, setFilterBudgetLine] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFiscalYear, setFilterFiscalYear] = useState("2026");
  const [filterSiteGroups, setFilterSiteGroups] = useState<string[]>([]);
  const [filterBudgetType, setFilterBudgetType] = useState("");
  const [filterBudgetClassification, setFilterBudgetClassification] = useState("");

  // Column visibility
  const [visibleMonths, setVisibleMonths] = useState<Record<string, boolean>>(
    Object.fromEntries([...MONTH_KEYS.map(k => [k, true]), ["total", true]])
  );
  const [visibleExtraColumns, setVisibleExtraColumns] = useState({ budgetType: true, budgetClassification: true });

  const monthColumnDefs = [
    ...MONTH_KEYS.map((k, i) => ({ key: k, label: MONTH_HEADERS[i] })),
    { key: "total", label: "Total" },
  ];

  const extraColumnDefs = [
    { key: "budgetType", label: "Budget Type" },
    { key: "budgetClassification", label: "Budget Classification" },
  ];

  const hasAppliedFilters = filterCountry || filterSite || filterBudgetLine || filterStatus || filterFiscalYear || filterSiteGroups.length > 0 || filterBudgetType || filterBudgetClassification;

  const applyFilters = () => {
    setFilterCountry(pendingCountry);
    setFilterBudgetLine(pendingBudgetLine);
    setFilterSite(pendingSite);
    setFilterStatus(pendingStatus);
    setFilterFiscalYear(pendingFiscalYear);
    setFilterSiteGroups(pendingSiteGroups);
    setFilterBudgetType(pendingBudgetType);
    setFilterBudgetClassification(pendingBudgetClassification);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPendingCountry(""); setPendingBudgetLine(""); setPendingSite("");
    setPendingStatus(""); setPendingFiscalYear(""); setPendingSiteGroups([]);
    setPendingBudgetType(""); setPendingBudgetClassification("");
    setFilterCountry(""); setFilterBudgetLine(""); setFilterSite("");
    setFilterStatus(""); setFilterFiscalYear(""); setFilterSiteGroups([]);
    setFilterBudgetType(""); setFilterBudgetClassification("");
  };

  const togglePendingSiteGroup = (group: string) => {
    setPendingSiteGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setBdLoading(true);
      const [bdRes, cRes, iRes] = await Promise.all([
        supabase.from("monthly_breakdown").select("project_id, apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar"),
        supabase.from("contracts").select("project_id, amount_lc, status"),
        supabase.from("invoices").select("amount_lc, contract_id"),
      ]);
      if (!bdRes.error) setBreakdowns((bdRes.data || []) as BreakdownRow[]);
      if (!cRes.error) setContracts((cRes.data || []) as ContractRow[]);

      if (!iRes.error && !cRes.error) {
        const cFull = await supabase.from("contracts").select("id, project_id");
        if (!cFull.error) {
          const cpMap = new Map<string, string>();
          (cFull.data || []).forEach((c: any) => cpMap.set(c.id, c.project_id));
          const mapped = (iRes.data || []).map((inv: any) => ({
            amount_lc: inv.amount_lc || 0,
            project_id: cpMap.get(inv.contract_id) || "",
          }));
          setInvoicesWithProject(mapped);
        }
      }
      setBdLoading(false);
    };
    fetchAll();
  }, []);

  // Project number map (sorted by created_at asc)
  const projectNumberMap = useMemo(() => {
    const sorted = [...projects].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const m = new Map<string, number>();
    sorted.forEach((p, i) => m.set(p.id, 13536 + i));
    return m;
  }, [projects]);

  const breakdownMap = useMemo(() => {
    const m = new Map<string, BreakdownRow>();
    breakdowns.forEach(b => m.set(b.project_id, b));
    return m;
  }, [breakdowns]);

  const filterOptions = useMemo(() => {
    const sites = [...new Set(projects.map(p => p.site).filter(Boolean))].sort() as string[];
    const countries = [...new Set(sites.map(s => siteToCountry[s] || "Unknown"))].sort();
    const budgetLines = [...new Set(projects.map(p => p.budget_line).filter(Boolean))].sort();
    const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))].sort();
    const fiscalYears = [...new Set(projects.map(p => p.fiscal_year).filter(Boolean))].sort();
    const budgetTypes = [...new Set(projects.map(p => p.budget_type).filter(Boolean))].sort() as string[];
    const budgetClassifications = [...new Set(projects.map(p => p.budget_classification).filter(Boolean))].sort() as string[];
    return { sites, countries, budgetLines, statuses, fiscalYears, budgetTypes, budgetClassifications };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const country = p.site ? siteToCountry[p.site] : null;
      const matchesCountry = !filterCountry || country === filterCountry;
      const matchesBudgetLine = !filterBudgetLine || p.budget_line === filterBudgetLine;
      const matchesSite = !filterSite || p.site === filterSite;
      const matchesStatus = !filterStatus || p.status === filterStatus;
      const matchesFiscalYear = !filterFiscalYear || p.fiscal_year === filterFiscalYear;
      const matchesSiteGroup = filterSiteGroups.length === 0 || (country && filterSiteGroups.includes(COUNTRY_TO_SITE_GROUP[country] || ""));
      const matchesBudgetType = !filterBudgetType || p.budget_type === filterBudgetType;
      const matchesBudgetClassification = !filterBudgetClassification || p.budget_classification === filterBudgetClassification;
      return matchesSearch && matchesCountry && matchesBudgetLine && matchesSite && matchesStatus && matchesFiscalYear && matchesSiteGroup && matchesBudgetType && matchesBudgetClassification;
    });
  }, [projects, searchQuery, filterCountry, filterBudgetLine, filterSite, filterStatus, filterFiscalYear, filterSiteGroups, filterBudgetType, filterBudgetClassification]);

  const grandTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    MONTH_KEYS.forEach(k => { totals[k] = 0; });
    totals.total = 0;
    filteredProjects.forEach(p => {
      const bd = breakdownMap.get(p.id);
      if (!bd) return;
      let rowTotal = 0;
      MONTH_KEYS.forEach(k => {
        const v = (bd as any)[k] as number | null;
        if (v) { totals[k] += v; rowTotal += v; }
      });
      totals.total += rowTotal;
    });
    return totals;
  }, [filteredProjects, breakdownMap]);

  const summaryTotals = useMemo(() => {
    const filteredIds = new Set(filteredProjects.map(p => p.id));
    const grandBudget = filteredProjects.reduce((s, p) => s + (p.total_budget || 0), 0);
    const planned3M = MONTH_KEYS.slice(0, 3).reduce((s, k) => s + (grandTotals[k] || 0), 0);
    const grandContracted = contracts.filter(c => filteredIds.has(c.project_id)).reduce((s, c) => s + (c.amount_lc || 0), 0);
    const grandInvoiced = invoicesWithProject.filter(i => filteredIds.has(i.project_id)).reduce((s, i) => s + (i.amount_lc || 0), 0);
    const grandOngoing = contracts.filter(c => filteredIds.has(c.project_id) && c.status === 'Ongoing').reduce((s, c) => s + (c.amount_lc || 0), 0);
    const grandSavings = filteredProjects.reduce((s, p) => s + ((p as any).savings || 0), 0);
    const grandPostponed = filteredProjects.reduce((s, p) => s + ((p as any).postponed || 0), 0);
    return { grandBudget, planned3M, grandContracted, grandInvoiced, grandOngoing, grandSavings, grandPostponed };
  }, [filteredProjects, grandTotals, contracts, invoicesWithProject]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  const calculateSubtotals = (projs: typeof filteredProjects) => {
    const st: Record<string, number> = {};
    MONTH_KEYS.forEach(mk => { st[mk] = 0; });
    st.total = 0;
    projs.forEach(p => {
      const bd = breakdownMap.get(p.id);
      if (!bd) return;
      let rowTotal = 0;
      MONTH_KEYS.forEach(mk => {
        const v = (bd as any)[mk] as number | null;
        if (v) { st[mk] += v; rowTotal += v; }
      });
      st.total += rowTotal;
    });
    return st;
  };

  const groupedProjects = useMemo(() => {
    const groups: Record<string, typeof filteredProjects> = {};
    filteredProjects.forEach(p => {
      const country = p.site ? siteToCountry[p.site] : null;
      const sg = country ? (COUNTRY_TO_SITE_GROUP[country] || "Other") : "Other";
      if (!groups[sg]) groups[sg] = [];
      groups[sg].push(p);
    });
    const order = ["WE", "PL", "HU", "Other"];
    return order.filter(k => groups[k]?.length).map(k => {
      const gProjects = groups[k];
      const subtotals = calculateSubtotals(gProjects);
      const icProjects = gProjects.filter(p => p.budget_type === 'IC');
      const adHocProjects = gProjects.filter(p => p.budget_type !== 'IC');
      const icSubtotals = calculateSubtotals(icProjects);
      const adHocSubtotals = calculateSubtotals(adHocProjects);
      return { group: k, label: SITE_GROUP_DISPLAY[k] || k, projects: gProjects, subtotals, icProjects, icSubtotals, adHocProjects, adHocSubtotals };
    });
  }, [filteredProjects, breakdownMap]);

  const loading = projectsLoading || bdLoading;

  // XLS Export
  const handleExportXls = () => {
    const rows: Record<string, any>[] = [];

    // Grouped project rows with headers and subtotals
    groupedProjects.forEach(group => {
      // Group header row
      rows.push({ "#": "", "Project Name": `${group.label} (${group.projects.length} project${group.projects.length !== 1 ? "s" : ""})` });

      const subsections = [
        { label: "IC", projects: group.icProjects, subtotals: group.icSubtotals },
        { label: "Ad Hoc", projects: group.adHocProjects, subtotals: group.adHocSubtotals },
      ];

      subsections.forEach(sub => {
        if (sub.projects.length === 0) return;
        // Subsection header
        rows.push({ "#": "", "Project Name": sub.label });

        sub.projects.forEach(p => {
          const bd = breakdownMap.get(p.id);
          let rowTotal = 0;
          const country = p.site ? siteToCountry[p.site] || "" : "";
          const site = p.site || "";
          const row: Record<string, any> = {
            "#": projectNumberMap.get(p.id) ?? "",
            "Country": country,
            "Site": site,
            "Project Name": p.name,
          };
          if (visibleExtraColumns.budgetType) row["Budget Type"] = p.budget_type || "";
          if (visibleExtraColumns.budgetClassification) row["Budget Classification"] = p.budget_classification || "";
          MONTH_KEYS.forEach((k, i) => {
            if (visibleMonths[k]) {
              const v = bd ? (bd as any)[k] || 0 : 0;
              row[MONTH_HEADERS[i]] = v;
              rowTotal += v;
            } else {
              if (bd) rowTotal += (bd as any)[k] || 0;
            }
          });
          if (visibleMonths.total) row["Total"] = rowTotal;
          rows.push(row);
        });

        // Subsection subtotal
        const subRow: Record<string, any> = { "#": "", "Project Name": `Subtotal ${sub.label} — ${group.label}` };
        MONTH_KEYS.forEach((k, i) => { if (visibleMonths[k]) subRow[MONTH_HEADERS[i]] = sub.subtotals[k] || 0; });
        if (visibleMonths.total) subRow["Total"] = sub.subtotals.total || 0;
        rows.push(subRow);
      });

      // Group total row
      const totalRow: Record<string, any> = { "#": "", "Project Name": `Total — ${group.label}` };
      MONTH_KEYS.forEach((k, i) => { if (visibleMonths[k]) totalRow[MONTH_HEADERS[i]] = group.subtotals[k] || 0; });
      if (visibleMonths.total) totalRow["Total"] = group.subtotals.total || 0;
      rows.push(totalRow);
    });

    // Grand Total row
    const gtRow: Record<string, any> = { "#": "", "Project Name": "Grand Total" };
    MONTH_KEYS.forEach((k, i) => { if (visibleMonths[k]) gtRow[MONTH_HEADERS[i]] = grandTotals[k] || 0; });
    if (visibleMonths.total) gtRow["Total"] = grandTotals.total || 0;
    rows.push(gtRow);

    // Summary rows (order: Budget, Contracted, Invoiced, Ongoing, Planned 3M, Savings, Postponed)
    const summaryRows: [string, number][] = [
      ["Budget", summaryTotals.grandBudget],
      ["Contracted", summaryTotals.grandContracted],
      ["Invoiced", summaryTotals.grandInvoiced],
      ["Ongoing", summaryTotals.grandOngoing],
      ["Planned 3M", summaryTotals.planned3M],
      ["Savings", summaryTotals.grandSavings],
      ["Postponed", summaryTotals.grandPostponed],
    ];
    summaryRows.forEach(([label, value]) => {
      const r: Record<string, any> = { "#": "", "Project Name": label };
      if (visibleMonths.total) r["Total"] = value || 0;
      rows.push(r);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Breakdown");
    XLSX.writeFile(wb, "monthly_breakdown_report.xlsx");
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      <div className={embedded ? "p-4" : "p-6"}>
        {!embedded && <h1 className="text-3xl font-bold mb-6">Monthly Breakdown</h1>}

        {/* Search */}
        <div className="flex items-center gap-4 mb-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-10" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>

        {/* Filters */}
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
                      <SelectItem value="Active">Active</SelectItem>
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
                  {filterCountry && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterCountry}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterCountry(""); setPendingCountry(""); }} /></Badge>}
                  {filterSite && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterSite}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterSite(""); setPendingSite(""); }} /></Badge>}
                  {filterBudgetLine && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterBudgetLine}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetLine(""); setPendingBudgetLine(""); }} /></Badge>}
                  {filterStatus && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterStatus}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterStatus(""); setPendingStatus(""); }} /></Badge>}
                  {filterFiscalYear && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">FY {filterFiscalYear}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterFiscalYear(""); setPendingFiscalYear(""); }} /></Badge>}
                  {filterBudgetType && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">Type: {filterBudgetType}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetType(""); setPendingBudgetType(""); }} /></Badge>}
                  {filterBudgetClassification && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterBudgetClassification}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetClassification(""); setPendingBudgetClassification(""); }} /></Badge>}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>
                </div>
              )}
            </div>
        </div>

        {/* Toolbar: Columns + Export */}
        <div className="flex items-center justify-end gap-2 mb-3 pr-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4 mr-2" />Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2">
                {extraColumnDefs.map(col => (
                  <div key={col.key} className="flex items-center justify-between">
                    <span className="text-sm">{col.label}</span>
                    <Switch
                      checked={visibleExtraColumns[col.key as keyof typeof visibleExtraColumns]}
                      onCheckedChange={(checked) =>
                        setVisibleExtraColumns(prev => ({ ...prev, [col.key]: checked }))
                      }
                    />
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2" />
                {monthColumnDefs.map(col => (
                  <div key={col.key} className="flex items-center justify-between">
                    <span className="text-sm">{col.label}</span>
                    <Switch
                      checked={visibleMonths[col.key]}
                      onCheckedChange={(checked) =>
                        setVisibleMonths(prev => ({ ...prev, [col.key]: checked }))
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

        {/* Table */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="h-10">
                      <TableHead className="h-10 py-0 px-3 sticky left-0 bg-background z-10">#</TableHead>
                      <TableHead className="h-10 py-0 px-3">Country</TableHead>
                      <TableHead className="h-10 py-0 px-3">Site</TableHead>
                      <TableHead className="h-10 py-0 px-3 sticky left-[60px] bg-background z-10 min-w-[200px]">Project Name</TableHead>
                      {visibleExtraColumns.budgetType && <TableHead className="h-10 py-0 px-3">Budget Type</TableHead>}
                      {visibleExtraColumns.budgetClassification && <TableHead className="h-10 py-0 px-3">Budget Classification</TableHead>}
                      {MONTH_KEYS.map((k, i) => visibleMonths[k] && <TableHead key={k} className="h-10 py-0 px-3 text-right min-w-[100px]">{MONTH_HEADERS[i]}</TableHead>)}
                      {visibleMonths.total && <TableHead className="h-10 py-0 px-3 text-right min-w-[140px] font-bold bg-muted/30">Total (EUR)</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4 + (visibleExtraColumns.budgetType ? 1 : 0) + (visibleExtraColumns.budgetClassification ? 1 : 0) + MONTH_KEYS.filter(k => visibleMonths[k]).length + (visibleMonths.total ? 1 : 0)} className="text-center text-muted-foreground py-12">No projects found</TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {groupedProjects.map(group => {
                          const isCollapsed = collapsedGroups.has(group.group);
                          const colCount = 4 + (visibleExtraColumns.budgetType ? 1 : 0) + (visibleExtraColumns.budgetClassification ? 1 : 0) + MONTH_KEYS.filter(k => visibleMonths[k]).length + (visibleMonths.total ? 1 : 0);
                          const colsBeforeTotal = colCount - (visibleMonths.total ? 1 : 0);
                          return (
                            <React.Fragment key={`group-${group.group}`}>
                              {/* Group header */}
                              <TableRow className="h-10 bg-muted/40 cursor-pointer" onClick={() => toggleGroup(group.group)}>
                                <TableCell colSpan={colCount} className="py-0 px-3 font-bold text-sm">
                                  <span className="inline-flex items-center gap-1.5">
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed && "-rotate-90")} />
                                    {group.label} ({group.projects.length} project{group.projects.length !== 1 ? "s" : ""})
                                  </span>
                                </TableCell>
                              </TableRow>
                              {/* Subsections: IC and Ad Hoc */}
                              {!isCollapsed && [
                                { label: "IC", projects: group.icProjects, subtotals: group.icSubtotals, headerBg: "bg-blue-50", subtotalBg: "bg-blue-100" },
                                { label: "Ad Hoc", projects: group.adHocProjects, subtotals: group.adHocSubtotals, headerBg: "bg-orange-50", subtotalBg: "bg-orange-50" },
                              ].map(sub => sub.projects.length === 0 ? null : (
                                <React.Fragment key={`sub-${group.group}-${sub.label}`}>
                                  {/* Subsection header */}
                                  <TableRow className={cn("h-10", sub.headerBg)}>
                                    <TableCell colSpan={colCount} className={cn("py-0 px-3 pl-8 text-sm font-semibold text-muted-foreground", sub.headerBg)}>
                                      {sub.label}
                                    </TableCell>
                                  </TableRow>
                                  {/* Subsection project rows */}
                                  {sub.projects.map(p => {
                                    const bd = breakdownMap.get(p.id);
                                    let rowTotal = 0;
                                    if (bd) MONTH_KEYS.forEach(k => { rowTotal += (bd as any)[k] || 0; });
                                    const country = p.site ? siteToCountry[p.site] || "—" : "—";
                                    const site = p.site || "—";
                                    return (
                                      <TableRow key={p.id} className="h-10">
                                        <TableCell className="py-0 px-3 sticky left-0 bg-background z-10">
                                          <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate(`/project/${p.id}`)}>
                                            {projectNumberMap.get(p.id) ?? "—"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="py-0 px-3 text-sm">{country}</TableCell>
                                        <TableCell className="py-0 px-3 text-sm">{site}</TableCell>
                                        <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 font-medium">{p.name}</TableCell>
                                        {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3 text-sm">{p.budget_type || "—"}</TableCell>}
                                        {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3 text-sm">{p.budget_classification || "—"}</TableCell>}
                                        {MONTH_KEYS.map(k => visibleMonths[k] && (
                                          <TableCell key={k} className="py-0 px-3 text-right tabular-nums">{formatAmount(bd ? (bd as any)[k] : null)}</TableCell>
                                        ))}
                                        {visibleMonths.total && <TableCell className="py-0 px-3 text-right font-bold tabular-nums bg-muted/30">{formatAmount(rowTotal || null)}</TableCell>}
                                      </TableRow>
                                    );
                                  })}
                                  {/* Subsection subtotal */}
                                  <TableRow className={cn("h-10", sub.subtotalBg)}>
                                    <TableCell className={cn("py-0 px-3 sticky left-0 z-10", sub.subtotalBg)} />
                                    <TableCell className={cn("py-0 px-3", sub.subtotalBg)} />
                                    <TableCell className={cn("py-0 px-3", sub.subtotalBg)} />
                                    <TableCell className={cn("py-0 px-3 sticky left-[60px] z-10 font-semibold text-sm italic", sub.subtotalBg)} colSpan={1 + (visibleExtraColumns.budgetType ? 1 : 0) + (visibleExtraColumns.budgetClassification ? 1 : 0)}>
                                      Subtotal {sub.label} — {group.label}
                                    </TableCell>
                                    {MONTH_KEYS.map(k => visibleMonths[k] && (
                                      <TableCell key={k} className={cn("py-0 px-3 text-right tabular-nums font-semibold", sub.subtotalBg)}>{formatAmount(sub.subtotals[k] || null)}</TableCell>
                                    ))}
                                    {visibleMonths.total && (
                                      <TableCell className={cn("py-0 px-3 text-right tabular-nums font-semibold", sub.subtotalBg)}>
                                        {formatAmount(sub.subtotals.total || null)}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                </React.Fragment>
                              ))}
                              {/* Group total row */}
                              <TableRow className="h-10 bg-orange-100">
                                <TableCell className="py-0 px-3 sticky left-0 bg-orange-100 z-10" />
                                <TableCell className="py-0 px-3 bg-orange-100" />
                                <TableCell className="py-0 px-3 bg-orange-100" />
                                <TableCell className="py-0 px-3 sticky left-[60px] bg-orange-100 z-10 font-semibold text-sm italic" colSpan={1 + (visibleExtraColumns.budgetType ? 1 : 0) + (visibleExtraColumns.budgetClassification ? 1 : 0)}>
                                  Total — {group.label}
                                </TableCell>
                                {MONTH_KEYS.map(k => visibleMonths[k] && (
                                  <TableCell key={k} className="py-0 px-3 text-right tabular-nums font-semibold bg-orange-100">{formatAmount(group.subtotals[k] || null)}</TableCell>
                                ))}
                                {visibleMonths.total && (
                                  <TableCell className="py-0 px-3 text-right tabular-nums font-semibold bg-orange-100">
                                    {formatAmount(group.subtotals.total || null)}
                                  </TableCell>
                                )}
                              </TableRow>
                              {/* Separator row */}
                              <TableRow className="h-4 border-0">
                                <TableCell colSpan={colCount} className="p-0 border-0" />
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                    {filteredProjects.length > 0 && (
                      <>
                        {/* Grand Total */}
                        <TableRow className="h-10 bg-muted/50 font-bold">
                          <TableCell className="py-0 px-3 sticky left-0 bg-muted/50 z-10" />
                          <TableCell className="py-0 px-3 bg-muted/50" />
                          <TableCell className="py-0 px-3 bg-muted/50" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-muted/50 z-10">
                            Grand Total (EUR)
                          </TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3 bg-muted/50" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3 bg-muted/50" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && (
                            <TableCell key={k} className="py-0 px-3 text-right tabular-nums">{formatAmount(grandTotals[k] || null)}</TableCell>
                          ))}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right tabular-nums bg-muted/30">
                              {summaryTotals.grandBudget > 0 && (
                                <span className={cn("mr-2 text-xs font-normal", grandTotals.total > summaryTotals.grandBudget ? "text-destructive" : "text-muted-foreground")}>
                                  ({Math.round((grandTotals.total / summaryTotals.grandBudget) * 100)}% of budget)
                                </span>
                              )}
                              {formatAmount(grandTotals.total || null)}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Budget */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Budget (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">{formatAmount(summaryTotals.grandBudget || null)}</TableCell>}
                        </TableRow>
                        {/* Contracted */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Contracted (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">
                              <span className="text-muted-foreground/60 mr-1">({grandTotals.total > 0 ? Math.round((summaryTotals.grandContracted / grandTotals.total) * 100) : 0}% total)</span>
                              {formatAmount(summaryTotals.grandContracted || null)}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Invoiced */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Invoiced (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">
                              <span className="text-muted-foreground/60 mr-1">({grandTotals.total > 0 ? Math.round((summaryTotals.grandInvoiced / grandTotals.total) * 100) : 0}% total)</span>
                              {formatAmount(summaryTotals.grandInvoiced || null)}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Ongoing */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Ongoing (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">
                              <span className="text-muted-foreground/60 mr-1">({grandTotals.total > 0 ? Math.round((summaryTotals.grandOngoing / grandTotals.total) * 100) : 0}% total)</span>
                              {formatAmount(summaryTotals.grandOngoing || null)}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Planned 3M */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Planned 3M (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">
                              <span className="text-muted-foreground/60 mr-1">({grandTotals.total > 0 ? Math.round((summaryTotals.planned3M / grandTotals.total) * 100) : 0}% total)</span>
                              {formatAmount(summaryTotals.planned3M || null)}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Savings */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Savings (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">
                              <span className="text-muted-foreground/60 mr-1">({grandTotals.total > 0 ? Math.round((summaryTotals.grandSavings / grandTotals.total) * 100) : 0}% total)</span>
                              {formatAmount(summaryTotals.grandSavings || null)}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Postponed */}
                        <TableRow className="h-10">
                          <TableCell className="py-0 px-3 sticky left-0 bg-background z-10" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3" />
                          <TableCell className="py-0 px-3 sticky left-[60px] bg-background z-10 text-sm text-muted-foreground">Postponed (EUR)</TableCell>
                          {visibleExtraColumns.budgetType && <TableCell className="py-0 px-3" />}
                          {visibleExtraColumns.budgetClassification && <TableCell className="py-0 px-3" />}
                          {MONTH_KEYS.map(k => visibleMonths[k] && <TableCell key={k} className="py-0 px-3" />)}
                          {visibleMonths.total && (
                            <TableCell className="py-0 px-3 text-right text-sm text-muted-foreground tabular-nums bg-muted/30">
                              <span className="text-muted-foreground/60 mr-1">({grandTotals.total > 0 ? Math.round((summaryTotals.grandPostponed / grandTotals.total) * 100) : 0}% total)</span>
                              {formatAmount(summaryTotals.grandPostponed || null)}
                            </TableCell>
                          )}
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
