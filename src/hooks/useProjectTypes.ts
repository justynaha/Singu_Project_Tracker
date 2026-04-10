import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  default_template_id: string | null;
  status: string;
  created_at: string;
  usage_count: number;
  parent_id: string | null;
  children?: ProjectType[];
}

function buildTree(items: ProjectType[]): ProjectType[] {
  const map = new Map<string, ProjectType>();
  const roots: ProjectType[] = [];
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));
  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function useProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectTypesTree, setProjectTypesTree] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectTypes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("project_types").select("*").order("name");
    if (error) {
      toast.error("Failed to load work categories");
      setLoading(false);
      return;
    }
    const flat = (data || []).map((pt: any) => ({
      ...pt,
      parent_id: pt.parent_id || null,
      status: pt.status || "active",
      usage_count: 0,
    }));
    setProjectTypes(flat);
    setProjectTypesTree(buildTree(flat));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjectTypes();
  }, [fetchProjectTypes]);

  const createProjectType = async (name: string, description?: string, default_template_id?: string | null, status?: string, parent_id?: string | null) => {
    const insertData: any = { name, description: description || null, default_template_id: default_template_id || null, status: status || "active" };
    if (parent_id) insertData.parent_id = parent_id;
    const { data, error } = await supabase.from("project_types").insert(insertData).select().single();
    if (error) {
      toast.error(error.message.includes("duplicate") ? "This work category already exists" : "Failed to create work category");
      return null;
    }
    toast.success("Work category created");
    await fetchProjectTypes();
    return data;
  };

  const updateProjectType = async (id: string, name: string, description?: string, default_template_id?: string | null, status?: string) => {
    const updateData: any = { name, description: description || null, default_template_id: default_template_id !== undefined ? default_template_id : null };
    if (status !== undefined) updateData.status = status;
    const { error } = await supabase.from("project_types").update(updateData).eq("id", id);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "This work category already exists" : "Failed to update work category");
      return false;
    }
    toast.success("Work category updated");
    await fetchProjectTypes();
    return true;
  };

  const toggleProjectTypeStatus = async (id: string) => {
    const pt = projectTypes.find((p) => p.id === id);
    if (!pt) return false;
    const newStatus = pt.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("project_types").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      return false;
    }
    toast.success(newStatus === "active" ? "Work category activated" : "Work category deactivated");
    await fetchProjectTypes();
    return true;
  };

  const deleteProjectType = async (id: string) => {
    const { error } = await supabase.from("project_types").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete work category");
      return false;
    }
    toast.success("Work category deleted");
    await fetchProjectTypes();
    return true;
  };

  return { projectTypes, projectTypesTree, loading, fetchProjectTypes, createProjectType, updateProjectType, deleteProjectType, toggleProjectTypeStatus };
}
