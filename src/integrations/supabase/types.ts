export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      milestone_cashflow: {
        Row: {
          budget: number | null
          contracted: number | null
          created_at: string
          forecasted: number | null
          id: string
          invoiced: number | null
          timeline_item_id: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          contracted?: number | null
          created_at?: string
          forecasted?: number | null
          id?: string
          invoiced?: number | null
          timeline_item_id: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          contracted?: number | null
          created_at?: string
          forecasted?: number | null
          id?: string
          invoiced?: number | null
          timeline_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_cashflow_timeline_item_id_fkey"
            columns: ["timeline_item_id"]
            isOneToOne: true
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_costs: {
        Row: {
          amount: number
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          issue_date: string
          issue_number: string | null
          project_id: string
          timeline_item_id: string | null
        }
        Insert: {
          amount: number
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          issue_date: string
          issue_number?: string | null
          project_id: string
          timeline_item_id?: string | null
        }
        Update: {
          amount?: number
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          issue_date?: string
          issue_number?: string | null
          project_id?: string
          timeline_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_timeline_item_id_fkey"
            columns: ["timeline_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          project_id: string
          timeline_item_id: string | null
          uploaded_at: string
        }
        Insert: {
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          project_id: string
          timeline_item_id?: string | null
          uploaded_at?: string
        }
        Update: {
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          project_id?: string
          timeline_item_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_timeline_item_id_fkey"
            columns: ["timeline_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          created_at: string
          default_template_id: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          default_template_id?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          default_template_id?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_types_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget_line: string | null
          building: string | null
          created_at: string
          currency: string | null
          description: string | null
          end_date: string | null
          fiscal_year: string | null
          id: string
          name: string
          site: string | null
          start_date: string | null
          status: string
          tenant: string | null
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          budget_line?: string | null
          building?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          fiscal_year?: string | null
          id?: string
          name: string
          site?: string | null
          start_date?: string | null
          status?: string
          tenant?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          budget_line?: string | null
          building?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_date?: string | null
          fiscal_year?: string | null
          id?: string
          name?: string
          site?: string | null
          start_date?: string | null
          status?: string
          tenant?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      timeline_items: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          include_in_cashflow: boolean
          name: string
          parent_id: string | null
          project_id: string
          sort_order: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          include_in_cashflow?: boolean
          name: string
          parent_id?: string | null
          project_id: string
          sort_order?: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          include_in_cashflow?: boolean
          name?: string
          parent_id?: string | null
          project_id?: string
          sort_order?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
