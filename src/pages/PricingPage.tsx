import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/stores/languageStore';
import { Check, X, ChevronRight, Sparkles } from 'lucide-react';

export function PricingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'starter',
      name: t('Starter'),
      description: t('For solopreneurs and small sales teams that need clean deal & relationship management.'),
      priceMonthly: 200,
      priceAnnual: 160,
      badge: null,
      popular: false,
      features: [
        t('Up to 5 team members'),
        t('2,500 Contacts & Companies'),
        t('Visual Sales Kanban Pipeline'),
        t('Activity & Task Tracking'),
        t('Basic Dashboards & Reports'),
        t('Email & Communication Log'),
        t('Community Support'),
      ],
      notIncluded: [
        t('Recruitment (ATS) Module'),
        t('Contact Center Workspace & Pitch Flows'),
        t('Gamification & Commissions'),
        t('Territory & Rayon Management'),
        t('Custom Workflows & Automations'),
      ],
      cta: t('Start 14-Day Free Trial'),
      buttonVariant: 'outline' as const,
    },
    {
      id: 'pro',
      name: t('Professional'),
      description: t('For ambitious commercial and recruitment teams scaling operations.'),
      priceMonthly: 100,
      priceAnnual: 80,
      badge: t('Most Popular'),
      popular: true,
      features: [
        t('Up to 15 team members'),
        t('Unlimited Contacts, Companies & Deals'),
        t('Full ATS Recruitment (Candidates & Jobs)'),
        t('Contact Center Workspace & Campaigns'),
        t('Interactive Pitch Flows (Calling scripts)'),
        t('Sales Quotes & Product Catalog'),
        t('No-Code Workflow Automations'),
        t('Realtime Cloud Firestore Synchronisation'),
        t('360° Contact Profile & Scoring'),
        t('Priority Email & Chat Support'),
      ],
      notIncluded: [
        t('Gamification & Streak System'),
        t('Territory & Rayon GeoJSON Maps'),
        t('Dedicated Cloud Infrastructure'),
      ],
      cta: t('Start 14-Day Free Trial'),
      buttonVariant: 'default' as const,
    },
    {
      id: 'enterprise',
      name: t('Enterprise'),
      description: t('For large organizations, call centers and multi-branch agencies needing full control.'),
      priceMonthly: 50,
      priceAnnual: 40,
      badge: t('Ultimate Power'),
      popular: false,
      features: [
        t('Unlimited team members & seats'),
        t('Everything in Professional included'),
        t('Full Gamification, Badges & Commissions'),
        t('Territory Management & Postcode Assignment'),
        t('Custom Dashboard Builder with KPI widgets'),
        t('Audit Logs & Compliance Tracking'),
        t('Custom Webhooks & REST API Access'),
        t('Dedicated Firestore Cloud Configuration'),
        t('99.9% SLA & Dedicated Account Manager'),
        t('Personal Onboarding & Migration Assistance'),
      ],
      notIncluded: [],
      cta: t('Start Enterprise Trial'),
      buttonVariant: 'outline' as const,
    },
  ];

  const comparisonFeatures = [
    {
      category: t('CRM & Sales Pipeline'),
      items: [
        { name: t('Visual Kanban Pipeline'), starter: true, pro: true, enterprise: true },
        { name: t('Unlimited Contacts & Companies'), starter: false, pro: true, enterprise: true },
        { name: t('360° Contact Insights & Score'), starter: false, pro: true, enterprise: true },
        { name: t('Quote Generator & Products'), starter: false, pro: true, enterprise: true },
      ],
    },
    {
      category: t('Recruitment (ATS)'),
      items: [
        { name: t('Candidate Pipeline & Tracking'), starter: false, pro: true, enterprise: true },
        { name: t('Job Opening Management'), starter: false, pro: true, enterprise: true },
        { name: t('Candidate Skills & Match Score'), starter: false, pro: true, enterprise: true },
      ],
    },
    {
      category: t('Contact Center & Telephony'),
      items: [
        { name: t('Agent Call Workspace & Timer'), starter: false, pro: true, enterprise: true },
        { name: t('Inbound & Outbound Campaigns'), starter: false, pro: true, enterprise: true },
        { name: t('Interactive Pitch Flow Decision Trees'), starter: false, pro: true, enterprise: true },
      ],
    },
    {
      category: t('Advanced Operations'),
      items: [
        { name: t('No-Code Workflow Triggers'), starter: false, pro: true, enterprise: true },
        { name: t('Gamification, Badges & Streaks'), starter: false, pro: false, enterprise: true },
        { name: t('Territory Postcode Polygon Maps'), starter: false, pro: false, enterprise: true },
        { name: t('Dashboard Widget Builder'), starter: false, pro: false, enterprise: true },
        { name: t('Audit Logs & Compliance'), starter: false, pro: false, enterprise: true },
      ],
    },
  ];

  const pricingFaqs = [
    {
      q: t('Can I switch or cancel my plan at any time?'),
      a: 'Ja, je kunt op elk moment upgraden, downgraden of je abonnement stopzetten. Bij een jaarlijks abonnement blijft je toegang actief tot het einde van de facturatieperiode.',
    },
    {
      q: t('Are there any setup fees or hidden costs?'),
      a: 'Nee. Er zijn geen setup-kosten of verborgen vergoedingen. De getoonde prijzen zijn exact wat je betaalt.',
    },
    {
      q: t('How does the 14-day free trial work?'),
      a: 'Je krijgt 14 dagen lang volledige toegang tot alle functionaliteiten van het gekozen plan. Er is geen creditcard nodig om te starten. Aan het einde van de proefperiode beslis je zelf of je door wilt gaan.',
    },
    {
      q: t('Can I integrate with my existing Firebase project?'),
      a: 'Zeker. In alle plannen kun je CRMos verbinden met je eigen Firebase project ID voor realtime Firestore dataopslag.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Top Header */}
      <Navbar />

      <main className="flex-1 pb-24">
        {/* ===================================================================== */}
        {/* PRICING HEADER */}
        {/* ===================================================================== */}
        <section className="relative pt-20 pb-16 text-center px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle Apple-style glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-[140px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-foreground border border-border/50">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{t('Transparent Pricing')}</span>
            </span>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground text-balance">
              {t('Simple, transparent pricing for every team')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t('Start for free with a 14-day trial. No credit card required. Cancel anytime.')}
            </p>

            {/* Apple-style Pill Billing Toggle */}
            <div className="pt-6 flex items-center justify-center">
              <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-full px-5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('Monthly')}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{t('Annual')}</span>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                    {t('Save 20%')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRICING CARDS */}
        {/* ===================================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl transition-all duration-300 ${
                    plan.popular
                      ? 'border-primary/80 ring-1 ring-primary/30 shadow-2xl bg-card/90 backdrop-blur-xl lg:-translate-y-2'
                      : 'border-border/60 shadow-lg bg-card/60 backdrop-blur-md hover:border-border hover:shadow-xl'
                  }`}
                >
                  {/* Badge for Popular or Power tier */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary text-primary-foreground font-medium text-[11px] px-3.5 py-1 shadow-md">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-6 sm:p-8">
                    <CardHeader className="p-0 pb-6">
                      <CardTitle className="text-2xl font-bold tracking-tight">{plan.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1 min-h-[40px] text-muted-foreground">
                        {plan.description}
                      </CardDescription>
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">€{price}</span>
                        <span className="text-sm font-medium text-muted-foreground">/{t('month')}</span>
                        {billingCycle === 'annual' && (
                          <span className="ml-2 text-[11px] text-muted-foreground">(jaarlijks gefactureerd)</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 space-y-6">
                      {/* Apple Pill Action Button */}
                      <Button
                        size="lg"
                        variant={plan.buttonVariant}
                        className={`w-full h-11 rounded-full font-medium text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                          plan.popular ? 'shadow-md shadow-primary/20' : ''
                        }`}
                        onClick={() => navigate(`/register?plan=${plan.id}`)}
                      >
                        <span>{plan.cta}</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>

                      {/* Included Features */}
                      <div className="space-y-3 pt-6 border-t border-border/40">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('What is included:')}
                        </p>
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Excluded Features */}
                        {plan.notIncluded.length > 0 && (
                          <div className="pt-3 space-y-2.5 opacity-50">
                            {plan.notIncluded.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm list-none text-muted-foreground">
                                <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* DETAILED FEATURE COMPARISON TABLE */}
        {/* ===================================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('Compare all plan capabilities')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('A complete overview of modules, limits and features.')}
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/40">
                    <th className="py-4 px-6 text-sm font-semibold text-foreground">{t('Features')}</th>
                    <th className="py-4 px-6 text-sm font-semibold text-center text-foreground">{t('Starter (€200)')}</th>
                    <th className="py-4 px-6 text-sm font-semibold text-center text-foreground bg-primary/5">{t('Professional (€100)')}</th>
                    <th className="py-4 px-6 text-sm font-semibold text-center text-foreground">{t('Enterprise (€50)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs sm:text-sm">
                  {comparisonFeatures.map((category, catIdx) => (
                    <>
                      <tr key={`cat-${catIdx}`} className="bg-muted/20">
                        <td colSpan={4} className="py-3 px-6 font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                          {category.category}
                        </td>
                      </tr>
                      {category.items.map((item, itemIdx) => (
                        <tr key={`item-${catIdx}-${itemIdx}`} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-6 font-medium text-foreground">{item.name}</td>
                          <td className="py-3.5 px-6 text-center">
                            {item.starter ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-center bg-primary/5 font-medium">
                            {item.pro ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            {item.enterprise ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRICING FAQ */}
        {/* ===================================================================== */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('Frequently Asked Questions')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingFaqs.map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md">
                <h4 className="font-semibold text-sm sm:text-base text-foreground mb-2">{faq.q}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
