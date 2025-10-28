import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  age: z.string().min(1, 'Age is required'),
  height: z.string().min(1, 'Height is required'),
  weight: z.string().min(1, 'Weight is required'),
  gender: z.string().min(1, 'Gender is required'),
  activityLevel: z.string().min(1, 'Activity level is required'),
  goal: z.string().min(1, 'Goal is required'),
  dietaryPreference: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    gender: '',
    activityLevel: '',
    goal: '',
    dietaryPreference: '',
  });
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signUpSchema.parse(signUpData);
      setLoading(true);

      // Pass additional user profile data
      const { error } = await signUp(
        validated.email, 
        validated.password, 
        validated.fullName,
        {
          age: validated.age,
          height: validated.height,
          weight: validated.weight,
          gender: validated.gender,
          activityLevel: validated.activityLevel,
          goal: validated.goal,
          dietaryPreference: validated.dietaryPreference ?? 'no_preference'
        }
      );

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome to MealGenie AI!',
          description: 'Your account has been created. Let\'s set up your profile.',
        });
        navigate('/onboarding');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signInSchema.parse(signInData);
      setLoading(true);

      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      
      <Card className="w-full max-w-md relative shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">MealGenie AI</CardTitle>
          <CardDescription>
            Your intelligent nutrition companion
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Profile Information</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="30"
                        value={signUpData.age}
                        onChange={(e) => setSignUpData({ ...signUpData, age: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={signUpData.gender} 
                        onValueChange={(value) => setSignUpData({ ...signUpData, gender: value })}
                        required
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="175"
                        value={signUpData.height}
                        onChange={(e) => setSignUpData({ ...signUpData, height: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        placeholder="70"
                        value={signUpData.weight}
                        onChange={(e) => setSignUpData({ ...signUpData, weight: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="activityLevel">Activity Level</Label>
                    <Select 
                      value={signUpData.activityLevel} 
                      onValueChange={(value) => setSignUpData({ ...signUpData, activityLevel: value })}
                      required
                    >
                      <SelectTrigger id="activityLevel">
                        <SelectValue placeholder="Select your activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                        <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                        <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                        <SelectItem value="very_active">Very Active (intense exercise daily)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="goal">Your Goal</Label>
                    <Select 
                      value={signUpData.goal} 
                      onValueChange={(value) => setSignUpData({ ...signUpData, goal: value })}
                      required
                    >
                      <SelectTrigger id="goal">
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose_weight">Lose Weight</SelectItem>
                        <SelectItem value="build_muscle">Build Muscle</SelectItem>
                        <SelectItem value="gain_weight">Gain Weight</SelectItem>
                        <SelectItem value="live_healthy">Live Healthy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dietary Preference dropdown */}
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="dietaryPreference">Dietary Preference</Label>
                    <Select 
                      value={signUpData.dietaryPreference}
                      onValueChange={(value) => setSignUpData({ ...signUpData, dietaryPreference: value })}
                    >
                      <SelectTrigger id="dietaryPreference">
                        <SelectValue placeholder="Select your diet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="keto">Keto</SelectItem>
                        <SelectItem value="paleo">Paleo</SelectItem>
                        <SelectItem value="carnivore">Carnivore</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="low_carb">Low-Carb</SelectItem>
                        <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        <SelectItem value="gluten_free">Gluten-Free</SelectItem>
                        <SelectItem value="no_preference">No Preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
