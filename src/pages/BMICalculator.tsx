import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Activity } from 'lucide-react';

type BmiResult = { value: number; category: string } | null;

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obesity';
}

function indicatorColor(category?: string): string {
  switch (category) {
    case 'Underweight':
      return 'bg-blue-500';
    case 'Healthy':
      return 'bg-emerald-500';
    case 'Overweight':
      return 'bg-amber-500';
    case 'Obesity':
      return 'bg-red-500';
    default:
      return 'bg-muted';
  }
}

export default function BMICalculator() {
  const navigate = useNavigate();
  const headerDesc = useMemo(() => (
    'Calculate BMI using Standard or Metric units, with clear categories.'
  ), []);

  const [activeTab, setActiveTab] = useState<'standard' | 'metric'>('standard');
  // Standard (Imperial)
  const [feet, setFeet] = useState<string>('');
  const [inches, setInches] = useState<string>('');
  const [pounds, setPounds] = useState<string>('');
  // Metric
  const [metricUnit, setMetricUnit] = useState<'cm' | 'm'>('cm');
  const [heightMetric, setHeightMetric] = useState<string>('');
  const [kilograms, setKilograms] = useState<string>('');

  const [result, setResult] = useState<BmiResult>(null);

  const handleCalculate = () => {
    let bmi = 0;
    if (activeTab === 'standard') {
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
      setResult({ value: Number(bmi.toFixed(1)), category: cat });
    } else {
      setResult(null);
    }
  };

  const progressRatio = result ? Math.min(result.value / 40, 1) : 0; // cap at BMI=40
  const progressColor = indicatorColor(result?.category);

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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">BMI Calculator</h1>
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
              <CardTitle>BMI Calculator</CardTitle>
              <CardDescription>Standard (Imperial) or Metric units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'standard' | 'metric')}>
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
                <Button className="gradient-primary text-white" onClick={handleCalculate}>Calculate Your BMI</Button>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Result</p>
                {result ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">Your BMI: {result.value}</p>
                    <p className="text-sm">Category: <span className="font-medium">{result.category}</span></p>
                    <div className="flex items-center gap-3">
                      <Progress value={progressRatio * 100} className="h-3 flex-1" />
                      <div className={`w-3 h-3 rounded-full ${progressColor}`} aria-label={`Indicator ${result.category}`} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Enter values and calculate to see your BMI.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories Panel */}
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
                  <TableRow>
                    <TableCell>Underweight</TableCell>
                    <TableCell>Below 18.5</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Healthy</TableCell>
                    <TableCell>18.5 – 24.9</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Overweight</TableCell>
                    <TableCell>25.0 – 29.9</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Obesity</TableCell>
                    <TableCell>30.0 or above</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}