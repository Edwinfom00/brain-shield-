'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Terminal, Zap } from 'lucide-react';

const TERMINAL_LINES = [
  { text: '$ brain scan', color: 'text-violet-400' },
  { text: '  Discovering project... (Next.js · 247 files)', color: 'text-zinc-400' },
  { text: '', color: '' },
  { text: '  ✓ Secrets & Keys Scanner      3 findings', color: 'text-red-400' },
  { text: '  ✓ Auth & Session Scanner      2 findings', color: 'text-orange-400' },
  { text: '  ✓ XSS & Injection Scanner     1 finding', color: 'text-orange-400' },
  { text: '  ✓ API Security Scanner        4 findings', color: 'text-amber-400' },
  { text: '  ✓ Dependency CVE Scanner      clean', color: 'text-emerald-400' },
  { text: '', color: '' },
  { text: '  Security Score  ██████░░░░░░░░░░░░░░  31/100  CRITICAL', color: 'text-red-400' },
  { text: '  10 vulnerabilities — 3 CRITICAL · 4 HIGH · 3 MEDIUM', color: 'text-zinc-400' },
  { text: '', color: '' },
  { text: '$ brain fix --critical --ai', color: 'text-violet-400' },
  { text: '  ✓ Applied 3 fixes.  Run brain scan to verify.', color: 'text-emerald-400' },
];

export function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-800/10 rounded-full blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-mono rounded-full px-3 py-1.5 mb-6">
              <Zap className="w-3 h-3" />
              Powered by by Edwin Fom
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Security analysis{' '}
              <span className="bg-gradient-to-r from-violet-400 to-violet-200 bg-clip-text text-transparent">
                built for developers
              </span>
            </h1>

            <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg">
              BrainShield scans your JavaScript & TypeScript codebase,
              detects vulnerabilities across 5 security domains, and fixes
              them automatically — all from your terminal.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-10">
              {[
                { label: 'Security rules', value: '40+' },
                { label: 'Auto-fixable', value: '60%' },
                { label: 'Scan time', value: '<1s' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/25"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-mono text-sm transition-colors cursor-pointer">
                <Terminal className="w-4 h-4 text-violet-400" />
                npx brainsield scan
              </div>
            </div>

            <p className="text-xs text-zinc-600 mt-4">
              No credit card · 50 free scans/month · Node.js ≥ 18
            </p>
          </div>

          {/* Right — Terminal */}
          <div className="relative">
            {/* Glow behind terminal */}
            <div className="absolute inset-0 bg-violet-600/5 rounded-2xl blur-xl scale-105" />

            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Terminal title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <div className="flex items-center gap-2 ml-3">
                  <Terminal className="w-3 h-3 text-zinc-500" />
                  <span className="text-xs text-zinc-500 font-mono">~/my-nextjs-app</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-violet-400" />
                  <span className="text-xs text-violet-400 font-mono">BrainShield</span>
                </div>
              </div>

              {/* Terminal content */}
              <div className="p-5 font-mono text-xs leading-relaxed space-y-0.5">
                {TERMINAL_LINES.map((line, i) => (
                  <div key={i} className={line.color || 'text-zinc-600'}>
                    {line.text || '\u00A0'}
                  </div>
                ))}
                <div className="text-violet-400 flex items-center gap-1 mt-2">
                  <span>$</span>
                  <span className="w-2 h-4 bg-violet-400 animate-pulse rounded-sm ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
