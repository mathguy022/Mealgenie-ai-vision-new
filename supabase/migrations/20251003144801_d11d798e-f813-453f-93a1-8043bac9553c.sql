-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE activity_level AS ENUM (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extremely_active'
);

CREATE TYPE health_goal AS ENUM (
  'weight_loss',
  'weight_gain',
  'muscle_building',
  'maintenance',
  'athletic_performance'
);

CREATE TYPE dietary_restriction AS ENUM (
  'none',
  'vegetarian',
  'vegan',
  'keto',
  'paleo',
  'gluten_free',
  'dairy_free',
  'halal',
  'kosher'
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  height_cm INTEGER,
  current_weight_kg DECIMAL(5, 2),
  target_weight_kg DECIMAL(5, 2),
  activity_level activity_level DEFAULT 'moderately_active',
  health_goal health_goal DEFAULT 'maintenance',
  dietary_restrictions dietary_restriction[] DEFAULT ARRAY['none']::dietary_restriction[],
  medical_conditions TEXT[],
  daily_calorie_target INTEGER,
  protein_target_g INTEGER,
  carbs_target_g INTEGER,
  fat_target_g INTEGER,
  budget_daily DECIMAL(10, 2),
  preferred_cuisines TEXT[],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight tracking table
CREATE TABLE public.weight_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food scans table
CREATE TABLE public.food_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein_g DECIMAL(5, 2),
  carbs_g DECIMAL(5, 2),
  fat_g DECIMAL(5, 2),
  portion_size TEXT,
  confidence_score DECIMAL(3, 2),
  image_url TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logged_to_diary BOOLEAN DEFAULT FALSE
);

-- Daily logs table
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories INTEGER DEFAULT 0,
  total_protein_g DECIMAL(5, 2) DEFAULT 0,
  total_carbs_g DECIMAL(5, 2) DEFAULT 0,
  total_fat_g DECIMAL(5, 2) DEFAULT 0,
  water_intake_ml INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for weight_entries
CREATE POLICY "Users can view own weight entries"
  ON public.weight_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight entries"
  ON public.weight_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight entries"
  ON public.weight_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight entries"
  ON public.weight_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for food_scans
CREATE POLICY "Users can view own food scans"
  ON public.food_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food scans"
  ON public.food_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food scans"
  ON public.food_scans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food scans"
  ON public.food_scans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_logs
CREATE POLICY "Users can view own daily logs"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_meal_plans
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_daily_logs
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();