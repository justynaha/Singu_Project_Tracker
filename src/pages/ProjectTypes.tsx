import { useState, useEffect } from "react";
import { Plus, Pencil, FolderKanban, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProjectTypes, ProjectType } from "@/hooks/useProjectTypes";

export default function ProjectTypes() {
  const { projectTypes, projectTypesTree, loading, createProjectType, updateProjectType, toggleProjectTypeStatus, deleteProjectType } = useProjectTypes();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProjectType | null>(null);
  const [modalParentId, setModalParentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectType | null>(null);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ProjectType | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [initialExpandDone, setInitialExpandDone] = useState(false);

  useEffect(() => {
    if (!loading && projectTypes.length > 0 && !initialExpandDone) {
      setExpanded(new Set(projectTypes.map((pt) => pt.id)));
      setInitialExpandDone(true);
    }
  }, [loading, projectTypes, initialExpandDone]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allExpanded = projectTypes.length > 0 && projectTypes.every((pt) => expanded.has(pt.id));
  const toggleAll = () => {
    if (allExpanded) setExpanded(new Set());
    else setExpanded(new Set(projectTypes.map((pt) => pt.id)));
  };

  const openCreate = (parentId: string | null = null) => {
    setEditingType(null);
    setModalParentId(parentId);
    setName("");
    setStatus("active");
    setModalOpen(true);
    if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
  };

  const openEdit = (pt: ProjectType) => {
    setEditingType(pt);
    setModalParentId(pt.parent_id);
    setName(pt.name);
    setStatus((pt.status as "active" | "inactive") || "active");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editingType) {
      await updateProjectType(editingType.id, name.trim(), "", editingType.default_template_id, status);
    } else {
      await createProjectType(name.trim(), "", null, status, modalParentId);
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleToggleStatus = async () => {
    if (!deactivateTarget) return;
    await toggleProjectTypeStatus(deactivateTarget.id);
    setDeactivateTarget(null);
  };

  const renderRow = (pt: ProjectType, depth: number, isLastChild: boolean) => {
    const isExpanded = expanded.has(pt.id);
    const hasChildren = (pt.children || []).length > 0;
    const canExpand = depth < 2 && hasChildren;
    const canAddChild = depth < 2;

    return (
      <div key={pt.id}>
        <div
          className="flex items-center cursor-pointer transition-colors group"
          style={{
            minHeight: 44,
            borderBottom: isLastChild && !isExpanded ? "none" : "1px solid #F3F4F6",
            paddingLeft: 12,
            paddingRight: 12,
          }}
          onClick={() => canExpand && toggleExpand(pt.id)}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <div className="flex items-center flex-1 min-w-0 py-2">
            {depth > 0 && <div style={{ width: depth * 24, flexShrink: 0 }} />}
            {canExpand ? (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(pt.id); }}
                className="flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ width: 20, height: 20, borderRadius: 4, color: isExpanded ? "#374151" : "#9CA3AF", background: "transparent", border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isExpanded ? "#374151" : "#9CA3AF"; }}
              >
                <ChevronRight className="transition-transform duration-150" style={{ width: 10, height: 10, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
            ) : (
              <div style={{ width: 20, flexShrink: 0 }} />
            )}
            <span style={{ marginLeft: 6, fontSize: 14, fontWeight: 400, color: "#111827" }} className="truncate">
              {pt.name}
            </span>
          </div>
          <div style={{ width: 112, flexShrink: 0, fontSize: 13, color: pt.usage_count > 0 ? "#111827" : "#9CA3AF", textAlign: "left" }}>
            {pt.usage_count > 0 ? pt.usage_count : "—"}
          </div>
          <div style={{ width: 112, flexShrink: 0 }}>
            <span
              style={{
                display: "inline-block", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 500,
                ...(pt.status === "active"
                  ? { background: "#ECFDF5", color: "#065F46" }
                  : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #E5E7EB" }),
              }}
            >
              {pt.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <div style={{ width: 72, flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 4 }}>
            {canAddChild && (
              <button
                onClick={(e) => { e.stopPropagation(); openCreate(pt.id); }}
                className="flex items-center justify-center transition-colors"
                style={{ width: 28, height: 28, borderRadius: 4, border: "none", background: "transparent", color: "#D1D5DB" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#D1D5DB"; }}
              >
                <Plus style={{ width: 14, height: 14 }} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(pt); }}
              className="flex items-center justify-center transition-colors"
              style={{ width: 28, height: 28, borderRadius: 4, border: "none", background: "transparent", color: "#D1D5DB" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#D1D5DB"; }}
            >
              <Pencil style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
        {canExpand && isExpanded && (
          <div>
            {(pt.children || []).map((child, idx) => renderRow(child, depth + 1, idx === (pt.children || []).length - 1))}
          </div>
        )}
      </div>
    );
  };

  function renderModal() {
    return (
      <>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit work category" : modalParentId ? "Add subcategory" : "Add work category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CAPEX, FIT-OUT" />
              </div>
              {!editingType && (
                <div>
                  <Label>Parent category</Label>
                  <Select value={modalParentId || "__none__"} onValueChange={(val) => setModalParentId(val === "__none__" ? null : val)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {projectTypesTree.flatMap((pt) => [
                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>,
                        ...(pt.children || []).map((child) => (
                          <SelectItem key={child.id} value={child.id}>↳ {child.name}</SelectItem>
                        )),
                      ])}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="mb-0">Status</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: status === "active" ? "#172b4d" : "#6b778c" }}>
                    {status === "active" ? "Active" : "Inactive"}
                  </span>
                  <Switch checked={status === "active"} onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")} />
                </div>
              </div>
            </div>
            <DialogFooter className="flex !justify-between">
              {editingType ? (
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(editingType)}>Delete</Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!name.trim() || saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deactivateTarget?.status === "active" ? "Deactivate work category" : "Activate work category"}</AlertDialogTitle>
              <AlertDialogDescription>
                {deactivateTarget?.status === "active"
                  ? `Deactivating "${deactivateTarget?.name}" will hide it from new project creation. Existing projects are not affected.`
                  : `Activate "${deactivateTarget?.name}" to make it available in project creation again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleToggleStatus}>{deactivateTarget?.status === "active" ? "Deactivate" : "Activate"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete work category</AlertDialogTitle>
              <AlertDialogDescription>
                This work category may be assigned to existing projects. Deleting it will remove the category label from those projects, but the projects themselves will not be affected. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (deleteTarget) {
                    await deleteProjectType(deleteTarget.id);
                    setDeleteTarget(null);
                    setModalOpen(false);
                  }
                }}
              >
                Delete work category
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (!loading && projectTypes.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: "#f4f5f7" }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold" style={{ color: "#172b4d" }}>Work Categories</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-24">
            <FolderKanban className="h-14 w-14 mb-4" style={{ color: "#c1c7d0" }} />
            <p className="text-lg font-semibold mb-1" style={{ color: "#172b4d" }}>No work categories yet</p>
            <p className="text-sm mb-6 max-w-md text-center" style={{ color: "#6b778c" }}>
              Define work categories to classify projects during creation (e.g. CAPEX, OPEX, FIT-OUT)
            </p>
            <button
              onClick={() => openCreate(null)}
              className="flex items-center gap-1.5 h-9 px-4 rounded text-sm font-medium transition-colors"
              style={{ background: "#1C73C4", color: "#ffffff" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#155a9c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1C73C4"; }}
            >
              <Plus className="h-4 w-4" />
              Add work category
            </button>
          </div>
        </div>
        {renderModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f4f5f7" }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold" style={{ color: "#172b4d" }}>Work Categories</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 h-9 px-3 rounded text-sm font-medium transition-colors border"
              style={{ background: "#ffffff", color: "#44546f", borderColor: "#dfe1e6" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f5f7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              <ChevronRight className="transition-transform duration-150" style={{ width: 12, height: 12, transform: allExpanded ? "rotate(90deg)" : "rotate(0deg)" }} />
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
            <button
              onClick={() => openCreate(null)}
              className="flex items-center gap-1.5 h-9 px-4 rounded text-sm font-medium transition-colors"
              style={{ background: "#1C73C4", color: "#ffffff" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#155a9c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1C73C4"; }}
            >
              <Plus className="h-4 w-4" />
              Add work category
            </button>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#ffffff" }}>
          <div
            className="flex items-center"
            style={{
              background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", padding: "0 12px",
              minHeight: 36, fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            <div className="flex-1">Name</div>
            <div style={{ width: 112, flexShrink: 0 }}>Projects</div>
            <div style={{ width: 112, flexShrink: 0 }}>Status</div>
            <div style={{ width: 72, flexShrink: 0 }}></div>
          </div>
          <div>
            {loading ? (
              <div className="p-8 text-center text-sm" style={{ color: "#6b778c" }}>Loading...</div>
            ) : (
              projectTypesTree.map((pt, idx) => renderRow(pt, 0, idx === projectTypesTree.length - 1))
            )}
          </div>
        </div>

        {!loading && (
          <div className="px-3 py-2 text-xs" style={{ color: "#9CA3AF" }}>
            {projectTypesTree.length} categories · {projectTypes.length} total
          </div>
        )}
      </div>
      {renderModal()}
    </div>
  );
}
