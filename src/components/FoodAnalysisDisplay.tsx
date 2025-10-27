import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FoodAnalysis } from '@/lib/food-analysis-parser';

interface FoodAnalysisDisplayProps {
  analysis: FoodAnalysis;
}

export function FoodAnalysisDisplay({ analysis }: FoodAnalysisDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Nutritional Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{Math.round(analysis.totalCalories)}</div>
          <div className="text-sm text-muted-foreground">Calories</div>
        </div>
        <div className="bg-blue-10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{Math.round(analysis.totalProtein)}g</div>
          <div className="text-sm text-muted-foreground">Protein</div>
        </div>
        <div className="bg-green-10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(analysis.totalCarbs)}g</div>
          <div className="text-sm text-muted-foreground">Carbs</div>
        </div>
        <div className="bg-orange-10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{Math.round(analysis.totalFat)}g</div>
          <div className="text-sm text-muted-foreground">Fat</div>
        </div>
      </div>

      {/* Food Items */}
      <div className="space-y-3">
        <h3 className="font-semibold">Food Items</h3>
        <div className="space-y-2">
          {analysis.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="font-medium">{item.name}</div>
                {item.quantity && (
                  <div className="text-sm text-muted-foreground">{item.quantity}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">{Math.round(item.calories)} kcal</div>
                <div className="text-xs text-muted-foreground">
                  P: {Math.round(item.protein)}g | C: {Math.round(item.carbs)}g | F: {Math.round(item.fat)}g
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Insights */}
      {analysis.healthInsights && analysis.healthInsights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Health Insights</h3>
          <div className="space-y-2">
            {analysis.healthInsights.map((insight, index) => (
              <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
