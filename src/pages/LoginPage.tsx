import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { isFirebaseConfigured, sendPasswordReset } from '@/lib/firebase';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from '@/stores/languageStore';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { CRMosLogo } from '@/components/common/CRMosLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogleAction, loginWithEmailAction } = useAuthStore();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  const hasFirebase = isFirebaseConfigured();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogleAction();
      navigate('/');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Het inlogvenster van Google is gesloten voordat het inloggen kon worden voltooid.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dit domein is nog niet geautoriseerd in de Firebase Console (Authentication > Settings > Authorized domains).');
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setError('Google Inloggen is nog niet ingeschakeld in de Firebase Console voor project crmosone-dev. Ga naar Build > Authentication > Sign-in method en activeer Google.');
      } else {
        setError(err.message || 'Inloggen met Google is mislukt. Probeer het opnieuw.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await loginWithEmailAction(email, password);
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Ongeldig e-mailadres of wachtwoord.');
      } else {
        setError(err.message || 'Er is een fout opgetreden bij het inloggen.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setError('');
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between bg-background selection:bg-primary/20 selection:text-primary">
      {/* Apple-style background ambient illumination glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] h-[360px] bg-primary/10 dark:bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Top Navigation Bar - Responsive, Never Overlaps */}
      <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all py-1.5 px-3 rounded-full bg-background/80 dark:bg-white/5 hover:bg-muted/60 dark:hover:bg-white/10 border border-border/50 dark:border-white/10 backdrop-blur-md shadow-xs active:scale-[0.97]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('Back to website')}</span>
          <span className="sm:hidden">{t('Terug')}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Form Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8 z-10 w-full max-w-[430px] mx-auto">
        {/* Brand Logo Header */}
        <div className="mb-4 sm:mb-6 flex flex-col items-center justify-center text-center">
          <Link
            to="/"
            className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <CRMosLogo size="md" showTagline={true} />
          </Link>
        </div>

        {/* Apple Glass Card */}
        <Card className="w-full rounded-[1.75rem] sm:rounded-[2rem] border border-border/60 dark:border-white/10 bg-card/90 dark:bg-[#121215]/85 backdrop-blur-2xl shadow-xl dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          <CardHeader className="space-y-1.5 text-center pb-4 pt-6 px-5 sm:px-7">
            <CardTitle className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-foreground">
              {t('Welcome to CRMos')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('Log in to your account with Google or your credentials')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-5 sm:px-7 pb-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Google Login Button (Apple Pill Style) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-full border-border/80 dark:border-white/15 bg-background/80 dark:bg-white/5 hover:bg-muted/80 dark:hover:bg-white/10 font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{isGoogleLoading ? t('Connecting with Google...') : t('Sign in with Google')}</span>
            </Button>

            {!hasFirebase && (
              <p className="text-[11px] text-center text-muted-foreground bg-muted/40 p-2 rounded-xl border border-muted">
                {t('Tip: Add Firebase credentials in .env')}
              </p>
            )}

            {/* Apple Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider">
                <span className="bg-card dark:bg-[#121215] px-3 text-muted-foreground">
                  {t('Or with email')}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  {t('Email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10.5 rounded-xl bg-background/70 dark:bg-black/30 border-border/70 dark:border-white/10 text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    {t('Password')}
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetEmail(email);
                      setResetSuccess(false);
                      setResetError('');
                    }}
                    className="text-[11px] font-medium text-primary hover:underline transition-colors"
                  >
                    {t('Forgot password?')}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-10.5 rounded-xl bg-background/70 dark:bg-black/30 border-border/70 dark:border-white/10 text-xs sm:text-sm pr-10 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    aria-label="Wachtwoord zichtbaarheid"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-full font-semibold text-xs sm:text-sm shadow-md shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/95 transition-all hover:scale-[1.01] active:scale-[0.98]"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? t('Signing in...') : t('Sign in')}
              </Button>
            </form>

            {/* Apple-style Password Reset Drawer/Modal */}
            {showResetModal && (
              <div className="rounded-2xl border border-primary/25 bg-background/95 dark:bg-neutral-900/95 p-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                    {t('Reset Password')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    ✕
                  </button>
                </div>

                {resetSuccess ? (
                  <div className="py-3 text-center space-y-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                    <p className="text-xs text-foreground font-medium">
                      Reset-link verzonden naar <span className="font-semibold">{resetEmail}</span>.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Controleer je inbox (en spambox) om je wachtwoord opnieuw in te stellen.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 rounded-full text-xs h-8"
                      onClick={() => setShowResetModal(false)}
                    >
                      Sluiten
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!resetEmail) return;
                      setIsResetLoading(true);
                      setResetError('');
                      try {
                        await sendPasswordReset(resetEmail);
                        setResetSuccess(true);
                      } catch (err: unknown) {
                        const error = err as { message?: string };
                        setResetError(error.message || 'Kon herstel e-mail niet versturen.');
                      } finally {
                        setIsResetLoading(false);
                      }
                    }}
                    className="pt-3 space-y-2.5"
                  >
                    <p className="text-[11px] text-muted-foreground">
                      Vul je e-mailadres in om een veilige herstellink te ontvangen.
                    </p>
                    {resetError && (
                      <p className="text-[11px] text-destructive bg-destructive/10 p-2 rounded-lg">
                        {resetError}
                      </p>
                    )}
                    <Input
                      type="email"
                      placeholder="naam@bedrijf.nl"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="h-9 rounded-xl text-xs bg-background"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isResetLoading}
                        className="rounded-full text-xs h-8 flex-1"
                      >
                        {isResetLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Verstuur herstellink
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowResetModal(false)}
                        className="rounded-full text-xs h-8"
                      >
                        Annuleer
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Registration link */}
            <div className="text-center pt-1">
              <p className="text-xs text-muted-foreground">
                {t("Don't have an account yet?")}{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary hover:underline transition-colors"
                >
                  {t('Start for Free')}
                </Link>
              </p>
            </div>

            {/* Quick Demo Section (Apple Segmented Style) */}
            <div className="pt-2 border-t border-border/40 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Demo-accounts</span>
                </span>
                <span className="text-[10px] text-muted-foreground/80">Willekeurig wachtwoord</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyDemo('info@jamaldrenthe.com')}
                  className={`group relative rounded-xl border p-2.5 text-left transition-all hover:scale-[1.01] active:scale-[0.98] ${
                    email === 'info@jamaldrenthe.com'
                      ? 'border-primary/50 bg-primary/10 text-foreground'
                      : 'border-border/60 dark:border-white/10 bg-background/50 dark:bg-white/5 hover:bg-muted/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground truncate">Jamal Drenthe</span>
                    <ShieldCheck className="h-3 w-3 text-blue-500 shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground block truncate">Super Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyDemo('agent@crmos.nl')}
                  className={`group relative rounded-xl border p-2.5 text-left transition-all hover:scale-[1.01] active:scale-[0.98] ${
                    email === 'agent@crmos.nl'
                      ? 'border-primary/50 bg-primary/10 text-foreground'
                      : 'border-border/60 dark:border-white/10 bg-background/50 dark:bg-white/5 hover:bg-muted/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground truncate">Agent Demo</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted-foreground block truncate">Buitendienst / Call</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer Branding */}
      <footer className="py-4 pb-6 sm:pb-8 text-center text-[11px] text-muted-foreground/75 z-10 px-4">
        CRMos &bull; Powered by Google Cloud &amp; Firestore
      </footer>
    </div>
  );
}
