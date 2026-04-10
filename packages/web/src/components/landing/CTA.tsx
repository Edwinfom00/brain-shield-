import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { Glow } from '@/components/ui/glow';
import { cn } from '@/lib/utils';

export function CTA() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Background glow */}
      <Glow size="lg" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-violet-500/25 bg-violet-500/8 rounded-full px-3 py-1.5 text-xs text-violet-300 font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Free to start · No credit card
        </div>

        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-5">
          <span className="text-white">Start securing your</span>
          <br />
          <span className="text-gradient-brand">codebase today</span>
        </h2>

        <p className="text-zinc-400 text-base mb-10 max-w-md mx-auto leading-relaxed">
          50 free scans per month. All 5 scanners. Claude AI enrichment.
          No setup, no config files — just your terminal.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className={cn(
              'inline-flex items-center gap-2 text-sm font-semibold text-white',
              'px-6 py-3 rounded-xl transition-all duration-200',
              'bg-violet-600 hover:bg-violet-500',
              'border border-violet-500/60',
              'hover:shadow-xl hover:shadow-violet-500/30',
              'hover:-translate-y-px'
            )}
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className={cn(
            'inline-flex items-center gap-2 text-sm font-mono text-zinc-400',
            'px-5 py-3 rounded-xl',
            'bg-white/[0.03] border border-white/[0.08]',
            'select-all cursor-text'
          )}>
            <Terminal className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            npm install -g brainsield
          </div>
        </div>
      </div>
    </section>
  );
}
