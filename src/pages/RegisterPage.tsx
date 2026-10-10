import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from '@/stores/languageStore';
import { Briefcase, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import type { User } from '@/types';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';
  const { registerWithEmailAction, loginWithGoogleAction } = useAuthStore();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('admin');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const hasFirebase = isFirebaseConfigured();

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogleAction();
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Google Sign-Up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Het inlogvenster van Google is gesloten voordat de registratie kon worden voltooid.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dit domein is nog niet geautoriseerd in de Firebase Console.');
      } else {
        setError(err.message || 'Registreren met Google is mislukt. Probeer het opnieuw.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Ga akkoord met de algemene voorwaarden om verder te gaan.');
      return;
    }
    if (password.length < 6) {
      setError('Het wachtwoord moet minimaal 6 tekens lang zijn.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await registerWithEmailAction(name, email, password, companyName, role);
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Dit e-mailadres is al in gebruik. Log direct in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Kies een sterker wachtwoord (minimaal 6 tekens).');
      } else {
        setError(err.message || 'Er is een fout opgetreden bij de registratie.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 py-12">
      {/* Top right language and theme controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2.5">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Top left back to website link */}
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('Back to website')}</span>
        </Link>
      </div>

      <div className="w-full max-w-lg mt-8">
        {/* Brand Logo & Header */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-3">
            <Briefcase className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">CRMos</h2>
          {selectedPlan && (
            <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/20 capitalize">
              Gekozen plan: {selectedPlan} (14 dagen gratis)
            </Badge>
          )}
        </div>

        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('Create your CRMos Account')}
            </CardTitle>
            <CardDescription>
              {t('Start your 14-day free trial. No credit card required.')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Quick Sign-Up */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-border/80 bg-background hover:bg-accent/60 font-medium transition-all shadow-sm flex items-center justify-center gap-3 relative"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? t('Connecting with Google...') : t('Sign up with Google')}</span>
            </Button>

            {!hasFirebase && (
              <p className="text-[11px] text-center text-muted-foreground bg-muted/40 p-2 rounded border border-muted">
                {t('Tip: Add Firebase credentials in .env')}
              </p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('Or with email')}</span>
              </div>
            </div>

            {/* Email Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t('Full Name')}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="bijv. Jan Jansen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="companyName">{t('Company Name')}</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="bijv. Jansen BV"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">{t('Business Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t('Password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimaal 6 tekens"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">{t('Your Role')}</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as User['role'])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="admin">{t('Sales Director / Managing Director')}</option>
                  <option value="manager">{t('Sales / Recruitment Manager')}</option>
                  <option value="recruiter">{t('Recruiter / ATS Consultant')}</option>
                  <option value="agent">{t('Contact Center Agent / Telemarketer')}</option>
                </select>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-muted accent-primary cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                  Ik ga akkoord met de <span className="underline text-foreground">Algemene Voorwaarden</span> en het <span className="underline text-foreground">Privacybeleid</span>.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-base mt-2"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? t('Creating account...') : t('Create Free Account')}
              </Button>
            </form>

            {/* Link to login */}
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                {t('Already have an account?')}{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  {t('Log in here')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          CRMos &bull; Powered by Firebase &amp; Cloud Firestore
        </p>
      </div>
    </div>
  );
}
