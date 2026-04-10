import { Shield } from 'lucide-react';
import Link from 'next/link';

const LINKS = {
  Product: [
    { label: 'Features',    href: '#features' },
    { label: 'How it works',href: '#how-it-works' },
    { label: 'Pricing',     href: '#pricing' },
    { label: 'Changelog',   href: '/changelog' },
  ],
  Developers: [
    { label: 'Docs',        href: '/docs' },
    { label: 'GitHub',      href: 'https://github.com/Edwinfom00/brain-shield', external: true },
    { label: 'npm',         href: 'https://npmjs.com/package/brainsield', external: true },
  ],
  Legal: [
    { label: 'Privacy',     href: '/privacy' },
    { label: 'Terms',       href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pt-14 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">BrainShield</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
              AI-powered security analysis for JavaScript & TypeScript codebases.
            </p>
            <p className="text-xs text-zinc-600 mt-4">by Edwin Fom</p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wider">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {'external' in item && item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.05]">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} BrainShield. MIT License.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
