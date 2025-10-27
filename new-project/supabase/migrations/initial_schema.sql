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
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5, 2) NOT NULL,
  entry_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily nutrition logs
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories INTEGER DEFAULT 0,
  total_protein_g INTEGER DEFAULT 0,
  total_carbs_g INTEGER DEFAULT 0,
  total_fat_g INTEGER DEFAULT 0,
  water_intake_ml INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Individual meal logs
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  quantity DECIMAL(6, 2) NOT NULL,
  unit TEXT NOT NULL,
  calculated_calories INTEGER NOT NULL,
  calculated_protein INTEGER NOT NULL,
  calculated_carbs INTEGER NOT NULL,
  calculated_fat INTEGER NOT NULL,
  scan_confidence DECIMAL(4, 2),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Weight entries policies
CREATE POLICY "Users can view their own weight entries" 
  ON public.weight_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries" 
  ON public.weight_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries" 
  ON public.weight_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries" 
  ON public.weight_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Daily logs policies
CREATE POLICY "Users can view their own daily logs" 
  ON public.daily_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily logs" 
  ON public.daily_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs" 
  ON public.daily_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Meal logs policies
CREATE POLICY "Users can view their own meal logs" 
  ON public.meal_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs" 
  ON public.meal_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs" 
  ON public.meal_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs" 
  ON public.meal_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_daily_logs_modtime
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();