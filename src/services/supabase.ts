import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/supabase'

// 创建Supabase客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 导出类型
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          phone: string | null
          avatar_url: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          phone?: string | null
          avatar_url?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string | null
          phone?: string | null
          avatar_url?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          generic_name: string | null
          manufacturer: string | null
          specification: string | null
          form: string | null
          appearance_desc: string | null
          dosage_unit: string | null
          color: string | null
          shape: string | null
          barcode: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          generic_name?: string | null
          manufacturer?: string | null
          specification?: string | null
          form?: string | null
          appearance_desc?: string | null
          dosage_unit?: string | null
          color?: string | null
          shape?: string | null
          barcode?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          generic_name?: string | null
          manufacturer?: string | null
          specification?: string | null
          form?: string | null
          appearance_desc?: string | null
          dosage_unit?: string | null
          color?: string | null
          shape?: string | null
          barcode?: string | null
          image_url?: string | null
        }
      }
      medication_schedules: {
        Row: {
          id: string
          medication_id: string
          user_id: string
          time_of_day: string
          dosage: string
          instructions: string | null
          weekdays: number[]
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          medication_id: string
          user_id: string
          time_of_day: string
          dosage: string
          instructions?: string | null
          weekdays?: number[]
          start_date: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          time_of_day?: string
          dosage?: string
          instructions?: string | null
          weekdays?: number[]
          start_date?: string
          end_date?: string | null
          is_active?: boolean
        }
      }
      medication_logs: {
        Row: {
          id: string
          schedule_id: string
          user_id: string
          scheduled_time: string
          taken_time: string | null
          status: string
          side_effects: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          user_id: string
          scheduled_time: string
          taken_time?: string | null
          status: string
          side_effects?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          taken_time?: string | null
          status?: string
          side_effects?: string | null
          notes?: string | null
        }
      }
      health_records: {
        Row: {
          id: string
          user_id: string
          date: string
          symptoms: any
          vital_signs: any
          overall_feeling: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          symptoms?: any
          vital_signs?: any
          overall_feeling?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          symptoms?: any
          vital_signs?: any
          overall_feeling?: string | null
          notes?: string | null
        }
      }
    }
  }
}
