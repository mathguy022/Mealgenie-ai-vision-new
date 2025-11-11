import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Loader2, Mic, Send, Trash2, Sparkles } from 'lucide-react';
import { openRouterClient, OpenRouterError } from '@/integrations/openrouter/openrouter-client';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { searchUSDAFood } from '@/lib/usda';
import { searchOpenFoodFactsByName } from '@/lib/openfoodfacts';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; ts: number };

const STORAGE_KEY = (uid?: string) => `nutrigenie_chat_${uid || 'guest'}`;

const systemPrompt = (profileSummary?: string, planSummary?: string) => `
You are NutriGenie Bot — the AI nutrition coach inside MealGenie AI.

Your role is to help users with:
- Food calorie and macro estimates
- Healthy meal planning (daily/weekly)
- Ingredient substitutions (e.g., replacing meat with plant-based options)
- Portion sizing and balanced meals
- Dietary restrictions (vegetarian, low-carb, gluten-free, etc.)
- Nutritional comparisons between foods

You may NOT discuss:
- Medical advice (e.g., “Is this safe for my heart condition?”)
- Non-nutrition topics (politics, entertainment, etc.)

Always respond in a friendly, supportive tone. Use emojis sparingly (🍎🥦).

If unsure, say: “I’m here to help with nutrition — let me know what food or meal you’d like to plan!”

Never say: “I can’t help with that.” Instead, gently redirect: “Let’s focus on how we can make this meal healthier or more balanced.”

Examples of valid interactions:
User: Can I replace chicken with tofu in this recipe?
Bot: Yes! Tofu is a great plant-based protein swap. 100g firm tofu has ~80 kcal and 8g protein — similar to chicken breast. Adjust seasoning to match flavor.
User: What’s a low-carb alternative to rice?
Bot: Try cauliflower rice! 1 cup has ~25 kcal vs 200+ for white rice. Great for reducing carbs while keeping volume.
User: Is peanut butter good for muscle gain?
Bot: Yes — it’s high in protein and healthy fats. 2 tbsp = ~8g protein + 16g fat. Perfect post-workout snack!

For even better results, use a nutrition database API we already have (e.g., USDA FoodData Central or Spoonacular) to provide real macro values when available.

Profile Context:
${profileSummary || 'No profile available.'}

Meal Plan Context:
${planSummary || 'No plan context provided.'}
`;

function isNutritionScope(text: string): boolean {
  const t = text.toLowerCase();
  const banned = [
    'weather','politics','election','stock','crypto','programming','code','javascript','python',
    'movie','music','celebrity','news','sports betting','gambling','tax','law','travel'
  ];
  if (banned.some(k => t.includes(k))) return false;

  // Core nutrition keywords
  const allowCore = ['calorie','calories','macro','protein','carb','fat','fiber','sodium','cholesterol','vitamin','mineral','portion','serving','diet','keto','vegan','vegetarian','low-carb','gluten-free','meal','snack','breakfast','lunch','dinner','food','recipe','eat','nutrition','plan','planning'];
  if (allowCore.some(k => t.includes(k))) return true;

  // Substitution and alternatives intent
  const intentSubs = ['replace','substitute','swap','alternative','instead'];
  const foodWords = ['chicken','fish','tofu','egg','eggs','beef','pork','rice','bread','milk','cheese','yogurt','beans','lentils','nuts'];
  if (intentSubs.some(k => t.includes(k)) && foodWords.some(f => t.includes(f))) return true;

  // Short queries are often food names
  return t.split(' ').length <= 4;
}

function summarizeProfile(p?: any): string {
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

type EmbeddedProps = {
  embedded?: boolean;
  context?: {
    targets?: any;
    meals?: any;
    profile?: any;
  };
  initialQuestion?: string;
};

function summarizePlan(ctx?: EmbeddedProps['context']): string {
  if (!ctx || !ctx.targets || !ctx.meals) return '';
  const t = ctx.targets;
  const m = ctx.meals;
  const lines = [
    `Daily target: ${Math.round(t.calories)} kcal; Protein ${Math.round(t.protein.grams)} g, Carbs ${Math.round(t.carbs.grams)} g, Fat ${Math.round(t.fat.grams)} g.`,
    `Meals:`,
    `- Breakfast: ${m.breakfast?.title} (${Math.round(m.breakfast?.calories || 0)} kcal, P${m.breakfast?.protein_g ?? 0} C${m.breakfast?.carbs_g ?? 0} F${m.breakfast?.fat_g ?? 0})`,
    `- Lunch: ${m.lunch?.title} (${Math.round(m.lunch?.calories || 0)} kcal, P${m.lunch?.protein_g ?? 0} C${m.lunch?.carbs_g ?? 0} F${m.lunch?.fat_g ?? 0})`,
    `- Dinner: ${m.dinner?.title} (${Math.round(m.dinner?.calories || 0)} kcal, P${m.dinner?.protein_g ?? 0} C${m.dinner?.carbs_g ?? 0} F${m.dinner?.fat_g ?? 0})`,
    `- Snack: ${m.snack?.title} (${Math.round(m.snack?.calories || 0)} kcal, P${m.snack?.protein_g ?? 0} C${m.snack?.carbs_g ?? 0} F${m.snack?.fat_g ?? 0})`,
  ];
  return lines.join('\n');
}

export default function NutriGenieBot({ embedded = false, context, initialQuestion }: EmbeddedProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const examplePrompts = useMemo(
    () => [
      'How many calories in 100g cooked quinoa? Include macros.',
      'High-protein vegetarian breakfast ideas under 400 kcal.',
      'Estimate calories: 2 slices pepperoni pizza and a can of Coke.',
      'Plan a 1800 kcal Mediterranean day with macro targets.'
    ],
    []
  );

  // Load profile lightly (no PII is stored in chat history)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('age, gender, height_cm, current_weight_kg, health_goal, dietary_restrictions, medical_conditions')
          .eq('id', user.id)
          .single();
        if (!mounted) return;
        if (!error) setProfile(data);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [user]);

  // Load history from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY(user?.id));
    if (raw) {
      try {
        const parsed: ChatMessage[] = JSON.parse(raw);
        setMessages(parsed);
        return;
      } catch {}
    }
    // Seed welcome
    setMessages([
      { id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: 'Hi! I\'m NutriGenie Bot 🤖. Ask me about foods, calories, portions, or meal ideas. I stay strictly on nutrition topics.' }
    ]);
  }, [user?.id]);

  // Auto-send initial question when embedded
  useEffect(() => {
    if (embedded && initialQuestion && initialQuestion.trim()) {
      // Small delay to allow seed message to render
      const t = setTimeout(() => { void sendMessage(initialQuestion); }, 100);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, initialQuestion]);

  const saveHistory = (msgs: ChatMessage[]) => {
    try { localStorage.setItem(STORAGE_KEY(user?.id), JSON.stringify(msgs.slice(-60))); } catch {}
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleClear = () => {
    const seed: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: 'Chat cleared. How can I help with nutrition today?' };
    setMessages([seed]);
    saveHistory([seed]);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput('');

    const newUserMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, ts: Date.now() };
    const nextMsgs = [...messages, newUserMsg];
    setMessages(nextMsgs);
    saveHistory(nextMsgs);

    // Scope filter
    if (!isNutritionScope(text)) {
      const reply: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', ts: Date.now(),
        content: 'I’m NutriGenie Bot — your nutrition expert 🍎. I can help with foods, calories, and healthy meal ideas — but not other topics.'
      };
      const finalMsgs = [...nextMsgs, reply];
      setMessages(finalMsgs);
      saveHistory(finalMsgs);
      return;
    }

    setLoading(true);

    // Helper: Attempt nutrition DB lookup (OpenFoodFacts first, USDA fallback)
    const fetchNutritionFacts = async (q: string) => {
      const off = await searchOpenFoodFactsByName(q);
      if (off && (off.energyKcalPer100g != null || off.proteinPer100g != null || off.carbsPer100g != null || off.fatPer100g != null)) {
        const lines = [
          `Nutrition (per 100g) for ${off.productName || q}:`,
          off.energyKcalPer100g != null ? `- Calories: ${Math.round(off.energyKcalPer100g)} kcal` : undefined,
          off.proteinPer100g != null ? `- Protein: ${Number(off.proteinPer100g).toFixed(1)} g` : undefined,
          off.carbsPer100g != null ? `- Carbs: ${Number(off.carbsPer100g).toFixed(1)} g` : undefined,
          off.fatPer100g != null ? `- Fat: ${Number(off.fatPer100g).toFixed(1)} g` : undefined,
          `(Source: OpenFoodFacts)`
        ].filter(Boolean).join('\n');
        return lines;
      }
      const usda = await searchUSDAFood(q);
      if (usda && (usda.calories != null || usda.protein_g != null || usda.carbs_g != null || usda.fat_g != null)) {
        const lines = [
          `Approximate nutrition (per 100g) for ${usda.description || q}:`,
          usda.calories != null ? `- Calories: ${Math.round(usda.calories)} kcal` : undefined,
          usda.protein_g != null ? `- Protein: ${Number(usda.protein_g).toFixed(1)} g` : undefined,
          usda.carbs_g != null ? `- Carbs: ${Number(usda.carbs_g).toFixed(1)} g` : undefined,
          usda.fat_g != null ? `- Fat: ${Number(usda.fat_g).toFixed(1)} g` : undefined,
          `(Source: USDA FoodData Central)`
        ].filter(Boolean).join('\n');
        return lines;
      }
      return null;
    };

    // Shortcut: direct macro facts for common calorie queries
    const caloriePattern = /(how many\s+calories\s+are\s+in|calories\s+in|nutrition\s+of|nutritional\s+facts\s+of)\s+(.+?)\??$/i;
    const match = text.match(caloriePattern);
    if (match?.[2]) {
      try {
        const lines = await fetchNutritionFacts(match[2]);
        if (lines) {
          const reply: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: lines };
          const finalMsgs = [...nextMsgs, reply];
          setMessages(finalMsgs);
          saveHistory(finalMsgs);
          setLoading(false);
          return;
        }
      } catch {}
    }

    // LLM chat via OpenRouter (Gemini)
    try {
      const profileSummary = summarizeProfile(profile);
      const mealPlanSummary = summarizePlan(context);
      const sys = { role: 'system' as const, content: systemPrompt(profileSummary, mealPlanSummary) };
      const hist = nextMsgs.slice(-8).map(m => ({ role: m.role, content: m.content }));

      // Build auxiliary nutrition facts context for substitutions or general queries
      let auxFacts: string | null = null;
      const swapMatch = text.match(/(replace|substitute|swap)\s+([a-zA-Z][a-zA-Z ]+?)\s+(with|for)\s+([a-zA-Z][a-zA-Z ]+?)(?:[?.!]|$)/i);
      if (swapMatch) {
        const a = swapMatch[2].trim();
        const b = swapMatch[4].trim();
        try {
          const [aFacts, bFacts] = await Promise.all([fetchNutritionFacts(a), fetchNutritionFacts(b)]);
          const blocks = [
            aFacts ? `Data: ${aFacts}` : null,
            bFacts ? `Data: ${bFacts}` : null,
          ].filter(Boolean);
          if (blocks.length) {
            auxFacts = blocks.join('\n\n');
          }
        } catch {}
      } else {
        // If query mentions a specific food word, try one lookup to aid the model
        const foodWord = (text.match(/\b(chicken|fish|tofu|egg|eggs|beef|pork|rice|bread|milk|cheese|yogurt|beans|lentils|nuts|banana|apple|oats|quinoa)\b/i)?.[0]) || null;
        if (foodWord) {
          try { auxFacts = await fetchNutritionFacts(foodWord); } catch {}
        }
      }

      const messagesForModel = auxFacts ? [sys, { role: 'assistant' as const, content: auxFacts }, ...hist] : [sys, ...hist];
      const completion = await openRouterClient.chat(messagesForModel);
      const reply: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: completion || 'Sorry, I had trouble generating a response.'
      };
      const finalMsgs = [...nextMsgs, reply];
      setMessages(finalMsgs);
      saveHistory(finalMsgs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection issue';
      // If API key missing, prompt user to provide OpenRouter API key
      if (err instanceof OpenRouterError && /not initialized|API key/i.test(msg)) {
        toast({
          title: 'OpenRouter API key required',
          description: 'Please provide your OpenRouter API key so I can respond. You can share it now and I will securely add it to the environment.',
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Chat error', description: msg, variant: 'destructive' });
      }
      const reply: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: 'I’m having trouble connecting right now. Please try again later.'
      };
      const finalMsgs = [...nextMsgs, reply];
      setMessages(finalMsgs);
      saveHistory(finalMsgs);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (text: string) => {
    if (loading) return;
    // Immediately send the suggested prompt
    void sendMessage(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const headerDesc = useMemo(() => (
    'Chat with your AI nutrition coach'
  ), []);

  return (
    <div className={embedded ? 'bg-background' : 'min-h-screen bg-background'}>
      {!embedded && (
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">NutriGenie Bot</h1>
                <p className="text-xs text-muted-foreground">{headerDesc}</p>
              </div>
              <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">NEW</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </div>
      </header>
      )}

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>NutriGenie Bot 🤖 — Your AI Nutrition Coach</CardTitle>
            <CardDescription>Ask about foods, calories, portions, diets, and healthy meal ideas.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tips strip with example prompts */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Try one of these</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePromptClick(p)}
                    className="text-xs rounded-full px-3 py-1 border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div ref={scrollRef} className={embedded ? 'h-[60vh] overflow-y-auto pr-2 space-y-4' : 'h-[65vh] md:h-[70vh] overflow-y-auto pr-2 space-y-4'}>
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-3 max-w-[85%] whitespace-pre-wrap`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask a nutrition question (e.g., calories in banana)"
                className="flex-1"
              />
              <Button variant="outline" disabled>
                <Mic className="w-4 h-4" />
              </Button>
              <Button onClick={sendMessage} disabled={loading || !input.trim()} className="gradient-primary text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}