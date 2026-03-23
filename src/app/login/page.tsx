'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('doctor@vedi.health');
  const [password, setPassword] = useState('doctor123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
      <div className='w-full max-w-md px-4'>
        {/* Logo */}
        <div className='mb-8 flex flex-col items-center'>
          <div className='mb-2 flex items-center gap-2'>
            <div className='bg-primary rounded-xl p-2'>
              <Activity className='text-primary-foreground h-8 w-8' />
            </div>
            <h1 className='text-3xl font-bold tracking-tight'>Vedi EHR</h1>
          </div>
          <p className='text-muted-foreground text-sm'>
            AI-Driven Electronic Health Records
          </p>
        </div>

        {/* Login Card */}
        <Card className='border-0 shadow-lg shadow-blue-100/50'>
          <CardHeader className='pb-4 text-center'>
            <CardTitle className='text-xl'>Doctor Portal</CardTitle>
            <CardDescription>
              Sign in to access your clinical dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3 text-sm'>
                  {error}
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='relative'>
                  <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='doctor@vedi.health'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='pl-10'
                    required
                    autoComplete='email'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <div className='relative'>
                  <Lock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    id='password'
                    type='password'
                    placeholder='••••••••'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='pl-10'
                    required
                    autoComplete='current-password'
                  />
                </div>
              </div>

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Dev hint */}
              <div className='bg-muted/50 text-muted-foreground rounded-md px-4 py-3 text-center text-xs'>
                <strong>Dev Mode:</strong> doctor@vedi.health / doctor123
              </div>
            </form>
          </CardContent>
        </Card>

        <p className='text-muted-foreground mt-6 text-center text-xs'>
          &copy; 2026 Sterling Universal Group. HIPAA Compliant.
        </p>
      </div>
    </div>
  );
}
