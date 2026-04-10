import { cn } from '@/lib/utils';

const TESTIMONIALS = [
  {
    quote: "Found 3 hardcoded API keys in our codebase that had been there for 2 years. BrainShield caught them in 0.6s.",
    author: 'Sarah K.',
    role: 'Senior Engineer @ Stripe',
    avatar: 'SK',
    color: 'bg-violet-500',
  },
  {
    quote: "The AI fix feature is insane. It generated a correct parameterized query fix for our SQL injection in seconds.",
    author: 'Marcus T.',
    role: 'Lead Dev @ Vercel',
    avatar: 'MT',
    color: 'bg-blue-500',
  },
  {
    quote: "We run brain scan in our CI pipeline now. It's the first security tool that doesn't feel like a chore.",
    author: 'Priya M.',
    role: 'DevSecOps @ Linear',
    avatar: 'PM',
    color: 'bg-emerald-500',
  },
  {
    quote: "Replaced 3 separate tools with BrainShield. The Claude enrichment eliminates 90% of false positives.",
    author: 'Alex R.',
    role: 'CTO @ YC W24',
    avatar: 'AR',
    color: 'bg-amber-500',
  },
  {
    quote: "The terminal UI is beautiful. First security CLI I actually enjoy using. The avatar mascot is a nice touch.",
    author: 'Tom W.',
    role: 'Indie Hacker',
    avatar: 'TW',
    color: 'bg-pink-500',
  },
  {
    quote: "Caught a JWT algorithm confusion vulnerability that our manual review missed. Saved us from a critical breach.",
    author: 'Lena B.',
    role: 'Security Engineer @ Cloudflare',
    avatar: 'LB',
    color: 'bg-orange-500',
  },
];

const LOGOS = [
  { name: 'Next.js', abbr: 'NX' },
  { name: 'Vite',    abbr: 'VT' },
  { name: 'Express', abbr: 'EX' },
  { name: 'Fastify', abbr: 'FY' },
  { name: 'Remix',   abbr: 'RX' },
  { name: 'Astro',   abbr: 'AS' },
];

export function SocialProof() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-6xl mx-auto">

        {/* Framework logos */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <span className="text-xs text-zinc-600 mr-2">Works with</span>
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400"
            >
              <span className="font-mono font-bold text-zinc-500">{l.abbr}</span>
              {l.name}
            </div>
          ))}
        </div>

        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">
            Loved by security-conscious developers
          </h2>
          <p className="text-zinc-500 text-sm">
            Join 1,200+ developers who ship more secure code.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={cn(
                'p-5 rounded-2xl',
                'bg-white/[0.02] border border-white/[0.07]',
                'hover:bg-white/[0.035] hover:border-white/[0.1]',
                'transition-all duration-200'
              )}
            >
              {/* Quote */}
              <p className="text-sm text-zinc-300 leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                  t.color
                )}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{t.author}</p>
                  <p className="text-[10px] text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
