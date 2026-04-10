import { Key, Lock, Globe, Package, Zap, Brain } from 'lucide-react';

const FEATURES = [
  {
    icon: Key,
    title: 'Secrets & Keys Scanner',
    description: '11 regex rules detect hardcoded API keys, tokens, DB strings, private keys — Anthropic, OpenAI, AWS, Stripe, GitHub and more.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    tag: 'CRITICAL',
    tagColor: 'text-red-400 bg-red-500/10',
  },
  {
    icon: Lock,
    title: 'Auth & Session Scanner',
    description: 'JWT algorithm checks, timing attack detection, weak bcrypt cost, missing CSRF, cookie flags, localStorage token storage.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    tag: '10 rules',
    tagColor: 'text-orange-400 bg-orange-500/10',
  },
  {
    icon: Zap,
    title: 'XSS & Injection Scanner',
    description: 'Detects dangerouslySetInnerHTML, innerHTML, SQLi via string concat, eval(), command injection, path traversal, prototype pollution.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    tag: '13 rules',
    tagColor: 'text-amber-400 bg-amber-500/10',
  },
  {
    icon: Globe,
    title: 'API Security Scanner',
    description: 'CORS wildcard + credentials, rate limiting on auth routes, admin endpoint exposure, stack trace leaks, mass assignment, IDOR, Next.js-specific rules.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    tag: '13 rules',
    tagColor: 'text-violet-400 bg-violet-500/10',
  },
  {
    icon: Package,
    title: 'Dependency CVE Scanner',
    description: 'Runs npm audit, parses CVE findings, enriches critical/high vulnerabilities with Claude — real-world impact, exploit likelihood, fix command.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    tag: 'npm audit',
    tagColor: 'text-blue-400 bg-blue-500/10',
  },
  {
    icon: Brain,
    title: 'Claude AI Enrichment',
    description: 'Every finding goes through Claude AI to validate false positives, adjust severity, and generate specific code fixes — powered by @edwinfom/ai-guard.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    tag: 'AI-powered',
    tagColor: 'text-emerald-400 bg-emerald-500/10',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-violet-400 text-sm font-mono border border-violet-400/20 bg-violet-400/5 rounded-full px-3 py-1 mb-4">
            5 scanners · 40+ rules · runs in &lt;1s
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything your codebase needs
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Five specialized agents scan in parallel, each focused on a security domain.
            Claude AI validates and enriches every finding.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`relative p-6 rounded-2xl border ${f.border} ${f.bg} group hover:scale-[1.02] transition-transform`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${f.tagColor}`}>
                  {f.tag}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
