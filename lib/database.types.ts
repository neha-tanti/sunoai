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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      calls: {
        Row: {
          call_langs: string[]
          checked_at: string | null
          coaching_lang: string
          created_at: string
          created_by: string | null
          denoise: boolean
          duration_seconds: number | null
          error: string | null
          error_code: Database["public"]["Enums"]["call_error_code"] | null
          example_id: string | null
          file_path: string
          file_size_bytes: number
          gnani_job_id: string | null
          id: string
          mime_type: string
          polled_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          status_at: string
          title: string
        }
        Insert: {
          call_langs: string[]
          checked_at?: string | null
          coaching_lang: string
          created_at?: string
          created_by?: string | null
          denoise?: boolean
          duration_seconds?: number | null
          error?: string | null
          error_code?: Database["public"]["Enums"]["call_error_code"] | null
          example_id?: string | null
          file_path: string
          file_size_bytes: number
          gnani_job_id?: string | null
          id?: string
          mime_type: string
          polled_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          status_at?: string
          title: string
        }
        Update: {
          call_langs?: string[]
          checked_at?: string | null
          coaching_lang?: string
          created_at?: string
          created_by?: string | null
          denoise?: boolean
          duration_seconds?: number | null
          error?: string | null
          error_code?: Database["public"]["Enums"]["call_error_code"] | null
          example_id?: string | null
          file_path?: string
          file_size_bytes?: number
          gnani_job_id?: string | null
          id?: string
          mime_type?: string
          polled_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          status_at?: string
          title?: string
        }
        Relationships: []
      }
      checklist_checks: {
        Row: {
          active: boolean
          id: string
          name: string
          position: number
          rule: string
        }
        Insert: {
          active?: boolean
          id: string
          name: string
          position: number
          rule: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          position?: number
          rule?: string
        }
        Relationships: []
      }
      checklist_red_flags: {
        Row: {
          active: boolean
          example: string
          id: string
          name: string
          position: number
        }
        Insert: {
          active?: boolean
          example: string
          id: string
          name: string
          position: number
        }
        Update: {
          active?: boolean
          example?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      company_rules: {
        Row: {
          id: number
          text: string
          updated_at: string
        }
        Insert: {
          id?: number
          text?: string
          updated_at?: string
        }
        Update: {
          id?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          call_id: string
          checklist_snapshot: Json
          checks: Json
          coaching: Json | null
          coaching_audio_path: string | null
          created_at: string
          fix_notes: Json
          frustration: Json
          frustration_end: Database["public"]["Enums"]["mood"]
          frustration_peak: Database["public"]["Enums"]["mood"]
          handover_segment_id: number | null
          llm_model: string
          needs_review: boolean
          prompt_version: string
          red_flags: Json
          score_passed: number
          score_total: number
          speakers: Json
          summary: string
        }
        Insert: {
          call_id: string
          checklist_snapshot: Json
          checks: Json
          coaching?: Json | null
          coaching_audio_path?: string | null
          created_at?: string
          fix_notes: Json
          frustration: Json
          frustration_end: Database["public"]["Enums"]["mood"]
          frustration_peak: Database["public"]["Enums"]["mood"]
          handover_segment_id?: number | null
          llm_model: string
          needs_review: boolean
          prompt_version: string
          red_flags: Json
          score_passed: number
          score_total: number
          speakers: Json
          summary: string
        }
        Update: {
          call_id?: string
          checklist_snapshot?: Json
          checks?: Json
          coaching?: Json | null
          coaching_audio_path?: string | null
          created_at?: string
          fix_notes?: Json
          frustration?: Json
          frustration_end?: Database["public"]["Enums"]["mood"]
          frustration_peak?: Database["public"]["Enums"]["mood"]
          handover_segment_id?: number | null
          llm_model?: string
          needs_review?: boolean
          prompt_version?: string
          red_flags?: Json
          score_passed?: number
          score_total?: number
          speakers?: Json
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: true
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_segments: {
        Row: {
          call_id: string
          end_time: number
          id: number
          segment_id: number
          speaker_id: number
          start_time: number
          text: string
        }
        Insert: {
          call_id: string
          end_time: number
          id?: never
          segment_id: number
          speaker_id: number
          start_time: number
          text: string
        }
        Update: {
          call_id?: string
          end_time?: number
          id?: never
          segment_id?: number
          speaker_id?: number
          start_time?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_segments_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_check_slot: {
        Args: { p_call_id: string; p_limit: number }
        Returns: boolean
      }
      claim_gnani_poll: { Args: { p_call_id: string }; Returns: boolean }
      load_checklist: { Args: never; Returns: Json }
      save_checklist: {
        Args: {
          p_checks: Json
          p_red_flags: Json
          p_rules: string
          p_version: string
        }
        Returns: boolean
      }
      save_report: {
        Args: { p_call_id: string; p_report: Json }
        Returns: boolean
      }
      save_transcript: {
        Args: {
          p_call_id: string
          p_duration_seconds: number
          p_segments: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      call_error_code:
        | "file_rejected"
        | "transcription_failed"
        | "no_speech"
        | "too_long"
        | "analysis_failed"
        | "gnani_failed"
      call_status:
        | "uploaded"
        | "transcribing"
        | "analyzing"
        | "ready"
        | "failed"
      mood: "calm" | "annoyed" | "angry"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      call_error_code: [
        "file_rejected",
        "transcription_failed",
        "no_speech",
        "too_long",
        "analysis_failed",
        "gnani_failed",
      ],
      call_status: ["uploaded", "transcribing", "analyzing", "ready", "failed"],
      mood: ["calm", "annoyed", "angry"],
    },
  },
} as const
