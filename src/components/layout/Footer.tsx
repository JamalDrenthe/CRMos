import { Link } from 'react-router-dom';
import { useTranslation } from '@/stores/languageStore';
import { Briefcase, Shield } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-card/60 text-card-foreground">
      {/* Top Pre-Footer Call to Action */}
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">
              {t('Ready to accelerate your sales & recruitment?')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('Start your 14-day free trial now. No credit card required.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
            >
              {t('Start for Free')}
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-lg border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              {t('View Pricing')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight">CRMos</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('The complete operational operating system for Sales, Recruitment (ATS) and Contact Centers. Powered by realtime Cloud Firestore and AI-ready automation.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>{t('GDPR Compliant • Enterprise Grade Security')}</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">{t('Product')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="/#modules" className="hover:text-foreground transition-colors">{t('CRM & Pipelines')}</a>
              </li>
              <li>
                <a href="/#modules" className="hover:text-foreground transition-colors">{t('Recruitment (ATS)')}</a>
              </li>
              <li>
                <a href="/#modules" className="hover:text-foreground transition-colors">{t('Contact Center Workspace')}</a>
              </li>
              <li>
                <a href="/#modules" className="hover:text-foreground transition-colors">{t('Quotes & Products')}</a>
              </li>
              <li>
                <a href="/#modules" className="hover:text-foreground transition-colors">{t('Gamification & Streaks')}</a>
              </li>
              <li>
                <a href="/#modules" className="hover:text-foreground transition-colors">{t('Territories & Postcodes')}</a>
              </li>
            </ul>
          </div>

          {/* Pricing & Solutions */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">{t('Pricing & Plans')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">{t('Starter Plan (€29)')}</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">{t('Professional (€79)')}</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">{t('Enterprise (€199)')}</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">{t('Feature Comparison')}</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground transition-colors">{t('FAQ & Billing')}</Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-sm font-semibold tracking-wider text-foreground uppercase">{t('Company')}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/login" className="hover:text-foreground transition-colors">{t('Log in')}</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-foreground transition-colors">{t('Create Account')}</Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">{t('Help & Support')}</a>
              </li>
              <li>
                <a href="mailto:info@jamaldrenthe.com" className="hover:text-foreground transition-colors">info@jamaldrenthe.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CRMos. {t('All rights reserved.')}</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-foreground cursor-pointer transition-colors">{t('Privacy Policy')}</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">{t('Terms of Service')}</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">{t('Security')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
