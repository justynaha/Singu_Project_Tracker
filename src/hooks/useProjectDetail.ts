import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimelineItem {
  id: string;
  project_id: string;
  parent_id: string | null;
  type: "task" | "milestone";
  name: string;
  status: string;
  due_date: string | null;
  sort_order: number;
  include_in_cashflow: boolean;
  created_at: string;
  updated_at: string;
}

const mapTimelineItem = (item: any): TimelineItem => ({
  ...item,
  type: item.type as "task" | "milestone",
});

export interface ProjectFile {
  id: string;
  project_id: string;
  timeline_item_id: string | null;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export interface ProjectCost {
  id: string;
  project_id: string;
  timeline_item_id: string | null;
  issue_date: string;
  issue_number: string | null;
  amount: number;
  currency: string;
  description: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_budget: number;
  created_at: string;
  updated_at: string;
  site: string | null;
  building: string | null;
  tenant: string | null;
  budget_line: string | null;
  fiscal_year: string | null;
  currency: string | null;
  address: string | null;
  work_description: string | null;
}

export interface MilestoneCashflow {
  id: string;
  timeline_item_id: string;
  budget: number;
  forecasted: number;
  contracted: number;
  invoiced: number;
}

export function useProjectDetail(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [cashflowData, setCashflowData] = useState<MilestoneCashflow[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast.error("Failed to fetch project: " + error.message);
    }
  }, [projectId]);

  const fetchTimelineItems = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("timeline_items")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setTimelineItems((data || []).map(mapTimelineItem));
    } catch (error: any) {
      toast.error("Failed to fetch timeline items: " + error.message);
    }
  }, [projectId]);

  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch files: " + error.message);
    }
  }, [projectId]);

  const fetchContracts = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("project_id", projectId)
        .order("contract_date", { ascending: false });
      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch contracts: " + error.message);
    }
  }, [projectId]);

  const fetchCosts = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("project_costs")
        .select("*")
        .eq("project_id", projectId)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      setCosts(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch costs: " + error.message);
    }
  }, [projectId]);

  const fetchCashflowData = useCallback(async (milestoneIds: string[]) => {
    if (milestoneIds.length === 0) {
      setCashflowData([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("milestone_cashflow")
        .select("*")
        .in("timeline_item_id", milestoneIds);
      if (error) throw error;
      setCashflowData(data || []);
    } catch (error: any) {
      console.error("Failed to fetch cashflow data:", error.message);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    await Promise.all([fetchProject(), fetchTimelineItems(), fetchFiles(), fetchCosts(), fetchContracts()]);
    setLoading(false);
  }, [projectId, fetchProject, fetchTimelineItems, fetchFiles, fetchCosts, fetchContracts]);

  // Timeline Items CRUD
  const createTimelineItem = async (input: {
    type: "task" | "milestone";
    name: string;
    status: string;
    due_date?: string;
    parent_id?: string;
    include_in_cashflow?: boolean;
  }) => {
    if (!projectId) return null;
    try {
      const maxOrder = timelineItems.reduce((max, item) => Math.max(max, item.sort_order), -1);
      const { data, error } = await supabase
        .from("timeline_items")
        .insert({
          project_id: projectId,
          type: input.type,
          name: input.name,
          status: input.status,
          due_date: input.due_date || null,
          parent_id: input.parent_id || null,
          sort_order: maxOrder + 1,
          include_in_cashflow: input.include_in_cashflow || false,
        })
        .select()
        .single();
      if (error) throw error;
      const mappedData = mapTimelineItem(data);
      setTimelineItems((prev) => [...prev, mappedData]);
      return mappedData;
    } catch (error: any) {
      toast.error("Failed to create item: " + error.message);
      return null;
    }
  };

  const updateTimelineItem = async (id: string, updates: Partial<TimelineItem>) => {
    try {
      const { data, error } = await supabase
        .from("timeline_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const mappedData = mapTimelineItem(data);
      setTimelineItems((prev) => prev.map((item) => (item.id === id ? mappedData : item)));
      return mappedData;
    } catch (error: any) {
      toast.error("Failed to update item: " + error.message);
      return null;
    }
  };

  const deleteTimelineItem = async (id: string) => {
    try {
      const { error } = await supabase.from("timeline_items").delete().eq("id", id);
      if (error) throw error;
      setTimelineItems((prev) =>
        prev.filter((item) => item.id !== id).map((item) =>
          item.parent_id === id ? { ...item, parent_id: null } : item
        )
      );
      return true;
    } catch (error: any) {
      toast.error("Failed to delete item: " + error.message);
      return false;
    }
  };

  const reorderTimelineItems = async (items: TimelineItem[]) => {
    setTimelineItems(items);
    // Update sort_order in background
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index,
      parent_id: item.parent_id,
    }));
    for (const update of updates) {
      await supabase
        .from("timeline_items")
        .update({ sort_order: update.sort_order, parent_id: update.parent_id })
        .eq("id", update.id);
    }
  };

  // Files CRUD
  const createFile = async (input: {
    name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    timeline_item_id?: string;
  }) => {
    if (!projectId) return null;
    try {
      const { data, error } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          name: input.name,
          file_url: input.file_url,
          file_type: input.file_type || null,
          file_size: input.file_size || null,
          timeline_item_id: input.timeline_item_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      setFiles((prev) => [data, ...prev]);
      return data;
    } catch (error: any) {
      toast.error("Failed to upload file: " + error.message);
      return null;
    }
  };

  const deleteFile = async (id: string) => {
    try {
      const { error } = await supabase.from("project_files").delete().eq("id", id);
      if (error) throw error;
      setFiles((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (error: any) {
      toast.error("Failed to delete file: " + error.message);
      return false;
    }
  };

  // Costs CRUD
  const createCost = async (input: {
    issue_date: string;
    issue_number?: string;
    amount: number;
    currency: string;
    description?: string;
    attachment_name?: string;
    attachment_url?: string;
    timeline_item_id?: string;
  }) => {
    if (!projectId) return null;
    try {
      const { data, error } = await supabase
        .from("project_costs")
        .insert({
          project_id: projectId,
          issue_date: input.issue_date,
          issue_number: input.issue_number || null,
          amount: input.amount,
          currency: input.currency,
          description: input.description || null,
          attachment_name: input.attachment_name || null,
          attachment_url: input.attachment_url || null,
          timeline_item_id: input.timeline_item_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      setCosts((prev) => [data, ...prev]);
      return data;
    } catch (error: any) {
      toast.error("Failed to add cost: " + error.message);
      return null;
    }
  };

  const updateCost = async (id: string, input: {
    issue_date: string;
    issue_number?: string;
    amount: number;
    currency: string;
    description?: string;
    attachment_name?: string;
    attachment_url?: string;
    timeline_item_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from("project_costs")
        .update({
          issue_date: input.issue_date,
          issue_number: input.issue_number || null,
          amount: input.amount,
          currency: input.currency,
          description: input.description || null,
          attachment_name: input.attachment_name || null,
          attachment_url: input.attachment_url || null,
          timeline_item_id: input.timeline_item_id || null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      setCosts((prev) => prev.map((c) => (c.id === id ? data : c)));
      return data;
    } catch (error: any) {
      toast.error("Failed to update cost: " + error.message);
      return null;
    }
  };

  const deleteCost = async (id: string) => {
    try {
      const { error } = await supabase.from("project_costs").delete().eq("id", id);
      if (error) throw error;
      setCosts((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (error: any) {
      toast.error("Failed to delete cost: " + error.message);
      return false;
    }
  };

  // Project Update
  const updateProject = async (updates: {
    name?: string;
    description?: string;
    status?: string;
    start_date?: string | null;
    end_date?: string | null;
    total_budget?: number;
  }) => {
    if (!projectId) return null;
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();
      if (error) throw error;
      setProject(data);
      toast.success("Project updated successfully");
      return data;
    } catch (error: any) {
      toast.error("Failed to update project: " + error.message);
      return null;
    }
  };

  const deleteProject = useCallback(async () => {
    if (!projectId) return false;
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
      toast.success("Project deleted successfully");
      return true;
    } catch (error: any) {
      toast.error("Failed to delete project: " + error.message);
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fetch cashflow data when timeline items change
  useEffect(() => {
    const milestoneIds = timelineItems.filter(item => item.type === "milestone").map(m => m.id);
    fetchCashflowData(milestoneIds);
  }, [timelineItems, fetchCashflowData]);

  // Calculate totals from cashflow data
  const cashflowTotals = cashflowData.reduce(
    (acc, item) => ({
      budget: acc.budget + Number(item.budget || 0),
      forecasted: acc.forecasted + Number(item.forecasted || 0),
      contracted: acc.contracted + Number(item.contracted || 0),
      invoiced: acc.invoiced + Number(item.invoiced || 0),
    }),
    { budget: 0, forecasted: 0, contracted: 0, invoiced: 0 }
  );

  return {
    project,
    timelineItems,
    files,
    costs,
    contracts,
    cashflowData,
    cashflowTotals,
    loading,
    fetchAll,
    updateProject,
    deleteProject,
    createTimelineItem,
    updateTimelineItem,
    deleteTimelineItem,
    reorderTimelineItems,
    createFile,
    deleteFile,
    createCost,
    updateCost,
    deleteCost,
  };
}
