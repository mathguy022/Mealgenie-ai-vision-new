import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bot, Loader2, Mic, Send, Trash2, Sparkles } from 'lucide-react';
import { openRouterClient } from '@/integrations/openrouter/openrouter-client';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { searchUSDAFood } from '@/lib/usda';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; ts: number };

const STORAGE_KEY = (uid?: string) => `nutrigenie_chat_${uid || 'guest'}`;

const systemPrompt = (profileSummary?: string) => `
You are NutriGenie Bot, an AI nutrition coach for MealGenie.
Stay STRICTLY within nutrition topics only. Decline non-nutrition topics politely.

Allowed scope:
- Food nutrition and calories, macronutrients, micronutrients
- Meal suggestions and healthy eating guidance
- Portion control and substitutions
- Diet types (vegan, keto, low-carb, etc.)
- Personalized advice using provided profile data only

When out-of-scope: reply exactly with:
"I’m NutriGenie Bot — your nutrition expert 🍎. I can help with foods, calories, and healthy meal ideas — but not other topics."

Style:
- Friendly, precise, evidence-based; provide kcal and grams
- Offer practical portions and simple swaps
- Prefer concise bullets; include both metric and US units when relevant
- If unsure, ask a clarifying nutrition question; avoid medical claims

Data sources:
- You may reference OpenFoodFacts or USDA FoodData Central when relevant.

User Profile (if provided):
${profileSummary || 'No profile available.'}
`;

function isNutritionScope(text: string): boolean {
  const t = text.toLowerCase();
  const banned = [
    'workout','exercise','training','bench press','squat','deadlift','biceps','triceps','cardio',
    'weather','politics','election','stock','crypto','programming','code','javascript','python',
    'movie','music','celebrity','news','sports betting','gambling','tax','law','travel'
  ];
  if (banned.some(k => t.includes(k))) return false;
  // Heuristic allow list hits
  const allow = ['calorie','calories','macro','protein','carb','fat','fiber','sodium','cholesterol','vitamin','mineral','portion','serving','diet','keto','vegan','low-carb','meal','snack','breakfast','lunch','dinner','food','recipe','eat','nutrition'];
  return allow.some(k => t.includes(k)) || t.split(' ').length <= 4; // short queries often food names
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

export default function NutriGenieBot() {
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

    // Try USDA shortcut for common calorie queries
    const caloriePattern = /(how many\s+calories\s+are\s+in|calories\s+in|nutrition\s+of|nutritional\s+facts\s+of)\s+(.+?)\??$/i;
    const match = text.match(caloriePattern);
    if (match?.[2]) {
      try {
        const food = await searchUSDAFood(match[2]);
        if (food && (food.calories || food.protein_g || food.carbs_g || food.fat_g)) {
          const lines = [
            `Approximate nutrition for ${food.description}:`,
            food.calories != null ? `- Calories: ${Math.round(food.calories)} kcal` : undefined,
            food.protein_g != null ? `- Protein: ${Number(food.protein_g).toFixed(1)} g` : undefined,
            food.carbs_g != null ? `- Carbs: ${Number(food.carbs_g).toFixed(1)} g` : undefined,
            food.fat_g != null ? `- Fat: ${Number(food.fat_g).toFixed(1)} g` : undefined,
            `(Source: USDA FoodData Central)`
          ].filter(Boolean).join('\n');

          const reply: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: lines };
          const finalMsgs = [...nextMsgs, reply];
          setMessages(finalMsgs);
          saveHistory(finalMsgs);
          setLoading(false);
          return;
        }
      } catch {}
    }

    // Fallback to LLM chat with system prompt
    try {
      const profileSummary = summarizeProfile(profile);
      const sys = { role: 'system' as const, content: systemPrompt(profileSummary) };
      const hist = nextMsgs.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const completion = await openRouterClient.chat([sys, ...hist]);
      const reply: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: completion || 'Sorry, I had trouble generating a response.'
      };
      const finalMsgs = [...nextMsgs, reply];
      setMessages(finalMsgs);
      saveHistory(finalMsgs);
    } catch (err: unknown) {
      toast({ title: 'Chat error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
      const reply: ChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', ts: Date.now(), content: 'I’m having trouble connecting right now. Please try again.'
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
    <div className="min-h-screen bg-background">
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

            <div ref={scrollRef} className="h-[65vh] md:h-[70vh] overflow-y-auto pr-2 space-y-4">
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