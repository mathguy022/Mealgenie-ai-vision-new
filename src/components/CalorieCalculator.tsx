import React, { useState, useEffect } from 'react';
import { useCalorieCalculator } from '@/hooks/use-calorie-calculator';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ActivityLevel, 
  NutritionGoal, 
  UserNutritionProfile 
} from '@/types/nutrition';
import { Loader2, Calculator } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import MacroBreakdown from '@/components/MacroBreakdown';
import { 
  ActivityLevel as _ActivityLevelFix, 
  NutritionGoal as _NutritionGoalFix, 
  UserNutritionProfile as _UserNutritionProfileFix, 
  CalorieCalculatorResult 
} from '@/types/nutrition';
import AIInsights from '@/components/AIInsights';

export function CalorieCalculator() {
  const { user } = useAuth();
  const { 
    profile, 
    calculationResult, 
    isLoading, 
    error, 
    updateUserProfile,
    calculateOnly
  } = useCalorieCalculator(user?.id);
  
  // Add effect to check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the calorie calculator",
        variant: "destructive"
      });
    }
  }, [user]);
  
  const [formData, setFormData] = useState<Partial<UserNutritionProfile>>({
    age: profile?.age || 30,
    gender: profile?.gender || 'male',
    height: profile?.height || 170,
    weight: profile?.weight || 70,
    activityLevel: profile?.activityLevel || ActivityLevel.MODERATELY_ACTIVE,
    goal: profile?.goal || NutritionGoal.MAINTENANCE
  });
  
  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        activityLevel: profile.activityLevel,
        goal: profile.goal
      });
    }
  }, [profile]);
  
  const handleChange = <K extends keyof UserNutritionProfile>(field: K, value: UserNutritionProfile[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const [overrideResult, setOverrideResult] = React.useState<CalorieCalculatorResult | null>(null);
  const displayResult = overrideResult || calculationResult;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.id) {
      updateUserProfile(formData);
    } else {
      const localProfile: UserNutritionProfile = {
        id: user?.id || 'local',
        age: formData.age || 30,
        gender: (formData.gender as 'male' | 'female') || 'male',
        height: formData.height || 170,
        weight: formData.weight || 70,
        activityLevel: (formData.activityLevel as ActivityLevel) || ActivityLevel.MODERATELY_ACTIVE,
        goal: (formData.goal as NutritionGoal) || NutritionGoal.MAINTENANCE,
      };
      const res = calculateOnly(localProfile);
      setOverrideResult(res);
      toast({
        title: 'Calculated locally',
        description: 'Profile not found; showing a local calculation result.'
      });
    }
  };
  
  const aiInsights = React.useMemo(() => {
    if (!displayResult?.explanation) return [] as string[];
    return displayResult.explanation
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [displayResult]);
  
  // Show authentication message if user is not logged in
  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calorie Calculator
            </CardTitle>
            <CardDescription>
              Calculate your daily calorie needs based on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="mb-4">Please sign in to use the calorie calculator</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calorie Calculator
          </CardTitle>
          <CardDescription>
            Calculate your daily calorie needs based on your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', parseInt(e.target.value))}
                  min={15}
                  max={100}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange('gender', value as 'male' | 'female')}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleChange('height', parseInt(e.target.value))}
                  min={100}
                  max={250}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => handleChange('weight', parseInt(e.target.value))}
                  min={30}
                  max={300}
                  step="0.1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => handleChange('activityLevel', value as ActivityLevel)}
                >
                  <SelectTrigger id="activityLevel">
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ActivityLevel.SEDENTARY}>Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value={ActivityLevel.LIGHTLY_ACTIVE}>Lightly Active (1-3 days/week)</SelectItem>
                    <SelectItem value={ActivityLevel.MODERATELY_ACTIVE}>Moderately Active (3-5 days/week)</SelectItem>
                    <SelectItem value={ActivityLevel.VERY_ACTIVE}>Very Active (6-7 days/week)</SelectItem>
                    <SelectItem value={ActivityLevel.EXTREMELY_ACTIVE}>Extremely Active (2x per day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal">Nutrition Goal</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(value) => handleChange('goal', value as NutritionGoal)}
                >
                  <SelectTrigger id="goal">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NutritionGoal.WEIGHT_LOSS}>Weight Loss</SelectItem>
                    <SelectItem value={NutritionGoal.MAINTENANCE}>Maintenance</SelectItem>
                    <SelectItem value={NutritionGoal.WEIGHT_GAIN}>Weight Gain</SelectItem>
                    <SelectItem value={NutritionGoal.MUSCLE_BUILDING}>Muscle Building</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {displayResult && (
        <Card>
          <CardHeader>
            <CardTitle>Your Nutrition Plan</CardTitle>
            <CardDescription>Based on your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-sm font-medium">BMR</div>
                <div className="text-2xl font-bold">{displayResult.bmr}</div>
                <div className="text-xs text-muted-foreground">calories/day</div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-sm font-medium">TDEE</div>
                <div className="text-2xl font-bold">{displayResult.tdee}</div>
                <div className="text-xs text-muted-foreground">calories/day</div>
              </div>
              
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <div className="text-sm font-medium">Daily Goal</div>
                <div className="text-2xl font-bold">{displayResult.goalCalories}</div>
                <div className="text-xs text-muted-foreground">calories/day</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Macro Breakdown</h3>
              <div className="mt-2">
                <MacroBreakdown macros={displayResult.macroBreakdown} goalCalories={displayResult.goalCalories} />
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="whitespace-pre-line">{displayResult.explanation}</p>
            </div>

            <div className="pt-2">
              <AIInsights insights={aiInsights} />
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}