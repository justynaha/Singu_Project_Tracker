import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  site: string | null;
  building: string | null;
  total_budget: number;
  currency: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  fiscal_year: string | null;
  budget_line: string | null;
}

interface TimelineItem {
  id: string;
  project_id: string;
  type: string;
  status: string;
  due_date: string | null;
}

interface CashflowData {
  timeline_item_id: string;
  budget: number;
  forecasted: number;
  contracted: number;
  invoiced: number;
}

// Sample GFA data for logistics warehouses (in m²)
// Typical large logistics buildings range from 10,000 to 100,000+ m²
const SAMPLE_GFA_BY_SITE: Record<string, number> = {
  "Verdant Parks Park Bedzin": 45000,
  "Verdant Parks Park Blonie 2": 38000,
  "Verdant Parks Park Gdańsk-Airport": 52000,
  "Verdant Parks Park Nadarzyn": 65000,
  "Verdant Parks Park Piotrków 1": 48000,
  "Verdant Parks Park Piotrków 2": 55000,
  "Verdant Parks Park Szczecin": 42000,
  "Verdant Parks Park Bologna Castel San Pietro": 35000,
  "Verdant Parks Park Fogars": 28000,
  "Verdant Parks Park Les Franqueses": 32000,
  "Verdant Parks Park Sallent": 25000,
  "Verdant Parks Park Valls": 30000,
  "Százhalombatta": 40000,
  "Üllő": 36000,
};

// Sample Contract Sum data (based on typical CAPEX ratios ~60-80% of budget)
// Contract sum represents committed/contracted amounts from vendors
const SAMPLE_CONTRACT_SUM_RATIO = 0.72; // 72% of budget as typical contract sum

// Site to country mapping
export const SITE_TO_COUNTRY: Record<string, string> = {
  "Verdant Parks Park Bedzin": "Poland",
  "Verdant Parks Park Blonie 2": "Poland",
  "Verdant Parks Park Gdańsk-Airport": "Poland",
  "Verdant Parks Park Nadarzyn": "Poland",
  "Verdant Parks Park Piotrków 1": "Poland",
  "Verdant Parks Park Piotrków 2": "Poland",
  "Verdant Parks Park Szczecin": "Poland",
  "Verdant Parks Park Bologna Castel San Pietro": "Italy",
  "Verdant Parks Park Fogars": "Spain",
  "Verdant Parks Park Les Franqueses": "Spain",
  "Verdant Parks Park Sallent": "Spain",
  "Verdant Parks Park Valls": "Spain",
  "Százhalombatta": "Hungary",
  "Üllő": "Hungary",
};

// Country to site group mapping
export const COUNTRY_TO_SITE_GROUP: Record<string, string> = {
  "Poland": "PL",
  "Hungary": "HU",
  "Spain": "WE",
  "Italy": "WE",
  "Netherlands": "WE",
  "France": "WE",
};

export const SITE_GROUP_OPTIONS = [
  { value: "WE", label: "WE (Western Europe)" },
  { value: "HU", label: "HU (Hungary)" },
  { value: "PL", label: "PL (Poland)" },
];

export interface DashboardFilters {
  fiscalYear: string; // e.g., "2025", "2026", or "" for all
  country: string;
  site: string;
  baselineYear: string; // e.g., "2025" or "" for previous year
  siteGroups: string[]; // e.g., ["WE", "PL"]
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  site: string;
  country: string;
  building: string;
  budgetLine: string;
  fiscalYear: string;
  gfa: number;
  isEstimatedGfa: boolean;
  budget: number;
  contracted: number;
  invoiced: number;
  contractedPerGfa: number;
  capexPerGfa: number;
  year: number;
  month: number;
  status: string;
  isOnTrack: boolean;
  isTenantRelated: boolean;
}

export interface BudgetLineMetrics {
  budgetLine: string;
  totalCapex: number;
  projectCount: number;
  baselineCapex: number;
  baselineProjectCount: number;
}

export interface SiteMetrics {
  site: string;
  country: string;
  totalGfa: number;
  totalCapex: number;
  capexPerGfa: number;
  projectCount: number;
  baselineCapex: number;
  baselineCapexPerGfa: number;
}

export interface CountryMetrics {
  country: string;
  totalGfa: number;
  totalCapex: number;
  capexPerGfa: number;
  projectCount: number;
  siteCount: number;
  yoyChange: number | null; // YoY % change from baseline year
  baselineCapex: number;
  baselineCapexPerGfa: number;
}

export function useDashboardData(filters: DashboardFilters) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [cashflowData, setCashflowData] = useState<CashflowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [projectsRes, timelineRes, cashflowRes] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("timeline_items").select("id, project_id, type, status, due_date"),
        supabase.from("milestone_cashflow").select("timeline_item_id, budget, forecasted, contracted, invoiced"),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (timelineRes.data) setTimelineItems(timelineRes.data);
      if (cashflowRes.data) {
        setCashflowData(cashflowRes.data.map(cf => ({
          ...cf,
          budget: Number(cf.budget) || 0,
          forecasted: Number(cf.forecasted) || 0,
          contracted: Number(cf.contracted) || 0,
          invoiced: Number(cf.invoiced) || 0,
        })));
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Calculate project metrics
  const projectMetrics = useMemo<ProjectMetrics[]>(() => {
    return projects.map(project => {
      const site = project.site || "Unknown";
      const country = SITE_TO_COUNTRY[site] || "Unknown";
      const gfa = SAMPLE_GFA_BY_SITE[site] || 35000; // Default GFA
      const isEstimatedGfa = !SAMPLE_GFA_BY_SITE[site];

      // Get cashflow data for this project
      const projectTimelineIds = timelineItems
        .filter(ti => ti.project_id === project.id)
        .map(ti => ti.id);
      
      const projectCashflow = cashflowData.filter(cf => 
        projectTimelineIds.includes(cf.timeline_item_id)
      );

      const totalBudget = project.total_budget || 0;
      const actualContracted = projectCashflow.reduce((sum, cf) => sum + cf.contracted, 0);
      // Use sample contract sum (based on budget ratio) if no actual contracted data
      const contracted = actualContracted > 0 ? actualContracted : totalBudget * SAMPLE_CONTRACT_SUM_RATIO;
      const invoiced = projectCashflow.reduce((sum, cf) => sum + cf.invoiced, 0);

      // Check if on track
      const projectItems = timelineItems.filter(ti => ti.project_id === project.id);
      const overdueItems = projectItems.filter(item => {
        if (!item.due_date) return false;
        if (item.status === "done") return false;
        return new Date(item.due_date) < new Date();
      });
      const isOnTrack = overdueItems.length === 0;

      const startDate = project.start_date ? new Date(project.start_date) : new Date();

      const budgetLine = project.budget_line || "Other";
      const isTenantRelated = budgetLine === "Tenant related";
      const fiscalYear = project.fiscal_year || "";

      return {
        projectId: project.id,
        projectName: project.name,
        site,
        country,
        building: project.building || "N/A",
        budgetLine,
        fiscalYear,
        gfa,
        isEstimatedGfa,
        budget: totalBudget,
        contracted,
        invoiced,
        contractedPerGfa: gfa > 0 ? contracted / gfa : 0,
        capexPerGfa: gfa > 0 ? totalBudget / gfa : 0,
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        status: project.status,
        isOnTrack,
        isTenantRelated,
      };
    });
  }, [projects, timelineItems, cashflowData]);

  // Apply filters
  const filteredMetrics = useMemo(() => {
    let filtered = [...projectMetrics];

    // Fiscal year filter
    if (filters.fiscalYear) {
      filtered = filtered.filter(m => m.fiscalYear === filters.fiscalYear);
    }

    // Hierarchy filters
    if (filters.country) {
      filtered = filtered.filter(m => m.country === filters.country);
    }
    if (filters.site) {
      filtered = filtered.filter(m => m.site === filters.site);
    }
    if (filters.siteGroups && filters.siteGroups.length > 0) {
      filtered = filtered.filter(m => {
        const group = COUNTRY_TO_SITE_GROUP[m.country] || "Unknown";
        return filters.siteGroups.includes(group);
      });
    }

    return filtered;
  }, [projectMetrics, filters]);

  // Aggregate by site with baseline comparison
  const siteMetrics = useMemo<SiteMetrics[]>(() => {
    const selectedFiscalYear = filters.fiscalYear;
    const baselineYear = filters.baselineYear || (selectedFiscalYear ? String(Number(selectedFiscalYear) - 1) : null);
    
    // Get baseline data by site
    const baselineBySite = new Map<string, { capex: number; gfa: number }>();
    if (baselineYear) {
      projectMetrics
        .filter(m => m.fiscalYear === baselineYear)
        .forEach(m => {
          const existing = baselineBySite.get(m.site);
          if (existing) {
            existing.capex += m.budget;
          } else {
            baselineBySite.set(m.site, { capex: m.budget, gfa: m.gfa });
          }
        });
    }
    
    const siteMap = new Map<string, SiteMetrics>();
    
    filteredMetrics.forEach(m => {
      const existing = siteMap.get(m.site);
      if (existing) {
        existing.totalCapex += m.budget;
        existing.projectCount += 1;
      } else {
        const baseline = baselineBySite.get(m.site);
        siteMap.set(m.site, {
          site: m.site,
          country: m.country,
          totalGfa: m.gfa,
          totalCapex: m.budget,
          capexPerGfa: 0,
          projectCount: 1,
          baselineCapex: baseline?.capex || 0,
          baselineCapexPerGfa: baseline && baseline.gfa > 0 ? baseline.capex / baseline.gfa : 0,
        });
      }
    });

    // Calculate per-GFA metrics and sort by totalCapex descending
    return Array.from(siteMap.values())
      .map(s => ({
        ...s,
        capexPerGfa: s.totalGfa > 0 ? s.totalCapex / s.totalGfa : 0,
      }))
      .sort((a, b) => b.totalCapex - a.totalCapex);
  }, [filteredMetrics, filters.fiscalYear, filters.baselineYear, projectMetrics]);

  // Aggregate by country with baseline comparison
  const countryMetrics = useMemo<CountryMetrics[]>(() => {
    // Calculate baseline year metrics for comparison
    const selectedFiscalYear = filters.fiscalYear;
    const baselineYear = filters.baselineYear || (selectedFiscalYear ? String(Number(selectedFiscalYear) - 1) : null);
    
    // Get baseline data by country
    const baselineByCountry = new Map<string, { capex: number; gfa: number }>();
    if (baselineYear) {
      projectMetrics
        .filter(m => m.fiscalYear === baselineYear)
        .forEach(m => {
          const existing = baselineByCountry.get(m.country);
          if (existing) {
            existing.capex += m.budget;
            existing.gfa += m.gfa;
          } else {
            baselineByCountry.set(m.country, { capex: m.budget, gfa: m.gfa });
          }
        });
    }
    
    const countryMap = new Map<string, CountryMetrics>();
    
    siteMetrics.forEach(s => {
      const existing = countryMap.get(s.country);
      if (existing) {
        existing.totalGfa += s.totalGfa;
        existing.totalCapex += s.totalCapex;
        existing.projectCount += s.projectCount;
        existing.siteCount += 1;
      } else {
        const baseline = baselineByCountry.get(s.country);
        countryMap.set(s.country, {
          country: s.country,
          totalGfa: s.totalGfa,
          totalCapex: s.totalCapex,
          capexPerGfa: 0,
          projectCount: s.projectCount,
          siteCount: 1,
          yoyChange: null,
          baselineCapex: baseline?.capex || 0,
          baselineCapexPerGfa: baseline && baseline.gfa > 0 ? baseline.capex / baseline.gfa : 0,
        });
      }
    });

    // Calculate YoY change and sort by totalCapex descending
    return Array.from(countryMap.values())
      .map(c => {
        const baseline = baselineByCountry.get(c.country);
        let yoyChange: number | null = null;
        
        if (selectedFiscalYear && baseline !== undefined && baseline.capex > 0) {
          yoyChange = ((c.totalCapex - baseline.capex) / baseline.capex) * 100;
        } else if (selectedFiscalYear && baseline === undefined && c.totalCapex > 0) {
          // No data in baseline year but has current data = new entry
          yoyChange = 100; // Show as +100% (new)
        }
        
        return {
          ...c,
          capexPerGfa: c.totalGfa > 0 ? c.totalCapex / c.totalGfa : 0,
          yoyChange,
        };
      })
      .sort((a, b) => b.totalCapex - a.totalCapex);
  }, [siteMetrics, filters.fiscalYear, filters.baselineYear, projectMetrics]);

  // YoY calculations based on fiscal year, baseline year, and country/site filters
  const yoyMetrics = useMemo(() => {
    const selectedFiscalYear = filters.fiscalYear;
    const baselineYear = filters.baselineYear || (selectedFiscalYear ? String(Number(selectedFiscalYear) - 1) : null);

    // Apply country and site filters to both current and baseline data
    const applyLocationFilters = (data: ProjectMetrics[]) => {
      let filtered = [...data];
      if (filters.country) {
        filtered = filtered.filter(m => m.country === filters.country);
      }
      if (filters.site) {
        filtered = filtered.filter(m => m.site === filters.site);
      }
      return filtered;
    };

    // Current fiscal year data (filtered by year + location)
    const currentYearData = applyLocationFilters(
      selectedFiscalYear 
        ? projectMetrics.filter(m => m.fiscalYear === selectedFiscalYear)
        : projectMetrics
    );
    
    // Baseline year data (filtered by year + location)
    const baselineYearData = baselineYear 
      ? applyLocationFilters(projectMetrics.filter(m => m.fiscalYear === baselineYear))
      : [];

    // Total CAPEX calculations
    const currentTotalCapex = currentYearData.reduce((sum, m) => sum + m.budget, 0);
    const baselineTotalCapex = baselineYearData.reduce((sum, m) => sum + m.budget, 0);
    const totalCapexChange = baselineTotalCapex > 0 
      ? ((currentTotalCapex - baselineTotalCapex) / baselineTotalCapex) * 100 
      : null;

    // CAPEX per GFA calculations
    const currentTotalGfa = currentYearData.reduce((sum, m) => sum + m.gfa, 0);
    const baselineTotalGfa = baselineYearData.reduce((sum, m) => sum + m.gfa, 0);
    const currentCapexPerGfa = currentTotalGfa > 0 ? currentTotalCapex / currentTotalGfa : 0;
    const baselineCapexPerGfa = baselineTotalGfa > 0 ? baselineTotalCapex / baselineTotalGfa : 0;
    const capexPerGfaChange = baselineCapexPerGfa > 0 
      ? ((currentCapexPerGfa - baselineCapexPerGfa) / baselineCapexPerGfa) * 100 
      : null;

    // Contract Sum per GFA calculations
    const currentTotalContracted = currentYearData.reduce((sum, m) => sum + m.contracted, 0);
    const baselineTotalContracted = baselineYearData.reduce((sum, m) => sum + m.contracted, 0);
    const currentContractedPerGfa = currentTotalGfa > 0 ? currentTotalContracted / currentTotalGfa : 0;
    const baselineContractedPerGfa = baselineTotalGfa > 0 ? baselineTotalContracted / baselineTotalGfa : 0;
    const contractedPerGfaChange = baselineContractedPerGfa > 0 
      ? ((currentContractedPerGfa - baselineContractedPerGfa) / baselineContractedPerGfa) * 100 
      : null;

    return {
      totalCapex: currentTotalCapex,
      totalCapexChange,
      capexPerGfa: currentCapexPerGfa,
      capexPerGfaChange,
      contractedPerGfa: currentContractedPerGfa,
      contractedPerGfaChange,
      selectedYear: selectedFiscalYear,
      baselineYear: baselineYear,
    };
  }, [projectMetrics, filters.fiscalYear, filters.baselineYear, filters.country, filters.site]);

  // Summary KPIs
  const kpis = useMemo(() => {
    const totalBudget = filteredMetrics.reduce((sum, m) => sum + m.budget, 0);
    const totalContracted = filteredMetrics.reduce((sum, m) => sum + m.contracted, 0);
    const totalGfa = filteredMetrics.reduce((sum, m) => sum + m.gfa, 0);
    const avgCapexPerGfa = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.capexPerGfa, 0) / filteredMetrics.length
      : 0;
    const avgContractedPerGfa = filteredMetrics.length > 0
      ? filteredMetrics.reduce((sum, m) => sum + m.contractedPerGfa, 0) / filteredMetrics.length
      : 0;

    return {
      totalProjects: filteredMetrics.length,
      totalBudget,
      totalContracted,
      avgCapexPerGfa,
      avgContractedPerGfa,
      onTrackCount: filteredMetrics.filter(m => m.isOnTrack).length,
      offTrackCount: filteredMetrics.filter(m => !m.isOnTrack).length,
    };
  }, [filteredMetrics]);

  // Budget line metrics - include all standard budget lines with baseline
  const budgetLineMetrics = useMemo<BudgetLineMetrics[]>(() => {
    const ALL_BUDGET_LINES = [
      "Tenant related",
      "Equipment end-of-life replacement",
      "Asset Enhancement Initiatives",
      "Building upgrading works",
      "Mechanical",
      "Electrical",
      "Plumbing",
      "Other"
    ];

    const selectedFiscalYear = filters.fiscalYear;
    const baselineYear = filters.baselineYear || (selectedFiscalYear ? String(Number(selectedFiscalYear) - 1) : null);

    // Get baseline data by budget line
    const baselineByBudgetLine = new Map<string, { capex: number; count: number }>();
    if (baselineYear) {
      projectMetrics
        .filter(m => m.fiscalYear === baselineYear)
        .forEach(m => {
          const budgetLine = ALL_BUDGET_LINES.includes(m.budgetLine) ? m.budgetLine : "Other";
          const existing = baselineByBudgetLine.get(budgetLine);
          if (existing) {
            existing.capex += m.budget;
            existing.count += 1;
          } else {
            baselineByBudgetLine.set(budgetLine, { capex: m.budget, count: 1 });
          }
        });
    }

    const budgetLineMap = new Map<string, BudgetLineMetrics>();
    
    // Initialize all budget lines with 0
    ALL_BUDGET_LINES.forEach(bl => {
      const baseline = baselineByBudgetLine.get(bl);
      budgetLineMap.set(bl, {
        budgetLine: bl,
        totalCapex: 0,
        projectCount: 0,
        baselineCapex: baseline?.capex || 0,
        baselineProjectCount: baseline?.count || 0,
      });
    });
    
    // Add values from filtered metrics
    filteredMetrics.forEach(m => {
      const budgetLine = ALL_BUDGET_LINES.includes(m.budgetLine) ? m.budgetLine : "Other";
      const existing = budgetLineMap.get(budgetLine);
      if (existing) {
        existing.totalCapex += m.budget;
        existing.projectCount += 1;
      }
    });

    return Array.from(budgetLineMap.values())
      .sort((a, b) => b.totalCapex - a.totalCapex);
  }, [filteredMetrics, filters.fiscalYear, filters.baselineYear, projectMetrics]);

  // Tenant vs Non-tenant breakdown
  const tenantBreakdown = useMemo(() => {
    const tenantRelated = filteredMetrics
      .filter(m => m.isTenantRelated)
      .reduce((sum, m) => sum + m.budget, 0);
    const nonTenantRelated = filteredMetrics
      .filter(m => !m.isTenantRelated)
      .reduce((sum, m) => sum + m.budget, 0);
    const total = tenantRelated + nonTenantRelated;

    // Calculate baseline data
    const effectiveBaselineYear = filters.baselineYear || (filters.fiscalYear ? String(Number(filters.fiscalYear) - 1) : null);
    const baselineMetrics = effectiveBaselineYear
      ? projectMetrics.filter(m => m.fiscalYear === effectiveBaselineYear)
      : [];
    
    const baselineTenantRelated = baselineMetrics
      .filter(m => m.isTenantRelated)
      .reduce((sum, m) => sum + m.budget, 0);
    const baselineNonTenantRelated = baselineMetrics
      .filter(m => !m.isTenantRelated)
      .reduce((sum, m) => sum + m.budget, 0);
    const baselineTotal = baselineTenantRelated + baselineNonTenantRelated;

    return {
      total,
      tenantRelated,
      tenantRelatedShare: total > 0 ? (tenantRelated / total) * 100 : 0,
      nonTenantRelated,
      nonTenantRelatedShare: total > 0 ? (nonTenantRelated / total) * 100 : 0,
      baselineTotal,
      baselineTenantRelated,
      baselineTenantRelatedShare: baselineTotal > 0 ? (baselineTenantRelated / baselineTotal) * 100 : 0,
      baselineNonTenantRelated,
      baselineNonTenantRelatedShare: baselineTotal > 0 ? (baselineNonTenantRelated / baselineTotal) * 100 : 0,
      baselineYear: effectiveBaselineYear,
    };
  }, [filteredMetrics, projectMetrics, filters.fiscalYear, filters.baselineYear]);

  // Filter options
  const filterOptions = useMemo(() => {
    const countries = [...new Set(projectMetrics.map(m => m.country))].sort();
    const sites = [...new Set(projectMetrics.map(m => m.site))].filter(s => s !== "Unknown").sort();
    const buildings = [...new Set(projectMetrics.map(m => m.building))].filter(b => b !== "N/A").sort();
    const fiscalYears = [...new Set(projectMetrics.map(m => m.fiscalYear))].filter(fy => fy).sort().reverse();
    const projectList = projectMetrics.map(m => ({ id: m.projectId, name: m.projectName }));
    
    return { countries, sites, buildings, fiscalYears, projects: projectList };
  }, [projectMetrics]);

  // Project-level metrics for site-specific view (sorted by CAPEX desc)
  const projectLevelMetrics = useMemo(() => {
    return filteredMetrics
      .map(m => ({
        projectName: m.projectName,
        totalCapex: m.budget,
        capexPerGfa: m.capexPerGfa,
        gfa: m.gfa,
      }))
      .sort((a, b) => b.totalCapex - a.totalCapex);
  }, [filteredMetrics]);

  return {
    loading,
    projects: filteredMetrics,
    siteMetrics,
    countryMetrics,
    yoyMetrics,
    kpis,
    budgetLineMetrics,
    tenantBreakdown,
    filterOptions,
    projectLevelMetrics,
  };
}
