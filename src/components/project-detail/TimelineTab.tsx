import { useState } from "react";
import { GripVertical, MoreHorizontal, Diamond, Circle, Clock, Plus, Pencil, Trash2, ChevronRight, ChevronDown, Paperclip, ChevronsUpDown, DollarSign, Check, ListTodo } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimelineItem, ProjectFile, ProjectCost } from "@/hooks/useProjectDetail";

interface TimelineTabProps {
  items: TimelineItem[];
  files: ProjectFile[];
  costs: ProjectCost[];
  projectCurrency?: string;
  onFilePreview: (file: { name: string; url: string; type: string }) => void;
  onCreateItem: (input: { type: "task" | "milestone"; name: string; status: string; due_date?: string; parent_id?: string; include_in_cashflow?: boolean }) => Promise<TimelineItem | null>;
  onUpdateItem: (id: string, updates: Partial<TimelineItem>) => Promise<TimelineItem | null>;
  onDeleteItem: (id: string) => Promise<boolean>;
  onReorderItems: (items: TimelineItem[]) => Promise<void>;
}

// Mock data for responsible persons
const RESPONSIBLE_PERSONS = [
  "Snow John",
  "Stark Arya",
  "Lannister Tyrion",
  "Targaryen Daenerys",
  "Baratheon Robert",
  "Greyjoy Theon",
  "Bolton Ramsay",
  "Mormont Jorah",
  "Martell Oberyn",
  "Tyrell Margaery",
];

export default function TimelineTab({ items, files, costs, projectCurrency = "EUR", onFilePreview, onCreateItem, onUpdateItem, onDeleteItem, onReorderItems }: TimelineTabProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverMilestone, setDragOverMilestone] = useState<string | null>(null);
  // Milestones expanded by default (empty set = none collapsed)
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [itemType, setItemType] = useState<"task" | "milestone">("task");
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  
  // Form state for multiple items
  interface FormItem {
    name: string;
    dueDate: string;
    status: string;
    budget: string;
    responsible: string;
    includeInCashflow: boolean;
  }
  const [formItems, setFormItems] = useState<FormItem[]>([{ name: "", dueDate: "", status: "to-do", budget: "", responsible: "", includeInCashflow: false }]);
  const [responsibleSearch, setResponsibleSearch] = useState<string[]>([]);
  const [showResponsibleDropdown, setShowResponsibleDropdown] = useState<number | null>(null);
  
  // Single form state for edit mode
  const [formName, setFormName] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] = useState("to-do");
  const [formBudget, setFormBudget] = useState("");
  const [formResponsible, setFormResponsible] = useState("");
  const [formIncludeInCashflow, setFormIncludeInCashflow] = useState(false);
  const [editResponsibleSearch, setEditResponsibleSearch] = useState("");
  const [showEditResponsibleDropdown, setShowEditResponsibleDropdown] = useState(false);
  
  // Local state to track budget and responsible per item (until DB supports these fields)
  const [itemMetadata, setItemMetadata] = useState<Record<string, { budget?: string; responsible?: string }>>({});

  // Get files assigned to a specific item
  const getFilesForItem = (itemId: string) => {
    return files.filter(f => f.timeline_item_id === itemId);
  };

  // Check if item has costs assigned
  const hasCostsForItem = (itemId: string) => {
    return costs.some(c => c.timeline_item_id === itemId);
  };

  // Get tasks that belong to a milestone
  const getTasksForMilestone = (milestoneId: string) => {
    return items.filter(item => item.parent_id === milestoneId);
  };

  // Check if milestone has any tasks
  const milestoneHasTasks = (milestoneId: string) => {
    return items.some(item => item.parent_id === milestoneId);
  };

  // Toggle milestone collapse
  const toggleMilestone = (milestoneId: string) => {
    setCollapsedMilestones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(milestoneId)) {
        newSet.delete(milestoneId);
      } else {
        newSet.add(milestoneId);
      }
      return newSet;
    });
  };

  // Expand/collapse all milestones
  const toggleAllMilestones = () => {
    const milestoneIds = items.filter(item => item.type === "milestone" && milestoneHasTasks(item.id)).map(item => item.id);
    const allCollapsed = milestoneIds.every(id => collapsedMilestones.has(id));
    
    if (allCollapsed) {
      setCollapsedMilestones(new Set());
    } else {
      setCollapsedMilestones(new Set(milestoneIds));
    }
  };

  const hasExpandableMilestones = items.some(item => item.type === "milestone" && milestoneHasTasks(item.id));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId?: string, isMilestone?: boolean) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const draggedItemData = items.find(item => item.id === draggedItem);
    if (draggedItemData?.type === "task" && isMilestone && targetId) {
      setDragOverMilestone(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverMilestone(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string, isMilestone?: boolean) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) {
      setDragOverMilestone(null);
      return;
    }

    const draggedItemData = items.find(item => item.id === draggedItem);
    const targetItemData = items.find(item => item.id === targetId);

    // If dropping a task onto a milestone, nest it
    if (draggedItemData?.type === "task" && targetItemData?.type === "milestone") {
      const newItems = items.map(item =>
        item.id === draggedItem
          ? { ...item, parent_id: targetId }
          : item
      );
      await onReorderItems(newItems);
    } else {
      // Regular reordering
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === targetId);

      const newItems = [...items];
      const [removed] = newItems.splice(draggedIndex, 1);
      if (!isMilestone && draggedItemData?.type === "task") {
        removed.parent_id = null;
      }
      newItems.splice(targetIndex, 0, removed);
      await onReorderItems(newItems);
    }
    
    setDraggedItem(null);
    setDragOverMilestone(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverMilestone(null);
  };

  const openCreateModal = (type: "task" | "milestone") => {
    setModalMode("create");
    setItemType(type);
    setFormItems([{ name: "", dueDate: "", status: "to-do", budget: "", responsible: "", includeInCashflow: false }]);
    setResponsibleSearch([]);
    setShowResponsibleDropdown(null);
    setEditingItem(null);
    setShowModal(true);
  };

  const addAnotherFormItem = () => {
    setFormItems(prev => [...prev, { name: "", dueDate: "", status: "to-do", budget: "", responsible: "", includeInCashflow: false }]);
    setResponsibleSearch(prev => [...prev, ""]);
  };

  const getFilteredPersons = (search: string) => {
    if (!search) return RESPONSIBLE_PERSONS;
    return RESPONSIBLE_PERSONS.filter(person => 
      person.toLowerCase().includes(search.toLowerCase())
    );
  };

  const updateFormItem = (index: number, field: keyof FormItem, value: string | boolean) => {
    setFormItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const openEditModal = (item: TimelineItem) => {
    setModalMode("edit");
    setItemType(item.type);
    setFormName(item.name);
    setFormDueDate(item.due_date || "");
    setFormStatus(item.status);
    setFormBudget(itemMetadata[item.id]?.budget || "");
    setFormResponsible(itemMetadata[item.id]?.responsible || "");
    setFormIncludeInCashflow(item.include_in_cashflow || false);
    setEditResponsibleSearch(itemMetadata[item.id]?.responsible || "");
    setShowEditResponsibleDropdown(false);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (modalMode === "create") {
      // Create all items that have a name
      const validItems = formItems.filter(item => item.name.trim());
      for (const item of validItems) {
        const created = await onCreateItem({
          type: itemType,
          name: item.name.trim(),
          status: item.status,
          due_date: item.dueDate || undefined,
          include_in_cashflow: item.includeInCashflow,
        });
        // Store budget and responsible in local state
        if (created && (item.budget || item.responsible)) {
          setItemMetadata(prev => ({
            ...prev,
            [created.id]: { budget: item.budget, responsible: item.responsible }
          }));
        }
      }
    } else if (editingItem) {
      if (!formName.trim()) return;
      await onUpdateItem(editingItem.id, {
        name: formName.trim(),
        status: formStatus,
        due_date: formDueDate || null,
        include_in_cashflow: formIncludeInCashflow,
      });
      // Update budget and responsible in local state
      setItemMetadata(prev => ({
        ...prev,
        [editingItem.id]: { budget: formBudget, responsible: formResponsible }
      }));
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await onDeleteItem(id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBD";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  const isMissedDueDate = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  // Render a single item row
  const renderItem = (item: TimelineItem, isNested: boolean = false) => {
    const hasTasks = item.type === "milestone" && milestoneHasTasks(item.id);
    const isCollapsed = collapsedMilestones.has(item.id);
    const isDropTarget = dragOverMilestone === item.id;
    const itemFiles = getFilesForItem(item.id);
    const itemHasCosts = hasCostsForItem(item.id);
    const missedDueDate = item.status !== "done" && isMissedDueDate(item.due_date);
    const metadata = itemMetadata[item.id];

    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => handleDragStart(e, item.id)}
        onDragOver={(e) => handleDragOver(e, item.id, item.type === "milestone")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.id, item.type === "milestone")}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex items-center gap-3 py-2 px-3 border-b border-border hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors group",
          draggedItem === item.id && "opacity-50 bg-muted",
          isNested && "ml-8 bg-muted/80 dark:bg-muted/40",
          isDropTarget && "border-primary bg-primary/10"
        )}
      >
        {/* Drag handle */}
        <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        
        {/* Expand/Collapse chevron for milestones with tasks */}
        {item.type === "milestone" && hasTasks ? (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMilestone(item.id); }}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}
        
        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => openEditModal(item)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(item.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Icon */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-5 h-5">
          {item.type === "milestone" ? (
            <Diamond 
              className={cn("h-5 w-5", item.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} 
              fill={item.status === "done" ? "currentColor" : "none"}
            />
          ) : (
            <Circle 
              className={cn("h-5 w-5", item.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} 
              fill={item.status === "done" ? "currentColor" : "none"}
            />
          )}
          {item.status === "done" && (
            <Check className="h-3 w-3 text-background absolute" strokeWidth={3} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{item.name}</div>
          <div className={cn(
            "text-sm capitalize flex items-center gap-1",
            item.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
          )}>
            {item.status === "done" && <Check className="h-3.5 w-3.5" />}
            {item.status.replace("-", " ")}
          </div>
        </div>

        {/* Cost indicator */}
        {itemHasCosts && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex-shrink-0 cursor-pointer">
                  <DollarSign className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Costs are assigned to this item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* File attachment icon */}
        {itemFiles.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onFilePreview({ name: itemFiles[0].name, url: itemFiles[0].file_url, type: itemFiles[0].file_type || "" }); }}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex-shrink-0 transition-colors"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Files are attached to this item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Budget column */}
        {metadata?.budget && (
          <div className="text-right flex-shrink-0 w-24">
            <div className="text-sm text-muted-foreground">Budget</div>
            <div className="text-sm text-foreground">
              {metadata.budget} {projectCurrency}
            </div>
          </div>
        )}

        {/* Responsible column */}
        {metadata?.responsible && (
          <div className="flex-shrink-0 w-32">
            <div className="text-sm text-muted-foreground">Responsible</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                {metadata.responsible.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <span className="text-sm text-foreground">
                {metadata.responsible.split(" ")[0]} {metadata.responsible.split(" ")[1]?.[0]}.
              </span>
            </div>
          </div>
        )}
        
        {/* Due date */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-muted-foreground">Due date</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{formatDate(item.due_date)}</span>
            {missedDueDate && (
              <span className="flex items-center gap-1 text-destructive text-sm">
                <Clock className="h-4 w-4" />
                Missed due date
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get root-level items (milestones and tasks without a parent)
  const rootItems = items.filter(item => !item.parent_id);

  return (
    <div className="p-4">
      {/* Add Button & Expand/Collapse All */}
      <div className="mb-4 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => openCreateModal("task")}>
              <Circle className="h-4 w-4 mr-2" />
              Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateModal("milestone")}>
              <Diamond className="h-4 w-4 mr-2" />
              Milestone
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.preventDefault()}>
              <Circle className="h-4 w-4 mr-2" />
              RFP
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {hasExpandableMilestones && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleAllMilestones}
            className="text-muted-foreground text-xs"
          >
            <ChevronsUpDown className="h-3 w-3 mr-1" />
            {items.filter(item => item.type === "milestone" && milestoneHasTasks(item.id)).every(m => collapsedMilestones.has(m.id)) 
              ? "Expand all" 
              : "Collapse all"}
          </Button>
        )}
      </div>

      {/* Timeline Items */}
      <div 
        className="space-y-1"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={async (e) => {
          e.preventDefault();
          if (!draggedItem) return;
          const draggedItemData = items.find(item => item.id === draggedItem);
          if (draggedItemData?.type === "task" && draggedItemData.parent_id) {
            const newItems = items.map(item =>
              item.id === draggedItem
                ? { ...item, parent_id: null }
                : item
            );
            await onReorderItems(newItems);
          }
          setDraggedItem(null);
        }}
      >
      {rootItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <ListTodo className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">No project plan yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Add milestones and tasks to create your project plan.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => openCreateModal("milestone")}>
                <Diamond className="h-4 w-4 mr-2 text-muted-foreground" />
                Add milestone
              </Button>
              <Button size="sm" onClick={() => openCreateModal("task")}>
                <Circle className="h-4 w-4 mr-2" />
                Add task
              </Button>
            </div>
          </div>
        ) : (
          rootItems.map((item) => (
            <div key={item.id}>
              {renderItem(item)}
              {/* Render nested tasks if milestone is expanded */}
              {item.type === "milestone" && !collapsedMilestones.has(item.id) && (
                getTasksForMilestone(item.id).map(task => renderItem(task, true))
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {modalMode === "create" 
                ? `Add ${itemType === "task" ? "task" : "milestone"}` 
                : `Edit ${itemType === "task" ? "task" : "milestone"}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            {modalMode === "create" ? (
              <>
                {formItems.map((formItem, index) => (
                  <div key={index} className={cn("space-y-4", index > 0 && "pt-8 mt-8 border-t-2 border-border")}>
                    {/* Row 1: Name, Status, Due Date */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`name-${index}`} className="text-sm font-medium">
                          {itemType === "milestone" ? "Milestone name" : "Task name"}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id={`name-${index}`}
                          value={formItem.name} 
                          onChange={(e) => updateFormItem(index, "name", e.target.value)}
                          placeholder={itemType === "milestone" ? "Entry space renovation done" : "Type a task name"}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`status-${index}`} className="text-sm font-medium">
                          Status<span className="text-destructive">*</span>
                        </Label>
                        <Select value={formItem.status} onValueChange={(value) => updateFormItem(index, "status", value)}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="to-do">To do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`dueDate-${index}`} className="text-sm font-medium">
                          {itemType === "milestone" ? "Milestone due date" : "Task due date"}
                        </Label>
                        <Input 
                          id={`dueDate-${index}`}
                          type="date"
                          value={formItem.dueDate} 
                          onChange={(e) => updateFormItem(index, "dueDate", e.target.value)}
                          placeholder="MM/DD/YYYY"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    {/* Row 2: Budget, Currency (text only), Responsible */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`budget-${index}`} className="text-sm font-medium">
                            Budget
                          </Label>
                          <Input 
                            id={`budget-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={formItem.budget} 
                            onChange={(e) => updateFormItem(index, "budget", e.target.value)}
                            placeholder="0.00"
                            className="mt-1.5"
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground pb-2.5">{projectCurrency}</span>
                      </div>
                      <div className="relative col-span-2">
                        <Label htmlFor={`responsible-${index}`} className="text-sm font-medium">
                          Responsible
                        </Label>
                        <Input 
                          id={`responsible-${index}`}
                          value={formItem.responsible || responsibleSearch[index] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setResponsibleSearch(prev => {
                              const newSearch = [...prev];
                              newSearch[index] = value;
                              return newSearch;
                            });
                            updateFormItem(index, "responsible", "");
                            setShowResponsibleDropdown(index);
                          }}
                          onFocus={() => setShowResponsibleDropdown(index)}
                          onBlur={() => setTimeout(() => setShowResponsibleDropdown(null), 200)}
                          placeholder="Search by surname..."
                          className="mt-1.5"
                        />
                        {showResponsibleDropdown === index && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {getFilteredPersons(responsibleSearch[index] || "").length === 0 ? (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
                            ) : (
                              getFilteredPersons(responsibleSearch[index] || "").map((person) => (
                                <button
                                  key={person}
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    updateFormItem(index, "responsible", person);
                                    setResponsibleSearch(prev => {
                                      const newSearch = [...prev];
                                      newSearch[index] = "";
                                      return newSearch;
                                    });
                                    setShowResponsibleDropdown(null);
                                  }}
                                >
                                  {person}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Row 3: Include in cost tracking checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox 
                        id={`includeInCashflow-${index}`}
                        checked={formItem.includeInCashflow}
                        onCheckedChange={(checked) => updateFormItem(index, "includeInCashflow", checked as boolean)}
                      />
                      <Label 
                        htmlFor={`includeInCashflow-${index}`} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        Include in cost tracking
                      </Label>
                    </div>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addAnotherFormItem}
                  className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Add another {itemType}
                </button>
              </>
            ) : (
              <>
                {/* Row 1: Name, Status, Due Date */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      {itemType === "milestone" ? "Milestone name" : "Task name"}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      value={formName} 
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={itemType === "milestone" ? "Entry space renovation done" : "Type a task name"}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status<span className="text-destructive">*</span>
                    </Label>
                    <Select value={formStatus} onValueChange={setFormStatus}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to-do">To do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dueDate" className="text-sm font-medium">
                      {itemType === "milestone" ? "Milestone due date" : "Task due date"}
                    </Label>
                    <Input 
                      id="dueDate" 
                      type="date"
                      value={formDueDate} 
                      onChange={(e) => setFormDueDate(e.target.value)}
                      placeholder="MM/DD/YYYY"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                {/* Row 2: Budget, Currency (text only), Responsible */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="edit-budget" className="text-sm font-medium">
                        Budget
                      </Label>
                      <Input 
                        id="edit-budget"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formBudget} 
                        onChange={(e) => setFormBudget(e.target.value)}
                        placeholder="0.00"
                        className="mt-1.5"
                      />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground pb-2.5">{projectCurrency}</span>
                  </div>
                  <div className="relative col-span-2">
                    <Label htmlFor="edit-responsible" className="text-sm font-medium">
                      Responsible
                    </Label>
                    <Input 
                      id="edit-responsible"
                      value={formResponsible || editResponsibleSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditResponsibleSearch(value);
                        setFormResponsible("");
                        setShowEditResponsibleDropdown(true);
                      }}
                      onFocus={() => setShowEditResponsibleDropdown(true)}
                      onBlur={() => setTimeout(() => setShowEditResponsibleDropdown(false), 200)}
                      placeholder="Search by surname..."
                      className="mt-1.5"
                    />
                    {showEditResponsibleDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {getFilteredPersons(editResponsibleSearch).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
                        ) : (
                          getFilteredPersons(editResponsibleSearch).map((person) => (
                            <button
                              key={person}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormResponsible(person);
                                setEditResponsibleSearch("");
                                setShowEditResponsibleDropdown(false);
                              }}
                            >
                              {person}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Row 3: Include in cost tracking checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="edit-includeInCashflow"
                    checked={formIncludeInCashflow}
                    onCheckedChange={(checked) => setFormIncludeInCashflow(checked as boolean)}
                  />
                  <Label 
                    htmlFor="edit-includeInCashflow" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Include in cost tracking
                  </Label>
                </div>
              </>
            )}
          </div>
          <div className="border-t pt-4 flex justify-end gap-3 flex-shrink-0">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="text-primary">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
