import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  age?: string;
  height?: string;
  weight?: string;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  dietaryPreference?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, profileData?: ProfileData) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, profileData?: ProfileData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          dietary_preference: profileData?.dietaryPreference ?? 'no_preference',
        },
      },
    });

    if (!error && data.user) {
      // Create profile with additional user data
      const insertData: Record<string, unknown> = {
        id: data.user.id,
        email: email,
        full_name: fullName,
        onboarding_completed: false,
      };

      if (profileData?.age) insertData.age = parseInt(profileData.age);
      if (profileData?.height) insertData.height_cm = parseInt(profileData.height);
      if (profileData?.weight) insertData.current_weight_kg = parseFloat(profileData.weight);
      if (profileData?.gender) insertData.gender = profileData.gender;
      if (profileData?.activityLevel) insertData.activity_level = profileData.activityLevel;
      if (profileData?.goal) insertData.health_goal = profileData.goal;

      // Map dietary preference into dietary_restrictions when possible
      const pref = profileData?.dietaryPreference ?? 'no_preference';
      const mapToRestriction = (p: string): string | null => {
        switch (p) {
          case 'vegan': return 'vegan';
          case 'vegetarian': return 'vegetarian';
          case 'keto': return 'keto';
          case 'paleo': return 'paleo';
          case 'gluten_free': return 'gluten_free';
          case 'no_preference': return 'none';
          default: return null; // others not in enum
        }
      };
      const restriction = mapToRestriction(pref);
      if (restriction) {
        insertData.dietary_restrictions = [restriction];
      } else {
        // Keep default if no mapping; set to ['none'] when explicitly 'no_preference'
        if (pref === 'no_preference') insertData.dietary_restrictions = ['none'];
      }

      await supabase.from('profiles').insert(insertData);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
