import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useCRMStore } from '@/stores/crmStore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from '@/stores/languageStore';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Building2, ShieldCheck, Lock, Tag } from 'lucide-react';
import { CRMosLogo } from '@/components/common/CRMosLogo';
import { validateBusinessEmail, CORE_PARTNER_OPTIONS, isCoreEcosystemCompany } from '@/lib/companyAccess';
import { toast } from 'sonner';
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
  const [emailWarning, setEmailWarning] = useState('');

  const hasFirebase = isFirebaseConfigured();
  const isEcosystemPartner = isCoreEcosystemCompany(companyName);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.includes('@') && val.includes('.')) {
      const check = validateBusinessEmail(val);
      if (!check.isValid) {
        setEmailWarning(check.error || 'Voer een zakelijk e-mailadres in.');
      } else {
        setEmailWarning('');
      }
    } else {
      setEmailWarning('');
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const { user: registeredUser } = await loginWithGoogleAction();
      const nameParts = (registeredUser.name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || registeredUser.name || 'Gebruiker';
      const lastName = nameParts.slice(1).join(' ') || '';

      const existing = useCRMStore
        .getState()
        .contacts.find((c) => c.email.toLowerCase() === registeredUser.email.toLowerCase());
      if (!existing && registeredUser.email) {
        const createdContact = useCRMStore.getState().addContact({
          first_name: firstName,
          last_name: lastName,
          email: registeredUser.email,
          company: registeredUser.company_name || 'CRMos',
          title: registeredUser.role,
          status: 'partner',
          source: 'CRMos Google Aanmelding',
          vvc_tag: registeredUser.vvc_tag,
          tags: registeredUser.vvc_tag ? [registeredUser.vvc_tag, 'Aanmelding'] : ['Aanmelding'],
          custom_fields: { user_id: registeredUser.id },
        });
        toast.success(`Welkom! Je unieke VVC API Tag is aangemaakt: ${createdContact.vvc_tag || registeredUser.vvc_tag}`);
      }
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Google Sign-Up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Het inlogvenster van Google is gesloten voordat de registratie kon worden voltooid.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Dit domein is nog niet geautoriseerd in de Firebase Console (Authentication > Settings > Authorized domains).');
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setError('Google Inloggen is nog niet ingeschakeld in de Firebase Console voor project crmosone-dev. Activeer Google onder Build > Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Registreren met Google is mislukt. Probeer het opnieuw.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Om toegang te krijgen tot CRMos moet je werkzaam zijn bij een bedrijf. Vul een geldige bedrijfsnaam in.');
      return;
    }

    const emailCheck = validateBusinessEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || 'Gebruik een zakelijk e-mailadres.');
      return;
    }

    if (!agreedToTerms) {
      setError('Ga akkoord met de algemene voorwaarden om verder te gaan.');
      return;
    }
    if (password.length < 6) {
      setError('Het wachtwoord moet minimaal 6 tekens lang zijn.');
      return;
    }

    setIsLoading(true);

    try {
      const { user: registeredUser } = await registerWithEmailAction(name, email, password, companyName.trim(), role);
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || name.trim();
      const lastName = nameParts.slice(1).join(' ') || '';

      const createdContact = useCRMStore.getState().addContact({
        first_name: firstName,
        last_name: lastName,
        email: email.trim(),
        company: companyName.trim(),
        title: role,
        status: isEcosystemPartner ? 'partner' : 'customer',
        source: 'CRMos Account Aanmelding',
        vvc_tag: registeredUser.vvc_tag,
        tags: registeredUser.vvc_tag ? [registeredUser.vvc_tag, 'Aanmelding'] : ['Aanmelding'],
        custom_fields: { user_id: registeredUser.id },
      });

      toast.success(
        `Welkom bij CRMos! Je unieke VVC API Tag is aangemaakt: ${createdContact.vvc_tag || registeredUser.vvc_tag}`
      );
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background p-4 sm:p-6 py-12 overflow-hidden">
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

      <div className="w-full max-w-[460px] mt-6 relative z-10">
        {/* Brand Logo & Header */}
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <Link to="/" className="transition-transform duration-200 hover:scale-[1.03]">
            <CRMosLogo size="lg" showTagline={true} />
          </Link>
          {selectedPlan && (
            <Badge variant="outline" className="mt-3 rounded-full px-3 py-0.5 text-[11px] bg-primary/10 text-primary border-primary/20 capitalize font-medium">
              Gekozen plan: {selectedPlan} (14 dagen gratis proef)
            </Badge>
          )}
        </div>

        <Card className="rounded-3xl border border-border/50 bg-card/85 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {t('Create your CRMos Account')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              {t('Start your 14-day free trial. No credit card required.')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Quick Sign-Up (Apple Pill Style) */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-full border-border/70 bg-background/80 hover:bg-accent/80 font-medium text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
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
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-foreground">
                  {t('Full Name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="bijv. Jan Jansen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 rounded-xl bg-background/60 border-border/70 text-xs sm:text-sm focus-visible:ring-1"
                />
              </div>

              {/* Company Name & Ecosystem Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="companyName" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>Bedrijfsnaam <span className="text-destructive">*</span></span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Werkzaam bij een bedrijf vereist</span>
                </div>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="bijv. Jansen BV of selecteer partner"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="h-10 rounded-xl bg-background/60 border-border/70 text-xs sm:text-sm focus-visible:ring-1"
                />

                {/* Quick Partner Pills */}
                <div className="pt-1">
                  <p className="text-[10px] text-muted-foreground mb-1.5">
                    Snelkoppeling partnermerken:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CORE_PARTNER_OPTIONS.map((partner) => {
                      const isSelected = companyName.toLowerCase() === partner.toLowerCase();
                      return (
                        <button
                          key={partner}
                          type="button"
                          onClick={() => setCompanyName(partner)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
                          }`}
                        >
                          {partner}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Categorisation & Data Isolation Notice */}
                {companyName.trim() && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl border text-[11px] flex items-start gap-2 transition-all ${
                      isEcosystemPartner
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
                    }`}
                  >
                    {isEcosystemPartner ? (
                      <>
                        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                        <div>
                          <p className="font-semibold">CRMos Core Ecosysteem Partner</p>
                          <p className="text-[10px] opacity-90 mt-0.5">
                            Gedeelde toegang tot CRMos data (zichtbaar voor CRMos, VVC, Quantum Initium, Logs Rent, Djobba en Trusting Work).
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                        <div>
                          <p className="font-semibold">Geïsoleerde Bedrijfsomgeving</p>
                          <p className="text-[10px] opacity-90 mt-0.5">
                            Strikte datascheiding actief. Medewerkers van andere bedrijven hebben geen toegang tot jouw gegevens. Alleen de platform-admin behoudt overkoepelend toezicht.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Business Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Zakelijk e-mailadres <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Geen privé mail</span>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@jouwbedrijf.nl"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className={`h-10 rounded-xl bg-background/60 border-border/70 text-xs sm:text-sm focus-visible:ring-1 ${
                    emailWarning ? 'border-destructive/60 focus-visible:ring-destructive' : ''
                  }`}
                />
                {emailWarning ? (
                  <p className="text-[11px] text-destructive flex items-center gap-1.5 mt-1 font-medium bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{emailWarning}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Gebruik je bedrijfs-e-mailadres om je account te koppelen aan je organisatie.
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  {t('Password')} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimaal 6 tekens"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

              {/* Role in Company */}
              <div className="space-y-1">
                <Label htmlFor="role" className="text-xs font-medium text-foreground">
                  Functie binnen het bedrijf
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as User['role'])}
                  className="flex h-10 w-full rounded-xl border border-border/70 bg-background/60 px-3 py-1.5 text-xs sm:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="admin">Directie / Bedrijfsbeheerder (Company Admin)</option>
                  <option value="manager">Sales / Recruitment Manager</option>
                  <option value="recruiter">ATS Recruiter / Talent Consultant</option>
                  <option value="agent">Contact Center Agent / Buitendienst Sales</option>
                </select>
              </div>

              {/* Automatic VVC Tag Assignment Indicator */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Tag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-medium">
                    Unieke VVC API Tag wordt bij aanmelding automatisch aangemaakt
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono bg-background border-amber-500/30 text-amber-700 dark:text-amber-400 shrink-0"
                >
                  vvc-usr-auto
                </Badge>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-3.5 w-3.5 mt-0.5 rounded border-muted accent-primary cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-muted-foreground cursor-pointer">
                  Ik bevestig werkzaam te zijn bij dit bedrijf en ga akkoord met de <span className="underline text-foreground">Algemene Voorwaarden</span> en het <span className="underline text-foreground">Privacybeleid</span>.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-full font-medium text-xs sm:text-sm mt-1 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoading ? t('Creating account...') : t('Create Free Account')}
              </Button>
            </form>

            {/* Link to login */}
            <div className="text-center pt-1">
              <p className="text-xs text-muted-foreground">
                {t('Already have an account?')}{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  {t('Log in here')}
                </Link>
              </p>
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
