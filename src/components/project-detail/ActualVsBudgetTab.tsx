import { useState, useRef } from "react";
import { Plus, Paperclip, CalendarIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimelineItem, ProjectCost } from "@/hooks/useProjectDetail";

interface CostInput {
  issue_date: string;
  issue_number?: string;
  amount: number;
  currency: string;
  description?: string;
  attachment_name?: string;
  attachment_url?: string;
  timeline_item_id?: string;
}

interface ActualVsBudgetTabProps {
  timelineItems: TimelineItem[];
  costs: ProjectCost[];
  totalBudget: number;
  onCreateCost: (input: CostInput) => Promise<ProjectCost | null>;
  onUpdateCost: (id: string, input: CostInput) => Promise<ProjectCost | null>;
  onDeleteCost: (id: string) => Promise<boolean>;
}

const currencies = ["USD", "EUR", "GBP", "PLN", "CHF"];

export default function ActualVsBudgetTab({ 
  timelineItems, 
  costs, 
  totalBudget, 
  onCreateCost, 
  onUpdateCost,
  onDeleteCost 
}: ActualVsBudgetTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<ProjectCost | null>(null);
  const [issueDate, setIssueDate] = useState<Date>();
  const [issueNumber, setIssueNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total spent
  const totalSpent = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
  const budgetUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const resetForm = () => {
    setIssueDate(undefined);
    setIssueNumber("");
    setAmount("");
    setCurrency("");
    setDescription("");
    setAttachmentName("");
    setSelectedTaskId("");
    setEditingCost(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (cost: ProjectCost) => {
    setEditingCost(cost);
    setIssueDate(new Date(cost.issue_date));
    setIssueNumber(cost.issue_number || "");
    setAmount(cost.amount.toString());
    setCurrency(cost.currency);
    setDescription(cost.description || "");
    setAttachmentName(cost.attachment_name || "");
    setSelectedTaskId(cost.timeline_item_id || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!issueDate || !issueNumber || !amount || !currency) return;

    const input: CostInput = {
      issue_date: issueDate.toISOString().split("T")[0],
      issue_number: issueNumber,
      amount: parseFloat(amount),
      currency,
      description: description || undefined,
      attachment_name: attachmentName || undefined,
      timeline_item_id: selectedTaskId && selectedTaskId !== "none" ? selectedTaskId : undefined,
    };

    if (editingCost) {
      await onUpdateCost(editingCost.id, input);
    } else {
      await onCreateCost(input);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setAttachmentName(file.name);
    }
  };

  // Group costs by month
  const costsByMonth = costs.reduce((acc, cost) => {
    const monthKey = format(new Date(cost.issue_date), "MMMM yyyy");
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(cost);
    return acc;
  }, {} as Record<string, ProjectCost[]>);

  // Sort months in reverse chronological order
  const sortedMonths = Object.keys(costsByMonth).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  const getTaskName = (taskId: string | null) => {
    if (!taskId) return "-";
    const task = timelineItems.find(item => item.id === taskId);
    return task?.name || "-";
  };

  const formatCurrency = (amount: number, curr: string) => {
    return `${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
  };

  return (
    <div className="p-4">
      {/* Add Cost Button */}
      <div className="mb-4">
        <Button size="sm" onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-1" />
          Add cost
        </Button>
      </div>

      {/* Costs Table Grouped by Month */}
      {costs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No costs added yet. Click "Add cost" to add your first invoice.
        </div>
      ) : (
        <div className="space-y-0">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[120px]">Issue Date</TableHead>
                  <TableHead className="w-[120px]">Issue Number</TableHead>
                  <TableHead className="text-right w-[150px]">Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[150px]">Task</TableHead>
                  <TableHead className="w-[80px]">Attachment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMonths.map((month) => (
                  <>
                    {/* Month Header Row */}
                    <TableRow key={`month-${month}`} className="bg-muted/70">
                      <TableCell colSpan={7} className="font-semibold text-sm py-2">
                        {month}
                      </TableCell>
                    </TableRow>
                    {costsByMonth[month].map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(cost)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                        <TableCell>{format(new Date(cost.issue_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium">{cost.issue_number}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(cost.amount, cost.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {cost.description || "-"}
                        </TableCell>
                        <TableCell>{getTaskName(cost.timeline_item_id)}</TableCell>
                        <TableCell>
                          {cost.attachment_name ? (
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
                {/* Global Total Row */}
                <TableRow className="bg-primary/10 font-semibold border-t-2 border-primary/20">
                  <TableCell></TableCell>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">
                    <div>{formatCurrency(totalSpent, costs[0]?.currency || "USD")}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {budgetUsedPercent.toFixed(1)}% of budget used
                    </div>
                  </TableCell>
                  <TableCell colSpan={3}>
                    <div className="text-xs text-muted-foreground font-normal">
                      Remaining: {formatCurrency(totalBudget - totalSpent, costs[0]?.currency || "USD")}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Add/Edit Cost Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCost ? "Edit cost" : "Add cost"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Issue Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Issue date<span className="text-destructive">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !issueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? format(issueDate, "MM/dd/yyyy") : "MM/DD/YYYY"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={setIssueDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Issue Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Issue number<span className="text-destructive">*</span>
              </label>
              <Input
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
                placeholder=""
              />
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Amount<span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Currency<span className="text-destructive">*</span>
                </label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachment</label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {attachmentName ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Paperclip className="h-4 w-4" />
                    {attachmentName}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Drag & drop files here or{" "}
                    <span className="text-primary font-medium">Click to browse</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assign to Task/Milestone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to task/milestone (optional)</label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {timelineItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.type === "milestone" ? "◆ " : ""}{item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!issueDate || !issueNumber || !amount || !currency}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
