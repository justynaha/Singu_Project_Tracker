import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sites } from "@/data/buildingsData";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_budget: number;
  created_at: string;
  updated_at: string;
  site?: string | null;
  building?: string | null;
  tenant?: string | null;
  budget_line?: string | null;
  fiscal_year?: string | null;
  currency?: string | null;
  address?: string | null;
  work_description?: string | null;
  fund_id?: string | null;
  cc_code?: string | null;
  area_sqm?: number | null;
  budget_eur?: number | null;
}

interface OverviewTabProps {
  project: Project;
}

interface DetailRowProps {
  label: string;
  value: string | null | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex py-4 border-b border-border last:border-b-0">
      <div className="w-48 text-sm font-semibold text-foreground shrink-0">{label}</div>
      <div className="text-sm text-foreground">{value || "-"}</div>
    </div>
  );
}

const budgetLineLabels: Record<string, string> = {};

export default function OverviewTab({ project }: OverviewTabProps) {
  const navigate = useNavigate();
  const [fxRate, setFxRate] = useState<number | null>(null);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "MM/dd/yyyy h:mm a");
    } catch {
      return dateString;
    }
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matchedSite = project.site ? sites.find(s => normalize(s.name) === normalize(project.site!)) : null;

  const currency = project.currency || matchedSite?.currency || "PLN";

  useEffect(() => {
    if (currency === "EUR") { setFxRate(1); return; }
    supabase
      .from("fx_rates")
      .select("rate")
      .eq("currency", currency)
      .order("valid_from", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setFxRate(Number(data[0].rate));
      });
  }, [currency]);

  // Fallbacks from property
  const address = project.address || matchedSite?.address || null;
  const fundId = project.fund_id || matchedSite?.fundId || null;
  const ccCode = project.cc_code || matchedSite?.ccCode || null;
  const areaSqm = project.area_sqm != null
    ? project.area_sqm.toLocaleString("en-US")
    : (matchedSite?.areaSqm || null);

  const budgetEurValue = project.budget_eur != null
    ? Number(project.budget_eur)
    : (project.total_budget && fxRate && fxRate > 0 ? project.total_budget / fxRate : null);

  return (
    <div className="p-6">
      <DetailRow label="Added on" value={formatDateTime(project.created_at)} />
      <DetailRow label="Name" value={project.name} />
      <DetailRow label="Work description" value={project.work_description} />
      <div className="flex py-4 border-b border-border">
          <div className="w-48 text-sm font-semibold text-foreground shrink-0">Property</div>
        <div className="text-sm">
          {matchedSite ? (
            <span
              className="text-primary hover:underline cursor-pointer"
              onClick={() => navigate(`/buildings/sites/${matchedSite.id}`)}
            >
              {project.site}
            </span>
          ) : (
            <span className="text-foreground">{project.site || "-"}</span>
          )}
        </div>
      </div>
      <DetailRow label="Address" value={address} />
      <DetailRow label="Building" value={project.building} />
      {project.tenant && <DetailRow label="Tenant" value={project.tenant} />}
      <DetailRow label="Project start date" value={formatDate(project.start_date)} />
      <DetailRow label="Project end date" value={formatDate(project.end_date)} />
      <DetailRow label="Work category" value={project.budget_line || null} />
      <DetailRow label="Fiscal year" value={project.fiscal_year} />
      <DetailRow label="Fund ID" value={fundId} />
      <DetailRow label="CC Code" value={ccCode} />
      <DetailRow label="Area (sqm)" value={areaSqm} />
      <DetailRow 
        label="Budget LC" 
        value={project.total_budget ? formatCurrency(project.total_budget, currency) : null} 
      />
      <DetailRow 
        label="Budget EUR" 
        value={budgetEurValue != null ? formatCurrency(budgetEurValue, "EUR") : null} 
      />
      <DetailRow label="Status" value={project.status} />
    </div>
  );
}
