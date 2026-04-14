import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  budget_type: string | null;
  budget_classification: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  work_description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  site?: string;
  building?: string;
  tenant?: string;
  budget_line?: string;
  fiscal_year?: string;
  currency?: string;
  budget_type?: string;
  budget_classification?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch projects: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (input: CreateProjectInput) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: input.name,
          description: input.description || null,
          work_description: input.work_description || null,
          status: input.status || "Open",
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          total_budget: input.total_budget || 0,
          site: input.site || null,
          building: input.building || null,
          tenant: input.tenant || null,
          budget_line: input.budget_line || null,
          fiscal_year: input.fiscal_year || null,
          currency: input.currency || "PLN",
          budget_type: input.budget_type || null,
          budget_classification: input.budget_classification || null,
        })
        .select()
        .single();

      if (error) throw error;
      setProjects((prev) => [data, ...prev]);
      toast.success("Project created successfully");
      return data;
    } catch (error: any) {
      toast.error("Failed to create project: " + error.message);
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<CreateProjectInput>) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
      toast.success("Project updated successfully");
      return data;
    } catch (error: any) {
      toast.error("Failed to update project: " + error.message);
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted successfully");
      return true;
    } catch (error: any) {
      toast.error("Failed to delete project: " + error.message);
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
