'use client';

import { Shield, LayoutDashboard, CreditCard, Settings, ChevronRight, Zap, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard',          label: 'Scans',    icon: LayoutDashboard },
  { href: '/dashboard/credits',  label: 'Credits',  icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface DashboardSidebarProps {
  scanCount?: number;
  scanLimit?: number;
}

export function DashboardSidebar({ scanCount = 0, scanLimit = 50 }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();

  const pct      = Math.min(100, Math.round((scanCount / scanLimit) * 100));
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-violet-500';

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <aside className="w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-sm">BrainShield</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Usage + user */}
      <div className="p-3">
        <div className="rounded-xl bg-violet-600/10 border border-violet-500/20 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Free Plan</span>
          </div>
          <p className="text-xs text-zinc-400 mb-2">{scanCount} / {scanLimit} scans used</p>
          <div className="h-1.5 bg-zinc-800 rounded-full mb-3 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
          </div>
          <Link
            href="/dashboard/credits"
            className="block w-full text-center text-xs font-semibold py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-violet-300">
              {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{session?.user?.name ?? 'Account'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{session?.user?.email ?? ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
