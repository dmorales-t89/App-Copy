export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          date: string
          start_time: string | null
          end_time: string | null
          color: string
          image_url: string | null
          group_id: string
          notes: string | null
          recurrence_rule: string | null
          recurrence_end_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          date: string
          start_time?: string | null
          end_time?: string | null
          color: string
          image_url?: string | null
          group_id: string
          notes?: string | null
          recurrence_rule?: string | null
          recurrence_end_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          date?: string
          start_time?: string | null
          end_time?: string | null
          color?: string
          image_url?: string | null
          group_id?: string
          notes?: string | null
          recurrence_rule?: string | null
          recurrence_end_date?: string | null
        }
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
  }
}