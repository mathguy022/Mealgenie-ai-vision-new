import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Camera, TrendingUp, Apple, LogOut, User, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WeeklyMeasurements from '@/components/WeeklyMeasurements';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  type Profile = {
    full_name?: string;
    daily_calorie_target: number;
    protein_target_g: number;
    carbs_target_g: number;
    fat_target_g: number;
    health_goal?: string;
    activity_level?: string;
    current_weight_kg: number;
    target_weight_kg: number;
  };
  type DailyLog = {
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
  };
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData?.onboarding_completed) {
        navigate('/onboarding');
        return;
      }

      setProfile(profileData);

      // Load today's log
      const today = new Date().toISOString().split('T')[0];
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user!.id)
        .eq('log_date', today)
        .single();

      if (logData) {
        setTodayLog(logData);
      } else {
        // Create today's log if it doesn't exist
        const { data: newLog } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user!.id,
            log_date: today,
          })
          .select()
          .single();
        
        setTodayLog(newLog);
      }
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading profile',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full gradient-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const calorieProgress = todayLog 
    ? (todayLog.total_calories / profile.daily_calorie_target) * 100 
    : 0;

  const proteinProgress = todayLog && profile.protein_target_g
    ? (parseFloat(todayLog.total_protein_g) / profile.protein_target_g) * 100
    : 0;

  const carbsProgress = todayLog && profile.carbs_target_g
    ? (parseFloat(todayLog.total_carbs_g) / profile.carbs_target_g) * 100
    : 0;

  const fatProgress = todayLog && profile.fat_target_g
    ? (parseFloat(todayLog.total_fat_g) / profile.fat_target_g) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                  MealGenie AI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your personalized nutrition and meal planning dashboard
                </p>
                <p className="text-sm text-muted-foreground">Welcome back, {profile.full_name?.split(' ')[0]}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <User className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <section className="grid md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-smooth border-primary/20 hover:border-primary"
            onClick={() => navigate('/scan')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Food Analyzer</h3>
                  <p className="text-sm text-muted-foreground">AI-powered recognition</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-smooth border-purple-500/20 hover:border-purple-500"
            onClick={() => navigate('/scan-live')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Live Scanner</h3>
                  <p className="text-sm text-muted-foreground">Real-time food analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
             className="cursor-pointer hover:shadow-lg transition-smooth border-green-500/20 hover:border-green-500"
             onClick={() => navigate('/food-analyzer?tab=calculator')}
           >
             <CardContent className="pt-6">
               <div className="flex flex-col items-center text-center space-y-3">
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                   <Sparkles className="w-8 h-8 text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">AI Calories Calculator</h3>
                   <p className="text-sm text-muted-foreground">Smart calorie needs</p>
                 </div>
               </div>
             </CardContent>
           </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-smooth border-secondary/20 hover:border-secondary">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center">
                  <Apple className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Meal Plans</h3>
                  <p className="text-sm text-muted-foreground">AI-generated plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Today's Progress */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Today's Progress</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calories */}
            <Card>
              <CardHeader>
                <CardTitle>Calories</CardTitle>
                <CardDescription>
                  {todayLog?.total_calories || 0} / {profile.daily_calorie_target} kcal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={Math.min(calorieProgress, 100)} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {profile.daily_calorie_target - (todayLog?.total_calories || 0)} remaining
                </p>
              </CardContent>
            </Card>

            {/* Macros Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Macronutrients</CardTitle>
                <CardDescription>Protein • Carbs • Fat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Protein</span>
                    <span className="text-muted-foreground">
                      {parseFloat(todayLog?.total_protein_g || 0).toFixed(1)}g / {profile.protein_target_g}g
                    </span>
                  </div>
                  <Progress value={Math.min(proteinProgress, 100)} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Carbs</span>
                    <span className="text-muted-foreground">
                      {parseFloat(todayLog?.total_carbs_g || 0).toFixed(1)}g / {profile.carbs_target_g}g
                    </span>
                  </div>
                  <Progress value={Math.min(carbsProgress, 100)} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fat</span>
                    <span className="text-muted-foreground">
                      {parseFloat(todayLog?.total_fat_g || 0).toFixed(1)}g / {profile.fat_target_g}g
                    </span>
                  </div>
                  <Progress value={Math.min(fatProgress, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Goals Summary */}
        <section className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Your Health Goal</CardTitle>
                <CardDescription className="capitalize">
                  {profile.health_goal?.replace('_', ' ')} • {profile.activity_level?.replace('_', ' ')}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/onboarding')}>
                Update Goals
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Current Weight</p>
                  <p className="text-2xl font-bold">{profile.current_weight_kg} kg</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Target Weight</p>
                  <p className="text-2xl font-bold">{profile.target_weight_kg} kg</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">To Go</p>
                  <p className="text-2xl font-bold">
                    {Math.abs(profile.current_weight_kg - profile.target_weight_kg).toFixed(1)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Measurements */}
          <WeeklyMeasurements />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
