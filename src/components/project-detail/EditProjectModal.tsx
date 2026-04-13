import { useState, useEffect } from "react";
import { Plus, Trash2, CalendarIcon, ChevronsUpDown, Check, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Project } from "@/hooks/useProjectDetail";

const BUILDING_OPTIONS = [
  { value: "building-a", label: "Building A - Main Office" },
  { value: "building-b", label: "Building B - Warehouse" },
  { value: "building-c", label: "Building C - Research Center" },
  { value: "building-d", label: "Building D - Manufacturing" },
];

const TENANT_OPTIONS = [
  { value: "tenant-alpha", label: "Alpha Corp" },
  { value: "tenant-beta", label: "Beta Industries" },
  { value: "tenant-gamma", label: "Gamma Solutions" },
  { value: "tenant-delta", label: "Delta Partners" },
  { value: "tenant-epsilon", label: "Epsilon Ltd" },
];

const budgetLineOptions = [
  { value: "common", label: "Common areas" },
  { value: "upgrades", label: "Upgrades" },
];

interface Contributor {
  id: string;
  name: string;
  permission: string;
}

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSave: (updates: {
    name?: string;
    description?: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    total_budget?: number;
  }) => Promise<any>;
  onDelete: () => Promise<boolean>;
}

export default function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSave,
  onDelete,
}: EditProjectModalProps) {
  const [name, setName] = useState(project.name);
  const [workDescription, setWorkDescription] = useState((project as any).work_description || "");
  const [building, setBuilding] = useState("");
  const [tenant, setTenant] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(
    project.start_date ? new Date(project.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project.end_date ? new Date(project.end_date) : undefined
  );
  const [budgetLine, setBudgetLine] = useState("");
  const [budgetLineOpen, setBudgetLineOpen] = useState(false);
  const [fiscalYear, setFiscalYear] = useState("2026");
  const [totalBudget, setTotalBudget] = useState(project.total_budget.toString());
  const [currency, setCurrency] = useState("EUR");
  const [contributors, setContributors] = useState<Contributor[]>([
    { id: "1", name: "", permission: "" }
  ]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project.name);
      setWorkDescription((project as any).work_description || "");
      setTotalBudget(project.total_budget.toString());
      setStartDate(project.start_date ? new Date(project.start_date) : undefined);
      setEndDate(project.end_date ? new Date(project.end_date) : undefined);
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const result = await onSave({
      name: name.trim(),
      work_description: workDescription.trim() || null,
      total_budget: parseFloat(totalBudget) || 0,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
    } as any);
    setSaving(false);
    if (result) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const success = await onDelete();
    setDeleting(false);
    if (success) {
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  const addContributor = () => {
    setContributors(prev => [...prev, { id: Date.now().toString(), name: "", permission: "" }]);
  };

  const updateContributor = (id: string, field: "name" | "permission", value: string) => {
    setContributors(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">
                Title<span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type the name of your project"
              />
            </div>

            {/* Work Description */}
            <div>
              <Label htmlFor="workDescription">Work description (optional)</Label>
              <textarea
                id="workDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the work to be done"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value.slice(0, 500))}
                maxLength={500}
              />
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
                {/* Building (optional) */}
                <div>
                  <Label htmlFor="building">Building (optional)</Label>
                  <Select value={building} onValueChange={setBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDING_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tenant (optional) */}
                <div>
                  <Label htmlFor="tenant">Tenant (optional)</Label>
                  <Select value={tenant} onValueChange={setTenant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Project Start & End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project start date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      initialFocus
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
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Budget line & Fiscal year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budgetLine">Budget line</Label>
                <Popover open={budgetLineOpen} onOpenChange={setBudgetLineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={budgetLineOpen}
                      className="w-full justify-between font-normal"
                    >
                      {budgetLine
                        ? budgetLineOptions.find((opt) => opt.value === budgetLine)?.label || budgetLine
                        : "Choose or type"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 z-50 bg-popover">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type..." 
                        onValueChange={(val) => setBudgetLine(val)}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <span className="text-muted-foreground text-sm">Press enter to use "{budgetLine}"</span>
                        </CommandEmpty>
                        <CommandGroup>
                          {budgetLineOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                setBudgetLine(currentValue);
                                setBudgetLineOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  budgetLine === option.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="fiscalYear">Fiscal year</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      {fiscalYear || "Select year"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 z-50 bg-popover" align="start">
                    <div className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 31 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <button
                            key={year}
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                              fiscalYear === String(year) && "bg-primary/10 font-medium"
                            )}
                            onClick={() => setFiscalYear(String(year))}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Project budget & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget (Estimated spend)</Label>
                <Input
                  id="budget"
                  type="text"
                  inputMode="decimal"
                  value={totalBudget ? Number(totalBudget).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    setTotalBudget(raw);
                  }}
                  placeholder="Type the budget"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
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

            {/* Contributors */}
            {contributors.map((contributor) => (
              <div key={contributor.id} className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project contributor</Label>
                  <Select 
                    value={contributor.name} 
                    onValueChange={(v) => updateContributor(contributor.id, "name", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose or type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anna-snow">Anna Snow</SelectItem>
                      <SelectItem value="michael-chen">Michael Chen</SelectItem>
                      <SelectItem value="john-doe">John Doe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Permission</Label>
                  <Select 
                    value={contributor.permission} 
                    onValueChange={(v) => updateContributor(contributor.id, "permission", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose or type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addContributor}
              className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add person
            </button>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete project
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone and will permanently remove the project along with all its milestones, tasks, files, and costs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
