import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/stores/languageStore';
import {
  Check,
  X,
  ArrowRight,
} from 'lucide-react';

export function PricingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      id: 'starter',
      name: t('Starter'),
      description: t('For solopreneurs and small sales teams that need clean deal & relationship management.'),
      priceMonthly: 29,
      priceAnnual: 23,
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
      priceMonthly: 79,
      priceAnnual: 63,
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
      priceMonthly: 199,
      priceAnnual: 159,
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
      category: t('Recruitment & ATS'),
      items: [
        { name: t('Candidate Profile Management'), starter: false, pro: true, enterprise: true },
        { name: t('Job Openings & Pipeline Stages'), starter: false, pro: true, enterprise: true },
        { name: t('Resume & Skills Matching'), starter: false, pro: true, enterprise: true },
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

      <main className="flex-1 pb-20">
        {/* ===================================================================== */}
        {/* PRICING HEADER */}
        {/* ===================================================================== */}
        <section className="pt-16 pb-12 text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30">
              {t('Transparent Pricing')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {t('Simple, transparent pricing for every team')}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('Start for free with a 14-day trial. No credit card required. Cancel anytime.')}
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="pt-6 flex items-center justify-center gap-4">
              <span
                className={`text-sm font-medium cursor-pointer ${
                  billingCycle === 'monthly' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('Monthly')}
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-primary/20 p-1 transition-colors focus:outline-none"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-primary transition-transform shadow-sm ${
                    billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium cursor-pointer ${
                    billingCycle === 'annual' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                  onClick={() => setBillingCycle('annual')}
                >
                  {t('Annual')}
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
                  {t('Save 20%')}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRICING CARDS */}
        {/* ===================================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col justify-between transition-all duration-200 ${
                    plan.popular
                      ? 'border-primary ring-2 ring-primary/20 shadow-xl bg-card'
                      : 'border-border/80 shadow-md bg-card/60 hover:shadow-lg'
                  }`}
                >
                  {/* Badge for Popular or Power tier */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground font-semibold shadow-sm px-3 py-0.5">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <CardHeader className="pb-6">
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-sm mt-1 min-h-[40px]">
                        {plan.description}
                      </CardDescription>
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">€{price}</span>
                        <span className="text-sm font-medium text-muted-foreground">/{t('month')}</span>
                        {billingCycle === 'annual' && (
                          <span className="ml-2 text-xs text-muted-foreground">(jaarlijks gefactureerd)</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Action Button */}
                      <Button
                        size="lg"
                        variant={plan.buttonVariant}
                        className={`w-full font-semibold transition-all ${
                          plan.popular ? 'shadow-md shadow-primary/25' : ''
                        }`}
                        onClick={() => navigate(`/register?plan=${plan.id}`)}
                      >
                        <span>{plan.cta}</span>
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>

                      {/* Included Features */}
                      <div className="space-y-3 pt-4 border-t">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('What is included:')}
                        </p>
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm">
                              <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Excluded Features */}
                        {plan.notIncluded.length > 0 && (
                          <div className="pt-2 space-y-2.5 opacity-60">
                            {plan.notIncluded.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-sm list-none text-muted-foreground">
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
        {/* DETAILED COMPARISON TABLE */}
        {/* ===================================================================== */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('Detailed Feature Comparison')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('Compare all capabilities across Starter, Professional and Enterprise.')}
            </p>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-4 px-6 font-semibold text-foreground w-1/2">{t('Features')}</th>
                    <th className="py-4 px-4 font-semibold text-center text-foreground">{t('Starter')}</th>
                    <th className="py-4 px-4 font-semibold text-center text-primary">{t('Professional')}</th>
                    <th className="py-4 px-4 font-semibold text-center text-foreground">{t('Enterprise')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparisonFeatures.map((group, groupIdx) => (
                    <div key={groupIdx} className="contents">
                      <tr className="bg-muted/20">
                        <td colSpan={4} className="py-2.5 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                          {group.category}
                        </td>
                      </tr>
                      {group.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-6 text-foreground font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-center">
                            {item.starter ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center bg-primary/5">
                            {item.pro ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.enterprise ? (
                              <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </div>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* PRICING FAQ */}
        {/* ===================================================================== */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('Frequently Asked Questions About Pricing')}
            </h2>
          </div>

          <div className="space-y-4">
            {pricingFaqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
