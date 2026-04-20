import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Download, Columns3, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Check, ChevronsUpDown, CalendarIcon, X, ChevronDown, Info, FolderOpen, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { useProjectTypes } from "@/hooks/useProjectTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useProjects, CreateProjectInput } from "@/hooks/useProjects";
import { SITE_GROUP_OPTIONS, COUNTRY_TO_SITE_GROUP } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimelineItem {
  id: string;
  project_id: string;
  type: string;
  status: string;
  due_date: string | null;
  name: string;
  sort_order: number;
}

interface CashflowData {
  timeline_item_id: string;
  project_id: string;
  contracted: number;
}

const MOCK_IMPORTED_PROJECTS = [
  { name: "LED Lighting Retrofit", site: "Bedzin", budget_line: "ESG", total_budget: 100000, owner: "Anna Kowalska", budget_type: "IC", budget_classification: "Mandatory" },
  { name: "Main Switchgear Replacement", site: "Bedzin", budget_line: "ELECTRICAL SYSTEMS", total_budget: 100000, owner: "Piotr Nowak", budget_type: "IC", budget_classification: "Mandatory" },
  { name: "Roof Solar Panel Installation", site: "Marseille", budget_line: "Sustainability", total_budget: 890000, owner: "Claire Dubois", budget_type: "IC", budget_classification: "Mandatory" },
  { name: "Automated Gate Access System", site: "Lyon", budget_line: "Building upgrading works", total_budget: 350000, owner: "Marc Lefevre", budget_type: "Ad Hoc", budget_classification: "Speculative" },
  { name: "Cross-Dock Area Expansion", site: "Tilburg", budget_line: "Asset Enhancement Initiatives", total_budget: 1250000, owner: "Jeroen van Dijk", budget_type: "IC", budget_classification: "Mandatory" },
  { name: "EV Charging Station Network", site: "Schiphol", budget_line: "Sustainability", total_budget: 680000, owner: "Sophie de Vries", budget_type: "IC", budget_classification: "Mandatory" },
];

export default function Projects() {
  const navigate = useNavigate();
  const { projects: dbProjects, loading, createProject, fetchProjects } = useProjects();
  const [hasImported, setHasImported] = useState(false);
  const projects = dbProjects;
  const [showFilters, setShowFilters] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showImportXLS, setShowImportXLS] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [importFileAttached, setImportFileAttached] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const { projectTypes } = useProjectTypes();
  const [visibleColumns, setVisibleColumns] = useState({
    no: true,
    title: true,
    property: true,
    owner: true,
    milestones: true,
    progress: true,
    fiscalYear: true,
    budget: true,
  });
  const columnDefs: { key: keyof typeof visibleColumns; label: string }[] = [
    { key: "no", label: "No." },
    { key: "title", label: "Title" },
    { key: "property", label: "Property" },
    { key: "owner", label: "Owner" },
    { key: "milestones", label: "Milestones" },
    { key: "progress", label: "Progress" },
    { key: "fiscalYear", label: "Fiscal year" },
    { key: "budget", label: "Budget/Work category" },
  ];
  const activeProjectTypes = useMemo(() => projectTypes.filter(pt => pt.status === "active"), [projectTypes]);
  const [formData, setFormData] = useState({
    name: "",
    workDescription: "",
    site: "",
    building: "",
    tenant: "",
    budgetLine: "",
    fiscalYear: "2025/2026",
    budget: "",
    currency: "EUR",
    startDate: new Date(),
    endDate: null as Date | null,
    budgetType: "",
    budgetClassification: "",
  });
  const [budgetLineOpen, setBudgetLineOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const budgetLineLabels: Record<string, string> = {
    common_areas: "Common Areas",
    tenant_fitout: "Tenant Fit-Out",
    building_upgrades: "Building Upgrades",
    sustainability: "Sustainability",
    safety_compliance: "Safety & Compliance",
  };

  // Site to country mapping based on sample data
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

  // Pending filter values (before clicking Search)
  const [pendingCountry, setPendingCountry] = useState("");
  const [pendingBudgetLine, setPendingBudgetLine] = useState("");
  const [pendingSite, setPendingSite] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");
  const [pendingFiscalYear, setPendingFiscalYear] = useState("");
  const [pendingTracking, setPendingTracking] = useState("");
  const [pendingSiteGroups, setPendingSiteGroups] = useState<string[]>([]);

  // Applied filter values (after clicking Search)
  const [filterCountry, setFilterCountry] = useState("");
  const [filterBudgetLine, setFilterBudgetLine] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFiscalYear, setFilterFiscalYear] = useState("");
  const [filterTracking, setFilterTracking] = useState("");
  const [filterSiteGroups, setFilterSiteGroups] = useState<string[]>([]);

  const hasAppliedFilters = filterCountry || filterSite || filterBudgetLine || filterStatus || filterFiscalYear || filterTracking || filterSiteGroups.length > 0;

  const applyFilters = () => {
    setFilterCountry(pendingCountry);
    setFilterBudgetLine(pendingBudgetLine);
    setFilterSite(pendingSite);
    setFilterStatus(pendingStatus);
    setFilterFiscalYear(pendingFiscalYear);
    setFilterTracking(pendingTracking);
    setFilterSiteGroups(pendingSiteGroups);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPendingCountry("");
    setPendingBudgetLine("");
    setPendingSite("");
    setPendingStatus("");
    setPendingFiscalYear("");
    setPendingTracking("");
    setPendingSiteGroups([]);
    setFilterCountry("");
    setFilterBudgetLine("");
    setFilterSite("");
    setFilterStatus("");
    setFilterFiscalYear("");
    setFilterTracking("");
    setFilterSiteGroups([]);
  };

  const togglePendingSiteGroup = (group: string) => {
    setPendingSiteGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  // Derive filter options from actual project data
  const filterOptions = useMemo(() => {
    const sites = [...new Set(projects.map(p => p.site).filter(Boolean))].sort() as string[];
    const countries = [...new Set(sites.map(site => siteToCountry[site] || "Unknown"))].sort();
    const budgetLines = [...new Set(projects.map(p => p.budget_line).filter(Boolean))].sort();
    const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))].sort();
    const fiscalYears = [...new Set(projects.map(p => p.fiscal_year).filter(Boolean))].sort();
    return { sites, countries, budgetLines, statuses, fiscalYears };
  }, [projects]);

  // Fetch all timeline items for all projects
  useEffect(() => {
    const fetchTimelineItems = async () => {
      const { data, error } = await supabase
        .from("timeline_items")
        .select("id, project_id, type, status, due_date, name, sort_order");
      if (!error && data) {
        setTimelineItems(data);
      }
    };
    fetchTimelineItems();
  }, [projects]);

  // Fetch cashflow data for all projects
  useEffect(() => {
    const fetchCashflowData = async () => {
      const { data, error } = await supabase
        .from("milestone_cashflow")
        .select("timeline_item_id, contracted");
      if (!error && data && timelineItems.length > 0) {
        // Map cashflow data to include project_id
        const mappedData = data.map(cf => {
          const item = timelineItems.find(ti => ti.id === cf.timeline_item_id);
          return {
            timeline_item_id: cf.timeline_item_id,
            project_id: item?.project_id || '',
            contracted: Number(cf.contracted) || 0
          };
        });
        setCashflowData(mappedData);
      }
    };
    fetchCashflowData();
  }, [timelineItems]);

  const handleProjectClick = (project: { id: string }) => {
    navigate(`/project/${project.id}`);
  };

  const DEFAULT_MILESTONES = [
    "Planning and Concept",
    "Tendering",
    "Formal Approval and Contracting",
    "Logistics and Work Kick-off",
    "Execution and Delivery",
    "Closure and Financial Settlement",
  ];

  const handleFormSubmit = async () => {
    const input: CreateProjectInput = {
      name: formData.name,
      work_description: formData.workDescription || undefined,
      total_budget: formData.budget ? parseFloat(formData.budget) : 0,
      status: "Open",
      start_date: formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : undefined,
      end_date: formData.endDate ? format(formData.endDate, "yyyy-MM-dd") : undefined,
      site: formData.site || undefined,
      building: formData.building || undefined,
      tenant: formData.tenant || undefined,
      budget_line: formData.budgetLine || undefined,
      fiscal_year: formData.fiscalYear || undefined,
      budget_type: formData.budgetType || undefined,
      budget_classification: formData.budgetClassification || undefined,
      currency: formData.currency || "PLN",
    };
    const result = await createProject(input);
    if (result) {
      // Create default milestones for the new project
      const milestonesToInsert = DEFAULT_MILESTONES.map((name, index) => ({
        project_id: result.id,
        name,
        type: "milestone",
        status: "not-started",
        sort_order: index,
        include_in_cashflow: true,
      }));

      await supabase.from("timeline_items").insert(milestonesToInsert);

      setShowNewProject(false);
      setFormData({
        name: "",
        workDescription: "",
        site: "",
        building: "",
        tenant: "",
        budgetLine: "",
        fiscalYear: "2025/2026",
        budget: "",
        currency: "EUR",
        startDate: new Date(),
        endDate: null,
        budgetType: "",
        budgetClassification: "",
      });
      // Navigate to newly created project
      navigate(`/project/${result.id}`);
    }
  };

  // Pre-calculate tracking status for all projects
  const projectTrackingStatus = useMemo(() => {
    const statusMap: Record<string, boolean> = {};
    projects.forEach(project => {
      const projectItems = timelineItems.filter(item => item.project_id === project.id);
      const overdueItems = projectItems.filter(item => {
        if (!item.due_date) return false;
        if (item.status === "done") return false;
        return new Date(item.due_date) < new Date();
      });
      statusMap[project.id] = overdueItems.length === 0;
    });
    return statusMap;
  }, [projects, timelineItems]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase());
    const projectCountry = project.site ? siteToCountry[project.site] : null;
    const matchesCountry = !filterCountry || projectCountry === filterCountry;
    const matchesBudgetLine = !filterBudgetLine || project.budget_line === filterBudgetLine;
    const matchesSite = !filterSite || project.site === filterSite;
    const matchesStatusFilter = !filterStatus || project.status === filterStatus;
    const matchesFiscalYear = !filterFiscalYear || project.fiscal_year === filterFiscalYear;
    const isOnTrack = projectTrackingStatus[project.id] ?? true;
    const matchesTracking = !filterTracking || 
      (filterTracking === "on-track" && isOnTrack) || 
      (filterTracking === "off-track" && !isOnTrack);
    const matchesSiteGroup = filterSiteGroups.length === 0 || (projectCountry && filterSiteGroups.includes(COUNTRY_TO_SITE_GROUP[projectCountry] || ""));
    return matchesSearch && matchesCountry && matchesBudgetLine && matchesSite && matchesStatusFilter && matchesFiscalYear && matchesTracking && matchesSiteGroup;
  });

  // Calculate progress for each project from real timeline data
  const getProjectProgress = (projectId: string) => {
    const projectItems = timelineItems.filter(item => item.project_id === projectId);
    const milestones = projectItems.filter(item => item.type === "milestone");
    const achievedMilestones = milestones.filter(m => m.status === "done");
    const milestonesAchieved = achievedMilestones.length;
    
    // Find the last achieved milestone (highest sort_order among done milestones)
    const lastAchievedMilestone = achievedMilestones.length > 0
      ? achievedMilestones.reduce((prev, current) => 
          (current.sort_order > prev.sort_order) ? current : prev
        )
      : null;
    
    const itemsDone = projectItems.filter(item => item.status === "done").length;
    
    // Check for overdue items (same logic as project details)
    const overdueItems = projectItems.filter(item => {
      if (!item.due_date) return false;
      if (item.status === "done") return false;
      return new Date(item.due_date) < new Date();
    });
    
    return {
      milestonesAchieved,
      totalMilestones: milestones.length,
      lastAchieved: lastAchievedMilestone?.name || "-",
      itemsDone,
      totalItems: projectItems.length,
      onTrack: overdueItems.length === 0,
    };
  };

  // Get total contracted amount for a project from cashflow data
  const getProjectSpent = (projectId: string) => {
    return cashflowData
      .filter(cf => cf.project_id === projectId)
      .reduce((sum, cf) => sum + cf.contracted, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-primary hover:text-primary" onClick={() => setShowImportXLS(true)}>
              Import from XLS
            </Button>
            <Button onClick={() => setShowNewProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add project
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mb-2"
          >
            Filters
            <ChevronLeft className={cn("h-4 w-4 ml-2 transition-transform", !showFilters && "-rotate-90")} />
          </Button>

          {showFilters && (
            <div className="p-4 border border-border rounded-lg bg-card space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Property group</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm font-normal">
                        {pendingSiteGroups.length === 0 ? "All groups" : pendingSiteGroups.join(", ")}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2" align="start">
                      {SITE_GROUP_OPTIONS.map(opt => (
                        <div
                          key={opt.value}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-sm"
                          onClick={() => togglePendingSiteGroup(opt.value)}
                        >
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
                  <Select value={pendingCountry || "all"} onValueChange={(val) => setPendingCountry(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All countries</SelectItem>
                      {filterOptions.countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Property</Label>
                  <Select value={pendingSite || "all"} onValueChange={(val) => setPendingSite(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All properties</SelectItem>
                      {filterOptions.sites.map((site) => (
                        <SelectItem key={site} value={site}>{site}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Work category</Label>
                  <Select value={pendingBudgetLine || "all"} onValueChange={(val) => setPendingBudgetLine(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {filterOptions.budgetLines.map((bl) => (
                        <SelectItem key={bl} value={bl}>{bl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                  <Select value={pendingStatus || "all"} onValueChange={(val) => setPendingStatus(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {filterOptions.statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Fiscal year</Label>
                  <Select value={pendingFiscalYear || "all"} onValueChange={(val) => setPendingFiscalYear(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {filterOptions.fiscalYears.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-2 block">Tracking</Label>
                  <Select value={pendingTracking || "all"} onValueChange={(val) => setPendingTracking(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="on-track">On track</SelectItem>
                      <SelectItem value="off-track">Off track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="shrink-0" onClick={applyFilters}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Filter chips - only show when filters are applied */}
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
                  {filterTracking && (
                    <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                      {filterTracking === "on-track" ? "On track" : "Off track"}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => { setFilterTracking(""); setPendingTracking(""); }} />
                    </Badge>
                  )}
                  <button
                    className="text-sm text-primary hover:underline font-medium"
                    onClick={clearFilters}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        {dbProjects.length === 0 && !hasImported ? (
          <div className="border border-border rounded-lg bg-card flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Import projects from XLS or add your first project to get started.
            </p>
          </div>
        ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {/* Pagination and actions */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {(() => {
              const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
              const startRow = (currentPage - 1) * itemsPerPage + 1;
              const endRow = Math.min(currentPage * itemsPerPage, filteredProjects.length);
              
              return (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button 
                      key={page}
                      variant="outline" 
                      size="sm" 
                      className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">
                    {filteredProjects.length > 0 ? `Rows ${startRow} to ${endRow} out of ${filteredProjects.length}` : 'No results'}
                  </span>
                </div>
              );
            })()}
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem>PDF</DropdownMenuItem>
                  <DropdownMenuItem>CSV</DropdownMenuItem>
                  <DropdownMenuItem>XLS</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Columns3 className="h-4 w-4 mr-2" />
                    Columns
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
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 text-sm font-medium w-16">No.</th>
                <th className="text-left py-2 px-4 text-sm font-medium w-44">Title</th>
                <th className="text-left py-2 px-4 text-sm font-medium w-36">Property</th>
                <th className="text-left py-2 px-4 text-sm font-medium w-36">Owner</th>
                <th className="text-left py-2 px-4 text-sm font-medium w-52">Milestones</th>
                <th className="text-left py-2 px-4 text-sm font-medium w-44">Progress</th>
                <th className="text-left py-2 px-4 text-sm font-medium w-24">Fiscal year</th>
                <th className="text-right py-2 px-4 text-sm font-medium w-48">Budget/Work category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-2 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-6 w-40" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-6 w-28" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-2 px-4"><Skeleton className="h-6 w-32" /></td>
                  </tr>
                ))
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No projects found. Click "Add project" to create one.
                  </td>
                </tr>
              ) : (
                filteredProjects
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((project, index) => {
                  const progress = getProjectProgress(project.id);
                  const progressPercent = progress.totalItems > 0 
                    ? Math.round((progress.itemsDone / progress.totalItems) * 100) 
                    : 0;
                  const projectSpent = getProjectSpent(project.id);
                  const budgetUsedPercent = project.total_budget && project.total_budget > 0 
                    ? Math.round((projectSpent / project.total_budget) * 100)
                    : 0;
                  
                  const getStatusBadgeClass = (status: string) => {
                    switch (status) {
                      case "Open":
                      case "In Progress":
                        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
                      case "Completed":
                        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
                      case "Closed":
                        return "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600";
                      case "Cancelled":
                        return "bg-slate-200 text-slate-700 border-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500";
                      default:
                        return "bg-muted text-muted-foreground border-border";
                    }
                  };
                  
                  const globalIndex = (currentPage - 1) * itemsPerPage + index;
                  
                  return (
                    <tr
                      key={project.id}
                      className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => handleProjectClick(project)}
                    >
                      <td className="py-2 px-4 text-sm text-primary font-medium">
                        {13536 + globalIndex}
                      </td>
                      <td className="py-2 px-4 text-sm text-primary font-medium">{project.name}</td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">
                        {project.site || "-"}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            <img 
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
                              alt="Anna Snow" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm text-foreground">Anna Snow</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-muted-foreground">◇</span>
                          <span>{progress.totalMilestones > 0 ? `${progress.milestonesAchieved}/${progress.totalMilestones}` : "-"}</span>
                          {progress.lastAchieved && progress.lastAchieved !== "-" && (
                            <span className="text-green-600 ml-1">✓ {progress.lastAchieved}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {progress.itemsDone}/{progress.totalItems} done
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    progressPercent === 0 ? "bg-muted-foreground/30" : "bg-blue-500"
                                  )}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{progressPercent}%</span>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs font-medium cursor-pointer w-fit",
                                    progress.onTrack 
                                      ? "bg-success/10 text-success border-success" 
                                      : "bg-destructive text-destructive-foreground border-destructive"
                                  )}
                                >
                                  {progress.onTrack ? "on track" : "off track"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="bottom" 
                                className={cn(
                                  "p-3 max-w-xs",
                                  progress.onTrack 
                                    ? "bg-success/10 border border-success/20" 
                                    : "bg-destructive/10 border border-destructive/20"
                                )}
                              >
                                {progress.onTrack ? (
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium text-success">On Track</p>
                                      <p className="text-sm text-success">No due dates have been missed</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium text-destructive">Off Track</p>
                                      <p className="text-sm text-destructive">Some tasks or milestones have missed their due dates</p>
                                    </div>
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">
                        {project.fiscal_year || "2025"}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {project.total_budget && project.total_budget > 0 ? (
                          <div className="space-y-0.5">
                            <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800">
                              {project.budget_line || "Unassigned"}
                            </Badge>
                            <div className="text-sm font-medium">
                              {project.currency || "PLN"} {project.total_budget.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              used: {project.currency || "PLN"} {projectSpent.toLocaleString('de-DE', { minimumFractionDigits: 2 })} 
                              <span className={cn(
                                "ml-1 font-medium",
                                budgetUsedPercent > 100 ? "text-red-500" : ""
                              )}>
                                ({budgetUsedPercent}%)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No budget</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">
                Title<span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Type the name of your new project"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="workDescription">Work description (optional)</Label>
              <textarea
                id="workDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the work to be done"
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value.slice(0, 500) })}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="site">
                Property<span className="text-destructive">*</span>
              </Label>
              <Select value={formData.site} onValueChange={(val) => setFormData({ ...formData, site: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose property" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.sites.map((site) => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between px-0 font-normal text-primary"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced
              <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
            </Button>

            {showAdvanced && (
              <>
                <div>
                  <Label htmlFor="building">Building (optional)</Label>
                  <Select value={formData.building} onValueChange={(val) => setFormData({ ...formData, building: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building-a">Building A - Main Office</SelectItem>
                      <SelectItem value="building-b">Building B - Warehouse</SelectItem>
                      <SelectItem value="building-c">Building C - Research Center</SelectItem>
                      <SelectItem value="building-d">Building D - Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tenant">Tenant (optional)</Label>
                  <Select value={formData.tenant} onValueChange={(val) => setFormData({ ...formData, tenant: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant-alpha">Alpha Corp</SelectItem>
                      <SelectItem value="tenant-beta">Beta Industries</SelectItem>
                      <SelectItem value="tenant-gamma">Gamma Solutions</SelectItem>
                      <SelectItem value="tenant-delta">Delta Partners</SelectItem>
                      <SelectItem value="tenant-epsilon">Epsilon Ltd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project start date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => {
                        setFormData({ ...formData, startDate: date || new Date() });
                        setStartDateOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Project end date</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => {
                        setFormData({ ...formData, endDate: date || null });
                        setEndDateOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetLine">Work category</Label>
                <Select value={formData.budgetLine} onValueChange={(val) => setFormData({ ...formData, budgetLine: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work category" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProjectTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.name}>{pt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fiscalYear">Fiscal year</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {formData.fiscalYear || "Select year"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <div className="max-h-[200px] overflow-y-auto">
                      {["2025/2026", "2026/2027", "2027/2028"].map((year) => (
                        <button
                          key={year}
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            formData.fiscalYear === year && "bg-primary/10 font-medium"
                          )}
                          onClick={() => setFormData({ ...formData, fiscalYear: year })}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget" className="flex items-center gap-1.5">Budget (Estimated spend)</Label>
                <Input
                  id="budget"
                  type="text"
                  inputMode="decimal"
                  placeholder="Type the budget"
                  value={formData.budget ? Number(formData.budget).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    setFormData({ ...formData, budget: raw });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="currency" className="flex items-center gap-1.5">
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
                <Select value={formData.currency} onValueChange={(val) => setFormData({ ...formData, currency: val })}>
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
              <Label>Budget type <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={formData.budgetType}
                onValueChange={(val) => setFormData({ ...formData, budgetType: val })}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IC" id="budget-type-ic" />
                  <Label htmlFor="budget-type-ic" className="font-normal cursor-pointer">IC</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ad Hoc" id="budget-type-adhoc" />
                  <Label htmlFor="budget-type-adhoc" className="font-normal cursor-pointer">Ad Hoc</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Budget classification <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={formData.budgetClassification}
                onValueChange={(val) => setFormData({ ...formData, budgetClassification: val })}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Mandatory" id="budget-class-mandatory" />
                  <Label htmlFor="budget-class-mandatory" className="font-normal cursor-pointer">Mandatory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Speculative" id="budget-class-speculative" />
                  <Label htmlFor="budget-class-speculative" className="font-normal cursor-pointer">Speculative</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={!formData.name || !formData.site || !formData.budgetType || !formData.budgetClassification}>
              Add project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportXLS} onOpenChange={(open) => { setShowImportXLS(open); if (!open) setImportFileAttached(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import from XLS</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground shrink-0">1</div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Download Excel template</p>
                <Button size="sm" onClick={() => { setShowImportXLS(false); setShowExcelPreview(true); }}>Download</Button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground shrink-0">2</div>
              <p className="text-sm font-medium pt-0.5">Fill in the template on your computer</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground shrink-0">3</div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Choose an Excel file on your computer and upload it below</p>
                {importFileAttached ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">projects-template.xlsx</p>
                      <p className="text-xs text-muted-foreground">28 KB</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportFileAttached(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-4 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground">Drag &amp; drop files here or</span>
                    <span className="text-primary font-medium">Browse files</span>
                    <input type="file" accept=".xls,.xlsx" className="hidden" onChange={() => setImportFileAttached(true)} />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button variant="outline" onClick={() => { setShowImportXLS(false); setImportFileAttached(false); }}>Cancel</Button>
            <Button
              disabled={!importFileAttached}
              onClick={async () => {
                const rows = MOCK_IMPORTED_PROJECTS.map((p) => ({
                  name: p.name,
                  description: `Owner: Anna Snow`,
                  status: "Open",
                  site: p.site,
                  budget_line: p.budget_line,
                  total_budget: p.total_budget,
                  currency: "EUR",
                  fiscal_year: "2025/2026",
                  budget_type: p.budget_type,
                  budget_classification: p.budget_classification,
                }));
                const { data: inserted, error } = await supabase
                  .from("projects")
                  .insert(rows)
                  .select();
                if (error || !inserted) {
                  toast.error("Failed to import projects: " + (error?.message || "unknown error"));
                  return;
                }
                const milestones = inserted.flatMap((proj) =>
                  DEFAULT_MILESTONES.map((name, index) => ({
                    project_id: proj.id,
                    name,
                    type: "milestone",
                    status: "not-started",
                    sort_order: index,
                    include_in_cashflow: true,
                  }))
                );
                await supabase.from("timeline_items").insert(milestones);
                await fetchProjects();
                setHasImported(true);
                setShowImportXLS(false);
                setImportFileAttached(false);
                toast.success("6 projects imported successfully");
              }}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExcelPreview} onOpenChange={setShowExcelPreview}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 border-b border-zinc-300">
            <span className="text-sm font-medium text-zinc-800">projects_import_template.xlsx</span>
            <Button variant="ghost" size="sm" onClick={() => { setShowExcelPreview(false); setImportFileAttached(true); setShowImportXLS(true); }}>
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
          </div>
          <div className="flex-1 overflow-auto bg-white">
            {(() => {
              const headers = [
                { label: "Name", red: true },
                { label: "Description", red: false },
                { label: "Property", red: true },
                { label: "Work category", red: false },
                { label: "Fiscal year", red: false },
                { label: "Budget", red: false },
                { label: "Currency", red: true },
                { label: "Owner", red: true },
                { label: "Budget type", red: false },
                { label: "Budget classification", red: false },
              ];
              const sampleRows = [
                ["LED Lighting Retrofit", "", "Bedzin", "ESG", "2025/2026", "100000", "EUR", "Anna Kowalska", "IC", "Mandatory"],
                ["Main Switchgear Replacement", "", "Bedzin", "ELECTRICAL SYSTEMS", "2025/2026", "100000", "EUR", "Piotr Nowak", "IC", "Mandatory"],
                ["Roof Solar Panel Installation", "", "Marseille", "Sustainability", "2025/2026", "890000", "EUR", "Claire Dubois", "IC", "Mandatory"],
                ["Automated Gate Access System", "", "Lyon", "Building upgrading works", "2025/2026", "350000", "EUR", "Marc Lefevre", "Ad Hoc", "Speculative"],
                ["Cross-Dock Area Expansion", "", "Tilburg", "Asset Enhancement Initiatives", "2025/2026", "1250000", "EUR", "Jeroen van Dijk", "IC", "Mandatory"],
                ["EV Charging Station Network", "", "Schiphol", "Sustainability", "2025/2026", "680000", "EUR", "Sophie de Vries", "IC", "Mandatory"],
              ];
              const colLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
              const totalRows = 34;
              return (
                <table className="border-collapse text-xs font-sans" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th className="bg-zinc-800 text-white border border-zinc-600 text-center font-normal" style={{ width: 40, height: 22 }}></th>
                      {colLetters.map((l) => (
                        <th key={l} className="bg-zinc-800 text-white border border-zinc-600 text-center font-normal" style={{ width: 160, height: 22 }}>{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: totalRows }).map((_, rIdx) => {
                      const rowNum = rIdx + 1;
                      const isHeader = rowNum === 1;
                      const dataRow = rowNum >= 2 && rowNum <= 7 ? sampleRows[rowNum - 2] : null;
                      return (
                        <tr key={rowNum}>
                          <td className="bg-zinc-100 border border-zinc-300 text-center text-zinc-600" style={{ width: 40, height: 24 }}>{rowNum}</td>
                          {colLetters.map((_, cIdx) => {
                            if (isHeader) {
                              const h = headers[cIdx];
                              return (
                                <td key={cIdx} className={cn(
                                  "border border-zinc-300 text-center font-bold px-2 truncate",
                                  h.red ? "text-red-600" : "text-black"
                                )} style={{ height: 24 }}>{h.label}</td>
                              );
                            }
                            const value = dataRow ? dataRow[cIdx] : "";
                            return (
                              <td key={cIdx} className="border border-zinc-300 px-2 text-black truncate" style={{ height: 24 }}>{value}</td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}