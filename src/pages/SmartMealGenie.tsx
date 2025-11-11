import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wand2, RefreshCw, Sparkles, Shuffle, MessageCircle, ShoppingCart } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ActivityLevel, NutritionGoal } from '@/types/nutrition';
import { calculateBMR, calculateTDEE } from '@/lib/nutrition-calculator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import NutriGenieBot from './NutriGenieBot';

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
  balanceTag?: '🟢 Balanced' | '🟡 High Carb' | '🔴 Low Protein';
};

type DayPlan = {
  date: string;
  calories_target: number;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
};

type Targets = {
  calories: number;
  protein: { grams: number; percentage: number };
  carbs: { grams: number; percentage: number };
  fat: { grams: number; percentage: number };
};

function getActivityLevel(p?: Profile): ActivityLevel {
  // Default to moderately active if not available
  const raw: string | undefined = (p as any)?.activity_level || (p as any)?.activity || undefined;
  switch ((raw || '').toLowerCase()) {
    case 'sedentary': return ActivityLevel.SEDENTARY;
    case 'lightly active':
    case 'lightly_active': return ActivityLevel.LIGHTLY_ACTIVE;
    case 'moderately active':
    case 'moderately_active': return ActivityLevel.MODERATELY_ACTIVE;
    case 'very active':
    case 'very_active': return ActivityLevel.VERY_ACTIVE;
    default: return ActivityLevel.MODERATELY_ACTIVE;
  }
}

function getGoal(p?: Profile): NutritionGoal {
  const raw = (p?.health_goal || '').toLowerCase();
  switch (raw) {
    case 'weight_loss':
    case 'fat loss':
    case 'lose weight': return NutritionGoal.WEIGHT_LOSS;
    case 'muscle_gain':
    case 'muscle building': return NutritionGoal.MUSCLE_BUILDING;
    case 'maintenance':
    case 'weight_maintenance': return NutritionGoal.MAINTENANCE;
    default: return NutritionGoal.MAINTENANCE;
  }
}

function assignMacroPercentages(diet: string[] | undefined) {
  const list = (diet || []).map(d => d.toLowerCase());
  if (list.includes('keto')) return { proteinPct: 20, carbsPct: 5, fatPct: 75 };
  if (list.includes('vegan')) return { proteinPct: 25, carbsPct: 60, fatPct: 15 };
  // Halal/Pescatarian/etc.: use general macros
  return { proteinPct: 30, carbsPct: 40, fatPct: 30 };
}

function clampWeightLossMin(calories: number, gender?: string) {
  const g = (gender || '').toLowerCase();
  const min = g === 'female' ? 1200 : 1500;
  return Math.max(Math.round(calories), min);
}

function computeTargetsFromProfile(p: Profile): Targets {
  const bmr = calculateBMR({
    id: p.id || 'me',
    age: p.age || 30,
    gender: (p.gender === 'male' || p.gender === 'female') ? p.gender : 'male',
    height: p.height_cm || 170,
    weight: p.current_weight_kg || 75,
    activityLevel: getActivityLevel(p),
    goal: getGoal(p),
    dietaryRestrictions: p.dietary_restrictions || []
  });
  const tdee = calculateTDEE(bmr, getActivityLevel(p));
  const goal = getGoal(p);
  let dailyCalories = tdee;
  if (goal === NutritionGoal.WEIGHT_LOSS) dailyCalories = clampWeightLossMin(tdee * 0.8, p.gender);
  if (goal === NutritionGoal.MUSCLE_BUILDING) dailyCalories = Math.round(tdee * 1.1);
  if (goal === NutritionGoal.MAINTENANCE) dailyCalories = Math.round(tdee * 1.0);

  const { proteinPct, carbsPct, fatPct } = assignMacroPercentages(p.dietary_restrictions);
  const proteinGrams = Math.round((dailyCalories * (proteinPct / 100)) / 4);
  const carbsGrams = Math.round((dailyCalories * (carbsPct / 100)) / 4);
  const fatGrams = Math.round((dailyCalories * (fatPct / 100)) / 9);

  return {
    calories: dailyCalories,
    protein: { grams: proteinGrams, percentage: proteinPct },
    carbs: { grams: carbsGrams, percentage: carbsPct },
    fat: { grams: fatGrams, percentage: fatPct }
  };
}

function formatDailyTarget(t: Targets) {
  return `🎯 Daily Target: ${t.calories} kcal | P${t.protein.percentage}% (${t.protein.grams}g) | C${t.carbs.percentage}% (${t.carbs.grams}g) | F${t.fat.percentage}% (${t.fat.grams}g)`;
}

function macroBalanceTag(meal: Meal): '🟢 Balanced' | '🟡 High Carb' | '🔴 Low Protein' {
  const kcalFromProtein = meal.protein_g * 4;
  const kcalFromCarbs = meal.carbs_g * 4;
  const kcalFromFat = meal.fat_g * 9;
  const total = Math.max(1, kcalFromProtein + kcalFromCarbs + kcalFromFat);
  const pPct = (kcalFromProtein / total) * 100;
  const cPct = (kcalFromCarbs / total) * 100;
  if (pPct < 20) return '🔴 Low Protein';
  if (cPct > 50) return '🟡 High Carb';
  return '🟢 Balanced';
}

function cuisineForDay(dateIso?: string): 'Mediterranean' | 'Asian' | 'American' | 'Middle Eastern' | 'Mexican' | 'Indian' | 'Fusion' {
  const d = dateIso ? new Date(dateIso) : new Date();
  const day = d.getDay(); // 0=Sun
  const map = ['Fusion', 'Mediterranean', 'Asian', 'American', 'Middle Eastern', 'Mexican', 'Indian'] as const;
  return map[day] || 'Fusion';
}

function eggBreakfastVariant(profile: Profile, targets: Targets, dateIso?: string): Meal {
  const diet = (profile.dietary_restrictions || []).map(d => d.toLowerCase());
  const share = 0.25;
  const base: Meal = {
    title: '',
    calories: Math.round(targets.calories * share),
    protein_g: Math.round(targets.protein.grams * share),
    carbs_g: Math.round(targets.carbs.grams * share),
    fat_g: Math.round(targets.fat.grams * share)
  };
  const stylesNonVegan = [
    { title: 'Scrambled eggs with spinach', ing: ['3 eggs', 'handful spinach', 'olive oil'], tip: 'Protein-rich breakfast to keep you full' },
    { title: 'Omelet with mushrooms', ing: ['3 eggs', 'sautéed mushrooms', 'olive oil'], tip: 'Hearty and satisfying start' },
    { title: 'Boiled eggs + cherry tomatoes', ing: ['3 boiled eggs', 'handful cherry tomatoes'], tip: 'Simple, portable protein' },
    { title: 'Shakshuka (eggs in tomato)', ing: ['3 eggs', 'tomato sauce', 'onion', 'spices'], tip: 'Warm and savory, great for mornings' }
  ];
  const stylesVegan = [
    { title: 'Tofu scramble with peppers', ing: ['200g firm tofu', 'bell peppers', 'turmeric', 'olive oil'], tip: 'Plant protein, egg-like texture' },
    { title: 'Chia pudding with berries', ing: ['3 tbsp chia seeds', '200ml plant milk', 'berries'], tip: 'Omega-3s for steady energy' }
  ];
  const idx = new Date(dateIso || new Date().toISOString()).getDay() % (diet.includes('vegan') ? stylesVegan.length : stylesNonVegan.length);
  const chosen = (diet.includes('vegan') ? stylesVegan : stylesNonVegan)[idx];
  const meal: Meal = { ...base, title: chosen.title, ingredients: chosen.ing, tips: chosen.tip };
  meal.balanceTag = macroBalanceTag(meal);
  return meal;
}

function generateMealTypeOptions(profile: Profile, targets: Targets, key: keyof DayPlan['meals']): Meal[] {
  const diet = (profile.dietary_restrictions || []).map(d => d.toLowerCase());
  const share = key === 'lunch' ? 0.35 : 0.25;
  const base = (title: string, ingredients: string[], tip: string): Meal => {
    const meal: Meal = {
      title,
      calories: Math.round(targets.calories * share),
      protein_g: Math.round(targets.protein.grams * share),
      carbs_g: Math.round(targets.carbs.grams * share),
      fat_g: Math.round(targets.fat.grams * share),
      ingredients,
      tips: tip
    };
    meal.balanceTag = macroBalanceTag(meal);
    return meal;
  };
  const halal = diet.includes('halal');
  const gf = diet.includes('gluten-free') || diet.includes('gluten_free');
  const vegan = diet.includes('vegan');
  const vegetarian = diet.includes('vegetarian');
  const pescatarian = diet.includes('pescatarian');

  const soy = gf ? 'tamari' : 'soy sauce';

  const optionsAll: { type: 'Meat' | 'Chicken' | 'Vegetarian' | 'Fish'; meal: Meal }[] = [
    { type: 'Meat', meal: base(halal ? 'Beef stir-fry (Halal-friendly)' : 'Beef stir-fry', ['150g lean beef', 'mixed veggies', soy, 'brown rice'], 'Stir-fry adds flavor with controlled oil') },
    { type: 'Chicken', meal: base('Grilled chicken with quinoa', ['150g chicken breast', '120g cooked quinoa', 'steamed broccoli', 'olive oil'], 'Lean protein + fiber for satiety') },
    { type: 'Vegetarian', meal: base('Lentil & chickpea bowl', ['120g cooked lentils', '100g chickpeas', 'spinach', 'olive oil + lemon'], 'Plant protein + fiber supports gut health') },
    { type: 'Fish', meal: base('Salmon with veggie medley', ['150g salmon', 'mixed vegetables', 'lemon', 'olive oil'], 'Omega-3s support heart and brain') }
  ];

  // Apply diet filters
  let filtered = optionsAll;
  if (vegan) {
    filtered = optionsAll.filter(o => o.type === 'Vegetarian');
    // Tweak ingredients to fully vegan
    filtered = filtered.map(o => ({ type: o.type, meal: { ...o.meal, title: 'Tofu & chickpea power bowl', ingredients: ['200g firm tofu', '100g chickpeas', 'spinach', soy], tips: 'High-protein vegan option' } }));
  } else if (vegetarian) {
    filtered = optionsAll.filter(o => o.type === 'Vegetarian');
  } else if (pescatarian) {
    filtered = optionsAll.filter(o => o.type === 'Vegetarian' || o.type === 'Fish');
  } else {
    // halal: exclude pork implicitly (none used), mark if halal
    if (halal) {
      filtered = filtered.map(o => ({ type: o.type, meal: { ...o.meal, tips: (o.meal.tips || '') + ' · Halal-friendly' } }));
    }
  }

  return filtered.map(o => o.meal);
}

function buildTemplateMeals(profile: Profile, targets: Targets): DayPlan['meals'] {
  const diet = (profile.dietary_restrictions || []).map(d => d.toLowerCase());
  const portion = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.25,
    snack: 0.15
  };

  const calcMeal = (share: number): Meal => {
    const kcals = Math.round(targets.calories * share);
    return {
      title: '',
      calories: kcals,
      protein_g: Math.round(targets.protein.grams * share),
      carbs_g: Math.round(targets.carbs.grams * share),
      fat_g: Math.round(targets.fat.grams * share)
    };
  };

  // Breakfast: enforce eggs (or vegan alternatives)
  const breakfast = eggBreakfastVariant(profile, targets);

  if (diet.includes('keto')) {
    return {
      breakfast,
      lunch: { ...calcMeal(portion.lunch), title: 'Grilled chicken salad', ingredients: ['150g chicken', 'mixed greens', '30g feta', 'olive oil dressing'], tips: 'Add olives for healthy fats' },
      dinner: { ...calcMeal(portion.dinner), title: 'Salmon with broccoli', ingredients: ['150g salmon', 'steamed broccoli', 'butter/lemon'], tips: 'Swap rice → cauliflower rice' },
      snack: { ...calcMeal(portion.snack), title: 'Greek yogurt + nuts', ingredients: ['200g Greek yogurt', '20g walnuts'], tips: 'Choose unsweetened yogurt' }
    };
  }

  if (diet.includes('vegan')) {
    return {
      breakfast,
      lunch: { ...calcMeal(portion.lunch), title: 'Chickpea power bowl', ingredients: ['150g chickpeas', 'quinoa', 'spinach', 'tahini'], tips: 'Roast chickpeas for texture' },
      dinner: { ...calcMeal(portion.dinner), title: 'Tofu stir-fry', ingredients: ['200g firm tofu', 'mixed veggies', 'soy sauce', 'brown rice'], tips: 'Press tofu for better sear' },
      snack: { ...calcMeal(portion.snack), title: 'Apple with peanut butter', ingredients: ['1 apple', '1 tbsp peanut butter'], tips: 'Great fiber-rich snack' }
    };
  }

  // General / halal / pescatarian / none
  return {
    breakfast,
    lunch: { ...calcMeal(portion.lunch), title: 'Grilled chicken salad', ingredients: ['150g chicken breast', 'mixed greens', 'olive oil', 'wholegrain bread'], tips: 'Add beans for extra fiber' },
    dinner: { ...calcMeal(portion.dinner), title: 'Baked salmon with quinoa', ingredients: ['150g salmon', '120g cooked quinoa', 'roasted vegetables'], tips: 'Swap white rice → cauliflower rice' },
    snack: { ...calcMeal(portion.snack), title: 'Cottage cheese with fruit', ingredients: ['200g cottage cheese', 'berries'], tips: 'Choose low-sugar fruit' }
  };
}

function substitutionSuggestion(name: string): string {
  const map: Record<string, string> = {
    'Greek yogurt parfait': 'Swap granola → oats (less sugar)',
    'Grilled chicken salad': 'Swap dressing → olive oil + lemon (cleaner fats)',
    'Baked salmon with quinoa': 'Swap white rice → cauliflower rice (lower carbs)',
    'Cottage cheese with fruit': 'Swap cottage cheese → Greek yogurt if lactose-sensitive',
    'Cheese omelette with avocado': 'Swap cheese → goat cheese if lactose-sensitive',
    'Salmon with broccoli': 'Swap butter → olive oil to reduce saturated fat',
    'Greek yogurt + nuts': 'Swap walnuts → almonds for crunch',
    'Overnight oats with berries': 'Swap oat milk → soy milk (more protein)',
    'Chickpea power bowl': 'Swap tahini → hummus for cost savings',
    'Tofu stir-fry': 'Swap soy sauce → tamari (gluten-free)',
    'Apple with peanut butter': 'Swap peanut butter → almond butter if allergic'
  };
  return map[name] || 'Swap white rice → cauliflower rice';
}

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
  const [targets, setTargets] = useState<Targets | null>(null);
  const [adjustText, setAdjustText] = useState('');
  const [askText, setAskText] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [strictOutput, setStrictOutput] = useState<string | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapKey, setSwapKey] = useState<keyof DayPlan['meals'] | null>(null);
  const [swapOptions, setSwapOptions] = useState<Meal[]>([]);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [groceryList, setGroceryList] = useState<string[]>([]);
  const [openGrocery, setOpenGrocery] = useState<Record<string, boolean>>({});
  const [botOpen, setBotOpen] = useState(false);

  // Per-meal NutriGenie coach notes
  const coachNotes: Record<keyof DayPlan['meals'], string> = {
    breakfast: 'Start your day with protein — keeps you full longer!',
    lunch: 'Great job including greens — fiber helps digestion.',
    dinner: 'Salmon = omega-3s. Your brain will thank you.',
    snack: 'Cottage cheese is high in casein — slow-digesting protein.'
  };

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

  // Keep strict formatted output in sync with any plan/target changes (e.g., swaps)
  useEffect(() => {
    if (plan && targets) {
      setStrictOutput(composeStrictOutput(plan, targets));
    }
  }, [plan, targets]);

  const headerDesc = useMemo(() => (
    'Dynamic meal plans that learn your goals and adapt daily.'
  ), []);

  const generatePlan = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const t = computeTargetsFromProfile(profile);
      setTargets(t);
      const meals = buildTemplateMeals(profile, t);
      // add substitution tip per meal
      const withTips = Object.fromEntries(Object.entries(meals).map(([k, m]) => {
        const tip = substitutionSuggestion(m.title);
        const enhanced = { ...m, tips: tip } as Meal;
        enhanced.balanceTag = macroBalanceTag(enhanced);
        return [k, enhanced];
      })) as DayPlan['meals'];
      setPlan({ date: today, calories_target: t.calories, meals: withTips });

      // Build strict formatted output
      const totalKcal = Object.values(withTips).reduce((sum, m) => sum + (m.calories || 0), 0);
      const pct = Math.round((totalKcal / t.calories) * 100);
      const status = pct >= 95 && pct <= 105 ? 'On Track' : 'Slight Adjust Needed';
      const header = `${formatDailyTarget(t)}\n📊 Progress Pulse: "${status} | ${pct}% of target"`;
      const mkLine = (label: string, m: Meal) => {
        const swap = m.tips ? m.tips : 'Swap white rice → cauliflower rice — lower carbs, same volume';
        const tip = 'Small steps count — you’re building momentum!';
        return `\n✅ ${label}: ${m.title} — ${Math.round(m.calories)} kcal\n    • Ingredients: ${(m.ingredients || []).join(', ')}\n    • Macros: P${m.protein_g}g / C${m.carbs_g}g / F${m.fat_g}g\n    • Balance: ${m.balanceTag || '🟢 Balanced'}\n    ➡️ Swap: "${swap.split('—')[0]}" — "${swap.split('—')[1] || 'Great choice!'}"\n    💡 Tip: "${tip}"`;
      };
      const sections = [
        mkLine('Breakfast', withTips.breakfast),
        mkLine('Lunch', withTips.lunch),
        mkLine('Dinner', withTips.dinner),
        mkLine('Snack', withTips.snack)
      ].join('\n');
      // Grocery list today
      const agg = aggregateIngredients(Object.values(withTips));
      const grocery = formatGrocery(agg).map(l => l.replace(/^•\s*/, '• ')).join('\n');
      const coach = 'You kept protein steady and chose fiber-rich sides — proud of your consistency today!';
      const output = `${header}\n\n🛒 Grocery List (Today):\n${grocery}\n\n💬 Coach Note: "${coach}"`;
      setStrictOutput(output);
    } catch (err: unknown) {
      toast({ title: 'Plan generation failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const swapMeal = async (key: keyof DayPlan['meals']) => {
    if (!profile || !plan || !targets) return;
    setLoading(true);
    try {
      const templates = buildTemplateMeals(profile, targets);
      const alt = templates[key];
      const withTip = { ...alt, tips: substitutionSuggestion(alt.title) };
      setPlan({ ...plan, meals: { ...plan.meals, [key]: withTip } });
    } catch (err: unknown) {
      toast({ title: 'Swap failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  function computeTotals(p: DayPlan | null) {
    if (!p) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const meals = Object.values(p.meals);
    return meals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein_g || 0),
      carbs: acc.carbs + (m.carbs_g || 0),
      fat: acc.fat + (m.fat_g || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  // Compose strict formatted output based on current plan and targets
  function composeStrictOutput(currentPlan: DayPlan, t: Targets): string {
    const meals = currentPlan.meals;
    const totalKcal = Object.values(meals).reduce((sum, m) => sum + (m.calories || 0), 0);
    const pct = Math.round((totalKcal / t.calories) * 100);
    const status = pct >= 95 && pct <= 105 ? 'On Track' : 'Slight Adjust Needed';
    const header = `${formatDailyTarget(t)}\n📊 Progress Pulse: "${status} | ${pct}% of target"`;
    const mkLine = (label: string, m: Meal) => {
      const swap = m.tips ? m.tips : 'Swap white rice → cauliflower rice — lower carbs, same volume';
      const tip = 'Small steps count — you’re building momentum!';
      return `\n✅ ${label}: ${m.title} — ${Math.round(m.calories)} kcal\n    • Ingredients: ${(m.ingredients || []).join(', ')}\n    • Macros: P${m.protein_g}g / C${m.carbs_g}g / F${m.fat_g}g\n    • Balance: ${m.balanceTag || '🟢 Balanced'}\n    ➡️ Swap: "${swap.split('—')[0]}" — "${swap.split('—')[1] || 'Great choice!'}"\n    💡 Tip: "${tip}"`;
    };
    const sections = [
      mkLine('Breakfast', meals.breakfast),
      mkLine('Lunch', meals.lunch),
      mkLine('Dinner', meals.dinner),
      mkLine('Snack', meals.snack)
    ].join('\n');
    const agg = aggregateIngredients(Object.values(meals));
    const grocery = formatGrocery(agg).map(l => l.replace(/^•\s*/, '• ')).join('\n');
    const coach = 'You kept protein steady and chose fiber-rich sides — proud of your consistency today!';
    return `${header}\n\n🛒 Grocery List (Today):\n${grocery}\n\n💬 Coach Note: "${coach}"`;
  }

  function tagSet(profile: Profile): string[] {
    const diet = (profile.dietary_restrictions || []).map(d => d.toLowerCase());
    const tags: string[] = [];
    if (diet.includes('vegan')) tags.push('Vegan');
    if (diet.includes('keto')) tags.push('Keto-Friendly');
    if (diet.includes('gluten-free')) tags.push('Gluten-Free');
    if (diet.includes('halal')) tags.push('Halal');
    return tags.length ? tags : ['Balanced'];
  }

  function generateSwapOptions(meal: Meal, p: Profile): Meal[] {
    const base = meal;
    const tags = tagSet(p);
    const title = (meal.title || '').toLowerCase();
    const make = (
      title: string,
      kcalDelta: number,
      pDelta: number,
      cDelta: number,
      fDelta: number,
      tip: string,
      ingredients?: string[]
    ): Meal => ({
      title,
      calories: Math.max(50, Math.round(base.calories + kcalDelta)),
      protein_g: Math.max(0, Math.round(base.protein_g + pDelta)),
      carbs_g: Math.max(0, Math.round(base.carbs_g + cDelta)),
      fat_g: Math.max(0, Math.round(base.fat_g + fDelta)),
      ingredients: ingredients ?? base.ingredients,
      tips: `${tip} · Tags: ${tags.join(', ')}`,
      recipe_url: base.recipe_url
    });

    // Breakfast: egg omelette style → offer relevant alternatives
    if (title.includes('omelette') || title.includes('egg')) {
      return [
        make(
          'Greek yogurt bowl',
          -50,
          +5,
          -8,
          -3,
          'High protein, quick prep',
          ['200g Greek yogurt', 'berries', 'chia seeds']
        ),
        make(
          'Tofu scramble',
          -30,
          -2,
          +4,
          -2,
          'Plant protein, vegan-friendly',
          ['200g firm tofu', 'spinach', 'mushrooms', 'spices']
        ),
        make(
          'Oatmeal + cottage cheese',
          -20,
          +6,
          +10,
          -2,
          'Slow carbs + protein combo',
          ['60g oats', '200g cottage cheese', 'berries']
        )
      ];
    }

    if (title.includes('yogurt') || title.includes('parfait') || title.includes('granola')) {
      return [
        make(
          'Oats bowl',
          -40,
          +2,
          -6,
          +1,
          'Lower sugar, same fiber',
          ['60g oats', '200ml milk or yogurt', 'berries', 'nuts']
        ),
        make(
          'Chia seed pudding',
          -20,
          +3,
          -8,
          +5,
          'More omega-3, steadier energy',
          ['3 tbsp chia seeds', '200ml milk (any)', 'berries', 'vanilla']
        ),
        make(
          'Flaxseed yogurt',
          -30,
          +2,
          -5,
          +4,
          'Extra fiber, heart healthy',
          ['200g Greek yogurt', '1 tbsp ground flaxseed', 'berries', 'honey (optional)']
        )
      ];
    }
    if (title.includes('salmon')) {
      return [
        make(
          'Grilled chicken with broccoli',
          -60,
          +2,
          0,
          -3,
          'Lean protein, lower fat',
          ['150g chicken breast', 'broccoli', 'olive oil', 'lemon']
        ),
        make(
          'Tuna steak with veggies',
          -30,
          +1,
          0,
          -2,
          'Similar protein, budget-friendly',
          ['150g tuna steak', 'mixed vegetables', 'olive oil']
        ),
        make(
          'Tofu stir-fry',
          -80,
          -2,
          +5,
          -4,
          'Plant-based protein option',
          ['200g firm tofu', 'mixed veggies', 'soy sauce', 'brown rice']
        )
      ];
    }
    if (title.includes('chicken')) {
      return [
        make(
          'Turkey salad',
          -40,
          +1,
          -3,
          0,
          'Lean protein, lighter',
          ['150g turkey breast', 'mixed greens', 'olive oil', 'wholegrain bread']
        ),
        make(
          'Tuna salad',
          -20,
          0,
          -2,
          -1,
          'Good omega-3s',
          ['150g tuna', 'mixed greens', 'olive oil', 'wholegrain wrap or lettuce wrap']
        ),
        make(
          'Chickpea salad',
          -10,
          -3,
          +8,
          -2,
          'High fiber, plant protein',
          ['150g chickpeas', 'spinach', 'tomato', 'olive oil + lemon']
        )
      ];
    }
    // Default general-purpose swaps
    return [
      make('Brown rice ↔ Quinoa', -30, 0, -4, +1, 'More protein, better micronutrients'),
      make('Wholegrain wrap ↔ Lettuce wrap', -80, 0, -15, 0, 'Lower carb, higher volume'),
      make('Olive oil ↔ Avocado', -10, 0, +2, 0, 'Similar fats, extra fiber')
    ];
  }

  const openSwap = (key: keyof DayPlan['meals']) => {
    if (!plan || !profile) return;
    const meal = plan.meals[key];
    setSwapKey(key);
    try {
      // For lunch and dinner, show the 4 distinct meal types per rules
      if (key === 'lunch' || key === 'dinner') {
        setSwapOptions(generateMealTypeOptions(profile, targets || computeTargetsFromProfile(profile), key));
      } else {
        const opts = generateSwapOptions(meal, profile);
        // Fallback to safe, snack/breakfast-friendly swaps if option generation fails or returns empty
        const fallback: Meal[] = [
          {
            title: 'Greek yogurt bowl',
            calories: Math.max(50, Math.round(meal.calories - 50)),
            protein_g: Math.max(0, Math.round(meal.protein_g + 5)),
            carbs_g: Math.max(0, Math.round(meal.carbs_g - 8)),
            fat_g: Math.max(0, Math.round(meal.fat_g - 3)),
            ingredients: ['200g Greek yogurt', 'berries', 'chia seeds'],
            tips: 'High protein, quick prep'
          },
          {
            title: 'Oatmeal + cottage cheese',
            calories: Math.max(50, Math.round(meal.calories - 20)),
            protein_g: Math.max(0, Math.round(meal.protein_g + 6)),
            carbs_g: Math.max(0, Math.round(meal.carbs_g + 10)),
            fat_g: Math.max(0, Math.round(meal.fat_g - 2)),
            ingredients: ['60g oats', '200g cottage cheese', 'berries'],
            tips: 'Slow carbs + protein combo'
          }
        ];
        setSwapOptions(opts && opts.length ? opts : fallback);
      }
    } catch (err) {
      // Ensure modal still opens even if generation throws
      setSwapOptions([
        {
          title: 'Fruit + nuts',
          calories: Math.max(50, Math.round(meal.calories - 40)),
          protein_g: Math.max(0, Math.round(meal.protein_g + 2)),
          carbs_g: Math.max(0, Math.round(meal.carbs_g - 6)),
          fat_g: Math.max(0, Math.round(meal.fat_g + 1)),
          ingredients: ['1 cup mixed fruit', 'handful of nuts'],
          tips: 'Lower sugar, same fiber'
        }
      ]);
    }
    setSwapOpen(true);
  };

  const applySwap = async (opt: Meal) => {
    let nextPlan: DayPlan | null = null;
    setPlan((current) => {
      if (!current || !swapKey) return current || null;
      const prev = current.meals[swapKey];
      const next: Meal = {
        ...opt,
        // Ensure visible swap text always shows arrow + benefit
        tips: `Swap: ${prev.title} → ${opt.title}` + (opt.tips ? `\n• ${opt.tips.replace(/\s*·\s*Tags:.*/,'')}` : ''),
        balanceTag: macroBalanceTag(opt)
      };
      const updated = { ...current, meals: { ...current.meals, [swapKey]: next } };
      nextPlan = updated;
      // Side-effects (toast + coach message)
      toast({ title: '✅ Swapped!', description: 'New plan saved.' });
      setAskAnswer(`💬 NutriGenie: Nice! You swapped ${prev.title} → ${opt.title}. That’s a smart move for your goals.\n💡 Tip: "Want more low-sugar swaps? Try berries, nuts, and oats."`);
      // Try logging (non-blocking)
      (async () => {
        try {
          await supabase.from('meal_swaps').insert({
            user_id: user?.id,
            meal_key: swapKey,
            original: prev.title,
            swapped: opt.title,
            reason: 'user_selected',
            created_at: new Date().toISOString()
          });
        } catch {}
      })();
      return updated;
    });
    // Rebuild strict output immediately so Grocery List reflects the swap
    if (nextPlan && targets) {
      setStrictOutput(composeStrictOutput(nextPlan, targets));
    }
    setSwapOpen(false);
  };

  // --- Grocery list helpers ---
  type ParsedIng = { name: string; qty?: number; unit?: string };
  function expandCompound(text: string): string[] {
    // Split ingredients expressed as "item + item" or comma-separated
    const parts = text.split(/\s*\+\s*|,\s*/).map(s => s.trim()).filter(Boolean);
    // If no split happened, return original
    if (parts.length <= 1) return [text];
    return parts;
  }
  function normalizeName(name: string) {
    const n = name.trim().toLowerCase();
    if (n.includes('chicken') && !n.includes('breast')) return 'chicken breast';
    if (n.includes('yogurt')) return 'greek yogurt';
    if (n.includes('olive oil')) return 'olive oil';
    if (n.includes('quinoa')) return 'quinoa';
    if (n.includes('oats')) return 'oats';
    if (n.includes('chia')) return 'chia seeds';
    if (n.includes('flax')) return 'ground flaxseed';
    return name.trim().toLowerCase();
  }

  function parseIngredient(text: string): ParsedIng {
    const t = text.trim();
    // e.g. "granola (30g)"
    const paren = t.match(/^(.*)\((\d+\.?\d*)\s*(g|ml|tbsp|tsp|cup|cups)\)$/i);
    if (paren) {
      const name = normalizeName(paren[1].trim());
      return { name, qty: parseFloat(paren[2]), unit: paren[3].toLowerCase() };
    }
    // e.g. "200g Greek yogurt" or "60g oats"
    const withUnit = t.match(/^(\d+\.?\d*)\s*(g|ml|tbsp|tsp|cup|cups)\s+(.+)$/i);
    if (withUnit) {
      const qty = parseFloat(withUnit[1]);
      const unit = withUnit[2].toLowerCase();
      const name = normalizeName(withUnit[3]);
      return { name, qty, unit };
    }
    // e.g. "1/2 avocado"
    const fraction = t.match(/^(\d+\/(\d+))\s+(.+)$/);
    if (fraction) {
      const [num, den] = fraction[1].split('/').map(Number);
      const qty = den ? num / den : Number(fraction[1]);
      const name = normalizeName(fraction[3]);
      return { name, qty, unit: 'count' };
    }
    // e.g. "3 eggs" or "1 apple"
    const count = t.match(/^(\d+\.?\d*)\s+(.+)$/);
    if (count) {
      const qty = parseFloat(count[1]);
      const name = normalizeName(count[2]);
      return { name, qty, unit: 'count' };
    }
    // fallback: no quantity provided
    return { name: normalizeName(t) };
  }

  function aggregateIngredients(meals: Meal[]): Map<string, { qty?: number; unit?: string }>
  {
    const map = new Map<string, { qty?: number; unit?: string }>();
    for (const m of meals) {
      for (const raw of m.ingredients || []) {
        const items = expandCompound(raw);
        for (const ing of items) {
          const p = parseIngredient(ing);
          const key = `${p.name}|${p.unit || 'na'}`;
          const prev = map.get(key);
          const nextQty = (prev?.qty || 0) + (p.qty || 0);
          map.set(key, { qty: p.qty !== undefined ? nextQty : prev?.qty, unit: p.unit });
        }
      }
    }
    return map;
  }

  function formatGrocery(map: Map<string, { qty?: number; unit?: string }>): string[] {
    const lines: string[] = [];
    for (const [key, val] of Array.from(map.entries()).sort()) {
      const [name, unit] = key.split('|');
      const qty = val.qty;
      if (qty && unit && unit !== 'na') {
        const rounded = unit === 'count' ? Math.ceil(qty) : Math.round(qty);
        lines.push(`• ${rounded} ${unit} ${name}`);
      } else if (qty) {
        lines.push(`• ${Math.ceil(qty)} ${name}`);
      } else {
        lines.push(`• ${name}`);
      }
    }
    return lines;
  }

  function buildGlobalGroceryList() {
    if (!plan) return;
    const meals = Object.values(plan.meals);
    const agg = aggregateIngredients(meals);
    setGroceryList(formatGrocery(agg));
    setGroceryOpen(true);
  }

  function buildMealGroceryList(meal: Meal): string {
    const agg = aggregateIngredients([meal]);
    const lines = formatGrocery(agg);
    return lines.map(l => l.replace(/^•\s*/, '')).join(', ');
  }

  function toggleMealGrocery(key: string) {
    setOpenGrocery(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const adjustPlan = () => {
    if (!plan || !profile || !targets) return;
    const request = adjustText.toLowerCase();
    const diet = (profile.dietary_restrictions || []).map(d => d.toLowerCase());
    const vegan = diet.includes('vegan');
    const halal = diet.includes('halal');
    const dislikes: string[] = [];
    // Parse dislikes/allergies
    ['egg','eggs','salmon','yogurt','peanut','peanuts','tofu','chicken','pork'].forEach(word => {
      if (request.includes(`no ${word}`) || request.includes(`don’t like ${word}`) || request.includes(`don't like ${word}`) || request.includes(`allergic to ${word}`)) {
        dislikes.push(word);
      }
    });

    // 1) Adjust targets: calories and macros
    let newTargets: Targets = { ...targets };
    let explanationParts: string[] = [];

    const kcalMatch = request.match(/(reduce|increase|set).*?calories?.*?(to|=)?\s*(\d{3,4})/);
    if (kcalMatch) {
      const desired = parseInt(kcalMatch[3], 10);
      const clamped = clampWeightLossMin(desired, profile.gender);
      newTargets.calories = clamped;
      const pPct = targets.protein.percentage;
      const cPct = targets.carbs.percentage;
      const fPct = targets.fat.percentage;
      newTargets.protein.grams = Math.round((newTargets.calories * pPct / 100) / 4);
      newTargets.carbs.grams = Math.round((newTargets.calories * cPct / 100) / 4);
      newTargets.fat.grams = Math.round((newTargets.calories * fPct / 100) / 9);
      explanationParts.push(`Daily calories set to ${newTargets.calories} and macros scaled.`);
    }

    if (request.includes('more protein')) {
      const inc = 12; // target +10–15g
      newTargets.protein.grams = Math.max(0, newTargets.protein.grams + inc);
      const calDelta = inc * 4;
      // reduce carbs/fats evenly to keep calories stable
      newTargets.carbs.grams = Math.max(0, newTargets.carbs.grams - Math.round((calDelta/2)/4));
      newTargets.fat.grams = Math.max(0, newTargets.fat.grams - Math.round((calDelta/2)/9));
      const totalCal = newTargets.protein.grams*4 + newTargets.carbs.grams*4 + newTargets.fat.grams*9;
      newTargets.protein.percentage = Math.round((newTargets.protein.grams*4 / totalCal) * 100);
      newTargets.carbs.percentage = Math.round((newTargets.carbs.grams*4 / totalCal) * 100);
      newTargets.fat.percentage = Math.round((newTargets.fat.grams*9 / totalCal) * 100);
      explanationParts.push(`Protein increased by ${inc}g; carbs/fats reduced to balance.`);
    }

    // 2) Build meals directly from newTargets (exact proportions) then apply compliance and request
    let baseMeals = buildTemplateMeals(profile, newTargets);
    // Handle "no eggs" specifically on breakfast
    if ((dislikes.includes('egg') || dislikes.includes('eggs')) || request.includes('no eggs')) {
      baseMeals.breakfast = vegan
        ? { title: 'Tofu scramble', calories: Math.round(newTargets.calories*0.25), protein_g: Math.round(newTargets.protein.grams*0.25), carbs_g: Math.round(newTargets.carbs.grams*0.25), fat_g: Math.round(newTargets.fat.grams*0.25), ingredients: ['200g firm tofu','spinach','mushrooms','spices'], tips: 'Eggs removed → tofu scramble' }
        : { title: 'Greek yogurt bowl', calories: Math.round(newTargets.calories*0.25), protein_g: Math.round(newTargets.protein.grams*0.25), carbs_g: Math.round(newTargets.carbs.grams*0.25), fat_g: Math.round(newTargets.fat.grams*0.25), ingredients: ['200g Greek yogurt','berries','chia seeds'], tips: 'Eggs removed → dairy protein' };
    }
    // Apply cheaper swaps across meals
    if (request.includes('cheaper')) {
      const replaceMap: Record<string,string> = { salmon: 'chicken breast', quinoa: 'brown rice', avocado: 'olive oil' };
      const applyCost = (m: Meal): Meal => {
        const t = { ...m };
        t.ingredients = (t.ingredients || []).map(i => {
          let s = i;
          Object.keys(replaceMap).forEach(k => { if (new RegExp(k,'i').test(s)) s = s.replace(new RegExp(k,'ig'), replaceMap[k]); });
          return s;
        });
        if (/salmon/i.test(t.title)) t.title = 'Chicken with rice and veggies';
        t.tips = ((t.tips || '') + ' · Cost-friendly swaps').trim();
        return t;
      };
      baseMeals = {
        breakfast: applyCost(baseMeals.breakfast),
        lunch: applyCost(baseMeals.lunch),
        dinner: applyCost(baseMeals.dinner),
        snack: applyCost(baseMeals.snack)
      };
    }
    // Enforce vegan/halal compliance
    if (vegan) {
      const ensureVegan = (m: Meal): Meal => {
        const nonVegan = /(chicken|beef|salmon|turkey|yogurt|cheese|cottage)/i;
        if (nonVegan.test(m.title) || (m.ingredients||[]).some(i => nonVegan.test(i))) {
          return { ...m, title: 'Tofu & chickpea power bowl', ingredients: ['200g firm tofu','100g chickpeas','spinach','olive oil'], tips: 'Vegan compliance maintained' };
        }
        return m;
      };
      baseMeals = {
        breakfast: ensureVegan(baseMeals.breakfast),
        lunch: ensureVegan(baseMeals.lunch),
        dinner: ensureVegan(baseMeals.dinner),
        snack: ensureVegan(baseMeals.snack)
      };
    } else if (halal) {
      const stripPork = (m: Meal): Meal => ({ ...m, ingredients: (m.ingredients||[]).filter(i => !/pork/i.test(i)) });
      baseMeals = {
        breakfast: stripPork(baseMeals.breakfast),
        lunch: stripPork(baseMeals.lunch),
        dinner: stripPork(baseMeals.dinner),
        snack: stripPork(baseMeals.snack)
      };
    }

    // Refresh tips and balance tags, maintain variety by rotating lunch/dinner if identical
    const finalize = (m: Meal): Meal => {
      const out = { ...m };
      out.balanceTag = macroBalanceTag(out);
      out.tips = substitutionSuggestion(out.title);
      return out;
    };
    let adjustedMeals: DayPlan['meals'] = {
      breakfast: finalize(baseMeals.breakfast),
      lunch: finalize(baseMeals.lunch),
      dinner: finalize(baseMeals.dinner),
      snack: finalize(baseMeals.snack)
    };
    if (adjustedMeals.lunch.title === plan.meals.lunch.title) {
      adjustedMeals.lunch.title = vegan ? 'Chickpea power bowl' : 'Turkey salad';
      adjustedMeals.lunch = finalize(adjustedMeals.lunch);
    }
    if (adjustedMeals.dinner.title === plan.meals.dinner.title) {
      adjustedMeals.dinner.title = vegan ? 'Tofu stir-fry' : 'Chicken & veggies';
      adjustedMeals.dinner = finalize(adjustedMeals.dinner);
    }

    setTargets(newTargets);
    setPlan({ ...plan, calories_target: newTargets.calories, meals: adjustedMeals });
    const explanation = explanationParts.length ? explanationParts.join(' ') : 'Plan adjusted for today: meals scaled to your new target and compliant substitutions applied.';
    setAskAnswer(`💬 NutriGenie: ${explanation}\n💡 Coach Note: "Great move — minor adjustments keep consistency high. Let’s stay steady today."`);
    toast({ title: 'Plan adjusted', description: '🎯 Totals and macros updated to new target.' });
  };

  const answerAsk = () => {
    const q = askText.trim().toLowerCase();
    if (!q) return;
    let answer = '';
    let tip = '';
    if (q.includes('reduce sugar')) {
      answer = 'Focus on whole foods, swap sugary drinks for water/tea, choose fruit over sweets, and check labels for added sugar.';
      tip = 'Try sparkling water with lemon instead of soda today.';
    } else if (q.includes('eat out')) {
      answer = 'Pick grilled options, ask for sauces on the side, choose veggies as sides, and watch portions.';
      tip = 'Order a protein + salad combo and skip sugary drinks.';
    } else if (q.includes('snack')) {
      answer = 'Good snacks: Greek yogurt, nuts, fruit, or hummus with carrots. Approx 150–250 kcal.';
      tip = 'Keep a 30g nut pack handy for a protein-fat boost.';
    } else {
      answer = 'Aim for balanced meals matching your daily target with protein, fiber-rich carbs, and healthy fats.';
      tip = 'Plan meals ahead and hydrate; consistency beats perfection.';
    }
    setAskAnswer(`💬 NutriGenie: ${answer}\n💡 Tip: "${tip}"`);
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
              {plan && (
                <Button variant="outline" onClick={buildGlobalGroceryList} className="h-10">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Grocery List
                </Button>
              )}
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Adjust request (e.g., no eggs, cheaper)"
                  value={adjustText}
                  onChange={(e) => setAdjustText(e.target.value)}
                />
                <Button variant="outline" onClick={adjustPlan} disabled={!plan || loading}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Adjust Plan
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Ask NutriGenie (e.g., reduce sugar)"
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                />
                <Button variant="outline" onClick={() => setBotOpen(true)}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Ask NutriGenie
                </Button>
              </div>
            </div>

            {profile && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Daily Calories</p>
                  <p className="font-bold">{targets?.calories || profile.daily_calorie_target || 2000} kcal</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="font-bold">{targets?.protein.grams ?? profile.protein_target_g ?? 125} g</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="font-bold">{targets?.carbs.grams ?? profile.carbs_target_g ?? 225} g</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fat</p>
                  <p className="font-bold">{targets?.fat.grams ?? profile.fat_target_g ?? 67} g</p>
                </div>
              </div>
            )}


            {targets && (
              <div className="mt-3 text-sm">
                {formatDailyTarget(targets)}
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
                  {/* Removed header grocery button to avoid duplicate triggers */}
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
                    <div className="text-sm">
                      <div className="mb-1">➡️ Swap: {meal.tips.replace(/^Swap[: ]?/, '')}</div>
                      <div className="text-xs text-muted-foreground">• Benefit: Smart alternative to fit your goals</div>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => openSwap(key as keyof DayPlan['meals'])}
                      className="text-[#8A6FF9] border-[#8A6FF9] h-12 min-w-[120px] text-base rounded-xl hover:scale-[1.02] shadow-sm"
                    >
                      <Shuffle className="w-4 h-4 mr-2" /> Swap
                    </Button>
                  </div>

                  <Collapsible open={!!openGrocery[key]} onOpenChange={(open) => setOpenGrocery(prev => ({ ...prev, [key]: open }))}>
                    <CollapsibleTrigger asChild>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="bg-[#F4EDFF] border-[#E0D7FF] text-black h-10 px-4 rounded-2xl hover:scale-[1.02]"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" /> Grocery List
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 rounded-xl border border-[#E0D7FF] bg-[#F9F6FF] p-3">
                        <div className="text-xs text-muted-foreground mb-2">Buy for this meal:</div>
                        {(() => {
                          const lines = formatGrocery(aggregateIngredients([meal]));
                          return (
                            <ul className="text-sm list-disc ml-5 space-y-1">
                              {lines.map((line, idx) => (
                                <li key={idx}>{line.replace(/^•\s*/, '')}</li>
                              ))}
                            </ul>
                          );
                        })()}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {meal.recipe_url && (
                    <a target="_blank" href={meal.recipe_url} className="text-sm text-amber-600 hover:underline">
                      View recipe ↗
                    </a>
                  )}

                  {/* Per-meal NutriGenie coach note */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">NutriGenie Coach Note: </span>
                    {coachNotes[key as keyof DayPlan['meals']]}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {strictOutput && (
          <Card className="mt-4">
            <CardContent className="py-4 text-sm whitespace-pre-wrap">
              {strictOutput}
            </CardContent>
          </Card>
        )}

        {/* Daily totals vs target */}
        {plan && (
          <Card>
            <CardContent className="py-4">
              {(() => {
                const totals = computeTotals(plan);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-bold">{targets?.calories ?? plan.calories_target} kcal</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total Calories</p>
                      <p className="font-bold">{totals.calories} kcal</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Protein</p>
                      <p className="font-bold">{totals.protein} g</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="font-bold">{totals.carbs} g</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Fat</p>
                      <p className="font-bold">{totals.fat} g</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Global healthy tips card at end of page */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💡 Healthy Tips from NutriGenie</CardTitle>
            <CardDescription>Bite-sized guidance to support your daily routine.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>✅ Don’t forget to drink 8 cups of water — hydration boosts metabolism and reduces false hunger.</li>
              <li>✅ Take the vitamins and supplements recommended by your healthcare provider — they fill nutritional gaps.</li>
              <li>✅ Don’t forget your prescribed medications — your health plan includes more than just food.</li>
              <li>✅ Balance your meals with protein, fiber, and healthy fats — this keeps your energy steady all day.</li>
              <li>✅ Walk 15–20 minutes daily in natural light — it helps burn calories, improves digestion, and supports vitamin D for better metabolism.</li>
              <li>✅ Step outside for 15–20 minutes each day — sunlight lifts your mood, boosts vitamin D, and gives you natural energy without caffeine.</li>
              <li>✅ Daily sunlight walks (15–20 min) support vitamin D, mental clarity, and long-term health — no supplements needed.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Swap modal */}
        <Dialog open={swapOpen} onOpenChange={setSwapOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose a swap</DialogTitle>
              <DialogDescription>Select one of these nutritionally equivalent alternatives.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {swapOptions.map((opt, idx) => (
                <div key={idx} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{opt.title}</div>
                    <div className="text-xs text-muted-foreground">{opt.calories} kcal • P {opt.protein_g}g • C {opt.carbs_g}g • F {opt.fat_g}g</div>
                    {opt.tips && <div className="text-xs mt-1">{opt.tips}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {(opt.tips || '').includes('Vegan') && <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Vegan</Badge>}
                    {(opt.tips || '').includes('Keto-Friendly') && <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Keto</Badge>}
                    {(opt.tips || '').includes('Gluten-Free') && <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">GF</Badge>}
                    {(opt.tips || '').includes('Halal') && <Badge className="bg-teal-500/20 text-teal-600 border-teal-500/30">Halal</Badge>}
                  </div>
                  <Button className="ml-4 gradient-primary text-white" onClick={() => applySwap(opt)}>Use this swap</Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setSwapOpen(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Grocery list modal */}
        <Dialog open={groceryOpen} onOpenChange={setGroceryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grocery List</DialogTitle>
              <DialogDescription>Aggregated items for today’s plan.</DialogDescription>
            </DialogHeader>
            {groceryList.length > 0 ? (
              <ul className="text-sm list-disc ml-5 space-y-1">
                {groceryList.map((line, idx) => (
                  <li key={idx}>{line.replace(/^•\s*/, '')}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">No items found.</div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setGroceryOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* NutriGenie Bot modal */}
        <Dialog open={botOpen} onOpenChange={setBotOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>NutriGenie Bot</DialogTitle>
              <DialogDescription>Ask questions with today’s plan context.</DialogDescription>
            </DialogHeader>
            <NutriGenieBot
              embedded
              context={{ targets, meals: plan?.meals, profile }}
              initialQuestion={askText || undefined}
            />
          </DialogContent>
        </Dialog>

        {!plan && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Click “Generate Today’s Plan” to build a personalized daily plan with 3 meals + 2 snacks.
            </CardContent>
          </Card>
        )}

        {askAnswer && (
          <Card>
            <CardContent className="py-4 text-sm whitespace-pre-wrap">{askAnswer}</CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Privacy note: your chat and planner do not store PII; profile summaries guide personalization.
        </div>
      </main>
    </div>
  );
}