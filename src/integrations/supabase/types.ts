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
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_title: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_title?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billable_hours: {
        Row: {
          case_id: string | null
          client_id: string | null
          created_at: string
          date: string
          description: string | null
          hours: number
          id: string
          is_sample: boolean
          rate: number
          user_id: string
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          hours?: number
          id?: string
          is_sample?: boolean
          rate?: number
          user_id: string
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          hours?: number
          id?: string
          is_sample?: boolean
          rate?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billable_hours_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billable_hours_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          case_id: string | null
          created_at: string
          date: string
          description: string | null
          end_date: string | null
          id: string
          is_sample: boolean
          location: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_sample?: boolean
          location?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_sample?: boolean
          location?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          case_id: string
          content: string
          created_at: string
          id: string
          is_sample: boolean
          user_id: string
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string
          id?: string
          is_sample?: boolean
          user_id: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string | null
          client_id: string | null
          court: string | null
          created_at: string
          description: string | null
          id: string
          is_sample: boolean
          judge: string | null
          next_hearing_date: string | null
          practice_area: string | null
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number?: string | null
          client_id?: string | null
          court?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_sample?: boolean
          judge?: string | null
          next_hearing_date?: string | null
          practice_area?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: string | null
          client_id?: string | null
          court?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_sample?: boolean
          judge?: string | null
          next_hearing_date?: string | null
          practice_area?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_sample: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_sample?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_sample?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communication_log: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          is_sample: boolean
          subject: string | null
          type: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          is_sample?: boolean
          subject?: string | null
          type?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          subject?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_checks: {
        Row: {
          created_at: string
          id: string
          query_text: string
          results: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query_text: string
          results?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query_text?: string
          results?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          case_type: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
        }
        Insert: {
          case_type?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          case_type?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          description: string | null
          expiry: string | null
          id: string
          party: string
          status: string
          title: string
          updated_at: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          expiry?: string | null
          id?: string
          party: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          expiry?: string | null
          id?: string
          party?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string | null
          created_at: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          case_id?: string | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      hearings: {
        Row: {
          case_id: string
          court: string | null
          created_at: string
          date: string
          id: string
          is_sample: boolean
          judge: string | null
          notes: string | null
          outcome: string | null
          purpose: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          court?: string | null
          created_at?: string
          date: string
          id?: string
          is_sample?: boolean
          judge?: string | null
          notes?: string | null
          outcome?: string | null
          purpose?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          court?: string | null
          created_at?: string
          date?: string
          id?: string
          is_sample?: boolean
          judge?: string | null
          notes?: string | null
          outcome?: string | null
          purpose?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          case_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          is_sample: boolean
          paid_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          is_sample?: boolean
          paid_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          case_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          is_sample?: boolean
          paid_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bar_council_number: string | null
          created_at: string
          expected_graduation_year: number | null
          firm_name: string | null
          free_access: boolean
          full_name: string | null
          id: string
          institution: string | null
          onboarding_completed: boolean
          phone: string | null
          sample_data_cleared: boolean
          sample_data_seeded: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bar_council_number?: string | null
          created_at?: string
          expected_graduation_year?: number | null
          firm_name?: string | null
          free_access?: boolean
          full_name?: string | null
          id?: string
          institution?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          sample_data_cleared?: boolean
          sample_data_seeded?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bar_council_number?: string | null
          created_at?: string
          expected_graduation_year?: number | null
          firm_name?: string | null
          free_access?: boolean
          full_name?: string | null
          id?: string
          institution?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          sample_data_cleared?: boolean
          sample_data_seeded?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_drafts: {
        Row: {
          content: string
          created_at: string
          document_type: string
          id: string
          is_sample: boolean
          parameters: Json | null
          parent_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          document_type: string
          id?: string
          is_sample?: boolean
          parameters?: Json | null
          parent_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          id?: string
          is_sample?: boolean
          parameters?: Json | null
          parent_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_drafts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "saved_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          is_sample: boolean
          query_text: string
          query_type: string
          result_summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          is_sample?: boolean
          query_text: string
          query_type?: string
          result_summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          is_sample?: boolean
          query_text?: string
          query_type?: string
          result_summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          case_id: string
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_sample: boolean
          title: string
          user_id: string
        }
        Insert: {
          case_id: string
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_sample?: boolean
          title: string
          user_id: string
        }
        Update: {
          case_id?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_sample?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accent_color: string
          created_at: string
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "student"
        | "individual_lawyer"
        | "law_firm"
        | "organization"
        | "admin"
      case_status: "active" | "pending" | "closed" | "won" | "lost" | "settled"
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
    Enums: {
      app_role: [
        "student",
        "individual_lawyer",
        "law_firm",
        "organization",
        "admin",
      ],
      case_status: ["active", "pending", "closed", "won", "lost", "settled"],
    },
  },
} as const
