import { Check } from 'lucide-react';
import Link from 'next/link';

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
    features: [
      'Unlimited scans',
      'All 5 scanners',
      'Priority Claude AI enrichment',
      'AI-powered auto-fix (brain fix --ai)',
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
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Simple pricing</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Start free. Upgrade when you need more scans or AI-powered fixes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-violet-600/10 border-2 border-violet-500/50 shadow-lg shadow-violet-500/10'
                  : 'bg-zinc-900/50 border border-zinc-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-all ${
                  plan.highlight
                    ? 'bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
