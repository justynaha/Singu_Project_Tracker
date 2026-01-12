import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData, DashboardFilters } from "@/hooks/useDashboardData";
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Eye, EyeOff, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const formatCurrency = (value: number) => {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
};
export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    fiscalYear: "2026",
    country: "",
    site: "",
    baselineYear: ""
  });
  const [visibleSeries, setVisibleSeries] = useState({
    currentCapex: true,
    baselineCapex: true,
    currentCapexPerGfa: true,
    baselineCapexPerGfa: true
  });
  const {
    loading,
    siteMetrics,
    countryMetrics,
    budgetLineMetrics,
    tenantBreakdown,
    filterOptions,
    yoyMetrics,
    projectLevelMetrics
  } = useDashboardData(filters);
  const baselineYearOptions = useMemo(() => {
    return ["Previous year", "2024", "2023", "2022", "2021", "2020"];
  }, []);
  const effectiveBaselineYear = filters.baselineYear || (filters.fiscalYear ? String(Number(filters.fiscalYear) - 1) : null);
  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const clearFilters = () => {
    setFilters({
      fiscalYear: "2026",
      country: "",
      site: "",
      baselineYear: ""
    });
  };
  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const hasFilters = filters.country || filters.site;
  const COLORS = {
    primary: "hsl(var(--primary))",
    success: "hsl(142 76% 36%)",
    danger: "hsl(0 84% 60%)",
    muted: "hsl(var(--muted-foreground))",
    budget: "hsl(217 91% 60%)",
    budgetLight: "hsl(217 91% 80%)",
    contracted: "hsl(262 83% 58%)",
    tenant: "hsl(280 67% 50%)",
    nonTenant: "hsl(199 89% 48%)"
  };
  const COUNTRY_COLORS = ["hsl(217 91% 60%)",
  // Blue
  "hsl(142 76% 40%)",
  // Green
  "hsl(32 95% 50%)",
  // Orange
  "hsl(262 83% 58%)",
  // Purple
  "hsl(0 84% 60%)",
  // Red
  "hsl(199 89% 48%)",
  // Cyan
  "hsl(45 93% 47%)",
  // Yellow
  "hsl(340 82% 52%)" // Pink
  ];
  const COUNTRY_COLORS_LIGHT = ["hsl(217 91% 88%)",
  // Blue light
  "hsl(142 76% 82%)",
  // Green light
  "hsl(32 95% 85%)",
  // Orange light
  "hsl(262 83% 86%)",
  // Purple light
  "hsl(0 84% 88%)",
  // Red light
  "hsl(199 89% 85%)",
  // Cyan light
  "hsl(45 93% 85%)",
  // Yellow light
  "hsl(340 82% 85%)" // Pink light
  ];
  if (loading) {
    return <div className="min-h-screen bg-background p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-1">CAPEX Dashboard</h1>
        <p className="text-muted-foreground">Portfolio-level cost efficiency and trends analysis</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Fiscal year</Label>
          <Select value={filters.fiscalYear || "all"} onValueChange={val => updateFilter("fiscalYear", val === "all" ? "" : val)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {filterOptions.fiscalYears.map(fy => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Baseline year</Label>
          <Select value={filters.baselineYear || "previous"} onValueChange={val => updateFilter("baselineYear", val === "previous" ? "" : val)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Previous year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous year</SelectItem>
              {baselineYearOptions.map(fy => <SelectItem key={fy} value={fy}>FY {fy}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
          <Select value={filters.country || "all"} onValueChange={val => updateFilter("country", val === "all" ? "" : val)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {filterOptions.countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Site</Label>
          <Select value={filters.site || "all"} onValueChange={val => updateFilter("site", val === "all" ? "" : val)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {filterOptions.sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="self-end">Clear filters</Button>}

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
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
      </div>

      {hasFilters && <div className="flex flex-wrap gap-2 mb-4">
          {filters.country && <Badge variant="secondary">Country: {filters.country}</Badge>}
          {filters.site && <Badge variant="secondary">Site: {filters.site}</Badge>}
        </div>}

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total CAPEX</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(yoyMetrics.totalCapex)}</div>
              {yoyMetrics.totalCapexChange !== null && <div className={`flex items-center gap-1 text-sm font-medium ${yoyMetrics.totalCapexChange > 0 ? 'text-red-500' : yoyMetrics.totalCapexChange < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {yoyMetrics.totalCapexChange > 0 ? <TrendingUp className="h-4 w-4" /> : yoyMetrics.totalCapexChange < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {yoyMetrics.totalCapexChange >= 0 ? '+' : ''}{yoyMetrics.totalCapexChange.toFixed(1)}%
                </div>}
            </div>
            {yoyMetrics.baselineYear && <p className="text-xs text-muted-foreground mt-1">vs FY{yoyMetrics.baselineYear}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardDescription>CAPEX / GFA</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">€{yoyMetrics.capexPerGfa.toFixed(2)}/m²</div>
              {yoyMetrics.capexPerGfaChange !== null && <div className={`flex items-center gap-1 text-sm font-medium ${yoyMetrics.capexPerGfaChange > 0 ? 'text-red-500' : yoyMetrics.capexPerGfaChange < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {yoyMetrics.capexPerGfaChange > 0 ? <TrendingUp className="h-4 w-4" /> : yoyMetrics.capexPerGfaChange < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {yoyMetrics.capexPerGfaChange >= 0 ? '+' : ''}{yoyMetrics.capexPerGfaChange.toFixed(1)}%
                </div>}
            </div>
            {yoyMetrics.baselineYear && <p className="text-xs text-muted-foreground mt-1">vs FY{yoyMetrics.baselineYear}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Contract Sum / GFA</CardDescription>
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
                
                <span>Synchronized with ERP</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">€{yoyMetrics.contractedPerGfa.toFixed(2)}/m²</div>
              {yoyMetrics.contractedPerGfaChange !== null && <div className={`flex items-center gap-1 text-sm font-medium ${yoyMetrics.contractedPerGfaChange > 0 ? 'text-red-500' : yoyMetrics.contractedPerGfaChange < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {yoyMetrics.contractedPerGfaChange > 0 ? <TrendingUp className="h-4 w-4" /> : yoyMetrics.contractedPerGfaChange < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  {yoyMetrics.contractedPerGfaChange >= 0 ? '+' : ''}{yoyMetrics.contractedPerGfaChange.toFixed(1)}%
                </div>}
            </div>
            {yoyMetrics.baselineYear && <p className="text-xs text-muted-foreground mt-1">vs FY{yoyMetrics.baselineYear}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>CAPEX by Type</CardTitle>
            <CardDescription>Tenant-related vs Non-tenant-related breakdown{effectiveBaselineYear && <span className="ml-1 text-xs">• vs FY{effectiveBaselineYear}</span>}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                
                
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={[{
                name: "Tenant-related",
                value: tenantBreakdown.tenantRelated
              }, {
                name: "Non-tenant-related",
                value: tenantBreakdown.nonTenantRelated
              }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({
                percent
              }) => `${(percent * 100).toFixed(0)}%`}>
                  <Cell fill={COLORS.tenant} />
                  <Cell fill={COLORS.nonTenant} />
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full mt-0.5" style={{
                backgroundColor: COLORS.tenant
              }} />
                <div>
                  <div className="font-medium">Tenant-related</div>
                  <div className="text-muted-foreground text-xs">
                    FY{filters.fiscalYear}: {formatCurrency(tenantBreakdown.tenantRelated)} ({tenantBreakdown.tenantRelatedShare.toFixed(1)}%)
                  </div>
                  {tenantBreakdown.baselineYear && <div className="text-muted-foreground text-xs">
                      FY{tenantBreakdown.baselineYear}: {formatCurrency(tenantBreakdown.baselineTenantRelated)} ({tenantBreakdown.baselineTenantRelatedShare.toFixed(1)}%)
                    </div>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full mt-0.5" style={{
                backgroundColor: COLORS.nonTenant
              }} />
                <div>
                  <div className="font-medium">Non-tenant-related</div>
                  <div className="text-muted-foreground text-xs">
                    FY{filters.fiscalYear}: {formatCurrency(tenantBreakdown.nonTenantRelated)} ({tenantBreakdown.nonTenantRelatedShare.toFixed(1)}%)
                  </div>
                  {tenantBreakdown.baselineYear && <div className="text-muted-foreground text-xs">
                      FY{tenantBreakdown.baselineYear}: {formatCurrency(tenantBreakdown.baselineNonTenantRelated)} ({tenantBreakdown.baselineNonTenantRelatedShare.toFixed(1)}%)
                    </div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CAPEX by Trade & Services</CardTitle>
                <CardDescription>Comparison across all budget categories{effectiveBaselineYear && <span className="ml-1 text-xs">• vs FY{effectiveBaselineYear}</span>}</CardDescription>
              </div>
              {effectiveBaselineYear && <Button variant="ghost" size="sm" onClick={() => toggleSeries('baselineCapex')} className="text-xs gap-1.5 px-0 h-auto py-1 text-muted-foreground hover:text-foreground">
                  {visibleSeries.baselineCapex ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {visibleSeries.baselineCapex ? 'Hide baseline' : 'Show baseline'}
                </Button>}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(320, budgetLineMetrics.length * 50)}>
              <BarChart data={budgetLineMetrics} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={v => formatCurrency(v)} />
                <YAxis type="category" dataKey="budgetLine" width={200} tick={{
                fontSize: 12
              }} />
                <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} />
                {effectiveBaselineYear && <Bar dataKey="baselineCapex" name={`FY${effectiveBaselineYear}`} fill={COLORS.budgetLight} radius={[0, 4, 4, 0]} hide={!visibleSeries.baselineCapex} />}
                <Bar dataKey="totalCapex" name={`FY${filters.fiscalYear}`} radius={[0, 4, 4, 0]} hide={!visibleSeries.currentCapex}>{budgetLineMetrics.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.budgetLine === "Tenant related" ? COLORS.tenant : COLORS.budget} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CAPEX by {filters.site ? "Project" : filters.country ? "Site" : "Country"}</CardTitle>
                <CardDescription>Total budget by {filters.site ? "project" : filters.country ? "site" : "country"}{effectiveBaselineYear && !filters.site && <span className="ml-1 text-xs">• vs FY{effectiveBaselineYear}</span>}</CardDescription>
              </div>
              {effectiveBaselineYear && !filters.site && <Button variant="ghost" size="sm" onClick={() => toggleSeries('baselineCapex')} className="text-xs gap-1.5 px-0 h-auto py-1 text-muted-foreground hover:text-foreground">
                  {visibleSeries.baselineCapex ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {visibleSeries.baselineCapex ? 'Hide baseline' : 'Show baseline'}
                </Button>}
            </div>
          </CardHeader>
          <CardContent>
            {filters.site ? (
              <ResponsiveContainer width="100%" height={Math.max(220, projectLevelMetrics.length * 40)}>
                <BarChart data={projectLevelMetrics} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={v => formatCurrency(v)} />
                  <YAxis type="category" dataKey="projectName" width={200} tick={{ fontSize: 11 }} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <div className="font-medium mb-1">{label}</div>
                        <div className="text-sm text-muted-foreground">CAPEX: {formatCurrency(data.totalCapex)}</div>
                      </div>
                    );
                  }} />
                  <Bar dataKey="totalCapex" name="CAPEX" radius={[0, 4, 4, 0]}>
                    {projectLevelMetrics.map((_, index) => (
                      <Cell key={`project-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : filters.country ? <ResponsiveContainer width="100%" height={Math.max(220, siteMetrics.length * 40)}>
                <BarChart data={siteMetrics} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={v => formatCurrency(v)} />
                  <YAxis type="category" dataKey="site" width={150} tick={{
                fontSize: 11
              }} />
                  <Tooltip content={({
                active,
                payload,
                label
              }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <div className="font-medium mb-1">{label}</div>
                          <div className="text-sm text-muted-foreground">FY{filters.fiscalYear}: {formatCurrency(data.totalCapex)}</div>
                          {effectiveBaselineYear && data.baselineCapex > 0 && <div className="text-sm text-muted-foreground">FY{effectiveBaselineYear}: {formatCurrency(data.baselineCapex)}</div>}
                        </div>;
              }} />
                  {effectiveBaselineYear && <Bar dataKey="baselineCapex" name={`FY${effectiveBaselineYear}`} radius={[0, 4, 4, 0]} hide={!visibleSeries.baselineCapex}>
                    {siteMetrics.map((_, index) => <Cell key={`baseline-${index}`} fill={COUNTRY_COLORS_LIGHT[index % COUNTRY_COLORS_LIGHT.length]} />)}
                  </Bar>}
                  <Bar dataKey="totalCapex" name={`FY${filters.fiscalYear}`} radius={[0, 4, 4, 0]} hide={!visibleSeries.currentCapex}>
                    {siteMetrics.map((_, index) => <Cell key={`current-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer> : (() => {
            const avgCapex = countryMetrics.length > 0 ? countryMetrics.reduce((sum, c) => sum + c.totalCapex, 0) / countryMetrics.length : 0;
            return <ResponsiveContainer width="100%" height={220}>
                <BarChart data={countryMetrics} margin={{
                top: 20
              }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="country" angle={-45} textAnchor="end" height={60} tick={{
                  fontSize: 11
                }} interval={0} />
                  <YAxis tickFormatter={v => formatCurrency(v)} />
                  <Tooltip content={({
                  active,
                  payload,
                  label
                }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <div className="font-medium mb-1">{label}</div>
                          <div className="text-sm text-muted-foreground">FY{filters.fiscalYear}: {formatCurrency(data.totalCapex)}</div>
                          {effectiveBaselineYear && data.baselineCapex > 0 && <div className="text-sm text-muted-foreground">FY{effectiveBaselineYear}: {formatCurrency(data.baselineCapex)}</div>}
                          {data.yoyChange !== null && <div className={`text-sm font-medium ${data.yoyChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>Change: {data.yoyChange >= 0 ? '+' : ''}{data.yoyChange.toFixed(1)}%</div>}
                        </div>;
                }} />
                  <ReferenceLine y={avgCapex} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" strokeWidth={2} isFront={true} label={{
                  value: `Avg: ${formatCurrency(avgCapex)}`,
                  position: 'right',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontWeight: 500
                }} />
                  {effectiveBaselineYear && <Bar dataKey="baselineCapex" name={`FY${effectiveBaselineYear}`} radius={[4, 4, 0, 0]} hide={!visibleSeries.baselineCapex}>
                    {countryMetrics.map((_, index) => <Cell key={`baseline-${index}`} fill={COUNTRY_COLORS_LIGHT[index % COUNTRY_COLORS_LIGHT.length]} />)}
                  </Bar>}
                  <Bar dataKey="totalCapex" name={`FY${filters.fiscalYear}`} radius={[4, 4, 0, 0]} hide={!visibleSeries.currentCapex}>
                    {countryMetrics.map((_, index) => <Cell key={`current-${index}`} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>;
          })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CAPEX per m² by {filters.site ? "Project" : filters.country ? "Site" : "Country"}</CardTitle>
                <CardDescription>
                  {filters.site ? "Cost efficiency by project" : filters.country ? "Cost efficiency by site" : "Average cost efficiency by country"}
                  <Badge variant="outline" className="ml-2 text-xs">Gross Floor Area</Badge>
                  {effectiveBaselineYear && !filters.site && <span className="ml-1 text-xs">• vs FY{effectiveBaselineYear}</span>}
                </CardDescription>
              </div>
              {effectiveBaselineYear && !filters.site && <Button variant="ghost" size="sm" onClick={() => toggleSeries('baselineCapexPerGfa')} className="text-xs gap-1.5 px-0 h-auto py-1 text-muted-foreground hover:text-foreground">
                  {visibleSeries.baselineCapexPerGfa ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {visibleSeries.baselineCapexPerGfa ? 'Hide baseline' : 'Show baseline'}
                </Button>}
            </div>
          </CardHeader>
          <CardContent>
            {filters.site ? (
              (() => {
                const sortedByCapexPerGfa = [...projectLevelMetrics].sort((a, b) => b.capexPerGfa - a.capexPerGfa);
                const avgCapexPerGfa = projectLevelMetrics.length > 0 
                  ? projectLevelMetrics.reduce((sum, p) => sum + p.capexPerGfa, 0) / projectLevelMetrics.length 
                  : 0;
                return (
                  <ResponsiveContainer width="100%" height={Math.max(220, sortedByCapexPerGfa.length * 40)}>
                    <BarChart data={sortedByCapexPerGfa} layout="vertical" barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={v => `€${v.toFixed(0)}`} />
                      <YAxis type="category" dataKey="projectName" width={200} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        formatter={(value: number) => [`€${value.toFixed(2)}/m²`, 'CAPEX/m²']} 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <ReferenceLine x={avgCapexPerGfa} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" strokeWidth={2} isFront={true} />
                      <Bar dataKey="capexPerGfa" name="CAPEX/m²" radius={[0, 4, 4, 0]}>
                        {sortedByCapexPerGfa.map((entry, index) => (
                          <Cell key={`project-${index}`} fill={entry.capexPerGfa > 5 ? COLORS.danger : COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()
            ) : filters.country ? <ResponsiveContainer width="100%" height={Math.max(220, siteMetrics.length * 40)}>
                <BarChart data={siteMetrics} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={v => `€${v.toFixed(0)}`} />
                  <YAxis type="category" dataKey="site" width={150} tick={{
                fontSize: 11
              }} />
                  <Tooltip formatter={(value: number, name: string) => [`€${value.toFixed(2)}/m²`, name]} contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} />
                  {effectiveBaselineYear && <Bar dataKey="baselineCapexPerGfa" name={`FY${effectiveBaselineYear}`} fill="hsl(var(--primary) / 0.4)" radius={[0, 4, 4, 0]} hide={!visibleSeries.baselineCapexPerGfa} />}
                  <Bar dataKey="capexPerGfa" name={`FY${filters.fiscalYear}`} fill={COLORS.primary} radius={[0, 4, 4, 0]} hide={!visibleSeries.currentCapexPerGfa}>{siteMetrics.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.capexPerGfa > 5 ? COLORS.danger : COLORS.primary} />)}</Bar>
                </BarChart>
              </ResponsiveContainer> : (() => {
            const sortedByCapexPerGfa = [...countryMetrics].sort((a, b) => b.capexPerGfa - a.capexPerGfa);
            const avgCapexPerGfa = countryMetrics.length > 0 ? countryMetrics.reduce((sum, c) => sum + c.capexPerGfa, 0) / countryMetrics.length : 0;
            // Create a color map based on original countryMetrics order
            const countryColorMap = new Map(countryMetrics.map((c, i) => [c.country, {
              main: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
              light: COUNTRY_COLORS_LIGHT[i % COUNTRY_COLORS_LIGHT.length]
            }]));
            return <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sortedByCapexPerGfa}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="country" angle={-45} textAnchor="end" height={60} tick={{
                  fontSize: 11
                }} interval={0} />
                  <YAxis tickFormatter={v => `€${v.toFixed(0)}`} />
                  <Tooltip formatter={(value: number, name: string) => [`€${value.toFixed(2)}/m²`, name]} contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} />
                  <ReferenceLine y={avgCapexPerGfa} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" strokeWidth={2} isFront={true} label={{
                  value: `Avg: €${avgCapexPerGfa.toFixed(2)}/m²`,
                  position: 'right',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontWeight: 500
                }} />
                  {effectiveBaselineYear && <Bar dataKey="baselineCapexPerGfa" name={`FY${effectiveBaselineYear}`} radius={[4, 4, 0, 0]} hide={!visibleSeries.baselineCapexPerGfa}>
                    {sortedByCapexPerGfa.map(entry => <Cell key={`baseline-${entry.country}`} fill={countryColorMap.get(entry.country)?.light || COUNTRY_COLORS_LIGHT[0]} />)}
                  </Bar>}
                  <Bar dataKey="capexPerGfa" name={`FY${filters.fiscalYear}`} radius={[4, 4, 0, 0]} hide={!visibleSeries.currentCapexPerGfa}>
                    {sortedByCapexPerGfa.map(entry => <Cell key={`current-${entry.country}`} fill={countryColorMap.get(entry.country)?.main || COUNTRY_COLORS[0]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>;
          })()}
          </CardContent>
        </Card>
      </div>
    </div>;
}