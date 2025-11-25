import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FoodLogEntry } from '@/components/FoodLogEntry';
import { searchOpenFoodFactsByName } from '@/lib/openfoodfacts';
import { searchUSDAFood } from '@/lib/usda';

type Unit = 'g' | 'oz';

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obesity';
}

export default function SmartBodyCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // BMI state (logic reused exactly)
  const [activeTabBmi, setActiveTabBmi] = useState<'standard' | 'metric'>('standard');
  const [feet, setFeet] = useState<string>('');
  const [inches, setInches] = useState<string>('');
  const [pounds, setPounds] = useState<string>('');
  const [metricUnit, setMetricUnit] = useState<'cm' | 'm'>('cm');
  const [heightMetric, setHeightMetric] = useState<string>('');
  const [kilograms, setKilograms] = useState<string>('');
  const [bmiResult, setBmiResult] = useState<{ value: number; category: string } | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('');

  const handleCalculateBMI = () => {
    let bmi = 0;
    if (activeTabBmi === 'standard') {
      const f = Number(feet) || 0;
      const i = Number(inches) || 0;
      const wlb = Number(pounds) || 0;
      const totalInches = f * 12 + i;
      if (wlb > 0 && totalInches > 0) {
        bmi = (703 * wlb) / (totalInches * totalInches);
      }
    } else {
      const hVal = Number(heightMetric) || 0;
      const kg = Number(kilograms) || 0;
      const meters = metricUnit === 'cm' ? hVal / 100 : hVal;
      if (kg > 0 && meters > 0) {
        bmi = kg / (meters * meters);
      }
    }
    if (bmi > 0) {
      const cat = classifyBmi(bmi);
      setBmiResult({ value: Number(bmi.toFixed(1)), category: cat });
    } else {
      setBmiResult(null);
    }
  };

  const progressRatio = bmiResult ? Math.min(bmiResult.value / 40, 1) : 0;

  // Calories calculator state (logic reused exactly)
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
    return unit === 'g' ? n : n * 28.3495;
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
    if (!q) { setError('Please enter a food name'); return; }
    setIsSearching(true);
    setError(null);
    setKcalPer100g(null);
    setProteinPer100g(null);
    setCarbsPer100g(null);
    setFatPer100g(null);
    setImageUrl(null);
    setProductName('');
    try {
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
      const usda = await searchUSDAFood(q);
      if (usda && usda.calories != null) {
        setProductName(usda.description || q);
        setImageUrl(null);
        setKcalPer100g(usda.calories);
        setProteinPer100g(usda.protein_g ?? null);
        setCarbsPer100g(usda.carbs_g ?? null);
        setFatPer100g(usda.fat_g ?? null);
        return;
      }
      setError('No nutrition data found for that food. Try a simpler name.');
    } catch {
      setError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!query) {
      setQuery('apple');
      (async () => { await handleSearch(); })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Smart AI Body Calculator</h1>
              <p className="text-xs text-muted-foreground">AI-powered BMI & calorie estimator</p>
              <p className="text-sm text-muted-foreground">Switch between BMI Calculator and Calorie Calculator</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <Card className="mb-2">
          <CardHeader>
            <CardTitle>Choose Mode</CardTitle>
            <CardDescription>Switch between BMI Calculator and Calorie Calculator</CardDescription>
          </CardHeader>
        </Card>
        <Tabs defaultValue="bmi">
          <TabsList className="w-full">
            <TabsTrigger value="bmi" className="flex-1">BMI Calculator</TabsTrigger>
            <TabsTrigger value="calories" className="flex-1">Smart Calories Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="bmi" className="space-y-6 pt-4">
            <section className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>BMI Calculator</CardTitle>
                  <CardDescription>Standard (Imperial) or Metric units</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={gender==='male'} onChange={()=>setGender('male')} />
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={gender==='female'} onChange={()=>setGender('female')} />
                        <span>Female</span>
                      </label>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <Label htmlFor="age">Age (optional)</Label>
                      <Input id="age" inputMode="numeric" value={age} onChange={(e)=>setAge(e.target.value)} placeholder="years" />
                    </div>
                  </div>
                  <Tabs value={activeTabBmi} onValueChange={(v) => setActiveTabBmi(v as 'standard' | 'metric')}>
                    <TabsList className="w-full">
                      <TabsTrigger value="standard" className="flex-1">Standard</TabsTrigger>
                      <TabsTrigger value="metric" className="flex-1">Metric</TabsTrigger>
                    </TabsList>
                    <TabsContent value="standard" className="space-y-3 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="feet">Height (ft)</Label>
                          <Input id="feet" inputMode="numeric" value={feet} onChange={(e) => setFeet(e.target.value)} placeholder="e.g., 5" />
                        </div>
                        <div>
                          <Label htmlFor="inches">Height (in)</Label>
                          <Input id="inches" inputMode="numeric" value={inches} onChange={(e) => setInches(e.target.value)} placeholder="e.g., 7" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="pounds">Weight (lb)</Label>
                        <Input id="pounds" inputMode="numeric" value={pounds} onChange={(e) => setPounds(e.target.value)} placeholder="e.g., 170" />
                      </div>
                    </TabsContent>
                    <TabsContent value="metric" className="space-y-3 pt-4">
                      <div className="grid grid-cols-3 gap-3 items-end">
                        <div className="col-span-2">
                          <Label htmlFor="heightMetric">Height</Label>
                          <Input id="heightMetric" inputMode="decimal" value={heightMetric} onChange={(e) => setHeightMetric(e.target.value)} placeholder="e.g., 175 or 1.75" />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <div className="flex gap-2">
                            <Button type="button" variant={metricUnit === 'cm' ? 'default' : 'outline'} onClick={() => setMetricUnit('cm')} size="sm">cm</Button>
                            <Button type="button" variant={metricUnit === 'm' ? 'default' : 'outline'} onClick={() => setMetricUnit('m')} size="sm">m</Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="kilograms">Weight (kg)</Label>
                        <Input id="kilograms" inputMode="decimal" value={kilograms} onChange={(e) => setKilograms(e.target.value)} placeholder="e.g., 77" />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="pt-2">
                    <Button className="gradient-primary text-white" onClick={handleCalculateBMI}>Calculate Your BMI</Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Result</p>
                    {bmiResult ? (
                      <div className="space-y-2">
                        <p className="text-lg font-semibold">Your BMI: {bmiResult.value}</p>
                        <p className="text-sm">Category: <span className="font-medium">{bmiResult.category}</span></p>
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-full rounded bg-muted overflow-hidden">
                            <div className="h-3 bg-indigo-500" style={{ width: `${progressRatio * 100}%` }} />
                          </div>
                          <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Enter values and calculate to see your BMI.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>BMI Categories</CardTitle>
                  <CardDescription>Reference ranges for adults</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>BMI Range</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow><TableCell>Underweight</TableCell><TableCell>Below 18.5</TableCell></TableRow>
                      <TableRow><TableCell>Healthy</TableCell><TableCell>18.5 – 24.9</TableCell></TableRow>
                      <TableRow><TableCell>Overweight</TableCell><TableCell>25.0 – 29.9</TableCell></TableRow>
                      <TableRow><TableCell>Obesity</TableCell><TableCell>30.0 or above</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="calories" className="space-y-6 pt-4">
            <section className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Smart Calories Calculator
                  </CardTitle>
                  <CardDescription>Manual input • Weight only • Metric or Imperial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="foodName">Food</Label>
                    <Input id="foodName" placeholder="e.g., apple, cooked rice, chicken breast" value={query} onChange={(e) => setQuery(e.target.value)} />
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
                    <Button className="gradient-primary text-white" onClick={handleSearch} disabled={isSearching}>{isSearching ? 'Searching…' : 'Calculate Calories'}</Button>
                  </div>
                  {error && <div className="bg-destructive/10 text-destructive p-3 rounded">{error}</div>}
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20">
                <CardHeader>
                  <CardTitle>Estimated Calories</CardTitle>
                  <CardDescription>Based on nutrition data per 100 g</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {kcalPer100g != null ? (
                    <div className="space-y-3">
                      <div className="text-4xl font-bold">{estimatedCalories} kcal</div>
                      <div className="text-sm text-muted-foreground">{productName || 'Food'} • {grams.toFixed(0)} g • {kcalPer100g} kcal/100g</div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted rounded-lg p-3 text-center"><div className="text-xs text-muted-foreground">Protein</div><div className="text-lg font-semibold">{scaledMacros.protein} g</div></div>
                        <div className="bg-muted rounded-lg p-3 text-center"><div className="text-xs text-muted-foreground">Carbs</div><div className="text-lg font-semibold">{scaledMacros.carbs} g</div></div>
                        <div className="bg-muted rounded-lg p-3 text-center"><div className="text-xs text-muted-foreground">Fat</div><div className="text-lg font-semibold">{scaledMacros.fat} g</div></div>
                      </div>
                      {user && (
                        <div className="pt-2">
                          <FoodLogEntry foodName={productName || query} calories={estimatedCalories} protein={scaledMacros.protein} carbs={scaledMacros.carbs} fat={scaledMacros.fat} onSuccess={() => {}} />
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}