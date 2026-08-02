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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          department: string
          id: string
          pinned: boolean
          section: string
          semester: string
          title: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          department: string
          id?: string
          pinned?: boolean
          section: string
          semester: string
          title?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          department?: string
          id?: string
          pinned?: boolean
          section?: string
          semester?: string
          title?: string
        }
        Relationships: []
      }
      attendance_history: {
        Row: {
          id: string
          local_id: string
          marked_on: string
          payload: Json
          status: string
          subject_code: string
          ts: string
          user_id: string
        }
        Insert: {
          id?: string
          local_id: string
          marked_on?: string
          payload?: Json
          status?: string
          subject_code?: string
          ts?: string
          user_id: string
        }
        Update: {
          id?: string
          local_id?: string
          marked_on?: string
          payload?: Json
          status?: string
          subject_code?: string
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance_imports: {
        Row: {
          fingerprint: string
          id: string
          local_id: string
          payload: Json
          ts: string
          user_id: string
        }
        Insert: {
          fingerprint?: string
          id?: string
          local_id: string
          payload?: Json
          ts?: string
          user_id: string
        }
        Update: {
          fingerprint?: string
          id?: string
          local_id?: string
          payload?: Json
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      class_timetable_slots: {
        Row: {
          code: string
          created_at: string
          day: number
          department: string
          end_time: string
          faculty: string
          id: string
          name: string
          published: boolean
          room: string
          section: string
          semester: string
          session: string
          start_time: string
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          day?: number
          department: string
          end_time?: string
          faculty?: string
          id?: string
          name?: string
          published?: boolean
          room?: string
          section: string
          semester: string
          session?: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          day?: number
          department?: string
          end_time?: string
          faculty?: string
          id?: string
          name?: string
          published?: boolean
          room?: string
          section?: string
          semester?: string
          session?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      cr_requests: {
        Row: {
          created_at: string
          department: string
          id: string
          name: string
          reason: string
          section: string
          semester: string
          status: string
          user_id: string
          usn: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          name?: string
          reason?: string
          section: string
          semester: string
          status?: string
          user_id: string
          usn?: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          name?: string
          reason?: string
          section?: string
          semester?: string
          status?: string
          user_id?: string
          usn?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          author_id: string
          created_at: string
          date: string | null
          department: string
          id: string
          kind: string
          notes: string
          section: string
          semester: string
          title: string
        }
        Insert: {
          author_id: string
          created_at?: string
          date?: string | null
          department: string
          id?: string
          kind?: string
          notes?: string
          section: string
          semester: string
          title?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          date?: string | null
          department?: string
          id?: string
          kind?: string
          notes?: string
          section?: string
          semester?: string
          title?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          choice: string
          created_at: string
          id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          choice: string
          created_at?: string
          id?: string
          poll_id: string
          user_id: string
        }
        Update: {
          choice?: string
          created_at?: string
          id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          author_id: string
          closed: boolean
          created_at: string
          department: string
          id: string
          pinned: boolean
          question: string
          section: string
          semester: string
        }
        Insert: {
          author_id: string
          closed?: boolean
          created_at?: string
          department: string
          id?: string
          pinned?: boolean
          question?: string
          section: string
          semester: string
        }
        Update: {
          author_id?: string
          closed?: boolean
          created_at?: string
          department?: string
          id?: string
          pinned?: boolean
          question?: string
          section?: string
          semester?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string
          disabled: boolean
          email: string
          id: string
          last_verified_at: string | null
          photo: string | null
          reminder_enabled: boolean
          reminder_time: string
          section: string
          semester: string
          setup_complete: boolean
          student_name: string
          theme: string
          university: string
          updated_at: string
          usn: string
        }
        Insert: {
          created_at?: string
          department?: string
          disabled?: boolean
          email?: string
          id: string
          last_verified_at?: string | null
          photo?: string | null
          reminder_enabled?: boolean
          reminder_time?: string
          section?: string
          semester?: string
          setup_complete?: boolean
          student_name?: string
          theme?: string
          university?: string
          updated_at?: string
          usn?: string
        }
        Update: {
          created_at?: string
          department?: string
          disabled?: boolean
          email?: string
          id?: string
          last_verified_at?: string | null
          photo?: string | null
          reminder_enabled?: boolean
          reminder_time?: string
          section?: string
          semester?: string
          setup_complete?: boolean
          student_name?: string
          theme?: string
          university?: string
          updated_at?: string
          usn?: string
        }
        Relationships: []
      }
      roles: {
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
      subjects: {
        Row: {
          absent: number
          code: string
          created_at: string
          faculty: string
          id: string
          name: string
          present: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          absent?: number
          code: string
          created_at?: string
          faculty?: string
          id?: string
          name?: string
          present?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          absent?: number
          code?: string
          created_at?: string
          faculty?: string
          id?: string
          name?: string
          present?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timetable_slots: {
        Row: {
          code: string
          day: number
          end_time: string
          faculty: string
          id: string
          local_id: string
          name: string
          room: string
          session: string
          start_time: string
          user_id: string
        }
        Insert: {
          code?: string
          day?: number
          end_time?: string
          faculty?: string
          id?: string
          local_id: string
          name?: string
          room?: string
          session?: string
          start_time?: string
          user_id: string
        }
        Update: {
          code?: string
          day?: number
          end_time?: string
          faculty?: string
          id?: string
          local_id?: string
          name?: string
          room?: string
          session?: string
          start_time?: string
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
      in_my_class: {
        Args: { _department: string; _section: string; _semester: string }
        Returns: boolean
      }
      my_class: {
        Args: never
        Returns: {
          department: string
          section: string
          semester: string
        }[]
      }
    }
    Enums: {
      app_role: "student" | "cr" | "admin"
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
      app_role: ["student", "cr", "admin"],
    },
  },
} as const
