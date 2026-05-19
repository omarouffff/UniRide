'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');
  
  // Resend Verification State
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token) {
      const verify = async () => {
        setLoading(true);
        setStatus('verifying');
        try {
          await api.post('/auth/verify-email', { token });
          setStatus('success');
          toast({
            variant: 'success',
            title: 'Email Verified',
            description: 'Your email has been successfully verified! You can now log in.',
          });
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err?.response?.data?.message || 'Invalid or expired verification link.');
          toast({
            variant: 'error',
            title: 'Verification Failed',
            description: err?.response?.data?.message || 'Invalid or expired verification link.',
          });
        } finally {
          setLoading(false);
        }
      };
      verify();
    }
  }, [token, toast]);

  // Handle countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: 'error',
        title: 'Email required',
        description: 'Please input your email address.',
      });
      return;
    }

    setResendLoading(true);
    try {
      const response = await api.post('/auth/resend-verification', { email });
      toast({
        variant: 'success',
        title: 'Link Sent',
        description: response.data.message || 'Verification link has been sent to your email.',
      });
      setCooldown(60); // Start 60-second cooldown
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Unable to send link.';
      toast({
        variant: 'error',
        title: 'Error',
        description: msg,
      });
      if (err?.response?.status === 429) {
        setCooldown(60); // Trigger cooldown if backend reports too many requests
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

      {/* VERIFYING STATE */}
      {status === 'verifying' && (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Verifying your Email</h2>
            <p className="text-slate-400 text-sm">Please wait while we secure your account details...</p>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {status === 'success' && (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
            <CheckCircle className="h-20 w-20 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Account Verified!</h2>
            <p className="text-slate-400 text-sm">
              Your email verification is complete. Your account request will be reviewed by the administration shortly.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/login')} 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02]"
          >
            Proceed to Sign In
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ERROR STATE */}
      {status === 'error' && (
        <div className="flex flex-col py-2 space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl" />
              <XCircle className="h-20 w-20 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
              <p className="text-rose-300 text-sm opacity-90">{errorMessage}</p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-5 space-y-4">
            <div className="text-center text-sm text-slate-400">
              Need a new link? Request another one below:
            </div>
            <form onSubmit={handleResend} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
              />
              <Button
                type="submit"
                disabled={resendLoading || cooldown > 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-all"
              >
                {resendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  'Request New Link'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* IDLE / NO TOKEN STATE */}
      {status === 'idle' && (
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-blue-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Verify Email Address</h2>
              <p className="text-slate-400 text-xs">Confirm your email to complete registration with UniRide.</p>
            </div>
          </div>

          <form onSubmit={handleResend} className="space-y-4 border-t border-slate-800/80 pt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Your Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={resendLoading || cooldown > 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {resendLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cooldown > 0 ? (
                `Resend Cooldown (${cooldown}s)`
              ) : (
                'Send Verification Link'
              )}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <Suspense fallback={
        <Card className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl flex items-center justify-center min-h-[250px]">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
