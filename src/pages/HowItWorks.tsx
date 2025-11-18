import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { User, Wand2, Camera, Scan, Bot } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const StepCard = ({
  icon: Icon,
  title,
  bullets,
  to,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  bullets: string[];
  to: string;
  gradient: string;
}) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Card
      ref={ref}
      className={`transition-smooth ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 transition-smooth ${visible ? 'scale-100' : 'scale-90'}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-2">{title}</h3>
            <ul className="space-y-1 mb-3">
              {bullets.map((b, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {b}</li>
              ))}
            </ul>
            <button
              onClick={() => navigate(to)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {title === 'Stay on track'
                ? 'Ask NutriGenie → Like this page with NutriGenie Bot'
                : 'Learn more →'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* HERO Section (Top of Page) */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">How MealGenie AI Works</h1>
            <p className="text-lg text-muted-foreground">
              Build a personalized plan in minutes, log food by photo or barcode, and get smart nudges that keep you on track.
            </p>
            <div>
              <Button
                size="lg"
                className="gradient-primary text-white"
                onClick={() => navigate('/auth')}
              >
                Get Started — Free
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">★ 4.8/5 • 12k+ users • Your data stays private</div>
            <nav className="mt-6 flex flex-wrap justify-center gap-3">
              {[
                { label: 'Create profile', href: '#step-profile' },
                { label: 'Build plan', href: '#step-plan' },
                { label: 'Scan & log', href: '#step-scan' },
                { label: 'Adjust anytime', href: '#step-adjust' },
                { label: 'Stay on track', href: '#step-track' },
              ].map((a) => (
                <a key={a.href} href={a.href} className="min-h-[44px] px-3 py-2 rounded-md bg-muted text-sm hover:bg-muted/70 transition-smooth">
                  {a.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* THE 5-STEP FLOW */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div id="step-profile">
            <StepCard
              icon={User}
              title="Create your profile"
              bullets={[
                'Age, weight, height, activity, goals',
                'Choose diet tags and exclusions (e.g., Keto, no dairy)',
                'Pick units you prefer (lb/kg, ft+in/cm)',
              ]}
              to="/onboarding"
              gradient="from-blue-500 to-indigo-500"
            />
            </div>
            <div id="step-plan">
            <StepCard
              icon={Wand2}
              title="Build your plan"
              bullets={[
                'AI designs meals for your calories and macros',
                'Honors diet rules and your budget/time',
                'Explains why each pick fits you',
              ]}
              to="/smart-meal-genie"
              gradient="from-amber-400 to-yellow-500"
            />
            </div>
            <div id="step-scan">
            <StepCard
              icon={Camera}
              title="Scan & log food"
              bullets={[
                'Snap a photo or scan a barcode',
                'Recognizes foods and estimates portions',
                'One-tap to log macros and calories',
              ]}
              to="/food-analyzer"
              gradient="from-green-500 to-emerald-500"
            />
            </div>
            <div id="step-adjust">
            <StepCard
              icon={Scan}
              title="Adjust anytime"
              bullets={[
                'Swap meals or tweak portions and macros',
                'Exclude ingredients with one tap',
                'Save presets: High-Protein, Low-Carb, On-the-Go',
              ]}
              to="/smart-meal-genie"
              gradient="from-purple-500 to-fuchsia-600"
            />
            </div>
            <div id="step-track">
            <StepCard
              icon={Bot}
              title="Stay on track"
              bullets={[
                'Smart pre-meal nudges and better swaps',
                'Weekly insights and gentle streaks',
                'Ask NutriGenie for science-backed answers',
              ]}
              to="/nutrigenie"
              gradient="from-rose-500 to-pink-600"
            />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-10 text-center">
            Backed by FDA/USDA nutrition data and your personal inputs. Your data stays private — always.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
