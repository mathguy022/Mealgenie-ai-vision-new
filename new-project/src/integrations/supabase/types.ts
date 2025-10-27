export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          age: number | null
          gender: string | null
          height_cm: number | null
          current_weight_kg: number | null
          target_weight_kg: number | null
          activity_level: string | null
          health_goal: string | null
          dietary_restrictions: string[] | null
          medical_conditions: string[] | null
          daily_calorie_target: number | null
          protein_target_g: number | null
          carbs_target_g: number | null
          fat_target_g: number | null
          budget_daily: number | null
          preferred_cuisines: string[] | null
          onboarding_completed: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          height_cm?: number | null
          current_weight_kg?: number | null
          target_weight_kg?: number | null
          activity_level?: string | null
          health_goal?: string | null
          dietary_restrictions?: string[] | null
          medical_conditions?: string[] | null
          daily_calorie_target?: number | null
          protein_target_g?: number | null
          carbs_target_g?: number | null
          fat_target_g?: number | null
          budget_daily?: number | null
          preferred_cuisines?: string[] | null
          onboarding_completed?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          height_cm?: number | null
          current_weight_kg?: number | null
          target_weight_kg?: number | null
          activity_level?: string | null
          health_goal?: string | null
          dietary_restrictions?: string[] | null
          medical_conditions?: string[] | null
          daily_calorie_target?: number | null
          protein_target_g?: number | null
          carbs_target_g?: number | null
          fat_target_g?: number | null
          budget_daily?: number | null
          preferred_cuisines?: string[] | null
          onboarding_completed?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          total_calories: number | null
          total_protein_g: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          water_intake_ml: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          log_date?: string
          total_calories?: number | null
          total_protein_g?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          water_intake_ml?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          total_calories?: number | null
          total_protein_g?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          water_intake_ml?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      meal_logs: {
        Row: {
          id: string
          user_id: string
          meal_type: string
          food_name: string
          quantity: number
          unit: string
          calculated_calories: number
          calculated_protein: number
          calculated_carbs: number
          calculated_fat: number
          scan_confidence: number | null
          logged_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          meal_type: string
          food_name: string
          quantity: number
          unit: string
          calculated_calories: number
          calculated_protein: number
          calculated_carbs: number
          calculated_fat: number
          scan_confidence?: number | null
          logged_at: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          meal_type?: string
          food_name?: string
          quantity?: number
          unit?: string
          calculated_calories?: number
          calculated_protein?: number
          calculated_carbs?: number
          calculated_fat?: number
          scan_confidence?: number | null
          logged_at?: string
          created_at?: string | null
        }
      }
      weight_entries: {
        Row: {
          id: string
          user_id: string
          weight_kg: number
          entry_date: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          weight_kg: number
          entry_date: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          weight_kg?: number
          entry_date?: string
          notes?: string | null
          created_at?: string | null
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