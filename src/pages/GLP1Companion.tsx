import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Activity, Pill, Sparkles, Bot as BotIcon, Syringe, LayoutDashboard, Scale, AlertCircle, Apple, UtensilsCrossed, Bell, TrendingUp, FlaskConical, Plus, CalendarClock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function calcLeanMassKg(weightKg: number, bodyFatPct?: number) {
  const bf = Math.min(60, Math.max(0, bodyFatPct || 0));
  const lean = weightKg * (1 - bf / 100);
  return Math.round(lean * 10) / 10;
}

export default function GLP1Companion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [medName, setMedName] = useState('Ozempic');
  const [dose, setDose] = useState('0.5 mg');
  const [freq, setFreq] = useState('Weekly');
  const [nextDose, setNextDose] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [lastSite, setLastSite] = useState<string>('Abdomen');
  const [injectionDay, setInjectionDay] = useState<number>(0);
  const [reminderTime, setReminderTime] = useState<string>('09:00');
  const [injectionHistory, setInjectionHistory] = useState<Array<{ date: string; dose: string; medication: string }>>([]);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [bodyFat, setBodyFat] = useState<number>(28);
  const [proteinTarget, setProteinTarget] = useState<number>(0);
  const [effects, setEffects] = useState<string>('');
  const [applyStatus, setApplyStatus] = useState<string>('');
  const [checkInOpen, setCheckInOpen] = useState<boolean>(false);
  const [checkinMood, setCheckinMood] = useState<string>('good');
  const [checkinSelections, setCheckinSelections] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [tab, setTab] = useState<'dashboard'|'medication'|'metrics'|'effects'|'nutrition'|'plans'>('dashboard');

  const leanMass = useMemo(() => calcLeanMassKg(weightKg || 0, bodyFat || 0), [weightKg, bodyFat]);
  const recommendedProtein = useMemo(() => Math.round(leanMass * 1.8), [leanMass]);

  useEffect(() => {
    setProteinTarget(recommendedProtein);
  }, [recommendedProtein]);

  useEffect(() => {
    const m = localStorage.getItem('glp1Med');
    const d = localStorage.getItem('glp1Dose');
    const f = localStorage.getItem('glp1Freq');
    const nd = localStorage.getItem('glp1NextDose');
    const sd = localStorage.getItem('glp1StartDate');
    const ls = localStorage.getItem('glp1LastSite');
    const id = localStorage.getItem('glp1InjectionDay');
    const rt = localStorage.getItem('glp1ReminderTime');
    const ih = localStorage.getItem('glp1InjectionHistory');
    if (m) setMedName(m);
    if (d) setDose(d);
    if (f) setFreq(f);
    if (nd) setNextDose(nd);
    if (sd) setStartDate(sd);
    if (ls) setLastSite(ls);
    if (id) setInjectionDay(parseInt(id));
    if (rt) setReminderTime(rt);
    if (ih) setInjectionHistory(JSON.parse(ih));
  }, []);

  function formatNextDose(text?: string) {
    if (!text) return '--';
    const dt = new Date(text);
    const day = dt.toLocaleDateString(undefined, { weekday: 'long' });
    const month = dt.toLocaleDateString(undefined, { month: 'short' });
    const date = dt.getDate();
    const time = dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${day}, ${month} ${date} at ${time}`;
  }

  function countdown(text?: string) {
    if (!text) return '';
    const now = Date.now();
    const target = new Date(text).getTime();
    const diff = target - now;
    if (diff <= 0) return 'Due now';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `(${days} day${days > 1 ? 's' : ''} from now)`;
    return `(${hours}h from now)`;
  }

  function computeWeek(start?: string) {
    if (!start) return '--';
    const s = new Date(start).getTime();
    const weeks = Math.floor((Date.now() - s) / (7 * 86400000)) + 1;
    return `Week ${weeks}`;
  }

  const sites = ['Abdomen', 'Thigh (Left)', 'Thigh (Right)', 'Arm (Left)', 'Arm (Right)'];
  function nextSite(current: string) {
    const idx = sites.indexOf(current);
    return sites[(idx + 1 + sites.length) % sites.length];
  }

  function computeNextDoseDate(): Date | null {
    try {
      const now = new Date();
      const t = (reminderTime || '09:00').split(':').map(x => parseInt(x));
      const target = new Date();
      target.setHours(t[0] || 9, t[1] || 0, 0, 0);
      const currentDow = target.getDay();
      let addDays = (injectionDay - currentDow + 7) % 7;
      if (addDays === 0 && target <= now) addDays = 7;
      target.setDate(target.getDate() + addDays);
      return target;
    } catch {
      return null;
    }
  }

  const weightSeries = [
    { week: 'Week 1', lbs: 338 },
    { week: 'Week 2', lbs: 334 },
    { week: 'Week 3', lbs: 328 },
    { week: 'Week 4', lbs: 320 },
    { week: 'Week 5', lbs: 312 },
    { week: 'Week 6', lbs: 305 },
    { week: 'Week 7', lbs: 298 },
    { week: 'Week 8', lbs: 290 },
  ];
  const [chartData, setChartData] = useState(weightSeries);
  const [logOpen, setLogOpen] = useState(false);
  const [logWeek, setLogWeek] = useState<string>('');
  const [logWeight, setLogWeight] = useState<string>('');

  const markDoseComplete = () => {
    const ns = nextSite(lastSite);
    setLastSite(ns);
    localStorage.setItem('glp1LastSite', ns);
    if (freq.toLowerCase().includes('week') && nextDose) {
      const n = new Date(nextDose);
      n.setDate(n.getDate() + 7);
      const iso = n.toISOString().slice(0,16);
      setNextDose(iso);
      localStorage.setItem('glp1NextDose', iso);
    }
    toast({ title: 'Marked dose complete', description: 'Rotation updated and next dose scheduled.' });
  };

  const setReminder = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast({ title: 'Enable notifications', description: 'Allow notifications to receive reminders.' });
        return;
      }
      if (!nextDose) return;
      const delay = new Date(nextDose).getTime() - Date.now();
      if (delay > 0 && delay < 7 * 86400000) {
        setTimeout(() => {
          new Notification('GLP‑1 dose reminder', { body: `${medName} ${dose} is due now` });
        }, delay);
        toast({ title: 'Reminder set', description: 'We will remind you at the scheduled time.' });
      } else {
        toast({ title: 'Reminder saved', description: 'Reminder will show when you revisit near the dose time.' });
      }
    } catch {}
  };

  const saveMedicationSchedule = () => {
    const enteredDose = dose;
    localStorage.setItem('glp1Med', medName);
    localStorage.setItem('glp1Dose', enteredDose);
    localStorage.setItem('glp1InjectionDay', String(injectionDay));
    localStorage.setItem('glp1ReminderTime', reminderTime);
    const d = computeNextDoseDate();
    if (d) {
      const iso = d.toISOString().slice(0,16);
      setNextDose(iso);
      localStorage.setItem('glp1NextDose', iso);
    }
    toast({ title: 'Medication schedule saved' });
  };

  const logInjection = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const already = injectionHistory.some(i => i.date === todayStr);
    if (already) { toast({ title: 'Injection already logged today' }); return; }
    const entry = { date: todayStr, dose, medication: medName };
    const updated = [entry, ...injectionHistory];
    setInjectionHistory(updated);
    localStorage.setItem('glp1InjectionHistory', JSON.stringify(updated));
    const d = computeNextDoseDate();
    if (d) {
      const iso = d.toISOString().slice(0,16);
      setNextDose(iso);
      localStorage.setItem('glp1NextDose', iso);
    }
    toast({ title: 'Injection logged' });
  };

  const applyAdjustments = () => {
    localStorage.setItem('glp1Mode', 'on');
    localStorage.setItem('glp1Med', medName);
    localStorage.setItem('glp1Dose', dose);
    localStorage.setItem('glp1Freq', freq);
    localStorage.setItem('glp1NextDose', nextDose);
    localStorage.setItem('glp1StartDate', startDate);
    localStorage.setItem('glp1LastSite', lastSite);
    localStorage.setItem('glp1ProteinTargetG', String(proteinTarget));
    localStorage.setItem('glp1LeanMassKg', String(leanMass));
    localStorage.setItem('glp1Effects', effects);
    setApplyStatus('GLP-1 adjustments saved. Open Smart Meal Genie to apply.');
  };

  const clearAdjustments = () => {
    ['glp1Mode','glp1Med','glp1Dose','glp1NextDose','glp1ProteinTargetG','glp1LeanMassKg','glp1Effects'].forEach(k => localStorage.removeItem(k));
    setApplyStatus('GLP-1 adjustments cleared.');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#6C4CEA] to-[#8B5CF6] shadow-sm">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">My GLP‑1 Journey</h1>
              <p className="text-sm opacity-90">{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <input className="h-10 w-64 rounded-full px-4 bg-white/20 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/60" placeholder="Search..." />
            </div>
            <div className="text-right hidden md:block">
              <div className="text-sm opacity-90">Next Dose</div>
              <div className="text-base font-semibold">{formatNextDose(nextDose)}</div>
            </div>
            <Button variant="outline" className="bg-white/20 border-white/40 text-white" onClick={() => setCheckInOpen(true)}>Check In</Button>
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-semibold">JD</div>
          </div>
        </div>
      </header>
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daily Check-in</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">How are you feeling today?</div>
              <select value={checkinMood} onChange={(e)=>setCheckinMood(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="great">Great</option>
                <option value="good">Good</option>
                <option value="okay">Okay</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Any side effects today?</div>
              <div className="space-y-2">
                {[
                  { v:'nausea', l:'Nausea' },
                  { v:'fatigue', l:'Fatigue' },
                  { v:'appetite_loss', l:'Loss of Appetite' },
                  { v:'none', l:'No side effects' }
                ].map((opt)=> (
                  <label key={opt.v} className="flex items-center gap-2">
                    <input type="checkbox" checked={checkinSelections.includes(opt.v)} onChange={(e)=>{
                      const checked=e.target.checked;
                      setCheckinSelections(prev=> checked ? [...new Set([...prev,opt.v])] : prev.filter(x=>x!==opt.v));
                    }} />
                    <span className="text-sm">{opt.l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Energy Level (1-10)</div>
              <input type="range" min={1} max={10} value={energyLevel} onChange={(e)=>setEnergyLevel(parseInt(e.target.value))} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>{energyLevel}</span>
                <span>High</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={()=>setCheckInOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 text-white flex-1" onClick={()=>{
              const payload={
                date:new Date().toISOString(),
                mood:checkinMood,
                sideEffects:checkinSelections,
                energy:energyLevel,
              };
              const key='glp1CheckIns';
              const existing=JSON.parse(localStorage.getItem(key)||'[]');
              existing.unshift(payload);
              localStorage.setItem(key,JSON.stringify(existing));
              toast({ title:'Check-in saved' });
              setCheckInOpen(false);
            }}>Save Check-in</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Weight Point</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2"># Week</div>
              <Input placeholder="e.g., 3" value={logWeek} onChange={(e)=>setLogWeek(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Weight (lbs)</div>
              <Input type="number" inputMode="decimal" placeholder="e.g., 312" value={logWeight} onChange={(e)=>setLogWeight(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={()=>setLogOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-600 text-white flex-1" onClick={()=>{
              const w = Math.max(1, parseInt(logWeek || '0'));
              const lbs = parseFloat(logWeight || '0');
              if (!Number.isFinite(lbs) || lbs <= 0) { toast({ title:'Enter a valid weight' }); return; }
              const wk = `Week ${w}`;
              const next = [...chartData.filter(p=>p.week!==wk), { week: wk, lbs }].sort((a,b)=>parseInt(a.week.replace(/\D/g,'')) - parseInt(b.week.replace(/\D/g,'')));
              setChartData(next);
              setLogOpen(false);
              setLogWeek('');
              setLogWeight('');
              toast({ title:'Logged', description:`${wk}: ${lbs} lbs` });
            }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full overflow-x-auto rounded-2xl bg-[#F5F3FF] border border-[#E9D5FF] px-2 py-2">
            <TabsTrigger value="dashboard" className="px-4 py-2 text-base text-[#6B7280] flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#6C4CEA] data-[state=active]:font-bold data-[state=active]:shadow"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="medication" className="px-4 py-2 text-base text-[#6B7280] flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#6C4CEA] data-[state=active]:font-bold data-[state=active]:shadow"><Pill className="w-4 h-4" /> Medication</TabsTrigger>
            <TabsTrigger value="metrics" className="px-4 py-2 text-base text-[#6B7280] flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#6C4CEA] data-[state=active]:font-bold data-[state=active]:shadow"><Scale className="w-4 h-4" /> Weight & Metrics</TabsTrigger>
            <TabsTrigger value="effects" className="px-4 py-2 text-base text-[#6B7280] flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#6C4CEA] data-[state=active]:font-bold data-[state=active]:shadow"><AlertCircle className="w-4 h-4" /> Side Effects</TabsTrigger>
            <TabsTrigger value="nutrition" className="px-4 py-2 text-base text-[#6B7280] flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#6C4CEA] data-[state=active]:font-bold data-[state=active]:shadow"><Apple className="w-4 h-4" /> Nutrition</TabsTrigger>
            <TabsTrigger value="plans" className="px-4 py-2 text-base text-[#6B7280] flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#6C4CEA] data-[state=active]:font-bold data-[state=active]:shadow"><UtensilsCrossed className="w-4 h-4" /> Meal Plans</TabsTrigger>
          </TabsList>
          <div className="pt-6 lg:flex gap-6">
            <aside className="hidden lg:block w-60">
              <div className="rounded-2xl p-4 bg-gradient-to-b from-[#F3E8FF] to-[#EDE9FE] border border-[#E9D5FF]">
                <nav className="space-y-2">
                  <button onClick={() => setTab('dashboard')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base ${tab==='dashboard'?'bg-[#6C4CEA] text-white font-bold shadow':'hover:bg-white/60 text-[#6C4CEA]'}`}>
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </button>
                  <button onClick={() => setTab('medication')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base ${tab==='medication'?'bg-[#6C4CEA] text-white font-bold shadow':'hover:bg-white/60 text-[#6C4CEA]'}`}>
                    <Pill className="w-4 h-4" /> Medication
                  </button>
                  <button onClick={() => setTab('metrics')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base ${tab==='metrics'?'bg-[#6C4CEA] text-white font-bold shadow':'hover:bg-white/60 text-[#6C4CEA]'}`}>
                    <Scale className="w-4 h-4" /> Weight & Metrics
                  </button>
                  <button onClick={() => setTab('effects')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base ${tab==='effects'?'bg-[#6C4CEA] text-white font-bold shadow':'hover:bg-white/60 text-[#6C4CEA]'}`}>
                    <AlertCircle className="w-4 h-4" /> Side Effects
                  </button>
                  <button onClick={() => setTab('nutrition')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base ${tab==='nutrition'?'bg-[#6C4CEA] text-white font-bold shadow':'hover:bg-white/60 text-[#6C4CEA]'}`}>
                    <Apple className="w-4 h-4" /> Nutrition
                  </button>
                  <button onClick={() => setTab('plans')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-base ${tab==='plans'?'bg-[#6C4CEA] text-white font-bold shadow':'hover:bg-white/60 text-[#6C4CEA]'}`}>
                    <UtensilsCrossed className="w-4 h-4" /> Meal Plans
                  </button>
                </nav>
              </div>
            </aside>
            <div className="flex-1">
          <TabsContent value="dashboard" className="pt-0">
            <div className="rounded-2xl p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold">Welcome back, John!</div>
                  <div className="text-sm opacity-90">Track your GLP‑1 journey and stay on top of your health goals</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">Today’s Date</div>
                  <div className="text-sm font-semibold">{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><div className="text-xs text-gray-500">Current Weight</div><div className="text-3xl font-extrabold">{Math.round(weightKg*2.2046)} lbs</div><div className="text-xs text-green-600">↓ 15 lbs</div></div><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-green-600" /></div></div></CardContent></Card>
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><div className="text-xs text-gray-500">Water Intake</div><div className="text-3xl font-extrabold">2.1 L</div><div className="text-xs text-indigo-600">75% of goal</div></div><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><FlaskConical className="w-4 h-4 text-indigo-600" /></div></div></CardContent></Card>
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><div className="text-xs text-gray-500">Protein Intake</div><div className="text-3xl font-extrabold">85g</div><div className="text-xs text-amber-600">85% of goal</div></div><div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Plus className="w-4 h-4 text-amber-600" /></div></div></CardContent></Card>
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between"><div><div className="text-xs text-gray-500">Last Injection</div><div className="text-3xl font-extrabold">{(() => { if(!injectionHistory.length) return '—'; const last = new Date(injectionHistory[0].date); const diff=Math.floor((Date.now()-last.getTime())/86400000); return `${diff} days`; })()}</div><div className="text-xs text-indigo-600">Due tomorrow</div></div><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><CalendarClock className="w-4 h-4 text-purple-600" /></div></div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">Weight Progress</div>
                    <Button onClick={()=>setLogOpen(true)} className="h-9 px-4 rounded-full bg-gradient-to-r from-[#6C4CEA] to-[#8B5CF6] text-white shadow">Log</Button>
                  </div>
                  <div className="h-56 rounded-xl bg-gradient-to-b from-[#F5F3FF] to-[#E9D5FF] p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="category" dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} tickMargin={8} />
                        <YAxis type="number" domain={[180, 400]} tick={{ fontSize: 11, fill: '#6B7280' }} tickMargin={4} />
                        <Tooltip />
                        <Line type="monotone" dataKey="lbs" stroke="#6C4CEA" strokeWidth={3} dot={{ r: 3, stroke: '#6C4CEA', strokeWidth: 2 }} activeDot={{ r: 4 }}>
                          <LabelList dataKey="lbs" position="right" fill="#6C4CEA" fontSize={11} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-sm"><CardContent className="p-6"><div className="font-semibold mb-3">Today’s Health Metrics</div><div className="space-y-2 text-sm"><div className="flex items-center justify-between"><span className="text-gray-700">Blood Sugar</span><span className="text-green-600 font-medium">98 mg/dL</span></div><div className="flex items-center justify-between"><span className="text-gray-700">Blood Pressure</span><span className="text-blue-600 font-medium">120/80 mmHg</span></div><div className="flex items-center justify-between"><span className="text-gray-700">Calories</span><span className="text-red-600 font-medium">1,450 kcal</span></div><div className="flex items-center justify-between"><span className="text-gray-700">Side Effects</span><span className="text-red-600 font-medium">Mild nausea</span></div></div></CardContent></Card>
            </div>

            <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-6">
              <CardContent className="p-6">
                <div className="font-semibold mb-2">Recent Activity</div>
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medication" className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Medication Schedule</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Medication Type</div>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={medName} onChange={(e)=>setMedName(e.target.value)}>
                      <option value="Ozempic">Ozempic (Semaglutide)</option>
                      <option value="Wegovy">Wegovy (Semaglutide)</option>
                      <option value="Mounjaro">Mounjaro (Tirzepatide)</option>
                      <option value="Zepbound">Zepbound (Tirzepatide)</option>
                      <option value="Saxenda">Saxenda (Liraglutide)</option>
                      <option value="Victoza">Victoza (Liraglutide)</option>
                      <option value="Trulicity">Trulicity (Dulaglutide)</option>
                      <option value="Bydureon">Bydureon (Exenatide)</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Current Dose</div>
                    <input type="text" value={dose} onChange={(e)=>setDose(e.target.value)} placeholder="e.g., 0.5 mg" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm" />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Injection Day</div>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={injectionDay} onChange={(e)=>setInjectionDay(parseInt(e.target.value))}>
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Reminder Time</div>
                    <Input type="time" value={reminderTime} onChange={(e)=>setReminderTime(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Next Dose</div>
                    <Input type="datetime-local" value={nextDose} onChange={(e)=>setNextDose(e.target.value)} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Start Date</div>
                      <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Last Site</div>
                      <Input value={lastSite} onChange={(e)=>setLastSite(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button className="bg-indigo-600 text-white" onClick={saveMedicationSchedule}><Sparkles className="w-4 h-4 mr-2" /> Save Schedule</Button>
                    <Button variant="outline" onClick={setReminder}><Bell className="w-4 h-4 mr-2" /> Set Reminder</Button>
                    <Button variant="outline" onClick={markDoseComplete}>Mark Complete</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader className="flex items-center justify-between"><CardTitle>Injection History</CardTitle><Button className="bg-green-600 text-white" onClick={logInjection}>Log Injection</Button></CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {injectionHistory.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No injections logged yet.</div>
                  ) : (
                    injectionHistory.slice(0,10).map((inj, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">{new Date(inj.date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{inj.medication} • {inj.dose}</div>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Log Weight & Metrics</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><div className="text-sm font-medium mb-2">Weight (kg)</div><Input type="number" inputMode="decimal" value={weightKg} onChange={(e)=>setWeightKg(parseFloat(e.target.value||'0'))} /></div>
                  <div><div className="text-sm font-medium mb-2">Body fat %</div><Input type="number" inputMode="decimal" value={bodyFat} onChange={(e)=>setBodyFat(parseFloat(e.target.value||'0'))} /></div>
                  <div><div className="text-sm font-medium mb-2">Lean mass (kg)</div><div className="font-bold mt-1">{leanMass}</div></div>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Weight Progress</CardTitle></CardHeader>
                <CardContent className="p-6"><div className="text-sm text-muted-foreground">Add entries to see progress.</div></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="effects" className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Log Side Effect</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><div className="text-sm font-medium mb-2">Date & Time</div><Input type="datetime-local" /></div>
                  <div>
                    <div className="text-sm font-medium mb-2">Side Effect Type</div>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="nausea">Nausea</option>
                      <option value="vomiting">Vomiting</option>
                      <option value="diarrhea">Diarrhea</option>
                      <option value="constipation">Constipation</option>
                      <option value="headache">Headache</option>
                      <option value="fatigue">Fatigue</option>
                      <option value="dizziness">Dizziness</option>
                      <option value="injection_site_reaction">Injection Site Reaction</option>
                      <option value="heartburn">Heartburn/GERD</option>
                      <option value="bloating">Bloating</option>
                      <option value="loss_appetite">Loss of Appetite</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Severity</div>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="mild">Mild - Noticeable but not bothersome</option>
                      <option value="moderate">Moderate - Bothersome but manageable</option>
                      <option value="severe">Severe - Significantly impacts daily life</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Notes (optional)</div>
                    <Textarea rows={3} placeholder="Additional details about the side effect..." />
                  </div>
                  <Button className="bg-indigo-600 text-white">Log Side Effect</Button>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Side Effect History</CardTitle></CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto"><div className="text-sm text-muted-foreground">No side effects logged yet.</div></CardContent>
              </Card>
            </div>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
              <CardHeader><CardTitle>Side Effect Summary</CardTitle></CardHeader>
              <CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="text-sm text-muted-foreground col-span-full">No side effects to summarize.</div></div></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Daily Nutrition</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><div className="text-sm font-medium mb-2">Date</div><Input type="date" /></div>
                  <div><div className="text-sm font-medium mb-2">Protein (g)</div><Input type="number" /></div>
                  <div><div className="text-sm font-medium mb-2">Calories (optional)</div><Input type="number" /></div>
                  <div><div className="text-sm font-medium mb-2">Water (cups)</div><Input type="number" /></div>
                  <Button className="bg-indigo-600 text-white">Save Nutrition Data</Button>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardHeader><CardTitle>Today's Nutrition</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm font-medium">Protein</span><span className="text-sm text-muted-foreground">0g / 120g</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-indigo-600 h-3 rounded-full" style={{ width:'0%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm font-medium">Calories</span><span className="text-sm text-muted-foreground">0 / 1800</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-green-600 h-3 rounded-full" style={{ width:'0%' }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2"><span className="text-sm font-medium">Water</span><span className="text-sm text-muted-foreground">0 / 8 cups</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3"><div className="bg-cyan-600 h-3 rounded-full" style={{ width:'0%' }} /></div>
                  </div>
                  <div className="mt-2 p-4 bg-indigo-50 rounded-lg text-sm"><span className="font-semibold">Protein Target:</span> Based on your lean body mass, aim for 120g of protein daily to preserve muscle mass.</div>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
              <CardHeader><CardTitle>7-Day Nutrition Trends</CardTitle></CardHeader>
              <CardContent className="p-6"><div className="text-sm text-muted-foreground">Add entries to see trends.</div></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="pt-0">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <CardHeader className="flex items-center justify-between"><CardTitle>Auto-Generated Meal Plan</CardTitle><Button className="bg-indigo-600 text-white">Generate New Plan</Button></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="text-sm text-muted-foreground">Generate to view plan.</div></CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200"><CardHeader><CardTitle>Meal Plan Guidelines</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3"><div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">High Protein Focus</div><div className="text-sm text-muted-foreground">Each meal contains 25-40g of protein</div></div></div><div className="flex items-start gap-3"><div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">Easy to Digest</div><div className="text-sm text-muted-foreground">Low-fat, low-fiber options</div></div></div><div className="flex items-start gap-3"><div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">Small Frequent Meals</div><div className="text-sm text-muted-foreground">3 meals + 2-3 snacks</div></div></div><div className="flex items-start gap-3"><div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">Hydration Focus</div><div className="text-sm text-muted-foreground">Includes water-rich foods</div></div></div></CardContent></Card>
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200"><CardHeader><CardTitle>Protein-Rich Foods</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4"><div><div className="text-sm font-semibold">Animal Proteins</div><ul className="text-sm text-muted-foreground space-y-1"><li>• Chicken breast</li><li>• Turkey</li><li>• White fish</li><li>• Greek yogurt</li><li>• Eggs</li><li>• Cottage cheese</li></ul></div><div><div className="text-sm font-semibold">Plant Proteins</div><ul className="text-sm text-muted-foreground space-y-1"><li>• Tofu</li><li>• Tempeh</li><li>• Lentils</li><li>• Protein powder</li><li>• Edamame</li><li>• Protein pasta</li></ul></div></CardContent></Card>
            </div>
          </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
