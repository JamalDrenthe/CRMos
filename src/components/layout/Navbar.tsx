import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useAuthStore } from '@/stores/authStore';
import { useTranslation } from '@/stores/languageStore';
import { Briefcase, ArrowRight, Menu, X, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
              CRMos
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isCurrent('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {t('Home')}
          </Link>
          <a
            href="/#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {t('Features')}
          </a>
          <a
            href="/#modules"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {t('Modules')}
          </a>
          <Link
            to="/pricing"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isCurrent('/pricing') ? 'text-primary font-semibold' : 'text-muted-foreground'
            }`}
          >
            {t('Pricing')}
          </Link>
          <a
            href="/#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {t('FAQ')}
          </a>
        </nav>

        {/* Action Controls & Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
          <ThemeToggle />

          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/dashboard')}
              className="gap-2 font-medium shadow-sm"
              size="sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('Go to Dashboard')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="font-medium text-foreground hover:bg-accent"
              >
                {t('Log in')}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="font-medium shadow-sm hover:shadow-md transition-all gap-1.5"
              >
                <span>{t('Start for Free')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
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
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-b bg-background px-4 py-4 md:hidden shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 pb-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('Home')}
            </Link>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('Features')}
            </a>
            <a
              href="/#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('Modules')}
            </a>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('Pricing')}
            </Link>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('FAQ')}
            </a>
          </nav>
          <div className="border-t pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
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
                  className="w-full"
                >
                  {t('Log in')}
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                  className="w-full gap-1.5"
                >
                  <span>{t('Start for Free')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
