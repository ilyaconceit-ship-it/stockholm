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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_name: string | null
          created_at: string
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          id: string
          meeting_id: string
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          id?: string
          meeting_id: string
          staff_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          id?: string
          meeting_id?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist: {
        Row: {
          admin_name: string | null
          created_at: string
          date: string
          duration: string | null
          id: string
          nickname: string
          reason: string | null
          status: Database["public"]["Enums"]["blacklist_status"]
        }
        Insert: {
          admin_name?: string | null
          created_at?: string
          date?: string
          duration?: string | null
          id?: string
          nickname: string
          reason?: string | null
          status?: Database["public"]["Enums"]["blacklist_status"]
        }
        Update: {
          admin_name?: string | null
          created_at?: string
          date?: string
          duration?: string | null
          id?: string
          nickname?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["blacklist_status"]
        }
        Relationships: []
      }
      couples: {
        Row: {
          created_at: string
          id: string
          member1_discord_id: string | null
          member1_nickname: string
          member2_discord_id: string | null
          member2_nickname: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member1_discord_id?: string | null
          member1_nickname: string
          member2_discord_id?: string | null
          member2_nickname: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member1_discord_id?: string | null
          member1_nickname?: string
          member2_discord_id?: string | null
          member2_nickname?: string
          notes?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string
          date: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          title?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      norms: {
        Row: {
          completed: boolean
          id: string
          period_start: string
          slot: number
          staff_id: string
          week: number
        }
        Insert: {
          completed?: boolean
          id?: string
          period_start: string
          slot?: number
          staff_id: string
          week?: number
        }
        Update: {
          completed?: boolean
          id?: string
          period_start?: string
          slot?: number
          staff_id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "norms_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          discord_id: string | null
          id: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          discord_id?: string | null
          id: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          discord_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      salaries: {
        Row: {
          amount: number
          bonus: number
          id: string
          notes: string | null
          penalty: number
          period_start: string
          staff_id: string
          tribunes_count: number
        }
        Insert: {
          amount?: number
          bonus?: number
          id?: string
          notes?: string | null
          penalty?: number
          period_start: string
          staff_id: string
          tribunes_count?: number
        }
        Update: {
          amount?: number
          bonus?: number
          id?: string
          notes?: string | null
          penalty?: number
          period_start?: string
          staff_id?: string
          tribunes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "salaries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          ad_branches: string | null
          created_at: string
          date: string
          host1_first: string | null
          host1_second: string | null
          host2_first: string | null
          host2_second: string | null
          id: string
          time: string | null
          tribune_type: string | null
          weekday: string | null
        }
        Insert: {
          ad_branches?: string | null
          created_at?: string
          date: string
          host1_first?: string | null
          host1_second?: string | null
          host2_first?: string | null
          host2_second?: string | null
          id?: string
          time?: string | null
          tribune_type?: string | null
          weekday?: string | null
        }
        Update: {
          ad_branches?: string | null
          created_at?: string
          date?: string
          host1_first?: string | null
          host1_second?: string | null
          host2_first?: string | null
          host2_second?: string | null
          id?: string
          time?: string | null
          tribune_type?: string | null
          weekday?: string | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["staff_category"]
          created_at: string
          discord_id: string | null
          id: string
          join_date: string
          name: string | null
          nickname: string
          updated_at: string
          vacation: boolean
          warnings: string | null
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["staff_category"]
          created_at?: string
          discord_id?: string | null
          id?: string
          join_date?: string
          name?: string | null
          nickname: string
          updated_at?: string
          vacation?: boolean
          warnings?: string | null
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["staff_category"]
          created_at?: string
          discord_id?: string | null
          id?: string
          join_date?: string
          name?: string | null
          nickname?: string
          updated_at?: string
          vacation?: boolean
          warnings?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "broadcaster"
      approval_status: "pending" | "approved" | "rejected"
      attendance_status: "present" | "absent" | "excused"
      blacklist_status: "active" | "expired" | "lifted"
      staff_category:
        | "admin_branch"
        | "curator"
        | "tech_curator"
        | "master"
        | "broadcaster"
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
      app_role: ["admin", "broadcaster"],
      approval_status: ["pending", "approved", "rejected"],
      attendance_status: ["present", "absent", "excused"],
      blacklist_status: ["active", "expired", "lifted"],
      staff_category: [
        "admin_branch",
        "curator",
        "tech_curator",
        "master",
        "broadcaster",
      ],
    },
  },
} as const
