import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Sparkles } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  daily_calorie_target?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, daily_calorie_target')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {profile?.full_name || 'User'}!</CardTitle>
            <CardDescription>Your personal nutrition dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Your account is connected to Supabase!</p>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <span>Integration successful</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Nutrition</CardTitle>
            <CardDescription>Your nutrition targets</CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.daily_calorie_target ? (
              <p>Daily calorie target: {profile.daily_calorie_target} kcal</p>
            ) : (
              <p>Complete your profile to set nutrition targets</p>
            )}
            <div className="mt-4">
              <Button>Update Nutrition Goals</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;