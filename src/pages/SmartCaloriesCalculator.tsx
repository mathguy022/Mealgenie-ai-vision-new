import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Flame, Utensils, ArrowLeft } from 'lucide-react';
import { searchOpenFoodFactsByName } from '@/lib/openfoodfacts';
import { searchUSDAFood } from '@/lib/usda';
import { useAuth } from '@/contexts/AuthContext';
import { FoodLogEntry } from '@/components/FoodLogEntry';

type Unit = 'g' | 'oz';

const ozToGram = (oz: number) => oz * 28.3495;

export default function SmartCaloriesCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [weight, setWeight] = useState<string>('100');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productName, setProductName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [kcalPer100g, setKcalPer100g] = useState<number | null>(null);
  const [proteinPer100g, setProteinPer100g] = useState<number | null>(null);
  const [carbsPer100g, setCarbsPer100g] = useState<number | null>(null);
  const [fatPer100g, setFatPer100g] = useState<number | null>(null);

  const grams = useMemo(() => {
    const n = parseFloat(weight);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return unit === 'g' ? n : ozToGram(n);
  }, [weight, unit]);

  const estimatedCalories = useMemo(() => {
    if (kcalPer100g == null || grams <= 0) return 0;
    return Math.round((kcalPer100g * grams) / 100);
  }, [kcalPer100g, grams]);

  const scaledMacros = useMemo(() => {
    const scale = grams > 0 ? grams / 100 : 0;
    return {
      protein: proteinPer100g != null ? Math.round((proteinPer100g * scale) * 10) / 10 : 0,
      carbs: carbsPer100g != null ? Math.round((carbsPer100g * scale) * 10) / 10 : 0,
      fat: fatPer100g != null ? Math.round((fatPer100g * scale) * 10) / 10 : 0,
    };
  }, [proteinPer100g, carbsPer100g, fatPer100g, grams]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      setError('Please enter a food name');
      return;
    }
    setIsSearching(true);
    setError(null);
    setKcalPer100g(null);
    setProteinPer100g(null);
    setCarbsPer100g(null);
    setFatPer100g(null);
    setImageUrl(null);
    setProductName('');

    try {
      // Try OpenFoodFacts first (no API key required)
      const off = await searchOpenFoodFactsByName(q);
      if (off && (off.energyKcalPer100g != null)) {
        setProductName(off.productName || q);
        setImageUrl(off.imageUrl || null);
        setKcalPer100g(off.energyKcalPer100g);
        setProteinPer100g(off.proteinPer100g ?? null);
        setCarbsPer100g(off.carbsPer100g ?? null);
        setFatPer100g(off.fatPer100g ?? null);
        return;
      }

      // Fallback to USDA (requires API key in env), gracefully handles null
      const usda = await searchUSDAFood(q);
      if (usda && usda.calories != null) {
        setProductName(usda.description || q);
        setImageUrl(null);
        // Assume values are per 100g; this is the common case for FDC entries
        setKcalPer100g(usda.calories);
        setProteinPer100g(usda.protein_g ?? null);
        setCarbsPer100g(usda.carbs_g ?? null);
        setFatPer100g(usda.fat_g ?? null);
        return;
      }

      setError('No nutrition data found for that food. Try a simpler name.');
    } catch (e) {
      console.error(e);
      setError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Preload example to demonstrate UI quickly
    // Do not block user typing
    if (!query) {
      setQuery('apple');
      // Kick off a background search only on first mount
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        await handleSearch();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerDesc = 'Enter food name and weight (g or oz) to estimate calories.';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Smart Calories Calculator</h1>
                <p className="text-xs text-muted-foreground">{headerDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <section className="grid md:grid-cols-2 gap-4">
          {/* Calculator Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Smart Calories Calculator
              </CardTitle>
              <CardDescription>Manual input • Weight only • Metric or Imperial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="foodName">Food</Label>
                <Input
                  id="foodName"
                  placeholder="e.g., apple, cooked rice, chicken breast"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input id="weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g., 100" />
                </div>
                <div>
                  <Label>Unit</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={unit === 'g' ? 'default' : 'outline'} onClick={() => setUnit('g')} size="sm">g</Button>
                    <Button type="button" variant={unit === 'oz' ? 'default' : 'outline'} onClick={() => setUnit('oz')} size="sm">oz</Button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button className="gradient-primary text-white" onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? 'Searching…' : 'Calculate Calories'}
                </Button>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Panel */}
          <Card className="border-emerald-500/20">
            <CardHeader>
              <CardTitle>Estimated Calories</CardTitle>
              <CardDescription>Based on nutrition data per 100 g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {kcalPer100g != null ? (
                <div className="space-y-3">
                  <div className="text-4xl font-bold">{estimatedCalories} kcal</div>
                  <div className="text-sm text-muted-foreground">
                    {productName || 'Food'} • {grams.toFixed(0)} g • {kcalPer100g} kcal/100g
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">Protein</div>
                      <div className="text-lg font-semibold">{scaledMacros.protein} g</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">Carbs</div>
                      <div className="text-lg font-semibold">{scaledMacros.carbs} g</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">Fat</div>
                      <div className="text-lg font-semibold">{scaledMacros.fat} g</div>
                    </div>
                  </div>

                  {user && (
                    <div className="pt-2">
                      <FoodLogEntry
                        foodName={productName || query}
                        calories={estimatedCalories}
                        protein={scaledMacros.protein}
                        carbs={scaledMacros.carbs}
                        fat={scaledMacros.fat}
                        onSuccess={() => {
                          // no-op; toast handled inside FoodLogEntry
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">Sources: OpenFoodFacts (default), USDA FoodData Central if configured. Estimates scale per entered weight.</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Enter a food and weight, then calculate to see calories.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}