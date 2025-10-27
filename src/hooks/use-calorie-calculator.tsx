import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserNutritionProfile, 
  ActivityLevel, 
  NutritionGoal,
  CalorieCalculatorResult
} from '@/types/nutrition';
import { calculateNutrition, ACTIVITY_MULTIPLIERS } from '@/lib/nutrition-calculator';
import { useToast } from '@/hooks/use-toast';

export { ACTIVITY_MULTIPLIERS };

export function useCalorieCalculator(userId?: string) {
  const [profile, setProfile] = useState<UserNutritionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalorieCalculatorResult | null>(null);
  const { toast } = useToast();

  // Fetch user nutrition profile from Supabase
  const fetchUserProfile = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, age, gender, height_cm, current_weight_kg, activity_level, health_goal')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Map database fields to our UserNutritionProfile interface
        const profile: UserNutritionProfile = {
          id: data.id,
          age: data.age || 30,
          gender: data.gender || 'male',
          height: data.height_cm || 170,
          weight: (typeof data.current_weight_kg === 'number' ? data.current_weight_kg : Number(data.current_weight_kg)) || 70,
          activityLevel: (data.activity_level as ActivityLevel) || ActivityLevel.MODERATELY_ACTIVE,
          goal: (data.health_goal as NutritionGoal) || NutritionGoal.MAINTENANCE,
        };
        
        setProfile(profile);
        
        // If we have a profile, calculate nutrition
        if (profile) {
          const result = calculateNutrition(profile);
          setCalculationResult(result);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your nutrition profile');
      toast({
        title: 'Error',
        description: 'Failed to load your nutrition profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user profile in Supabase
  const updateUserProfile = async (updatedProfile: Partial<UserNutritionProfile>) => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate new nutrition values if weight, height, age, gender, activity or goal changed
      const needsRecalculation = 
        'weight' in updatedProfile || 
        'height' in updatedProfile || 
        'age' in updatedProfile || 
        'gender' in updatedProfile || 
        'activityLevel' in updatedProfile || 
        'goal' in updatedProfile;
      
      const newProfile = { ...profile, ...updatedProfile };
      
      if (needsRecalculation) {
        const result = calculateNutrition(newProfile);
        setCalculationResult(result);
      }
      
      // Map our interface fields to database column names
      const dbData: Record<string, unknown> = {
        age: updatedProfile.age,
        gender: updatedProfile.gender,
        height_cm: updatedProfile.height,
        current_weight_kg: updatedProfile.weight,
        activity_level: updatedProfile.activityLevel,
        health_goal: updatedProfile.goal,
      };
      
      // Remove undefined values
      Object.keys(dbData).forEach(key => {
        if (dbData[key] === undefined) {
          delete dbData[key];
        }
      });
      
      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', profile.id);
      
      if (error) throw error;
      
      setProfile(newProfile);
      toast({
        title: 'Success',
        description: 'Your nutrition profile has been updated',
      });
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update your nutrition profile');
      toast({
        title: 'Error',
        description: 'Failed to update your nutrition profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate nutrition without saving to database
  const calculateOnly = (profileData: UserNutritionProfile) => {
    const result = calculateNutrition(profileData);
    return result;
  };

  // Load user profile when userId changes
  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId, fetchUserProfile]);

// Remove the duplicate import at the bottom of the file
  return {
    profile,
    calculationResult,
    isLoading,
    error,
    updateUserProfile,
    calculateOnly
  };
}