import { useState } from 'react';
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
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background p-4 sm:p-6 overflow-hidden">
      {/* Apple-style background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Top right language and theme controls */}
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Top left back to website link */}
      <div className="absolute top-5 left-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 px-2.5 rounded-full hover:bg-muted/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('Back to website')}</span>
        </Link>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Logo Header */}
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <Link to="/" className="transition-transform duration-200 hover:scale-[1.03]">
            <CRMosLogo size="lg" showTagline={true} />
          </Link>
        </div>

        <Card className="rounded-3xl border border-border/50 bg-card/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-semibold tracking-tight">{t('Welcome to CRMos')}</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              {t('Log in to your account with Google or your credentials')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Login Button (Apple Pill Style) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-full border-border/70 bg-background/80 hover:bg-accent/80 font-medium text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleGoogleSignIn}
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
              <span>{isGoogleLoading ? t('Connecting with Google...') : t('Sign in with Google')}</span>
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">{t('Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 rounded-xl bg-background/60 border-border/70 text-xs sm:text-sm focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">{t('Password')}</Label>
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
                    className="h-10 rounded-xl bg-background/60 border-border/70 text-xs sm:text-sm pr-10 focus-visible:ring-1"
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

              <Button
                type="submit"
                className="w-full h-11 rounded-full font-medium text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? t('Signing in...') : t('Sign in')}
              </Button>
            </form>

            {/* Apple-style Password Reset Drawer/Modal */}
            {showResetModal && (
              <div className="rounded-2xl border border-primary/20 bg-background/95 p-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                    {t('Reset Password')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
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

            <div className="text-center pt-1">
              <p className="text-xs text-muted-foreground">
                {t("Don't have an account yet?")}{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  {t('Start for Free')}
                </Link>
              </p>
            </div>

            <div className="text-center text-[11px] text-muted-foreground pt-2">
              <p>{t('Demo credentials (any email/password works)')}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('info@jamaldrenthe.com');
                  setPassword('password');
                }}
                className="rounded-full border border-border/60 bg-background/50 py-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              >
                Jamal Drenthe (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('agent@crmos.nl');
                  setPassword('password');
                }}
                className="rounded-full border border-border/60 bg-background/50 py-1.5 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              >
                {t('Use Agent Account')}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/75">
          CRMos &bull; Powered by Google Cloud &amp; Firestore
        </p>
      </div>
    </div>
  );
}
