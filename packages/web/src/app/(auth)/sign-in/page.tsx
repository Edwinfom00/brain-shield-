'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Github, Chrome, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export default function SignInPage() {
  const router  = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState<string | null>(null);
  const [error, setError]       = useState('');

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading('email');
    const res = await signIn.email({ email, password, callbackURL: '/dashboard' });
    if (res.error) setError(res.error.message ?? 'Sign in failed');
    else router.push('/dashboard');
    setLoading(null);
  }

  async function handleSocial(provider: 'google' | 'github') {
    setLoading(provider);
    await signIn.social({ provider, callbackURL: '/dashboard' });
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">BrainShield</span>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h1 className="text-lg font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-400 mb-6">Sign in to your account</p>

          {/* Social */}
          <div className="space-y-2.5 mb-5">
            <button
              onClick={() => handleSocial('github')}
              disabled={!!loading}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                'bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading === 'github'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Github className="w-4 h-4" />
              }
              Continue with GitHub
            </button>

            <button
              onClick={() => handleSocial('google')}
              disabled={!!loading}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                'bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading === 'google'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Chrome className="w-4 h-4" />
              }
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className={cn(
                  'w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600',
                  'bg-zinc-800/60 border border-zinc-700 focus:border-violet-500 focus:outline-none',
                  'transition-colors'
                )}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={cn(
                  'w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600',
                  'bg-zinc-800/60 border border-zinc-700 focus:border-violet-500 focus:outline-none',
                  'transition-colors'
                )}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!!loading}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                'bg-violet-600 hover:bg-violet-500 border border-violet-500/60',
                'hover:shadow-lg hover:shadow-violet-500/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          No account?{' '}
          <Link href="/sign-up" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
