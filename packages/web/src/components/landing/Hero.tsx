'use client';

import Link from 'next/link';
import { ArrowRight, Terminal, Star } from 'lucide-react';
import { Glow } from '@/components/ui/glow';
import { cn } from '@/lib/utils';

const TERMINAL_LINES = [
  { prefix: '$', text: 'brain scan', color: 'text-violet-400', delay: 0 },
  { prefix: ' ', text: 'Discovering project...  Next.js · 247 files', color: 'text-zinc-500', delay: 1 },
  { prefix: '',  text: '', color: '', delay: 2 },
  { prefix: ' ', text: '✓  Secrets & Keys Scanner      3 findings', color: 'text-red-400', delay: 3 },
  { prefix: ' ', text: '✓  Auth & Session Scanner       2 findings', color: 'text-orange-400', delay: 4 },
  { prefix: ' ', text: '✓  XSS & Injection Scanner      1 finding', color: 'text-orange-400', delay: 5 },
  { prefix: ' ', text: '✓  API Security Scanner         4 findings', color: 'text-amber-400', delay: 6 },
  { prefix: ' ', text: '✓  Dependency CVE Scanner       clean', color: 'text-emerald-400', delay: 7 },
  { prefix: '',  text: '', color: '', delay: 8 },
  { prefix: ' ', text: 'Score  ██████░░░░░░░░░░░░░░  31/100  CRITICAL', color: 'text-red-400', delay: 9 },
  { prefix: ' ', text: '10 vulnerabilities · 3 CRITICAL · 4 HIGH · 3 MEDIUM', color: 'text-zinc-500', delay: 10 },
  { prefix: '',  text: '', color: '', delay: 11 },
  { prefix: '$', text: 'brain fix --critical --ai', color: 'text-violet-400', delay: 12 },
  { prefix: ' ', text: '✓  3 fixes applied.  Run brain scan to verify.', color: 'text-emerald-400', delay: 13 },
];

const STATS = [
  { value: '40+',  label: 'Security rules' },
  { value: '5',    label: 'Parallel agents' },
  { value: '<1s',  label: 'Scan time' },
  { value: '100%', label: 'Open source' },
];

export function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden">

      {/* Background glows — Linear Look */}
      <Glow size="xl" className="-top-40 left-1/2 -translate-x-1/2 opacity-15" />
      <Glow size="md" color="brand" className="top-20 left-1/4 -translate-x-1/2 opacity-10" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#09090b] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 xl:gap-20 items-center">

          {/* ── Left: Copy ─────────────────────────────────────────────── */}
          <div className="flex flex-col">

            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 self-start mb-6">
              <div className="flex items-center gap-1.5 border border-white/10 bg-white/[0.03] rounded-full px-3 py-1.5 text-xs text-zinc-400">
                <div className="flex -space-x-1">
                  {['bg-violet-500', 'bg-blue-500', 'bg-emerald-500'].map((c, i) => (
                    <div key={i} className={cn('w-4 h-4 rounded-full border border-zinc-900', c)} />
                  ))}
                </div>
                <span>Trusted by 1,200+ developers</span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-amber-400 font-medium">4.9</span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-[2.75rem] lg:text-[3.5rem] xl:text-[4rem] font-bold leading-[1.08] tracking-tight mb-5">
              <span className="text-white">Security analysis</span>
              <br />
              <span className="text-gradient-brand">built for devs</span>
            </h1>

            {/* Sub */}
            <p className="text-base lg:text-lg text-zinc-400 leading-relaxed mb-8 max-w-md">
              BrainShield scans your JS & TS codebase, detects vulnerabilities
              across 5 security domains, and fixes them with AI — all from your terminal.
            </p>

            {/* Stats row */}
            <div className="flex gap-6 mb-9 pb-9 border-b border-white/[0.06]">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-5">
              <Link
                href="/sign-up"
                className={cn(
                  'inline-flex items-center gap-2 text-sm font-semibold text-white',
                  'px-5 py-2.5 rounded-xl transition-all duration-200',
                  'bg-violet-600 hover:bg-violet-500',
                  'border border-violet-500/60',
                  'hover:shadow-lg hover:shadow-violet-500/25',
                  'hover:-translate-y-px'
                )}
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className={cn(
                'inline-flex items-center gap-2 text-sm font-mono text-zinc-300',
                'px-5 py-2.5 rounded-xl cursor-pointer select-all',
                'bg-white/[0.03] hover:bg-white/[0.06]',
                'border border-white/[0.08] hover:border-white/[0.12]',
                'transition-all duration-200'
              )}>
                <Terminal className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                npx brainsield scan
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              No credit card · 50 free scans/month · Node.js ≥ 18
            </p>
          </div>

          {/* ── Right: Terminal ─────────────────────────────────────────── */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-4 bg-violet-600/10 rounded-3xl blur-2xl pointer-events-none" />

            {/* Terminal window */}
            <div className={cn(
              'relative rounded-2xl overflow-hidden',
              'bg-[#0d0d0f]',
              'border border-white/[0.08]',
              'shadow-2xl shadow-black/60',
            )}>
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <Terminal className="w-3 h-3 text-zinc-600" />
                  <span className="text-xs text-zinc-600 font-mono">~/my-nextjs-app</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[10px] text-violet-400 font-mono font-medium">BrainShield</span>
                </div>
              </div>

              {/* Terminal body */}
              <div className="p-5 font-mono text-[11px] leading-[1.7] space-y-0">
                {TERMINAL_LINES.map((line, i) => (
                  <div key={i} className={cn('flex gap-2', line.color || 'text-zinc-700')}>
                    {line.prefix && (
                      <span className={line.prefix === '$' ? 'text-violet-500 select-none' : 'select-none opacity-0'}>
                        {line.prefix}
                      </span>
                    )}
                    <span>{line.text || '\u00A0'}</span>
                  </div>
                ))}

                {/* Blinking cursor */}
                <div className="flex gap-2 mt-1">
                  <span className="text-violet-500 select-none">$</span>
                  <span className="w-[7px] h-[13px] bg-violet-400 rounded-sm animate-cursor inline-block" />
                </div>
              </div>

              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 inset-x-0 h-8 bg-linear-to-t from-[#0d0d0f] to-transparent pointer-events-none" />
            </div>

            {/* Floating badge — score */}
            <div className={cn(
              'absolute -bottom-4 -left-4 flex items-center gap-2.5',
              'px-3.5 py-2.5 rounded-xl',
              'bg-[#0d0d0f] border border-white/[0.08]',
              'shadow-xl shadow-black/40',
            )}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">95</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none mb-0.5">After fix</p>
                <p className="text-[10px] text-emerald-400">Score improved +64</p>
              </div>
            </div>

            {/* Floating badge — time */}
            <div className={cn(
              'absolute -top-4 -right-4 flex items-center gap-2',
              'px-3 py-2 rounded-xl',
              'bg-[#0d0d0f] border border-white/[0.08]',
              'shadow-xl shadow-black/40',
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs text-zinc-300 font-mono">0.8s scan</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
