import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/stores/languageStore';
import { Menu, X, LayoutDashboard, ChevronRight } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Apple-style Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <CRMosLogo size="sm" showTagline={false} />
        </Link>

        {/* Desktop Apple-style Minimal Navigation */}
        <nav className="hidden items-center gap-7 text-[13px] font-medium tracking-tight md:flex">
          <Link
            to="/"
            className={`transition-colors hover:text-foreground ${
              isCurrent('/') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            {t('Overview')}
          </Link>
          <Link
            to="/solutions"
            className={`transition-colors hover:text-foreground ${
              isCurrent('/solutions') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            Oplossingen
          </Link>
          <Link
            to="/data-intelligence"
            className={`transition-colors hover:text-foreground ${
              isCurrent('/data-intelligence') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            Data Intelligence
          </Link>
          <Link
            to="/compare"
            className={`transition-colors hover:text-foreground ${
              isCurrent('/compare') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            Vergelijk
          </Link>
          <Link
            to="/pricing"
            className={`transition-colors hover:text-foreground ${
              isCurrent('/pricing') ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            {t('Pricing')}
          </Link>
          <a
            href="/#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pijlers
          </a>
          <a
            href="/#faq"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('FAQ')}
          </a>
        </nav>

        {/* Action Controls & Apple Pill CTA Buttons */}
        <div className="hidden items-center gap-2.5 md:flex">
          <LanguageToggle />
          <ThemeToggle />

          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/dashboard')}
              className="h-8 rounded-full px-4 text-xs font-medium gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              size="sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t('Go to Dashboard')}</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="h-8 rounded-full px-3 text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors"
              >
                {t('Log in')}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-xs font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] gap-1"
              >
                <span>{t('Try Free')}</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4 text-foreground" />}
          </Button>
        </div>
      </div>

      {/* Mobile Apple-style Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border/40 bg-background/95 backdrop-blur-2xl px-5 py-5 md:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 pb-4 text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('Overview')}
            </Link>
            <Link
              to="/solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Oplossingen
            </Link>
            <Link
              to="/data-intelligence"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Data Intelligence
            </Link>
            <Link
              to="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Vergelijk
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('Pricing')}
            </Link>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              Pijlers
            </a>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('FAQ')}
            </a>
          </nav>

          <div className="border-t border-border/40 pt-4 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full h-9 rounded-full gap-2 text-xs font-medium"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>{t('Go to Dashboard')}</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full h-9 rounded-full text-xs font-medium"
                >
                  {t('Log in')}
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full h-9 rounded-full gap-1.5 text-xs font-medium"
                >
                  <span>{t('Try Free')}</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
