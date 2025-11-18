import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Apple, Sparkles, Camera, TrendingUp, Radar } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <header className="border-b py-6 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">MealGenie AI</h2>
            <Sparkles className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              size="sm"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              size="sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">MealGenie AI</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                Transform your nutrition with AI-powered insights
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <div className="text-white text-center p-8">
                    <Sparkles className="h-16 w-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">AI-Powered Food Analysis</h3>
                    <p className="mt-2">Scan your meals for instant nutrition insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Smart Features for Better Nutrition</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: 'Real-Time Food Scanning',
                description: 'Point your camera at any meal to instantly recognize food items and calculate nutrition with AI precision.',
              },
              {
                icon: Radar,
                title: 'Personalized Meal Plans',
                description: 'AI-generated meal plans tailored to your goals, dietary restrictions, and preferences.',
              },
              {
                icon: TrendingUp,
                title: 'Proactive Coaching',
                description: 'Get smart suggestions to help you stay on track with your nutrition goals.',
              },
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Welcome;
