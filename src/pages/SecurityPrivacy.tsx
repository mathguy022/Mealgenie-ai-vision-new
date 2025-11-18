import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, BarChart3, Download, Trash2, Cookie, Mail, AlertTriangle } from 'lucide-react';

const trackClick = (name: string) => {
  console.log(`[track] click: ${name}`);
};

const setMeta = () => {
  document.title = 'Security & Privacy — MealGenie AI';
  const desc = 'How MealGenie AI protects your data: encryption, access controls, your privacy choices, and easy ways to export or delete your data.';
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', desc);
};

const SecurityPrivacy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setMeta();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <section className="border-b" aria-labelledby="page-title">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 id="page-title" className="text-4xl md:text-5xl font-bold">Security & Privacy</h1>
            <p className="text-lg text-muted-foreground">Your data stays yours.</p>
            <p className="text-sm md:text-base text-muted-foreground">
              We secure MealGenie AI with modern encryption and transparent controls. This page explains the basics in plain language. For full details, see our Privacy Policy, Cookies Policy, and Terms of Service.
            </p>
            <div>
              <Button className="gradient-primary text-white" size="lg" onClick={() => navigate('/auth')}>Get Started — Free</Button>
            </div>
            <div className="text-xs text-muted-foreground">★ 4.8/5 • 12k+ users • Your data stays private</div>
          </div>
          {/* Anchor bar */}
          <nav className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { label: 'How we protect', href: '#protect' },
              { label: 'Your controls', href: '#controls' },
              { label: 'Compliance', href: '#compliance' },
              { label: 'Privacy summary', href: '#privacy' },
              { label: 'Cookies', href: '#cookies' },
              { label: 'Terms', href: '#terms' },
              { label: 'FAQ', href: '#faq' },
              { label: 'Still need help?', href: '#help' },
            ].map((a) => (
              <a key={a.href} href={a.href} className="min-h-[44px] px-3 py-2 rounded-md bg-muted text-sm hover:bg-muted/70 transition-smooth">
                {a.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* SECTION 1 — How We Protect Your Data */}
      <section id="protect" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center" aria-hidden="true">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold">Data Sources (📊 FDA/USDA badge)</h3>
                <p className="text-sm text-muted-foreground">
                  We use FDA/USDA nutrition data together with your profile (age, weight, goals, diet tags, and logs) to personalize plans. We do not sell your data or share it with advertisers.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center" aria-hidden="true">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold">Encryption (🔒 Lock)</h3>
                <p className="text-sm text-muted-foreground">
                  Data in transit is protected with TLS 1.3. Data at rest is encrypted (e.g., AES-256). Access to your information is limited to authorized systems and roles needed to run the service.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center" aria-hidden="true">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold">Access Controls (🛡️ Shield / audit log)</h3>
                <p className="text-sm text-muted-foreground">
                  Only authorized engineers can access production systems, and access is logged and reviewed regularly. We follow the principle of least privilege.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Your Control Over Your Data */}
      <section id="controls" className="py-12 md:py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { icon: Download, label: 'Export your data (📥 Download) — Download your meal history and account data as CSV or PDF.', action: () => trackClick('export_data') },
              { icon: Trash2, label: 'Delete your account (🗑️ Trash) — Request deletion anytime. We remove account data from active systems and schedule removal from backups per our retention policy.', action: () => trackClick('delete_account') },
              { icon: Cookie, label: 'Manage cookies (🍪 Cookie) — Update cookie preferences in the banner or browser settings; some features may be limited.', action: () => trackClick('manage_cookies') },
              { icon: Mail, label: 'Email preferences (✉️ Mail) — Unsubscribe from non-essential emails with one click.', action: () => trackClick('email_preferences') },
            ].map(({ icon: Icon, label, action }, i) => (
              <button key={i} onClick={action} className="w-full text-left min-h-[44px] px-4 py-3 rounded-lg bg-muted hover:bg-muted/70 transition-smooth flex items-center gap-3">
                <span className="w-9 h-9 rounded-md gradient-primary flex items-center justify-center" aria-hidden="true"><Icon className="w-5 h-5 text-white" /></span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </button>
            ))}
            <p className="text-xs text-muted-foreground">
              For region-specific rights (GDPR/CCPA), see Privacy Policy for instructions to access, correct, export, or delete your data.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Compliance & Disclaimers */}
      <section id="compliance" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              'We follow industry best practices for security and data handling.',
              'MealGenie AI is not a medical device and does not provide medical advice.',
              'Nutrition information is for education only—please consult a qualified professional for medical decisions.',
              'If we ever learn of a security incident that affects your data, we will notify you in line with applicable laws.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/50 p-3 rounded-md">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-1" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
            <p className="text-sm">
              Security reports: If you believe you’ve found a vulnerability, contact <a href="mailto:security@mealgenie.ai" className="text-primary hover:underline">security@mealgenie.ai</a>.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Privacy Policy (Short Version) */}
      <section id="privacy" className="py-12 md:py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-lg p-5" style={{ backgroundColor: 'hsl(210, 40%, 98%)' }}>
            <h3 className="text-base font-bold mb-2">Privacy Policy</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We respect your privacy—always. We collect the minimum information needed to build your personalized plans (account details, profile inputs, and usage needed to run the app). We do not sell personal data or share it with advertisers.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Your data is encrypted in transit and at rest. You can export your data or request deletion at any time. Some data may remain in time-limited backups before permanent removal, consistent with our retention policy.
            </p>
            <p className="text-xs text-muted-foreground">Last updated: November 2025</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Cookies Policy (Short) */}
      <section id="cookies" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-lg p-5" style={{ backgroundColor: 'hsl(210, 40%, 98%)' }}>
            <h3 className="text-base font-bold mb-2">Cookies Policy</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We use cookies to make MealGenie AI work smoothly—such as keeping you signed in, remembering units and preferences, and measuring performance to improve the app. You can manage preferences from the cookie banner or your browser. Turning off certain cookies may limit functionality.
            </p>
            <p className="text-xs text-muted-foreground mt-2">If applicable in your region, include a “Do Not Sell/Share My Personal Information” preference.</p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Terms of Service (Short) */}
      <section id="terms" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto rounded-lg p-5" style={{ backgroundColor: 'hsl(210, 40%, 98%)' }}>
            <h3 className="text-base font-bold mb-2">Terms of Service</h3>
            <p className="text-sm text-muted-foreground mb-2">
              By using MealGenie AI, you agree to use it for personal nutrition guidance. We do not provide medical advice. We work to keep your data secure and the service reliable. Misuse (e.g., scraping, abuse, fraud) may result in account restrictions.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FAQ */}
      <section id="faq" className="py-12 md:py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: 'How does MealGenie AI create my meal plan?', a: 'Provide your goals, diet tags, and any exclusions. The AI generates a daily plan (e.g., meat, chicken, vegetarian, fish options) tailored to your calories and macros.' },
                { q: 'Can I swap meals or change ingredients?', a: 'Yes. Use NutriGenie Bot or the Adjust Plan tools to request substitutions (e.g., “Replace chicken with tofu”) or tweak macros.' },
                { q: 'Do I need to log every meal?', a: 'No. Photo or barcode logging helps personalize your plan, but it’s optional.' },
                { q: 'Is my data safe?', a: 'We don’t sell personal data or share it with advertisers. Data is encrypted in transit and at rest. You can export or request deletion anytime (with standard backup retention windows).' },
                { q: 'Does this work for vegetarian, keto, or gluten-free diets?', a: 'Yes. Pick the diets and exclusions that fit you; plans adapt accordingly.' },
                { q: 'How accurate are calorie and macro estimates?', a: 'Estimates use FDA/USDA data and AI models. They’re designed to be helpful but may vary; you can review and edit portions before saving.' },
                { q: 'Can I use MealGenie AI for free?', a: 'Yes. We offer a free tier; you can upgrade anytime for advanced features.' },
                { q: 'What if I don’t like my plan?', a: 'Ask NutriGenie Bot for different cuisines, quicker prep times, or ingredient swaps. The system learns from your preferences.' },
              ].map((item, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* SECTION 8 — Still Need Help? */}
      <section id="help" className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-xl font-bold text-center">Didn’t find your answer?</h3>
            <p className="text-muted-foreground text-center">We reply within 24 hours.</p>
            <form
              className="bg-muted/50 p-4 rounded-lg space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const name = (form.elements.namedItem('name') as HTMLInputElement)?.value || '';
                const email = (form.elements.namedItem('email') as HTMLInputElement)?.value || '';
                const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value || '';
                trackClick('contact_form_submit');
                const subject = encodeURIComponent('MealGenie Support Request');
                const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
                window.location.href = `mailto:help@mealgenie.ai?subject=${subject}&body=${body}`;
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input name="name" placeholder="Your name" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <Input type="email" name="email" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Message</label>
                <Textarea name="message" placeholder="Tell us how we can help" required />
              </div>
              <Button type="submit" className="w-full min-h-[44px] gradient-primary text-white">Send Message</Button>
            </form>
            <p className="text-center text-sm">
              Or email <a href="mailto:help@mealgenie.ai" className="text-primary hover:underline" onClick={() => trackClick('mailto_help')}>help@mealgenie.ai</a>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 9 — Trust Badges & Footer */}
      <section className="py-12 md:py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <div>Backed by FDA/USDA nutrition data • 12,000+ users • 4.8/5 rating 🔬 FDA | 📊 USDA | 👥 12K+ | ⭐ 4.8</div>
            <div>© 2025 MealGenie AI. All rights reserved.</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SecurityPrivacy;
