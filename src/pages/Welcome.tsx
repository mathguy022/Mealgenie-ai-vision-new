import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Apple, Sparkles, Camera, TrendingUp, Scan, Bot, Wand2, Flame, Star, MessageSquare, Waves, UtensilsCrossed, Radar } from 'lucide-react';
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
            {/* Primary Navigation */}
            <nav className="hidden md:flex items-center gap-6 ml-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')} className="text-muted-foreground hover:text-foreground">Pricing</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/how-it-works')} className="text-muted-foreground hover:text-foreground">How it Works</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/security')} className="text-muted-foreground hover:text-foreground">Security/Privacy</Button>
            </nav>
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
                Personalized, AI-built meal plans that fit your diet and time—plus instant nutrition from any photo or barcode.
              </p>
              {/* Trust row under hero copy */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">★ 4.8/5</span>
                <span>• 12k+ users</span>
                <span>• Your data stays private</span>
              </div>
              
              {/* Removed non-functional hero CTA buttons per request */}
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
                bullets: [
                  'Recognizes foods instantly',
                  'Estimates portions',
                  'Logs macros in one tap',
                ],
                actionText: 'Try a demo →',
                actionTo: '/scan',
                gradient: 'gradient-primary',
              },
              {
                icon: Radar,
                title: 'Personalized Meal Plans',
                bullets: [
                  'Fits your macros',
                  'Honors diet rules',
                  'Adapts to budget',
                ],
                actionText: 'See examples →',
                actionTo: '/smart-meal-genie',
                gradient: 'gradient-secondary',
              },
              {
                icon: TrendingUp,
                title: 'Proactive Coaching',
                bullets: [
                  'Smart pre-meal nudges',
                  'Better swaps',
                  'Stay consistent',
                ],
                actionText: 'Learn more →',
                actionTo: '/how-it-works',
                gradient: 'from-accent to-accent/70',
              },
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-smooth"
              >
                <div className={`relative w-14 h-14 rounded-xl ${feature.gradient} bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth`}>
                  <feature.icon className="w-7 h-7 text-white" />
                  {feature.withSparkle && (
                    <Sparkles className="absolute -right-1 -top-1 w-4 h-4 text-white/90" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <ul className="space-y-2 mb-4">
                  {feature.bullets.map((b: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {b}</li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(feature.actionTo)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {feature.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Nutrition Toolkit */}
      <section className="py-12 md:py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Your Nutrition Toolkit</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The practical tools you’ll use every day to make smarter food choices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                title: 'Food Analyzer',
                subtitle: 'Upload image or Snap a photo to get instant portion, macros and calories',
                gradient: 'from-green-500 to-emerald-500',
                to: '/scan',
                badges: [{ type: 'star', text: 'Used by 80% of users' }],
              },
              {
                icon: Waves,
                title: 'Live Scanner',
                subtitle: 'Analyze meals in real time — no photo needed.',
                gradient: 'from-purple-500 to-fuchsia-600',
                to: '/scan-live',
              },
              {
                icon: Scan,
                title: 'Barcode Scanner',
                subtitle: 'Scan packaged foods for verified nutrition facts per serving.',
                gradient: 'from-sky-500 to-teal-500',
                to: '/barcode-scanner',
              },
              {
                icon: Bot,
                title: 'NutriGenie Bot',
                subtitle: 'Ask nutrition questions and get science‑backed answers for you.',
                gradient: 'from-emerald-500 to-teal-600',
                to: '/nutrigenie',
                badges: [{ type: 'message', text: 'Rated 4.9/5 for helpfulness' }],
              },
              {
                icon: Wand2,
                title: 'Smart Meal Planning',
                subtitle: 'Fits your macros and honors your diet rules — automatically.',
                gradient: 'from-amber-400 to-yellow-500',
                to: '/smart-meal-genie',
              },
              {
                icon: Flame,
                title: 'AI Calories Calculator',
                subtitle: 'Estimate calories by weight or serving and adjust for goals.',
                gradient: 'from-rose-500 to-pink-600',
                to: '/food-analyzer?tab=calculator',
              },
              {
                icon: TrendingUp,
                title: 'BMI Calculator',
                subtitle: 'Understand your BMI to set realistic health targets.',
                gradient: 'from-indigo-500 to-blue-600',
                to: '/bmi-calculator',
              },
            ].map((tool, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:shadow-lg transition-smooth border-border hover:border-primary/40"
                onClick={() => navigate(tool.to)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold">{tool.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{tool.subtitle}</p>
                      {tool.badges && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tool.badges.map((b, i) => (
                            <Badge key={i} variant="outline" className="text-xs gap-1">
                              {b.type === 'star' ? (
                                <Star className="w-3 h-3 text-amber-500" />
                              ) : (
                                <MessageSquare className="w-3 h-3 text-sky-500" />
                              )}
                              <span>{b.text}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-8 text-center">
            Backed by FDA/USDA nutrition data and your profile inputs.
          </p>
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

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <h4 className="font-bold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/scan')}>Food Analyzer</button></li>
                <li><button onClick={() => navigate('/smart-meal-genie')}>Smart Meal Planning</button></li>
                <li><button onClick={() => navigate('/nutrigenie')}>NutriGenie Bot</button></li>
                <li><button onClick={() => navigate('/barcode-scanner')}>Barcode Scanner</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/pricing')}>Pricing</button></li>
                <li><button onClick={() => navigate('/how-it-works')}>How it Works</button></li>
                <li><button onClick={() => navigate('/security')}>Security/Privacy</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/auth')}>Contact</button></li>
                <li><button onClick={() => navigate('/auth')}>Help Center</button></li>
                <li><button onClick={() => navigate('/auth')}>Guides</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/terms')}>Terms</button></li>
                <li><button onClick={() => navigate('/privacy')}>Privacy</button></li>
                <li><button onClick={() => navigate('/cookies')}>Cookies</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Get Early Access</h4>
              <p className="text-sm text-muted-foreground mb-3">Join our list to get product updates and early invites.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com" className="flex-1 rounded-md border bg-muted p-2 text-sm" />
                <Button size="sm" className="gradient-primary text-white" onClick={() => navigate('/auth')}>Subscribe</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Backed by FDA/USDA nutrition data and your profile inputs.</p>
            </div>
          </div>
          <div className="mt-10 text-xs text-muted-foreground">© {new Date().getFullYear()} MealGenie AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
