import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height_cm: '',
    current_weight_kg: '',
    target_weight_kg: '',
    activity_level: 'moderately_active',
    health_goal: 'maintenance',
    dietary_restrictions: [] as string[],
    medical_conditions: [] as string[],
    budget_daily: '',
    preferred_cuisines: [] as string[],
  });

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (6-7 days/week)' },
    { value: 'extremely_active', label: 'Extremely Active (athlete)' },
  ];

  const healthGoals = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'weight_gain', label: 'Weight Gain' },
    { value: 'muscle_building', label: 'Muscle Building' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'athletic_performance', label: 'Athletic Performance' },
  ];

  const dietaryOptions = [
    'vegetarian', 'vegan', 'keto', 'paleo', 
    'gluten_free', 'dairy_free', 'halal', 'kosher'
  ];

  const cuisineOptions = [
    'Italian', 'Asian', 'Mediterranean', 'Mexican', 
    'Indian', 'American', 'Middle Eastern', 'Japanese'
  ];

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const calculateTargets = () => {
    const weight = parseFloat(formData.current_weight_kg);
    const height = parseFloat(formData.height_cm);
    const age = parseInt(formData.age);
    
    // Simple BMR calculation (Harris-Benedict)
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    if (formData.gender === 'male') bmr += 5;
    else bmr -= 161;
    
    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    };
    
    const tdee = bmr * (activityMultipliers[formData.activity_level] || 1.55);
    
    // Goal adjustments
    let calorieTarget = tdee;
    if (formData.health_goal === 'weight_loss') calorieTarget -= 500;
    if (formData.health_goal === 'weight_gain') calorieTarget += 500;
    
    // Macro targets (rough estimates)
    const protein = weight * 2; // 2g per kg
    const fat = (calorieTarget * 0.25) / 9; // 25% of calories
    const carbs = (calorieTarget - (protein * 4) - (fat * 9)) / 4;
    
    return {
      daily_calorie_target: Math.round(calorieTarget),
      protein_target_g: Math.round(protein),
      carbs_target_g: Math.round(carbs),
      fat_target_g: Math.round(fat),
    };
  };

  const handleSubmit = async () => {
    try {
      if (!user) return;
      
      const targets = calculateTargets();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          age: parseInt(formData.age),
          gender: formData.gender,
          height_cm: parseInt(formData.height_cm),
          current_weight_kg: parseFloat(formData.current_weight_kg),
          target_weight_kg: parseFloat(formData.target_weight_kg),
          activity_level: formData.activity_level,
          health_goal: formData.health_goal,
          dietary_restrictions: (formData.dietary_restrictions.length > 0 
            ? formData.dietary_restrictions 
            : ['none']),
          medical_conditions: formData.medical_conditions,
          budget_daily: formData.budget_daily ? parseFloat(formData.budget_daily) : null,
          preferred_cuisines: formData.preferred_cuisines,
          onboarding_completed: true,
          ...targets,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile completed!',
        description: 'Welcome to MealGenie AI. Let\'s start your journey!',
      });
      
      navigate('/dashboard');
    } catch (error: unknown) {
      toast({
        title: 'Error saving profile',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-2xl shadow-soft relative animate-fade-in border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
              MealGenie AI
            </h1>
            <CardTitle className="text-xl">Complete Your Profile</CardTitle>
            <CardDescription className="text-base">
              Step {step} of {totalSteps} - Personalize your nutrition journey
            </CardDescription>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-3" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2 pb-4 border-b">
                <h3 className="text-xl font-bold">Let's Get Started</h3>
                <p className="text-sm text-muted-foreground">Tell us about yourself</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-weight">Current Weight (kg)</Label>
                  <Input
                    id="current-weight"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={formData.current_weight_kg}
                    onChange={(e) => setFormData({ ...formData, current_weight_kg: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-weight">Target Weight (kg)</Label>
                  <Input
                    id="target-weight"
                    type="number"
                    step="0.1"
                    placeholder="65"
                    value={formData.target_weight_kg}
                    onChange={(e) => setFormData({ ...formData, target_weight_kg: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2 pb-4 border-b">
                <h3 className="text-xl font-bold">Your Lifestyle</h3>
                <p className="text-sm text-muted-foreground">How active are you?</p>
              </div>
              
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={formData.activity_level} onValueChange={(value) => setFormData({ ...formData, activity_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Health Goal</Label>
                <Select value={formData.health_goal} onValueChange={(value) => setFormData({ ...formData, health_goal: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {healthGoals.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2 pb-4 border-b">
                <h3 className="text-xl font-bold">Your Preferences</h3>
                <p className="text-sm text-muted-foreground">What do you like to eat?</p>
              </div>
              
              <div className="space-y-2">
                <Label>Dietary Restrictions (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {dietaryOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={formData.dietary_restrictions.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              dietary_restrictions: [...formData.dietary_restrictions, option],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              dietary_restrictions: formData.dietary_restrictions.filter((r) => r !== option),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={option} className="text-sm font-normal capitalize cursor-pointer">
                        {option.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Cuisines</Label>
                <div className="grid grid-cols-2 gap-3">
                  {cuisineOptions.map((cuisine) => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        id={cuisine}
                        checked={formData.preferred_cuisines.includes(cuisine)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              preferred_cuisines: [...formData.preferred_cuisines, cuisine],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              preferred_cuisines: formData.preferred_cuisines.filter((c) => c !== cuisine),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={cuisine} className="text-sm font-normal cursor-pointer">
                        {cuisine}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2 pb-4 border-b">
                <h3 className="text-xl font-bold">Almost There!</h3>
                <p className="text-sm text-muted-foreground">Final touches for your plan</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget">Daily Food Budget (optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  placeholder="20.00"
                  value={formData.budget_daily}
                  onChange={(e) => setFormData({ ...formData, budget_daily: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This helps us suggest meal plans within your budget
                </p>
              </div>
              
              <div className="p-6 gradient-primary rounded-xl text-white shadow-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <p className="font-bold text-lg">Ready to Transform!</p>
                    <p className="text-sm text-white/90">
                      MealGenie AI will create a personalized meal plan and nutrition targets tailored just for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              size="lg"
              className="min-w-[120px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {step < totalSteps ? (
              <Button 
                onClick={handleNext} 
                className="gradient-primary text-white hover:opacity-90 transition-smooth min-w-[120px]"
                size="lg"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="gradient-primary text-white hover:opacity-90 transition-smooth min-w-[160px]"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
