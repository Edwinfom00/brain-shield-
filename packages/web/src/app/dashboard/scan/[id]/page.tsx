import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ArrowLeft, Info, ChevronDown, Shield } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { cn, scoreColor, scoreLabel, scoreBg, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Scan Report' };

const SEVERITY_CFG = {
  CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  MEDIUM:   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  LOW:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  INFO:     { color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   border: 'border-zinc-500/20'   },
} as const;

type Sev = keyof typeof SEVERITY_CFG;

// Sort findings by severity weight
const SEV_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;

  const scan = await prisma.scan.findUnique({
    where:   { id },
    include: { findings: true },
  });

  if (!scan)              notFound();
  if (scan.userId !== userId) redirect('/dashboard');

  const findings = [...scan.findings].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5)
  );

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<Sev, number>;
  for (const f of findings) {
    const s = f.severity as Sev;
    if (s in counts) counts[s]++;
  }

  const color = scoreColor(scan.score);
  const label = scoreLabel(scan.score);

  return (
    <div className="p-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All Scans
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-zinc-500" />
            <h1 className="text-xl font-bold text-white">{scan.projectName}</h1>
            {scan.framework && (
              <span className="text-xs text-zinc-500 font-mono border border-zinc-800 px-1.5 py-0.5 rounded">
                {scan.framework}
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm">
            {scan.filesScanned} files · {findings.length} findings · {formatDate(scan.scannedAt)}
          </p>
        </div>
        <div className="shrink-0 w-16 h-16 rounded-full border-2 border-zinc-700 flex flex-col items-center justify-center">
          <span className={cn('text-lg font-bold leading-none', color)}>{scan.score}</span>
          <span className="text-zinc-600 text-[9px] uppercase tracking-wide">{label}</span>
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(Object.entries(SEVERITY_CFG).filter(([s]) => s !== 'INFO') as [Sev, typeof SEVERITY_CFG[Sev]][]).map(([sev, cfg]) => (
          <div key={sev} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
            <p className={`text-2xl font-bold ${cfg.color}`}>{counts[sev] ?? 0}</p>
            <p className="text-xs text-zinc-400 mt-0.5 capitalize">{sev.toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* Score bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Security Score</span>
          <span className={color}>{scan.score} / 100</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', scoreBg(scan.score))}
            style={{ width: `${scan.score}%` }}
          />
        </div>
      </div>

      {/* Findings */}
      <h2 className="text-sm font-semibold text-zinc-300 mb-3">
        Findings <span className="text-zinc-600 font-normal">({findings.length})</span>
      </h2>

      {findings.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <p className="text-emerald-400 font-semibold text-sm">✓ No vulnerabilities found</p>
          <p className="text-zinc-500 text-xs mt-1">This codebase is clean.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {findings.map((f) => {
            const sev = (f.severity in SEVERITY_CFG ? f.severity : 'INFO') as Sev;
            const cfg = SEVERITY_CFG[sev];
            return (
              <details
                key={f.id}
                className="group bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors"
              >
                <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer list-none select-none">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border shrink-0', cfg.color, cfg.bg, cfg.border)}>
                    {f.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-zinc-500 font-mono truncate">
                      {f.file}{f.line ? `:${f.line}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono hidden sm:block shrink-0">{f.id}</span>
                  <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform shrink-0" />
                </summary>

                <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-sm text-zinc-300">{f.description}</p>
                  </div>

                  {f.snippet && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Code</p>
                      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">
                        {f.snippet}
                      </pre>
                    </div>
                  )}

                  {f.fix && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Recommended Fix</p>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex gap-2">
                        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-zinc-300">{f.fix}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    {f.cwe   && <span className="text-xs text-zinc-600 font-mono">{f.cwe}</span>}
                    {f.owasp && <span className="text-xs text-zinc-600">{f.owasp}</span>}
                    {f.autoFixable && (
                      <span className="text-xs text-emerald-500 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        auto-fixable
                      </span>
                    )}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* CLI hint */}
      <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-2">Fix critical & high findings from your terminal:</p>
        <code className="text-sm text-violet-300 font-mono">brain fix --high</code>
      </div>
    </div>
  );
}
