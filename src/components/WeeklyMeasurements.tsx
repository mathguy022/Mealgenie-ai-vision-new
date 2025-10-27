import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type WeightEntry = {
  id: string;
  user_id?: string;
  weight_kg: number;
  recorded_at?: string | null;
  entry_date?: string | null; // fallback for alternate schema
  created_at?: string | null;
  notes?: string | null;
};

export default function WeeklyMeasurements() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('weight_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setEntries(data || []);
      } catch (err) {
        console.error('Failed to load weight entries', err);
        toast({
          title: 'Could not load measurements',
          description: 'Please try again in a moment.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [user?.id, toast]);

  const lastSeven = useMemo(() => entries.slice(0, 7), [entries]);

  const handleAddEntry = async () => {
    if (!user?.id) {
      toast({ title: 'Please log in', description: 'Sign in to save measurements', variant: 'destructive' });
      return;
    }
    const value = parseFloat(weightInput);
    if (Number.isNaN(value) || value <= 0) {
      toast({ title: 'Invalid weight', description: 'Enter a positive number in kg.' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: user.id,
        weight_kg: value,
      };

      // Prefer recorded_at if available in schema; otherwise fallback to entry_date
      const nowIso = new Date().toISOString();
      payload.recorded_at = nowIso;

      const { data, error } = await supabase
        .from('weight_entries')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      setEntries(prev => [data as WeightEntry, ...prev]);
      setWeightInput('');
      toast({ title: 'Measurement saved', description: `Logged ${value.toFixed(1)} kg` });
    } catch (err) {
      console.error('Failed to save measurement', err);
      toast({ title: 'Save failed', description: 'Could not save measurement', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Measurements</CardTitle>
        <CardDescription>Log your weight and track weekly progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 74.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
          </div>
          <Button onClick={handleAddEntry} disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Saving…' : 'Add Entry'}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Last 7 entries</p>
            {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
          </div>
          <div className="divide-y rounded-md border">
            {lastSeven.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No measurements yet.</div>
            )}
            {lastSeven.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <span className="text-sm text-muted-foreground">
                  {formatDate(e.recorded_at || e.entry_date || e.created_at)}
                </span>
                <span className="font-semibold">{Number(e.weight_kg).toFixed(1)} kg</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}