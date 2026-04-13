import React, { useState, useCallback, useEffect, useRef } from "react";
import { TimelineItem, ProjectFile } from "@/hooks/useProjectDetail";
import { supabase } from "@/integrations/supabase/client";
import { Plus, ChevronDown, ChevronRight, Trash2, Diamond, Columns3, GripVertical, ChevronsUpDown, Check, AlertCircle, FileText } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface TimelineV2TabProps {
  items: TimelineItem[];
  files: ProjectFile[];
  budget: number;
  contracted: number;
  invoiced: number;
  currency: string;
  budgetLc?: number;
  localCurrency?: string;
  trackingStatus: "on-track" | "off-track";
  offTrackMessage?: string;
  onCreateItem: (input: {
    type: "task" | "milestone";
    name: string;
    status: string;
    due_date?: string;
    parent_id?: string;
  }) => Promise<TimelineItem | null>;
  onUpdateItem: (id: string, updates: Partial<TimelineItem>) => Promise<TimelineItem | null>;
  onDeleteItem: (id: string) => Promise<boolean>;
}

const STATUS_OPTIONS = [
  { value: "not-started", label: "To do", color: "bg-muted text-muted-foreground" },
  { value: "in-progress", label: "In progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "done", label: "Done", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
];

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  children?: ColumnConfig[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "Name", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "due_date", label: "Due Date", visible: true },
  { id: "files", label: "Files", visible: true },
  { 
    id: "cashflow", 
    label: "Cashflow", 
    visible: true,
    children: [
      { id: "forecasted", label: "Forecasted", visible: true },
      { id: "contracted", label: "Contracted", visible: true },
      { id: "invoiced", label: "Invoiced", visible: true },
      { id: "remaining", label: "Remaining", visible: true },
    ]
  },
];

function StatusDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "px-2 py-1 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity",
            current.color
          )}
        >
          {current.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-1 z-50 bg-popover" align="start">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-xs font-medium hover:bg-muted/50",
              option.color
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function DatePickerCell({
  value,
  onChange,
  status,
}: {
  value: string | null;
  onChange: (date: string | null) => void;
  status?: string;
}) {
  const [open, setOpen] = useState(false);
  const dateValue = value ? new Date(value) : undefined;
  
  // Check if date is overdue (past due date and not done)
  const isOverdue = value && status !== "done" && isPast(parseISO(value)) && parseISO(value).toDateString() !== new Date().toDateString();

  const dateContent = (
    <button className={cn(
      "text-left text-sm hover:bg-muted/50 px-2 py-1 rounded min-w-[100px] flex items-center gap-1",
      isOverdue && "text-destructive"
    )}>
      {isOverdue && <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
      {value ? format(new Date(value), "MMM d, yyyy") : <span className="text-muted-foreground">--</span>}
    </button>
  );

  const trigger = (
    <PopoverTrigger asChild>
      {dateContent}
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {isOverdue ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {trigger}
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
              <p>Due date missed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        trigger
      )}
      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

function EditableNumericCell({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number | null | undefined;
  onChange: (val: number | null) => void;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() || "");

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(inputValue.replace(/,/g, ""));
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (inputValue.trim() === "") {
      onChange(null);
    } else {
      setInputValue(value?.toString() || "");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setInputValue(value?.toString() || "");
      setIsEditing(false);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "";
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!isEditing) {
    return (
      <span
        onClick={() => {
          setIsEditing(true);
          setInputValue(value?.toString() || "");
        }}
        className="cursor-text hover:bg-muted/50 px-2 py-1 rounded text-sm min-w-[80px] inline-block text-right"
      >
        {value !== null && value !== undefined ? formatNumber(value) : <span className="text-muted-foreground">--</span>}
      </span>
    );
  }

  return (
    <Input
      type="text"
      autoFocus
      className="h-7 text-sm text-right w-24"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
}

function EditableTextCell({
  value,
  onChange,
  placeholder = "",
}: {
  value: string | null | undefined;
  onChange: (val: string | null) => void;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue.trim() !== (value || "")) {
      onChange(inputValue.trim() || null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setInputValue(value || "");
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <span
        onClick={() => {
          setIsEditing(true);
          setInputValue(value || "");
        }}
        className="cursor-text hover:bg-muted/50 px-2 py-1 rounded text-sm min-w-[80px] inline-block"
      >
        {value || <span className="text-muted-foreground">--</span>}
      </span>
    );
  }

  return (
    <Input
      type="text"
      autoFocus
      className="h-7 text-sm w-32"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
}

function EditableNameCell({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue.trim() && inputValue !== value) {
      onChange(inputValue.trim());
    } else {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (!isEditing && value) {
    return (
      <span
        onClick={() => {
          setIsEditing(true);
          setInputValue(value);
        }}
        className={cn("cursor-text hover:bg-muted/50 px-2 py-1 rounded", className)}
      >
        {value}
      </span>
    );
  }

  return (
    <input
      type="text"
      autoFocus
      className={cn(
        "bg-transparent outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 w-full",
        className
      )}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
}

function NewItemRow({
  type,
  parentId,
  onAdd,
  placeholder,
  indented,
  visibleColumns,
}: {
  type: "milestone" | "task";
  parentId?: string;
  onAdd: (name: string) => void;
  placeholder: string;
  indented?: boolean;
  visibleColumns: string[];
}) {
  const [name, setName] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      onAdd(name.trim());
      setName("");
    }
  };

  const colCount = 1 + visibleColumns.length; // 1 for delete column

  return (
    <tr className="hover:bg-muted/30">
      <td className="py-2 px-4"></td>
      <td className={cn("py-2 px-4", indented && "pl-10")}>
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            className="bg-transparent outline-none focus:ring-1 focus:ring-primary/50 rounded px-2 py-1 w-full text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        </div>
      </td>
      {visibleColumns.slice(1).map((col) => (
        <td key={col} className="py-2 px-4">
          <span className="text-muted-foreground text-xs">--</span>
        </td>
      ))}
    </tr>
  );
}

function ColumnsDropdown({
  columns,
  onColumnsChange,
}: {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleToggle = (columnId: string, parentId?: string) => {
    const newColumns = columns.map(col => {
      if (parentId && col.id === parentId && col.children) {
        return {
          ...col,
          children: col.children.map(child => 
            child.id === columnId ? { ...child, visible: !child.visible } : child
          )
        };
      }
      if (col.id === columnId) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
    onColumnsChange(newColumns);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newColumns = [...columns];
    const draggedItem = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onColumnsChange(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 z-50 bg-popover" align="end">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="font-medium">Columns</span>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            ×
          </button>
        </div>
        <div className="p-2 max-h-[400px] overflow-y-auto">
          {columns.map((column, index) => (
            <div key={column.id}>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 py-2 px-1 rounded hover:bg-muted/50 cursor-move",
                  draggedIndex === index && "opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={column.visible}
                  onCheckedChange={() => handleToggle(column.id)}
                  className="data-[state=checked]:bg-primary"
                />
                <span className="text-sm">{column.label}</span>
              </div>
              {column.children && column.visible && (
                <div className="ml-8 border-l border-border pl-2">
                  {column.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-2 py-2 px-1 rounded hover:bg-muted/50"
                    >
                      <div className="w-4" />
                      <Switch
                        checked={child.visible}
                        onCheckedChange={() => handleToggle(child.id, column.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span className="text-sm">{child.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const DEFAULT_MILESTONES = [
  "Planning and Concept",
  "Tendering",
  "Formal Approval and Contracting",
  "Logistics and Work Kick-off",
  "Execution and Delivery",
  "Closure and Financial Settlement",
];

function MilestoneStatusWidget({
  milestones,
  allItems,
  trackingStatus,
  offTrackMessage,
}: {
  milestones: TimelineItem[];
  allItems: TimelineItem[];
  trackingStatus: "on-track" | "off-track";
  offTrackMessage?: string;
}) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done": return "Done";
      case "in-progress": return "In progress";
      default: return "To do";
    }
  };

  const getTaskProgress = (milestoneId: string) => {
    const tasks = allItems.filter(item => item.type === "task" && item.parent_id === milestoneId);
    if (tasks.length === 0) return null;
    const doneTasks = tasks.filter(t => t.status === "done").length;
    return { done: doneTasks, total: tasks.length };
  };

  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant={trackingStatus === "on-track" ? "outline" : "destructive"}
                className={cn(
                  "text-xs font-medium cursor-pointer",
                  trackingStatus === "on-track" && "bg-success/10 text-success border-success"
                )}
              >
                {trackingStatus === "on-track" ? "on track" : "off track"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className={cn(
                "p-3 max-w-xs",
                trackingStatus === "on-track" 
                  ? "bg-success/10 border border-success/20" 
                  : "bg-destructive/10 border border-destructive/20"
              )}
            >
              {trackingStatus === "on-track" ? (
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-success">On Track</p>
                    <p className="text-sm text-success">No due dates have been missed</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Diamond className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Off Track</p>
                    <p className="text-sm text-destructive">{offTrackMessage || "Some tasks or milestones have missed their due dates"}</p>
                  </div>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-start justify-between relative">
        {milestones.map((milestone, idx) => {
          const isDone = milestone.status === "done";
          const isInProgress = milestone.status === "in-progress";
          const statusLabel = getStatusLabel(milestone.status);
          const taskProgress = isInProgress ? getTaskProgress(milestone.id) : null;
          
          return (
            <div key={milestone.id} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center mb-2 transition-colors rotate-45",
                  isDone
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4 -rotate-45" />
                ) : (
                  <span className="-rotate-45 text-xs font-medium">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-[100px] leading-tight",
                  isDone ? "text-success" : "text-muted-foreground"
                )}
              >
                {milestone.name}
              </span>
              <span
                className={cn(
                  "text-[10px] text-center mt-1",
                  isDone ? "text-success" : isInProgress ? "text-primary" : "text-muted-foreground"
                )}
              >
                {statusLabel}
              </span>
              {isInProgress && taskProgress && (
                <span className="text-[10px] text-muted-foreground text-center">
                  {taskProgress.done}/{taskProgress.total} done
                </span>
              )}
            </div>
          );
        })}
        {/* Progress line */}
        <div className="absolute top-4 left-[5%] right-[5%] h-0.5 bg-border -z-0" />
      </div>
    </div>
  );
}

function BudgetWidget({ 
  budget,
  forecasted,
  contracted,
  invoiced,
  currency,
  budgetLc,
  localCurrency,
}: {
  budget: number;
  forecasted: number;
  contracted: number;
  invoiced: number;
  currency: string;
  budgetLc?: number;
  localCurrency?: string;
}) {
  // Budget Variance = Budget - max(Forecast, Contracted)
  const remaining = budget - Math.max(forecasted, contracted);
  const contractedPercent = budget > 0 ? (contracted / budget) * 100 : 0;
  const invoicedPercent = budget > 0 ? (invoiced / budget) * 100 : 0;
  const remainingPercent = budget > 0 ? (remaining / budget) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/,/g, ' ')}`;
  };

  const formatLc = (amount: number) => {
    return `${localCurrency} ${amount.toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/,/g, ' ')}`;
  };

  const showLc = localCurrency && localCurrency !== "EUR" && budgetLc != null;

  return (
    <div className="w-80 border-l border-border pl-6">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-foreground">
          Budget ({(100).toFixed(2).replace('.', ',')}%)
        </h3>
        <span className="text-lg font-bold text-foreground">{formatCurrency(budget)}</span>
      </div>
      {showLc && (
        <div className="flex justify-end mb-4">
          <span className="text-xs text-muted-foreground">{formatLc(budgetLc)}</span>
        </div>
      )}
      {!showLc && <div className="mb-4" />}

      {/* Contracted row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <span className="text-sm text-muted-foreground">
          Contracted ({contractedPercent.toFixed(1).replace('.', ',')}%)
        </span>
        <span className="ml-auto text-sm font-medium text-foreground">{formatCurrency(contracted)}</span>
      </div>

      {/* Invoiced row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        <span className="text-sm text-muted-foreground">
          Invoiced ({invoicedPercent.toFixed(1).replace('.', ',')}%)
        </span>
        <span className="ml-auto text-sm font-medium text-foreground">{formatCurrency(invoiced)}</span>
      </div>

      {/* Progress bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-2">
        <div 
          className="bg-blue-500 transition-all" 
          style={{ width: `${Math.min(invoicedPercent, 100)}%` }}
        />
        <div 
          className="bg-amber-500 transition-all"
          style={{ width: `${Math.max(0, Math.min(contractedPercent - invoicedPercent, 100 - invoicedPercent))}%` }}
        />
        <div 
          className="bg-muted-foreground/30 transition-all"
          style={{ width: `${Math.max(0, remainingPercent)}%` }}
        />
      </div>

      {/* Budget Variance row */}
      <div className="flex justify-between text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground cursor-help">
                Budget Variance ({remainingPercent.toFixed(1).replace('.', ',')}%)
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Budget Variance = Approved Budget – max(Forecast Cost, Committed Cost)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className={cn("font-medium", remaining < 0 ? "text-red-500" : "text-foreground")}>{formatCurrency(remaining)}</span>
      </div>
    </div>
  );
}

export default function TimelineV2Tab({
  items,
  files,
  budget,
  contracted: propContracted,
  invoiced: propInvoiced,
  currency,
  trackingStatus,
  offTrackMessage,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}: TimelineV2TabProps) {
  const milestones = items.filter((item) => item.type === "milestone");
  
  // Expand all milestones by default
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(
    new Set(milestones.map((i) => i.id))
  );
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const hasInitialized = useRef(false);

  // Keep milestones expanded when new ones are added
  useEffect(() => {
    setExpandedMilestones(new Set(milestones.map((i) => i.id)));
  }, [milestones.length]);

  const getTasksForMilestone = (milestoneId: string) =>
    items.filter((item) => item.type === "task" && item.parent_id === milestoneId);
  const orphanTasks = items.filter((item) => item.type === "task" && !item.parent_id);

  // Auto-create default milestones if none exist
  useEffect(() => {
    if (!hasInitialized.current && milestones.length === 0) {
      hasInitialized.current = true;
      const createMilestones = async () => {
        for (const name of DEFAULT_MILESTONES) {
          await onCreateItem({
            type: "milestone",
            name,
            status: "not-started",
          });
        }
      };
      createMilestones();
    }
  }, [milestones.length, onCreateItem]);

  const allExpanded = milestones.length > 0 && milestones.every(m => expandedMilestones.has(m.id));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedMilestones(new Set());
    } else {
      setExpandedMilestones(new Set(milestones.map(m => m.id)));
    }
  };

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddMilestone = useCallback(
    async (name: string) => {
      const result = await onCreateItem({
        type: "milestone",
        name,
        status: "not-started",
      });
      if (result) {
        setExpandedMilestones((prev) => new Set(prev).add(result.id));
      }
    },
    [onCreateItem]
  );

  const handleAddTask = useCallback(
    async (name: string, parentId?: string) => {
      await onCreateItem({
        type: "task",
        name,
        status: "not-started",
        parent_id: parentId,
      });
    },
    [onCreateItem]
  );

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      onUpdateItem(id, { status });
    },
    [onUpdateItem]
  );

  const handleDateChange = useCallback(
    (id: string, due_date: string | null) => {
      onUpdateItem(id, { due_date });
    },
    [onUpdateItem]
  );

  const handleNameChange = useCallback(
    (id: string, name: string) => {
      onUpdateItem(id, { name });
    },
    [onUpdateItem]
  );

  // Get visible columns list
  const getVisibleColumns = (): string[] => {
    const visible: string[] = [];
    columns.forEach(col => {
      if (col.visible) {
        if (col.children) {
          col.children.forEach(child => {
            if (child.visible) visible.push(child.id);
          });
        } else {
          visible.push(col.id);
        }
      }
    });
    return visible;
  };

  const visibleColumns = getVisibleColumns();

  // Local state for editable cashflow fields per milestone
  const [cashflowData, setCashflowData] = useState<Record<string, { forecasted: number | null; contracted: number | null; invoiced: number | null }>>({});
  const cashflowLoadedRef = useRef(false);

  // Load cashflow data from database
  useEffect(() => {
    const loadCashflowData = async () => {
      if (milestones.length === 0) return;
      if (cashflowLoadedRef.current) return;
      
      const milestoneIds = milestones.map(m => m.id);
      
      const { data, error } = await supabase
        .from('milestone_cashflow')
        .select('*')
        .in('timeline_item_id', milestoneIds);

      if (error) {
        console.error('Error loading cashflow data:', error);
        return;
      }

      if (data && data.length > 0) {
        const cashflowMap: Record<string, { forecasted: number | null; contracted: number | null; invoiced: number | null }> = {};
        data.forEach((item) => {
          cashflowMap[item.timeline_item_id] = {
            forecasted: item.forecasted,
            contracted: item.contracted,
            invoiced: item.invoiced,
          };
        });
        setCashflowData(cashflowMap);
        cashflowLoadedRef.current = true;
      }
    };

    loadCashflowData();
  }, [milestones]);

  // Save cashflow data to database
  const saveCashflowItem = useCallback(async (itemId: string, data: { forecasted: number | null; contracted: number | null; invoiced: number | null }) => {
    const { error } = await supabase
      .from('milestone_cashflow')
      .upsert({
        timeline_item_id: itemId,
        forecasted: data.forecasted,
        contracted: data.contracted,
        invoiced: data.invoiced,
      }, {
        onConflict: 'timeline_item_id'
      });

    if (error) {
      console.error('Error saving cashflow data:', error);
    }
  }, []);

  const updateCashflowField = useCallback((itemId: string, field: string, value: number | null) => {
    setCashflowData(prev => {
      const updated = {
        ...prev,
        [itemId]: {
          forecasted: prev[itemId]?.forecasted ?? null,
          contracted: prev[itemId]?.contracted ?? null,
          invoiced: prev[itemId]?.invoiced ?? null,
          [field]: value,
        }
      };
      // Save to database
      saveCashflowItem(itemId, updated[itemId]);
      return updated;
    });
  }, [saveCashflowItem]);

  // Calculate totals
  const totals = {
    forecasted: Object.values(cashflowData).reduce((sum, item) => sum + (item?.forecasted || 0), 0),
    contracted: Object.values(cashflowData).reduce((sum, item) => sum + (item?.contracted || 0), 0),
    invoiced: Object.values(cashflowData).reduce((sum, item) => sum + (item?.invoiced || 0), 0),
  };
  const totalRemaining = totals.forecasted - totals.contracted;

  const formatPercent = (value: number) => {
    if (budget === 0) return "0%";
    return `${((value / budget) * 100).toFixed(1)}%`;
  };

  // Get file count for a timeline item (including child tasks for milestones)
  const getFileCount = (itemId: string, isMilestone: boolean): number => {
    // Files directly assigned to this item
    const directFiles = files.filter(f => f.timeline_item_id === itemId).length;
    
    if (isMilestone) {
      // For milestones, also count files from child tasks
      const childTaskIds = items
        .filter(i => i.type === "task" && i.parent_id === itemId)
        .map(i => i.id);
      const childFiles = files.filter(f => f.timeline_item_id && childTaskIds.includes(f.timeline_item_id)).length;
      return directFiles + childFiles;
    }
    
    return directFiles;
  };

  const renderCellValue = (item: TimelineItem, columnId: string, isMilestone: boolean = false) => {
    const itemCashflow = cashflowData[item.id] || { forecasted: null, contracted: null, invoiced: null };
    const forecasted = itemCashflow.forecasted || 0;
    const contracted = itemCashflow.contracted || 0;
    const remaining = forecasted - contracted;

    switch (columnId) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            {isMilestone && (
              <>
                <button
                  onClick={() => toggleMilestone(item.id)}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {expandedMilestones.has(item.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Diamond className="h-3 w-3 text-muted-foreground" />
              </>
            )}
            <EditableNameCell
              value={item.name}
              onChange={(name) => handleNameChange(item.id, name)}
              placeholder={isMilestone ? "Milestone name" : "Task name"}
            />
          </div>
        );
      case "status":
        return (
          <StatusDropdown
            value={item.status}
            onChange={(status) => handleStatusChange(item.id, status)}
          />
        );
      case "due_date":
        return (
          <DatePickerCell
            value={item.due_date}
            onChange={(date) => handleDateChange(item.id, date)}
            status={item.status}
          />
        );
      case "files":
        const fileCount = getFileCount(item.id, isMilestone);
        return (
          <div className="flex items-center gap-1.5 text-sm px-2 py-1">
            {fileCount > 0 ? (
              <>
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{fileCount}</span>
              </>
            ) : (
              <span className="text-muted-foreground">--</span>
            )}
          </div>
        );
      case "forecasted":
        return isMilestone ? (
          <EditableNumericCell
            value={itemCashflow.forecasted}
            onChange={(val) => updateCashflowField(item.id, "forecasted", val)}
            placeholder="0"
          />
        ) : <span className="text-muted-foreground text-sm">--</span>;
      case "contracted":
        return isMilestone ? (
          <EditableNumericCell
            value={itemCashflow.contracted}
            onChange={(val) => updateCashflowField(item.id, "contracted", val)}
            placeholder="0"
          />
        ) : <span className="text-muted-foreground text-sm">--</span>;
      case "invoiced":
        return isMilestone ? (
          <EditableNumericCell
            value={itemCashflow.invoiced}
            onChange={(val) => updateCashflowField(item.id, "invoiced", val)}
            placeholder="0"
          />
        ) : <span className="text-muted-foreground text-sm">--</span>;
      case "remaining":
        return isMilestone ? (
          <span className="text-sm text-right px-2 py-1 inline-block min-w-[80px]">
            {remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        ) : <span className="text-muted-foreground text-sm">--</span>;
      default:
        return null;
    }
  };

  const cellBorder = "border border-border";

  const getColumnLabel = (colId: string): string => {
    for (const col of columns) {
      if (col.id === colId) return col.label;
      if (col.children) {
        const child = col.children.find(c => c.id === colId);
        if (child) return child.label;
      }
    }
    return colId;
  };

  return (
    <div className="p-6">
      {/* Status and Budget Widget */}
      <div className="flex mb-8 pb-6 border-b border-border">
        <MilestoneStatusWidget
          milestones={milestones}
          allItems={items}
          trackingStatus={trackingStatus}
          offTrackMessage={offTrackMessage}
        />
        <BudgetWidget
          budget={budget}
          forecasted={totals.forecasted}
          contracted={totals.contracted}
          invoiced={totals.invoiced}
          currency={currency}
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Project Plan</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll} className="gap-2">
            <ChevronsUpDown className="h-4 w-4" />
            {allExpanded ? "Collapse all" : "Expand all"}
          </Button>
          <ColumnsDropdown columns={columns} onColumnsChange={setColumns} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr>
              <th className={cn("py-3 px-4 font-medium text-muted-foreground", cellBorder, "w-[60px]")}></th>
              {visibleColumns.map((colId) => (
                <th
                  key={colId}
                  className={cn(
                    "text-left py-3 px-4 font-medium text-muted-foreground",
                    cellBorder,
                    colId === "name" && "min-w-[300px]",
                    colId === "status" && "min-w-[120px]",
                    colId === "due_date" && "min-w-[140px]",
                    ["forecasted", "contracted", "invoiced", "remaining"].includes(colId) && "min-w-[100px] text-right"
                  )}
                >
                  {getColumnLabel(colId)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {milestones.map((milestone) => {
              const isExpanded = expandedMilestones.has(milestone.id);
              const tasks = getTasksForMilestone(milestone.id);

              return (
                <React.Fragment key={milestone.id}>
                  {/* Milestone Row */}
                  <tr className="bg-muted/30 hover:bg-muted/50">
                    <td className={cn("py-2 px-4 text-center", cellBorder)}>
                      <button
                        onClick={() => onDeleteItem(milestone.id)}
                        className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                    {visibleColumns.map((colId) => (
                      <td
                        key={colId}
                        className={cn(
                          "py-2 px-4",
                          cellBorder,
                          colId === "name" && "font-medium"
                        )}
                      >
                        {renderCellValue(milestone, colId, true)}
                      </td>
                    ))}
                  </tr>

                  {/* Tasks under milestone */}
                  {isExpanded && (
                    <>
                      {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-muted/30">
                          <td className={cn("py-2 px-4 text-center", cellBorder)}>
                            <button
                              onClick={() => onDeleteItem(task.id)}
                              className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                          {visibleColumns.map((colId) => (
                            <td
                              key={colId}
                              className={cn(
                                "py-2 px-4",
                                cellBorder,
                                colId === "name" && "pl-10"
                              )}
                            >
                              {colId === "name" ? (
                                <EditableNameCell
                                  value={task.name}
                                  onChange={(name) => handleNameChange(task.id, name)}
                                  placeholder="Task name"
                                />
                              ) : (
                                renderCellValue(task, colId, false)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Add task row under milestone */}
                      <NewItemRow
                        type="task"
                        parentId={milestone.id}
                        onAdd={(name) => handleAddTask(name, milestone.id)}
                        placeholder="Add task..."
                        indented
                        visibleColumns={visibleColumns}
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* Orphan tasks (tasks without parent) */}
            {orphanTasks.length > 0 && (
              <>
                <tr>
                  <td colSpan={1 + visibleColumns.length} className="py-2 px-4 text-muted-foreground text-xs font-medium bg-muted/20">
                    Unassigned Tasks
                  </td>
                </tr>
                {orphanTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30">
                    <td className={cn("py-2 px-4 text-center", cellBorder)}>
                      <button
                        onClick={() => onDeleteItem(task.id)}
                        className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                    {visibleColumns.map((colId) => (
                      <td key={colId} className={cn("py-2 px-4", cellBorder)}>
                        {renderCellValue(task, colId, false)}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* Add new milestone row */}
            <NewItemRow
              type="milestone"
              onAdd={handleAddMilestone}
              placeholder="Add milestone..."
              visibleColumns={visibleColumns}
            />

            {/* Total row */}
            <tr className="bg-muted/50 font-semibold border-t-2 border-border">
              <td className={cn("py-3 px-4", cellBorder)}></td>
              {visibleColumns.map((colId) => (
                <td
                  key={colId}
                  className={cn(
                    "py-3 px-4",
                    cellBorder,
                    ["forecasted", "contracted", "invoiced", "remaining"].includes(colId) && "text-right"
                  )}
                >
                  {colId === "name" ? (
                    <span className="font-bold">Total</span>
                  ) : colId === "forecasted" ? (
                    <div>
                      <div>{totals.forecasted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground font-normal">{formatPercent(totals.forecasted)} of budget</div>
                    </div>
                  ) : colId === "contracted" ? (
                    <div>
                      <div>{totals.contracted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground font-normal">{formatPercent(totals.contracted)} of budget</div>
                    </div>
                  ) : colId === "invoiced" ? (
                    <div>
                      <div>{totals.invoiced.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground font-normal">{formatPercent(totals.invoiced)} of budget</div>
                    </div>
                  ) : colId === "remaining" ? (
                    <div>
                      <div>{totalRemaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground font-normal">{formatPercent(totalRemaining)} of budget</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
