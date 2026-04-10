import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap, Shield, Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Credits & Plan' };

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    scans: 50,
    icon: Shield,
    current: true,
    features: ['50 scans / month', 'All 5 scanners', 'JSON & Markdown reports', 'Basic Claude enrichment', 'Community support'],
    cta: null,
    ctaHref: null,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    scans: -1,
    icon: Zap,
    current: false,
    features: ['Unlimited scans', 'Priority Claude AI enrichment', 'AI auto-fix (brain fix --ai)', 'Web dashboard & history', 'PDF export', 'CI/CD integration', 'Priority support'],
    cta: 'Upgrade to Pro',
    ctaHref: 'https://buy.stripe.com/brainsield-pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    scans: -1,
    icon: Users,
    current: false,
    features: ['Everything in Pro', 'Up to 10 seats', 'Shared scan history', 'Custom security rules', 'SSO / SAML', 'SLA guarantee'],
    cta: 'Contact us',
    ctaHref: 'mailto:hello@brainsield.dev',
  },
] as const;

export default function CreditsPage() {
  const used = 38;
  const limit = 50;
  const pct = Math.round((used / limit) * 100);
  const daysLeft = 21;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Credits & Plan</h1>
        <p className="text-zinc-400 text-sm">Manage your scan usage and subscription.</p>
      </div>

      {/* Usage card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Current Plan</p>
            <p className="text-lg font-bold text-white">Free</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">Active</span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Scans used this month</span>
              <span className="text-white font-semibold">{used} / {limit}</span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-1.5">{limit - used} scans remaining · Resets in {daysLeft} days</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-sm font-semibold text-zinc-300 mb-4">Plans</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-5 flex flex-col ${'highlight' in plan && plan.highlight
              ? 'bg-violet-600/10 border-2 border-violet-500/50 shadow-lg shadow-violet-500/10'
              : 'bg-zinc-900/50 border border-zinc-800'
            }`}
          >
            {'highlight' in plan && plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most popular
              </div>
            )}

            {plan.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Current plan
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <plan.icon className={`w-4 h-4 ${'highlight' in plan && plan.highlight ? 'text-violet-400' : 'text-zinc-400'}`} />
              <span className="font-bold text-white">{plan.name}</span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              <span className="text-zinc-400 text-sm">{plan.period}</span>
            </div>

            <ul className="space-y-2.5 flex-1 mb-5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.cta && plan.ctaHref ? (
              <Link
                href={plan.ctaHref}
                className={`w-full py-2 rounded-xl font-semibold text-sm text-center transition-all ${'highlight' in plan && plan.highlight
                  ? 'bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                {plan.cta}
              </Link>
            ) : (
              <div className="w-full py-2 rounded-xl text-sm text-center text-zinc-600 bg-zinc-800/50 border border-zinc-800">
                Your current plan
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-10 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">FAQ</h2>
        {[
          { q: 'What counts as a scan?', a: 'Each time you run brain scan on a project, one scan credit is consumed, regardless of project size or number of files.' },
          { q: 'Do unused scans roll over?', a: 'No. Free plan scans reset on the 1st of each month. Pro & Team plans are unlimited so rollover doesn\'t apply.' },
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel your subscription at any time and you\'ll retain Pro access until the end of your billing period.' },
        ].map((item) => (
          <details key={item.q} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden group">
            <summary className="px-5 py-4 text-sm font-medium text-white cursor-pointer list-none select-none flex items-center justify-between">
              {item.q}
              <span className="text-zinc-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="px-5 pb-4 text-sm text-zinc-400 border-t border-zinc-800 pt-3">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
