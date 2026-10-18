import { Link } from 'react-router-dom';
import { useTranslation } from '@/stores/languageStore';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import { Shield, ChevronRight } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/40 bg-muted/20 text-foreground transition-colors">
      {/* Apple Pre-Footer Callout */}
      <div className="border-b border-border/30 bg-background/50 py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative mx-auto max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-secondary/80 text-foreground border border-border/50">
            {t('Start Today')}
          </span>
          <h3 className="text-2xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            {t('Ready to experience CRMos in action?')}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t('Start your 14-day free trial now. No credit card required. Instant setup.')}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs sm:text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t('Start for Free')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-6 py-2.5 text-xs sm:text-sm font-medium text-foreground hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t('View Pricing')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Apple Structured Footer Directory */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Footnotes / Disclaimers (Apple Keynote Style) */}
        <div className="pb-8 border-b border-border/30 text-[11px] leading-relaxed text-muted-foreground/80 space-y-1.5">
          <p>
            1. Prijzen zijn exclusief BTW en gebaseerd op een maandelijks of jaarlijks opzegbaar abonnement. 14 dagen proefperiode start direct zonder automatische verlenging.
          </p>
          <p>
            2. Realtime datasynchronisatie vereist een actieve internetverbinding en wordt ondersteund via Google Cloud Identity en Firestore SDK.
          </p>
        </div>

        <div className="pt-8 grid grid-cols-2 gap-8 md:grid-cols-5 text-[12px]">
          {/* Brand Info & Mission */}
          <div className="col-span-2 space-y-4 pr-4">
            <Link to="/" className="inline-block transition-opacity hover:opacity-90">
              <CRMosLogo size="sm" showTagline={true} />
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              {t('The complete operational platform for Field Sales, Contact Centers and Recruitment.')}
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/90">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>{t('GDPR Compliant • Enterprise Grade Security')}</span>
            </div>
          </div>

          {/* Solutions & Disciplines (SEO) */}
          <div>
            <h4 className="font-semibold tracking-wider text-foreground uppercase text-[11px]">Oplossingen</h4>
            <ul className="mt-3.5 space-y-2 text-muted-foreground">
              <li>
                <Link to="/solutions?tab=field-sales" className="hover:text-foreground transition-colors">Field Sales &amp; D2D</Link>
              </li>
              <li>
                <Link to="/solutions?tab=callcenter" className="hover:text-foreground transition-colors">Callcenter Software</Link>
              </li>
              <li>
                <Link to="/solutions?tab=recruitment" className="hover:text-foreground transition-colors">Recruitment CRM (ATS)</Link>
              </li>
              <li>
                <Link to="/solutions?tab=revenue" className="hover:text-foreground transition-colors">Recruitment to Revenue</Link>
              </li>
              <li>
                <Link to="/solutions?tab=automation" className="hover:text-foreground transition-colors">Sales Automation</Link>
              </li>
              <li>
                <Link to="/data-intelligence" className="hover:text-foreground transition-colors font-medium text-foreground/90">Data Intelligence &amp; Geodata</Link>
              </li>
              <li>
                <Link to="/solutions" className="hover:text-foreground transition-colors">Alle Oplossingen</Link>
              </li>
            </ul>
          </div>

          {/* Comparisons */}
          <div>
            <h4 className="font-semibold tracking-wider text-foreground uppercase text-[11px]">Vergelijk Software</h4>
            <ul className="mt-3.5 space-y-2 text-muted-foreground">
              <li>
                <Link to="/compare?competitor=salesdock" className="hover:text-foreground transition-colors">CRMos vs Salesdock</Link>
              </li>
              <li>
                <Link to="/compare?competitor=leaddesk" className="hover:text-foreground transition-colors">CRMos vs LeadDesk</Link>
              </li>
              <li>
                <Link to="/compare?competitor=recruit-crm" className="hover:text-foreground transition-colors">CRMos vs Recruit CRM</Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-foreground transition-colors">Alles-in-één Matrix</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">Kostenvergelijking</Link>
              </li>
            </ul>
          </div>

          {/* Pricing & Account */}
          <div>
            <h4 className="font-semibold tracking-wider text-foreground uppercase text-[11px]">Prijzen &amp; Contact</h4>
            <ul className="mt-3.5 space-y-2 text-muted-foreground">
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">Starter (vanaf €39/mnd)</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">Professional (vanaf €95/mnd)</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">Enterprise (vanaf €199/mnd)</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">{t('Log in')}</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-foreground transition-colors">Gratis Proefperiode</Link>
              </li>
              <li>
                <a href="mailto:info@jamaldrenthe.com" className="hover:text-foreground transition-colors">info@jamaldrenthe.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Apple-style Bottom copyright & legal row */}
        <div className="mt-10 border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CRMos Inc. {t('All rights reserved.')}</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">{t('Privacy Policy')}</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">{t('Terms of Service')}</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">{t('Security')}</span>
            <span>•</span>
            <span className="text-emerald-500 font-medium">● Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
