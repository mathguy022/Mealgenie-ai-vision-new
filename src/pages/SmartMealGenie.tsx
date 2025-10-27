import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wand2, RefreshCw, Sparkles, Shuffle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { openRouterClient } from '@/integrations/openrouter/openrouter-client';

type Profile = {
  id?: string;
  full_name?: string;
  daily_calorie_target?: number;
  protein_target_g?: number;
  carbs_target_g?: number;
  fat_target_g?: number;
  age?: number;
  gender?: string;
  height_cm?: number;
  current_weight_kg?: number;
  health_goal?: string;
  dietary_restrictions?: string[];
  medical_conditions?: string[];
};

type Meal = {
  title: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients?: string[];
  tips?: string;
  recipe_url?: string;
};

type DayPlan = {
  date: string;
  calories_target: number;
  meals: {
    breakfast: Meal;
    snack1: Meal;
    lunch: Meal;
    snack2: Meal;
    dinner: Meal;
  };
};

function summarizeProfile(p?: Profile): string {
  if (!p) return '';
  const parts: string[] = [];
  if (p.age) parts.push(`age ${p.age}`);
  if (p.gender) parts.push(`${p.gender}`);
  if (p.current_weight_kg) parts.push(`weight ${p.current_weight_kg} kg`);
  if (p.height_cm) parts.push(`height ${p.height_cm} cm`);
  if (p.health_goal) parts.push(`goal: ${String(p.health_goal).replace('_',' ')}`);
  if (Array.isArray(p.dietary_restrictions) && p.dietary_restrictions.length) parts.push(`dietary: ${p.dietary_restrictions.join(', ')}`);
  if (Array.isArray(p.medical_conditions) && p.medical_conditions.length) parts.push(`allergies/conditions: ${p.medical_conditions.join(', ')}`);
  return parts.join(', ');
}

function safeParseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from code fences
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[1] ?? match[0]) as T; } catch {}
    }
    return null;
  }
}

export default function SmartMealGenie() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (!mounted) return;
        setProfile(data as Profile);
      } catch (err: unknown) {
        toast({ title: 'Profile load error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const headerDesc = useMemo(() => (
    'Dynamic meal plans that learn your goals and adapt daily.'
  ), []);

  const generatePlan = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const calories = profile.daily_calorie_target || 2000;
      const macros = {
        protein_g: profile.protein_target_g || Math.round((calories * 0.25) / 4),
        carbs_g: profile.carbs_target_g || Math.round((calories * 0.45) / 4),
        fat_g: profile.fat_target_g || Math.round((calories * 0.30) / 9)
      };

      const sys = {
        role: 'system' as const,
        content: `You are MealGenie AI, generating compact JSON daily meal plans tailored to a user's nutrition targets and preferences. Return ONLY JSON, no commentary.`
      };
      const userMsg = {
        role: 'user' as const,
        content: `Profile: ${summarizeProfile(profile)}\nTargets: ${calories} kcal, ${macros.protein_g}g protein, ${macros.carbs_g}g carbs, ${macros.fat_g}g fat.\nTask: Create a one-day plan with 3 meals + 2 snacks sized to roughly meet the targets. Use widely available ingredients. For each item include: title, calories, protein_g, carbs_g, fat_g, ingredients (3-8), optional recipe_url, optional tips.\nFormat as JSON: {"date":"${today}","calories_target":${calories},"meals":{ "breakfast":Meal, "snack1":Meal, "lunch":Meal, "snack2":Meal, "dinner":Meal }}`
      };

      const text = await openRouterClient.chat([sys, userMsg]);
      const parsed = text ? safeParseJSON<DayPlan>(text) : null;
      if (!parsed) {
        throw new Error('Could not parse plan from AI response');
      }
      setPlan(parsed);
    } catch (err: unknown) {
      toast({ title: 'Plan generation failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const swapMeal = async (key: keyof DayPlan['meals']) => {
    if (!profile || !plan) return;
    setLoading(true);
    try {
      const target = plan.meals[key];
      const sys = { role: 'system' as const, content: 'Return ONLY JSON for a single meal replacement.' };
      const userMsg = { role: 'user' as const, content: `Suggest 1 alternative meal that fits similar calories and macros to this, honors preferences: ${summarizeProfile(profile)}. Current: ${JSON.stringify(target)}. JSON shape: {"title":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"ingredients":[],"tips":"","recipe_url":""}` };
      const text = await openRouterClient.chat([sys, userMsg]);
      const alt = text ? safeParseJSON<Meal>(text) : null;
      if (!alt) throw new Error('Could not parse alternative meal');
      setPlan({
        ...plan,
        meals: { ...plan.meals, [key]: alt }
      });
    } catch (err: unknown) {
      toast({ title: 'Swap failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">🪄 AI Smart Meal Genie</h1>
                <p className="text-xs text-muted-foreground">{headerDesc}</p>
              </div>
              <Badge className="ml-2 bg-amber-500/20 text-amber-500 border-amber-500/30">BETA</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>The Genie that plans your perfect meals</CardTitle>
            <CardDescription>
              Personalized plans using your profile, macro targets, and smart substitutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={generatePlan} disabled={loading} className="gradient-primary text-white">
                {loading ? (
                  <>Generating…</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Today’s Plan
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => plan && generatePlan()} disabled={!plan || loading}>
                <RefreshCw className="w-4 h-4 mr-2" /> Adjust Plan
              </Button>
              <Button variant="outline" onClick={() => navigate('/nutrigenie')}>
                Ask NutriGenie about this plan
              </Button>
            </div>

            {profile && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Daily Calories</p>
                  <p className="font-bold">{profile.daily_calorie_target || 2000} kcal</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="font-bold">{profile.protein_target_g || 125} g</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="font-bold">{profile.carbs_target_g || 225} g</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fat</p>
                  <p className="font-bold">{profile.fat_target_g || 67} g</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {plan && (
          <section className="grid md:grid-cols-2 gap-4">
            {Object.entries(plan.meals).map(([key, meal]) => (
              <Card key={key} className="border-amber-500/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{key}</CardTitle>
                    <CardDescription>{meal.title}</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => swapMeal(key as keyof DayPlan['meals'])}>
                    <Shuffle className="w-4 h-4 mr-1" /> Swap
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Calories</div>
                      <div className="font-semibold">{Math.round(meal.calories)} kcal</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Protein</div>
                      <div className="font-semibold">{meal.protein_g} g</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Carbs</div>
                      <div className="font-semibold">{meal.carbs_g} g</div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">Fat</div>
                      <div className="font-semibold">{meal.fat_g} g</div>
                    </div>
                  </div>

                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Ingredients</div>
                      <ul className="text-sm list-disc ml-5 space-y-0.5">
                        {meal.ingredients.slice(0,8).map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meal.tips && (
                    <p className="text-xs text-muted-foreground">Tip: {meal.tips}</p>
                  )}

                  {meal.recipe_url && (
                    <a target="_blank" href={meal.recipe_url} className="text-sm text-amber-600 hover:underline">
                      View recipe ↗
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {!plan && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Click “Generate Today’s Plan” to build a personalized daily plan with 3 meals + 2 snacks.
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Privacy note: your chat and planner do not store PII; profile summaries guide personalization.
        </div>
      </main>
    </div>
  );
}