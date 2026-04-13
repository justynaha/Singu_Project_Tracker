import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { sites } from "@/data/buildingsData";

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

const budgetLineLabels: Record<string, string> = {
  common_areas: "Common Areas",
  tenant_fitout: "Tenant Fit-Out",
  building_upgrades: "Building Upgrades",
  sustainability: "Sustainability",
  safety_compliance: "Safety & Compliance",
};

export default function OverviewTab({ project }: OverviewTabProps) {
  const navigate = useNavigate();

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

  return (
    <div className="p-6">
      <DetailRow label="Added on" value={formatDateTime(project.created_at)} />
      <DetailRow label="Name" value={project.name} />
      <DetailRow label="Work description" value={project.work_description} />
      <div className="flex py-4 border-b border-border">
        <div className="w-48 text-sm font-semibold text-foreground shrink-0">Site</div>
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
      <DetailRow label="Address" value={project.address} />
      <DetailRow label="Building" value={project.building} />
      <DetailRow label="Tenant" value={project.tenant} />
      <DetailRow label="Project start date" value={formatDate(project.start_date)} />
      <DetailRow label="Project end date" value={formatDate(project.end_date)} />
      <DetailRow label="Budget line" value={project.budget_line ? budgetLineLabels[project.budget_line] || project.budget_line : null} />
      <DetailRow label="Fiscal year" value={project.fiscal_year} />
      <DetailRow 
        label="Budget" 
        value={project.total_budget ? formatCurrency(project.total_budget, project.currency || "PLN") : null} 
      />
      <DetailRow label="Status" value={project.status} />
    </div>
  );
}
