/**
 * Auto-generated Supabase database types.
 *
 * Generated via Supabase MCP `generate_typescript_types` on 2026-05-11.
 * Re-generate when the schema changes (after migrations).
 *
 * Used by:
 *   src/lib/supabase/client.ts       — admin client
 *   src/lib/supabase/browser.ts      — browser client
 *   src/lib/supabase/server.ts       — server client
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      breed_chunks: {
        Row: {
          breed: string
          content: string
          doc_version: string
          embedding: string | null
          id: string
          page_ref: string
          source: string
          source_url: string
        }
        Insert: {
          breed: string
          content: string
          doc_version?: string
          embedding?: string | null
          id?: string
          page_ref?: string
          source: string
          source_url?: string
        }
        Update: {
          breed?: string
          content?: string
          doc_version?: string
          embedding?: string | null
          id?: string
          page_ref?: string
          source?: string
          source_url?: string
        }
        Relationships: []
      }
      chat_usage: {
        Row: {
          count: number
          date: string
          user_id: string
        }
        Insert: {
          count?: number
          date: string
          user_id: string
        }
        Update: {
          count?: number
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      community_submissions: {
        Row: {
          breed: string
          created_at: string | null
          doc_version: string
          file_size: number
          filename: string
          id: string
          reviewed: boolean
          source_url: string
        }
        Insert: {
          breed: string
          created_at?: string | null
          doc_version?: string
          file_size: number
          filename: string
          id?: string
          reviewed?: boolean
          source_url?: string
        }
        Update: {
          breed?: string
          created_at?: string | null
          doc_version?: string
          file_size?: number
          filename?: string
          id?: string
          reviewed?: boolean
          source_url?: string
        }
        Relationships: []
      }
      custom_exercises: {
        Row: {
          active: boolean
          created_at: string
          dog_id: string
          exercise_id: string
          id: string
          label: string
          prompt: string
          spec: Json
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dog_id: string
          exercise_id: string
          id?: string
          label: string
          prompt: string
          spec: Json
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dog_id?: string
          exercise_id?: string
          id?: string
          label?: string
          prompt?: string
          spec?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_exercises_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_exercise_metrics: {
        Row: {
          breed: string
          created_at: string
          criteria_level_id: string | null
          date: string
          dog_id: string
          exercise_id: string
          fail_count: number
          latency_bucket: string | null
          notes: string | null
          success_count: number
          updated_at: string
        }
        Insert: {
          breed: string
          created_at?: string
          criteria_level_id?: string | null
          date: string
          dog_id: string
          exercise_id: string
          fail_count?: number
          latency_bucket?: string | null
          notes?: string | null
          success_count?: number
          updated_at?: string
        }
        Update: {
          breed?: string
          created_at?: string
          criteria_level_id?: string | null
          date?: string
          dog_id?: string
          exercise_id?: string
          fail_count?: number
          latency_bucket?: string | null
          notes?: string | null
          success_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_exercise_metrics_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_progress: {
        Row: {
          breed: string
          created_at: string | null
          date: string
          dog_id: string
          exercise_id: string
          id: string
          reps_done: number
        }
        Insert: {
          breed: string
          created_at?: string | null
          date: string
          dog_id: string
          exercise_id: string
          id?: string
          reps_done?: number
        }
        Update: {
          breed?: string
          created_at?: string | null
          date?: string
          dog_id?: string
          exercise_id?: string
          id?: string
          reps_done?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_profiles: {
        Row: {
          assessment: Json | null
          birthdate: string
          breed: string
          castration_status: string | null
          created_at: string
          id: string
          name: string
          onboarding: Json | null
          sex: string | null
          training_week: number
          user_id: string
        }
        Insert: {
          assessment?: Json | null
          birthdate: string
          breed: string
          castration_status?: string | null
          created_at?: string
          id?: string
          name: string
          onboarding?: Json | null
          sex?: string | null
          training_week?: number
          user_id: string
        }
        Update: {
          assessment?: Json | null
          birthdate?: string
          breed?: string
          castration_status?: string | null
          created_at?: string
          id?: string
          name?: string
          onboarding?: Json | null
          sex?: string | null
          training_week?: number
          user_id?: string
        }
        Relationships: []
      }
      heat_cycles: {
        Row: {
          created_at: string
          dog_id: string
          ended_at: string | null
          id: string
          started_at: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "heat_cycles_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_logs: {
        Row: {
          breed: string
          created_at: string | null
          dog_id: string
          exercises: Json | null
          focus: number
          handler_consistency: number | null
          handler_reading: number | null
          handler_timing: number | null
          id: string
          notes: string | null
          obedience: number
          quick_rating: string
          user_id: string | null
          week_number: number
        }
        Insert: {
          breed: string
          created_at?: string | null
          dog_id: string
          exercises?: Json | null
          focus: number
          handler_consistency?: number | null
          handler_reading?: number | null
          handler_timing?: number | null
          id?: string
          notes?: string | null
          obedience: number
          quick_rating: string
          user_id?: string | null
          week_number: number
        }
        Update: {
          breed?: string
          created_at?: string | null
          dog_id?: string
          exercises?: Json | null
          focus?: number
          handler_consistency?: number | null
          handler_reading?: number | null
          handler_timing?: number | null
          id?: string
          notes?: string | null
          obedience?: number
          quick_rating?: string
          user_id?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      takedown_requests: {
        Row: {
          breed: string
          contact: string
          created_at: string | null
          id: string
          reason: string
          source: string
        }
        Insert: {
          breed: string
          contact?: string
          created_at?: string | null
          id?: string
          reason: string
          source: string
        }
        Update: {
          breed?: string
          contact?: string
          created_at?: string | null
          id?: string
          reason?: string
          source?: string
        }
        Relationships: []
      }
      training_cache: {
        Row: {
          breed: string
          content: string
          created_at: string | null
          dog_id: string | null
          id: string
          source: string
          week_number: number
        }
        Insert: {
          breed: string
          content: string
          created_at?: string | null
          dog_id?: string | null
          id?: string
          source?: string
          week_number: number
        }
        Update: {
          breed?: string
          content?: string
          created_at?: string | null
          dog_id?: string | null
          id?: string
          source?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_cache_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          active_dog_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_dog_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_dog_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_active_dog_id_fkey"
            columns: ["active_dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_focus: {
        Row: {
          dog_id: string
          focus_areas: Json
          iso_week: string
          updated_at: string
        }
        Insert: {
          dog_id: string
          focus_areas?: Json
          iso_week: string
          updated_at?: string
        }
        Update: {
          dog_id?: string
          focus_areas?: Json
          iso_week?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_focus_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: {
      match_breed_chunks: {
        Args: {
          match_breed: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          doc_version: string
          id: string
          page_ref: string
          similarity: number
          source: string
          source_url: string
        }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
