import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { supabase } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Calculate daily calorie target based on user inputs
      // This is a simple example - you might want to use a more sophisticated formula
      const bmr = calculateBMR(parseInt(age), parseInt(height), parseInt(weight), gender);
      const activityMultiplier = getActivityMultiplier(activityLevel);
      const goalAdjustment = getGoalAdjustment(goal);
      
      const dailyCalorieTarget = Math.round(bmr * activityMultiplier + goalAdjustment);

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          age: parseInt(age),
          height_cm: parseInt(height),
          current_weight_kg: parseFloat(weight),
          gender,
          activity_level: activityLevel,
          health_goal: goal,
          daily_calorie_target: dailyCalorieTarget,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple BMR calculation (Mifflin-St Jeor equation)
  const calculateBMR = (age: number, heightCm: number, weightKg: number, gender: string) => {
    if (gender === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  };

  const getActivityMultiplier = (activity: string) => {
    switch (activity) {
      case 'sedentary': return 1.2;
      case 'lightly_active': return 1.375;
      case 'moderately_active': return 1.55;
      case 'very_active': return 1.725;
      case 'extremely_active': return 1.9;
      default: return 1.2;
    }
  };

  const getGoalAdjustment = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return -500;
      case 'weight_gain': return 500;
      case 'muscle_building': return 300;
      case 'athletic_performance': return 200;
      default: return 0; // maintenance
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Help us personalize your nutrition plan by providing some information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} required>
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

            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                placeholder="Centimeters"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Kilograms"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityLevel">Activity Level</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                  <SelectItem value="lightly_active">Lightly active (light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderately_active">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="very_active">Very active (hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="extremely_active">Extremely active (very hard exercise & physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Health Goal</Label>
              <Select value={goal} onValueChange={setGoal} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="weight_gain">Weight Gain</SelectItem>
                  <SelectItem value="muscle_building">Muscle Building</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;