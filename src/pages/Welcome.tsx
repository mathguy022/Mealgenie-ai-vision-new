import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Apple, Sparkles, Camera, TrendingUp } from 'lucide-react';
import heroFood from '@/assets/hero-food.jpg';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* App Header */}
      <header className="border-b py-6 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">MealGenie AI</h2>
            <Sparkles className="h-6 w-6 text-primary" />
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
              className="gradient-primary text-white"
              size="sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                <span className="gradient-primary bg-clip-text text-transparent">MealGenie AI</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                Transform your life with AI
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="gradient-primary text-white hover:opacity-90 transition-smooth"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl rounded-full" />
              <img 
                src={heroFood} 
                alt="Healthy nutritious meals" 
                className="relative rounded-2xl shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cutting-edge AI technology meets personalized nutrition for unprecedented results
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                title: 'Real-Time Food Scanning',
                description: 'Point your camera at any meal to instantly recognize food items, estimate portions, and calculate nutrition with AI precision.',
                gradient: 'gradient-primary',
              },
              {
                icon: Apple,
                title: 'Smart Meal Planning',
                description: 'AI-generated meal plans tailored to your goals, dietary restrictions, cultural preferences, and budget.',
                gradient: 'gradient-secondary',
              },
              {
                icon: TrendingUp,
                title: 'Proactive Coaching',
                description: 'Get behavioral nudges before you eat — smart suggestions to help you stay on track with your nutrition goals.',
                gradient: 'from-accent to-accent/70',
              },
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-smooth"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.gradient} bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Transform Your Nutrition?
            </h2>
            <p className="text-lg text-muted-foreground">
                Join thousands of users achieving their health goals with MealGenie AI
              </p>
            <Button 
              size="lg" 
              className="gradient-primary text-white hover:opacity-90 transition-smooth"
              onClick={() => navigate('/auth')}
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Welcome;
