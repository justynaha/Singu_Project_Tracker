import { useState } from "react";
import { Upload, Sparkles, Plus, BarChart3, LineChart, PieChart, Table as TableIcon, Layers, Gauge } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VIEWS = [
  "Projects",
  "Contracts",
  "Invoices",
  "Monthly Breakdown",
  "CAPEX Tracker",
  "Mandatory vs Speculative",
];

const METRICS = [
  "Count",
  "Total Budget",
  "Contracted Value",
  "Invoiced Value",
  "Forecasted",
  "Savings",
  "Variance",
];

const DIMENSIONS = [
  "None",
  "Country",
  "Site",
  "Region",
  "Work Category",
  "Budget Type",
  "Classification",
  "Fiscal Year",
  "Currency",
];

const CHART_TYPES = [
  { value: "table", label: "Table", icon: TableIcon },
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "stacked", label: "Stacked Bar", icon: Layers },
  { value: "pie", label: "Pie Chart", icon: PieChart },
  { value: "kpi", label: "KPI Card", icon: Gauge },
];

const FISCAL_YEARS = ["FY 2024", "FY 2025", "FY 2026", "FY 2027"];

export default function AddReportModal({ open, onOpenChange }: AddReportModalProps) {
  const [view, setView] = useState("Projects");
  const [metric, setMetric] = useState("Count");
  const [dimension, setDimension] = useState("None");
  const [chartType, setChartType] = useState("table");
  const [fiscalYear, setFiscalYear] = useState("FY 2026");
  const [name, setName] = useState("Count (Projects)");
  const [description, setDescription] = useState("Shows the count of Projects");

  const handleViewChange = (v: string) => {
    setView(v);
    setName(`${metric} (${v})`);
    setDescription(`Shows the ${metric.toLowerCase()} of ${v}`);
  };

  const handleMetricChange = (m: string) => {
    setMetric(m);
    setName(`${m} (${view})`);
    setDescription(`Shows the ${m.toLowerCase()} of ${view}`);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Report name is required");
      return;
    }
    toast.success("Report created");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">Report Configuration</DialogTitle>
              <DialogDescription>
                Configure your report by selecting data and visualization options
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Data Selection */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Data Selection</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Presets
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>View</Label>
                <Select value={view} onValueChange={handleViewChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIEWS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Metric</Label>
                <Select value={metric} onValueChange={handleMetricChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METRICS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filters</Label>
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2 border-dashed"
                  onClick={() => toast("Filter builder coming soon")}
                >
                  <Plus className="h-4 w-4" />
                  Add filter
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Breakdown Dimension (Optional)</Label>
                <Select value={dimension} onValueChange={setDimension}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Visualization */}
          <section>
            <h3 className="text-base font-semibold mb-4">Visualization</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map(({ value, label, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fiscal Year</Label>
                <Select value={fiscalYear} onValueChange={setFiscalYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEARS.map((fy) => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Button onClick={handleSave} className="w-full" size="lg">
            Save Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}