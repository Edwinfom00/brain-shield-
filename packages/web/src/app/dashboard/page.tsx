import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ScanCard } from '@/components/dashboard/ScanCard';
import { Terminal, TrendingUp, ShieldAlert, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'Scan History' };

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  const userId = session.user.id;

  const [scans, stats, cleanScans] = await Promise.all([
    prisma.scan.findMany({
      where:   { userId },
      orderBy: { scannedAt: 'desc' },
      take:    50,
      select: {
        id: true, projectName: true, score: true, scannedAt: true,
        filesScanned: true, criticalCount: true, highCount: true,
        mediumCount: true, lowCount: true,
      },
    }),
    prisma.scan.aggregate({
      where: { userId },
      _avg:  { score: true },
      _sum:  { criticalCount: true },
      _count:{ id: true },
    }),
    prisma.scan.count({
      where: { userId, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
    }),
  ]);

  const STATS = [
    { label: 'Total Scans',   value: String(stats._count.id),                        icon: Terminal,    color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Avg Score',     value: String(Math.round(stats._avg.score ?? 0)),       icon: TrendingUp,  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20'  },
    { label: 'Critical Found',value: String(stats._sum.criticalCount ?? 0),           icon: ShieldAlert, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'      },
    { label: 'Clean Scans',   value: String(cleanScans),                              icon: ShieldCheck, color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20'},
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Scan History</h1>
        <p className="text-zinc-400 text-sm">All your past security scans, sorted by date.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-zinc-400">{s.label}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Recent Scans</h2>
          <div className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <Terminal className="w-3 h-3" />
            <span>Run <code className="text-violet-400 font-mono">brain scan --push</code> to add more</span>
          </div>
        </div>

        {scans.length === 0 ? <EmptyState /> : scans.map((scan) => (
          <ScanCard key={scan.id} scan={{
            id: scan.id, projectName: scan.projectName, score: scan.score,
            scannedAt: scan.scannedAt.toISOString(), filesScanned: scan.filesScanned,
            findings: { critical: scan.criticalCount, high: scan.highCount, medium: scan.mediumCount, low: scan.lowCount },
          }} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
        <Terminal className="w-5 h-5 text-violet-400" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">No scans yet</h3>
      <p className="text-xs text-zinc-500 mb-4 max-w-xs mx-auto">Run your first scan and push it to your dashboard.</p>
      <code className="text-xs text-violet-300 font-mono bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
        brain scan --push
      </code>
    </div>
  );
}
