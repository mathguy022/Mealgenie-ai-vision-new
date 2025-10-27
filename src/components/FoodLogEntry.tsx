import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Save, Plus } from 'lucide-react';

interface FoodLogEntryProps {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
  onSuccess?: () => void;
}

export function FoodLogEntry({ 
  foodName, 
  calories, 
  protein, 
  carbs, 
  fat, 
  confidence,
  onSuccess 
}: FoodLogEntryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  const handleLogMeal = async () => {
    if (!user?.id) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to track your meals',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Calculate final nutrition values based on quantity
      const calculatedCalories = Math.round(calories * quantity);
      const calculatedProtein = Math.round(protein * quantity);
      const calculatedCarbs = Math.round(carbs * quantity);
      const calculatedFat = Math.round(fat * quantity);

      // Create meal log entry
      const { error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          meal_type: mealType,
          food_name: foodName,
          quantity,
          unit,
          calculated_calories: calculatedCalories,
          calculated_protein: calculatedProtein,
          calculated_carbs: calculatedCarbs,
          calculated_fat: calculatedFat,
          scan_confidence: confidence || null,
          logged_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Meal logged successfully',
        description: `Added ${foodName} to your ${mealType} log`,
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error logging meal:', err);
      toast({
        title: 'Failed to log meal',
        description: 'There was an error saving your meal data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Log This Meal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0.25"
                step="0.25"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serving">Serving</SelectItem>
                  <SelectItem value="grams">Grams</SelectItem>
                  <SelectItem value="cup">Cup</SelectItem>
                  <SelectItem value="tbsp">Tablespoon</SelectItem>
                  <SelectItem value="tsp">Teaspoon</SelectItem>
                  <SelectItem value="oz">Ounce</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={(value) => setMealType(value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}>
              <SelectTrigger id="mealType">
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-muted p-2 rounded text-center">
              <div className="text-sm font-medium">Total Calories</div>
              <div className="text-xl font-bold">{Math.round(calories * quantity)}</div>
            </div>
            <div className="bg-muted p-2 rounded text-center">
              <div className="text-sm font-medium">Protein</div>
              <div className="text-xl font-bold">{Math.round(protein * quantity)}g</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleLogMeal} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Log Meal
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
