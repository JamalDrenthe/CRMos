import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { Briefcase, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Demo login - accept any email/password
    if (email && password) {
      const mockUser = {
        id: 'user1',
        email: email,
        name: email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        role: 'admin' as const,
        org_id: 'org1',
        timezone: 'America/New_York',
        created_at: new Date().toISOString(),
      };

      const mockOrg = {
        id: 'org1',
        name: 'JamCRM Demo',
        org_type: 'supplier' as const,
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          date_format: 'MM/DD/YYYY',
          branding: {
            primary_color: '#3b82f6',
          },
          features: {
            recruitment: true,
            crm: true,
            sales: true,
            contact_center: true,
            gamification: true,
            workflows: true,
          },
        },
        created_at: new Date().toISOString(),
      };

      login(mockUser, mockOrg);
      navigate('/');
    } else {
      setError('Please enter both email and password');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Briefcase className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome to JamCRM</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
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

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Demo credentials (any email/password works)</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@jamcrm.com');
                  setPassword('password');
                }}
                className="rounded-lg border p-2 text-xs hover:bg-accent"
              >
                Use Admin Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('agent@jamcrm.com');
                  setPassword('password');
                }}
                className="rounded-lg border p-2 text-xs hover:bg-accent"
              >
                Use Agent Account
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          JamCRM v2.0 - All-in-One Business Platform
        </p>
      </div>
    </div>
  );
}
