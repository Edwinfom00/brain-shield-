import { Key, Lock, Zap, Globe, Package, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Key,
    title: 'Secrets & Keys',
    description: '11 regex rules detect hardcoded API keys, tokens, DB strings, private keys — Anthropic, OpenAI, AWS, Stripe, GitHub.',
    accent: 'red',
    tag: 'CRITICAL',
    stat: '11 rules',
    iconBg: 'bg-red-500/10 border-red-500/20',
    iconColor: 'text-red-400',
    tagColor: 'text-red-400 bg-red-500/8 border-red-500/20',
    glow: 'group-hover:shadow-red-500/10',
  },
  {
    icon: Lock,
    title: 'Auth & Sessions',
    description: 'JWT algorithm checks, timing attacks, weak bcrypt cost, missing CSRF, cookie flags, localStorage token storage.',
    accent: 'orange',
    tag: '10 rules',
    stat: 'Auth',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    iconColor: 'text-orange-400',
    tagColor: 'text-orange-400 bg-orange-500/8 border-orange-500/20',
    glow: 'group-hover:shadow-orange-500/10',
  },
  {
    icon: Zap,
    title: 'XSS & Injection',
    description: 'dangerouslySetInnerHTML, innerHTML, SQL injection via string concat, eval(), command injection, path traversal, prototype pollution.',
    accent: 'amber',
    tag: '13 rules',
    stat: 'Injection',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    iconColor: 'text-amber-400',
    tagColor: 'text-amber-400 bg-amber-500/8 border-amber-500/20',
    glow: 'group-hover:shadow-amber-500/10',
  },
  {
    icon: Globe,
    title: 'API Security',
    description: 'CORS wildcard + credentials, rate limiting on auth routes, admin endpoint exposure, stack trace leaks, mass assignment, IDOR.',
    accent: 'violet',
    tag: '13 rules',
    stat: 'API',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
    iconColor: 'text-violet-400',
    tagColor: 'text-violet-400 bg-violet-500/8 border-violet-500/20',
    glow: 'group-hover:shadow-violet-500/10',
  },
  {
    icon: Package,
    title: 'Dependency CVEs',
    description: 'Runs npm audit, parses CVE findings, enriches critical/high vulnerabilities with Claude — real-world impact, exploit likelihood, fix command.',
    accent: 'blue',
    tag: 'npm audit',
    stat: 'CVE',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconColor: 'text-blue-400',
    tagColor: 'text-blue-400 bg-blue-500/8 border-blue-500/20',
    glow: 'group-hover:shadow-blue-500/10',
  },
  {
    icon: Brain,
    title: 'Claude AI Enrichment',
    description: 'Every finding is validated by Claude AI — false positive filtering, severity adjustment, and specific code fixes generated automatically.',
    accent: 'emerald',
    tag: 'AI-powered',
    stat: 'Claude',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'text-emerald-400',
    tagColor: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20',
    glow: 'group-hover:shadow-emerald-500/10',
    featured: true,
  },
] as const;

export function Features() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-violet-400 border border-violet-400/20 bg-violet-400/5 rounded-full px-3 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            5 scanners · 40+ rules · runs in &lt;1s
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            Everything your codebase needs
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-base leading-relaxed">
            Five specialized agents scan in parallel, each focused on a security domain.
            Claude AI validates and enriches every finding.
          </p>
        </div>

        {/* Bento grid — Linear/Supabase style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={cn(
                'group relative p-5 rounded-2xl overflow-hidden',
                'bg-white/[0.02] border border-white/[0.07]',
                'hover:bg-white/[0.04] hover:border-white/[0.12]',
                'transition-all duration-300',
                'hover:shadow-xl',
                f.glow,
                'featured' in f && f.featured && 'md:col-span-2 lg:col-span-1'
              )}
            >
              {/* Subtle inner glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-br from-white/[0.02] to-transparent" />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-4 relative">
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', f.iconBg)}>
                  <f.icon className={cn('w-4 h-4', f.iconColor)} />
                </div>
                <span className={cn('text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border', f.tagColor)}>
                  {f.tag}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-white mb-2 relative">{f.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed relative">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
