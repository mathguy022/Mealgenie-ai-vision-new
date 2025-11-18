import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Activity, Pill, Sparkles, Bot as BotIcon, Syringe, LayoutDashboard, Scale, AlertCircle, Apple, UtensilsCrossed, Bell } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
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
    const enteredDose = doseRef.current?.value?.trim() || dose;
    setDose(enteredDose);
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
      <header className="sticky top-0 z-50 bg-card shadow-sm">
        <div className="container mx-auto px-4 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">GLP‑1 Companion</h1>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Next Dose</div>
              <div className="text-sm font-semibold">{formatNextDose(nextDose)}</div>
            </div>
            <Button className="bg-indigo-600 text-white" onClick={() => setCheckInOpen(true)}>Check In</Button>
            <Button variant="outline" size="icon"><Bell className="w-5 h-5" /></Button>
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

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="dashboard">
          <TabsList className="flex w-full overflow-x-auto border-b">
            <TabsTrigger value="dashboard" className="px-4 py-3 data-[state=active]:text-indigo-600 data-[state=active]:font-bold data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</TabsTrigger>
            <TabsTrigger value="medication" className="px-4 py-3 data-[state=active]:text-indigo-600 data-[state=active]:font-bold data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 flex items-center gap-2"><Pill className="w-4 h-4" /> Medication</TabsTrigger>
            <TabsTrigger value="metrics" className="px-4 py-3 data-[state=active]:text-indigo-600 data-[state=active]:font-bold data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 flex items-center gap-2"><Scale className="w-4 h-4" /> Weight & Metrics</TabsTrigger>
            <TabsTrigger value="effects" className="px-4 py-3 data-[state=active]:text-indigo-600 data-[state=active]:font-bold data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Side Effects</TabsTrigger>
            <TabsTrigger value="nutrition" className="px-4 py-3 data-[state=active]:text-indigo-600 data-[state=active]:font-bold data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 flex items-center gap-2"><Apple className="w-4 h-4" /> Nutrition</TabsTrigger>
            <TabsTrigger value="plans" className="px-4 py-3 data-[state=active]:text-indigo-600 data-[state=active]:font-bold data-[state=active]:border-b-4 data-[state=active]:border-indigo-600 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4" /> Meal Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="font-semibold mb-4">Current Status</div>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Current Weight</span><span className="font-semibold">-- lbs</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Weekly Progress</span><span className="text-green-600">-- lbs</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Medication This Week</span><span className="font-medium">On Track</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="font-semibold mb-4">Protein Target</div>
                  <div className="flex items-center gap-6">
                    <RadialBarChart width={120} height={120} innerRadius={45} outerRadius={55} data={[{ name:'p', value:50, fill:'#6366F1' }]} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0,100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={8} />
                    </RadialBarChart>
                    <div>
                      <div className="text-2xl font-bold">50%</div>
                      <div className="text-sm text-muted-foreground">60g / 120g</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="font-semibold mb-4">Lean Body Mass</div>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Current LBM</span><span className="font-semibold">-- lbs</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">LBM %</span><span className="text-indigo-600">--%</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Trend</span><span className="text-green-600">Stable</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
              <CardContent className="p-6">
                <div className="font-semibold mb-2">Recent Activity</div>
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medication" className="pt-6">
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

          <TabsContent value="metrics" className="pt-6">
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

          <TabsContent value="effects" className="pt-6">
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

          <TabsContent value="nutrition" className="pt-6">
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

          <TabsContent value="plans" className="pt-6">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
              <CardHeader className="flex items-center justify-between"><CardTitle>Auto-Generated Meal Plan</CardTitle><Button className="bg-indigo-600 text-white">Generate New Plan</Button></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="text-sm text-muted-foreground">Generate to view plan.</div></CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200"><CardHeader><CardTitle>Meal Plan Guidelines</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3"><div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">High Protein Focus</div><div className="text-sm text-muted-foreground">Each meal contains 25-40g of protein</div></div></div><div className="flex items-start gap-3"><div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">Easy to Digest</div><div className="text-sm text-muted-foreground">Low-fat, low-fiber options</div></div></div><div className="flex items-start gap-3"><div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">Small Frequent Meals</div><div className="text-sm text-muted-foreground">3 meals + 2-3 snacks</div></div></div><div className="flex items-start gap-3"><div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div><div><div className="text-sm font-medium">Hydration Focus</div><div className="text-sm text-muted-foreground">Includes water-rich foods</div></div></div></CardContent></Card>
              <Card className="bg-white rounded-xl shadow-sm border border-gray-200"><CardHeader><CardTitle>Protein-Rich Foods</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4"><div><div className="text-sm font-semibold">Animal Proteins</div><ul className="text-sm text-muted-foreground space-y-1"><li>• Chicken breast</li><li>• Turkey</li><li>• White fish</li><li>• Greek yogurt</li><li>• Eggs</li><li>• Cottage cheese</li></ul></div><div><div className="text-sm font-semibold">Plant Proteins</div><ul className="text-sm text-muted-foreground space-y-1"><li>• Tofu</li><li>• Tempeh</li><li>• Lentils</li><li>• Protein powder</li><li>• Edamame</li><li>• Protein pasta</li></ul></div></CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
