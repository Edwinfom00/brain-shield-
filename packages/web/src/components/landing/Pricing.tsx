import { Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for side projects and open source.',
    cta: 'Get started',
    ctaHref: '/sign-up',
    highlight: false,
    features: [
      '50 scans / month',
      'All 5 scanners',
      '40+ security rules',
      'JSON & Markdown reports',
      'Basic Claude enrichment',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For professional developers and small teams.',
    cta: 'Start free trial',
    ctaHref: '/sign-up?plan=pro',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Unlimited scans',
      'All 5 scanners',
      'Priority Claude AI enrichment',
      'AI-powered auto-fix',
      'Web dashboard & history',
      'Export PDF reports',
      'CI/CD integration',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'For teams that need security at scale.',
    cta: 'Contact us',
    ctaHref: 'mailto:hello@brainsield.dev',
    highlight: false,
    features: [
      'Everything in Pro',
      'Up to 10 seats',
      'Team dashboard',
      'Shared scan history',
      'Custom security rules',
      'SSO / SAML',
      'SLA guarantee',
      'Dedicated support',
    ],
  },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-zinc-400 max-w-sm mx-auto">
            Start free. Upgrade when you need more scans or AI-powered fixes.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-2xl p-6 flex flex-col',
                plan.highlight
                  ? 'bg-violet-600/[0.08] border-2 border-violet-500/40 shadow-xl shadow-violet-500/10'
                  : 'bg-white/[0.02] border border-white/[0.07]'
              )}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-violet-600 text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                  <Zap className="w-2.5 h-2.5" />
                  {plan.badge}
                </div>
              )}

              {/* Plan info */}
              <div className="mb-6">
                <p className="text-xs font-medium text-zinc-500 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Check className={cn(
                      'w-3.5 h-3.5 shrink-0 mt-0.5',
                      plan.highlight ? 'text-violet-400' : 'text-zinc-500'
                    )} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={cn(
                  'w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-all duration-200',
                  plan.highlight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/60 hover:shadow-lg hover:shadow-violet-500/20'
                    : 'bg-white/[0.04] hover:bg-white/[0.07] text-zinc-200 border border-white/[0.08]'
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-zinc-600 mt-8">
          All plans include a 14-day money-back guarantee. No questions asked.
        </p>
      </div>
    </section>
  );
}
