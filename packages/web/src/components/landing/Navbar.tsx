'use client';

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#features',     label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing',      label: 'Pricing' },
  { href: '/docs',         label: 'Docs' },
];

export function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Thin top accent line */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
              'bg-violet-600 group-hover:bg-violet-500 group-hover:shadow-lg group-hover:shadow-violet-500/30'
            )}>
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">BrainShield</span>
            <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-violet-400 border border-violet-400/25 rounded-md px-1.5 py-0.5 bg-violet-400/5">
              BETA
            </span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white rounded-md hover:bg-white/5 transition-all duration-150"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            <SignedOut>
              <Link
                href="/sign-in"
                className="hidden sm:block text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  'text-sm font-medium text-white px-3.5 py-1.5 rounded-lg transition-all duration-200',
                  'bg-violet-600 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25',
                  'border border-violet-500/50'
                )}
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors border border-violet-500/50"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>
      </div>
    </header>
  );
}
