import { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

export default function MonthlyBreakdownList({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const [breakdowns, setBreakdowns] = useState<BreakdownRow[]>([]);
  const [bdLoading, setBdLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Pending / applied filter state
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingBudgetLine, setPendingBudgetLine] = useState("");
  const [pendingSite, setPendingSite] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingFiscalYear, setPendingFiscalYear] = useState("");
  const [pendingSiteGroups, setPendingSiteGroups] = useState<string[]>([]);

  const [filterCountry, setFilterCountry] = useState("");
  const [filterBudgetLine, setFilterBudgetLine] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFiscalYear, setFilterFiscalYear] = useState("");
  const [filterSiteGroups, setFilterSiteGroups] = useState<string[]>([]);

  const hasAppliedFilters = filterCountry || filterSite || filterBudgetLine || filterStatus || filterFiscalYear || filterSiteGroups.length > 0;

  const applyFilters = () => {
    setFilterCountry(pendingCountry);
    setFilterBudgetLine(pendingBudgetLine);
    setFilterSite(pendingSite);
    setFilterStatus(pendingStatus);
    setFilterFiscalYear(pendingFiscalYear);
    setFilterSiteGroups(pendingSiteGroups);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPendingCountry(""); setPendingBudgetLine(""); setPendingSite("");
    setPendingStatus(""); setPendingFiscalYear(""); setPendingSiteGroups([]);
    setFilterCountry(""); setFilterBudgetLine(""); setFilterSite("");
    setFilterStatus(""); setFilterFiscalYear(""); setFilterSiteGroups([]);
  };

  const togglePendingSiteGroup = (group: string) => {
    setPendingSiteGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  useEffect(() => {
    const fetch = async () => {
      setBdLoading(true);
      const { data, error } = await supabase.from("monthly_breakdown").select("project_id, apr, may, jun, jul, aug, sep, oct, nov, dec, jan, feb, mar");
      if (!error) setBreakdowns((data || []) as BreakdownRow[]);
      setBdLoading(false);
    };
    fetch();
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
    return { sites, countries, budgetLines, statuses, fiscalYears };
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
      return matchesSearch && matchesCountry && matchesBudgetLine && matchesSite && matchesStatus && matchesFiscalYear && matchesSiteGroup;
    });
  }, [projects, searchQuery, filterCountry, filterBudgetLine, filterSite, filterStatus, filterFiscalYear, filterSiteGroups]);

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

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginated = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const loading = projectsLoading || bdLoading;

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      <div className={embedded ? "" : "p-6"}>
        {!embedded && <h1 className="text-3xl font-bold mb-6">Monthly Breakdown</h1>}

        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-10" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
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
                      {filterOptions.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                  {filterCountry && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterCountry}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterCountry(""); setPendingCountry(""); }} /></Badge>}
                  {filterSite && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterSite}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterSite(""); setPendingSite(""); }} /></Badge>}
                  {filterBudgetLine && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{budgetLineLabels[filterBudgetLine] || filterBudgetLine}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterBudgetLine(""); setPendingBudgetLine(""); }} /></Badge>}
                  {filterStatus && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">{filterStatus}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterStatus(""); setPendingStatus(""); }} /></Badge>}
                  {filterFiscalYear && <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">FY {filterFiscalYear}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterFiscalYear(""); setPendingFiscalYear(""); }} /></Badge>}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>
                </div>
              )}
            </div>
          )}
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
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10">#</TableHead>
                      <TableHead className="sticky left-[60px] bg-background z-10 min-w-[200px]">Project Name</TableHead>
                      {MONTH_HEADERS.map(h => <TableHead key={h} className="text-right min-w-[100px]">{h}</TableHead>)}
                      <TableHead className="text-right min-w-[110px] font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center text-muted-foreground py-12">No projects found</TableCell>
                      </TableRow>
                    ) : (
                      paginated.map(p => {
                        const bd = breakdownMap.get(p.id);
                        let rowTotal = 0;
                        if (bd) MONTH_KEYS.forEach(k => { rowTotal += (bd as any)[k] || 0; });
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="sticky left-0 bg-background z-10">
                              <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate(`/project/${p.id}`)}>
                                {projectNumberMap.get(p.id) ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="sticky left-[60px] bg-background z-10 font-medium">{p.name}</TableCell>
                            {MONTH_KEYS.map(k => (
                              <TableCell key={k} className="text-right tabular-nums">{formatAmount(bd ? (bd as any)[k] : null)}</TableCell>
                            ))}
                            <TableCell className="text-right font-bold tabular-nums">{formatAmount(rowTotal || null)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {/* Grand Total */}
                    {paginated.length > 0 && (
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell className="sticky left-0 bg-muted/50 z-10" />
                        <TableCell className="sticky left-[60px] bg-muted/50 z-10">Grand Total</TableCell>
                        {MONTH_KEYS.map(k => (
                          <TableCell key={k} className="text-right tabular-nums">{formatAmount(grandTotals[k] || null)}</TableCell>
                        ))}
                        <TableCell className="text-right tabular-nums">{formatAmount(grandTotals.total || null)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length}
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
    </div>
  );
}
