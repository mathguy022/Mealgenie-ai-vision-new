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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_logs: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_protein_g: number | null
          updated_at: string | null
          user_id: string
          water_intake_ml: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id: string
          water_intake_ml?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string
          water_intake_ml?: number | null
        }
        Relationships: []
      }
      food_scans: {
        Row: {
          calories: number
          carbs_g: number | null
          confidence_score: number | null
          fat_g: number | null
          food_name: string
          id: string
          image_url: string | null
          logged_to_diary: boolean | null
          portion_size: string | null
          protein_g: number | null
          scanned_at: string | null
          user_id: string
        }
        Insert: {
          calories: number
          carbs_g?: number | null
          confidence_score?: number | null
          fat_g?: number | null
          food_name: string
          id?: string
          image_url?: string | null
          logged_to_diary?: boolean | null
          portion_size?: string | null
          protein_g?: number | null
          scanned_at?: string | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          confidence_score?: number | null
          fat_g?: number | null
          food_name?: string
          id?: string
          image_url?: string | null
          logged_to_diary?: boolean | null
          portion_size?: string | null
          protein_g?: number | null
          scanned_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          plan_name: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          plan_name: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          plan_name?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          budget_daily: number | null
          carbs_target_g: number | null
          created_at: string | null
          current_weight_kg: number | null
          daily_calorie_target: number | null
          dietary_restrictions:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          email: string
          fat_target_g: number | null
          full_name: string | null
          gender: string | null
          health_goal: Database["public"]["Enums"]["health_goal"] | null
          height_cm: number | null
          id: string
          medical_conditions: string[] | null
          onboarding_completed: boolean | null
          preferred_cuisines: string[] | null
          protein_target_g: number | null
          target_weight_kg: number | null
          updated_at: string | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          budget_daily?: number | null
          carbs_target_g?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          dietary_restrictions?:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          email: string
          fat_target_g?: number | null
          full_name?: string | null
          gender?: string | null
          health_goal?: Database["public"]["Enums"]["health_goal"] | null
          height_cm?: number | null
          id: string
          medical_conditions?: string[] | null
          onboarding_completed?: boolean | null
          preferred_cuisines?: string[] | null
          protein_target_g?: number | null
          target_weight_kg?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          budget_daily?: number | null
          carbs_target_g?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          daily_calorie_target?: number | null
          dietary_restrictions?:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          email?: string
          fat_target_g?: number | null
          full_name?: string | null
          gender?: string | null
          health_goal?: Database["public"]["Enums"]["health_goal"] | null
          height_cm?: number | null
          id?: string
          medical_conditions?: string[] | null
          onboarding_completed?: boolean | null
          preferred_cuisines?: string[] | null
          protein_target_g?: number | null
          target_weight_kg?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          recorded_at: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "extremely_active"
      dietary_restriction:
        | "none"
        | "vegetarian"
        | "vegan"
        | "keto"
        | "paleo"
        | "gluten_free"
        | "dairy_free"
        | "halal"
        | "kosher"
      health_goal:
        | "weight_loss"
        | "weight_gain"
        | "muscle_building"
        | "maintenance"
        | "athletic_performance"
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
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extremely_active",
      ],
      dietary_restriction: [
        "none",
        "vegetarian",
        "vegan",
        "keto",
        "paleo",
        "gluten_free",
        "dairy_free",
        "halal",
        "kosher",
      ],
      health_goal: [
        "weight_loss",
        "weight_gain",
        "muscle_building",
        "maintenance",
        "athletic_performance",
      ],
    },
  },
} as const
