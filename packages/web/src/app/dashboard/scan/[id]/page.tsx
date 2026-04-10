import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Info, ChevronDown, Shield } from 'lucide-react';
import { cn, scoreColor, scoreLabel } from '@/lib/utils';

export const metadata: Metadata = { title: 'Scan Report' };

// Severity config
const SEVERITY = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-500', weight: 4 },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', bar: 'bg-orange-500', weight: 3 },
  MEDIUM:   { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-500', weight: 2 },
  LOW:      { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', bar: 'bg-blue-500', weight: 1 },
} as const;

type Sev = keyof typeof SEVERITY;

interface Finding {
  id: string;
  title: string;
  severity: Sev;
  file: string;
  line: number;
  description: string;
  fix: string;
  rule: string;
}

// Mock — replace with real data fetch
const MOCK_FINDINGS: Finding[] = [
  { id: 'SEC-A1B2', title: 'Hardcoded API Key', severity: 'CRITICAL', file: 'src/lib/client.ts', line: 14, description: 'An Anthropic API key is hardcoded in source code and will be exposed in version control.', fix: 'Move the key to an environment variable (e.g. ANTHROPIC_API_KEY) and access it via process.env.', rule: 'secrets/anthropic-key' },
  { id: 'SEC-C3D4', title: 'JWT Algorithm Not Verified', severity: 'HIGH', file: 'src/auth/jwt.ts', line: 32, description: 'jwt.verify() is called without specifying algorithms, allowing algorithm confusion attacks.', fix: 'Pass { algorithms: ["HS256"] } as the third argument to jwt.verify().', rule: 'auth/jwt-algorithm' },
  { id: 'SEC-E5F6', title: 'innerHTML Assignment', severity: 'HIGH', file: 'src/components/Preview.tsx', line: 87, description: 'Directly assigning user-controlled data to innerHTML can lead to XSS vulnerabilities.', fix: 'Use dangerouslySetInnerHTML with sanitization (DOMPurify) or escape the content first.', rule: 'injection/xss-innerhtml' },
  { id: 'SEC-G7H8', title: 'CORS Wildcard with Credentials', severity: 'MEDIUM', file: 'src/server/index.ts', line: 5, description: "Access-Control-Allow-Origin: * combined with credentials: true is rejected by browsers but signals insecure intent.", fix: 'Set a specific allowed origin instead of *', rule: 'api/cors-wildcard-credentials' },
  { id: 'SEC-I9J0', title: 'Missing Rate Limiting', severity: 'MEDIUM', file: 'src/app/api/auth/route.ts', line: 1, description: 'Authentication endpoint has no rate limiting, enabling brute-force attacks.', fix: 'Add rate limiting middleware (e.g. express-rate-limit or upstash/ratelimit for Next.js).', rule: 'api/no-rate-limit' },
  { id: 'SEC-K1L2', title: 'bcrypt Cost Factor Too Low', severity: 'LOW', file: 'src/auth/password.ts', line: 22, description: 'bcrypt is configured with a cost factor of 8, which may be insufficient for modern hardware.', fix: 'Increase the cost factor to at least 12.', rule: 'auth/bcrypt-cost' },
];

const MOCK_META = { projectName: 'my-nextjs-app', score: 62, filesScanned: 84, scannedAt: '2026-04-10T10:32:00Z' };

export default function ScanDetailPage() {
  const { projectName, score, filesScanned } = MOCK_META;
  const label = scoreLabel(score);
  const color = scoreColor(score);

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<Sev, number>;
  for (const f of MOCK_FINDINGS) counts[f.severity]++;

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        All Scans
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-zinc-500" />
            <h1 className="text-xl font-bold text-white">{projectName}</h1>
          </div>
          <p className="text-zinc-400 text-sm">{filesScanned} files scanned · {MOCK_FINDINGS.length} findings</p>
        </div>
        <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-zinc-700 flex flex-col items-center justify-center">
          <span className={cn('text-lg font-bold leading-none', color)}>{score}</span>
          <span className="text-zinc-600 text-[9px] uppercase tracking-wide">{label}</span>
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {(Object.entries(SEVERITY) as [Sev, typeof SEVERITY[Sev]][]).map(([sev, cfg]) => (
          <div key={sev} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
            <p className={`text-2xl font-bold ${cfg.color}`}>{counts[sev]}</p>
            <p className="text-xs text-zinc-400 mt-0.5 capitalize">{sev.toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* Score bar */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Security Score</span>
          <span className={color}>{score} / 100</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full">
          <div
            className={cn('h-full rounded-full transition-all', score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500')}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Findings */}
      <h2 className="text-sm font-semibold text-zinc-300 mb-3">Findings</h2>
      <div className="space-y-3">
        {MOCK_FINDINGS.map((f) => {
          const cfg = SEVERITY[f.severity];
          return (
            <details key={f.id} className="group bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors">
              <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer list-none select-none">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', cfg.color, cfg.bg, cfg.border)}>
                  {f.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-zinc-500 font-mono truncate">{f.file}:{f.line}</p>
                </div>
                <span className="text-xs text-zinc-600 font-mono hidden sm:block">{f.id}</span>
                <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-zinc-300">{f.description}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1.5">Recommended Fix</p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex gap-2">
                    <Info className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-300">{f.fix}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">Rule: <code className="text-zinc-400 font-mono">{f.rule}</code></span>
                  <span className="text-xs text-zinc-700">·</span>
                  <span className="text-xs text-zinc-600 font-mono">{f.file}:{f.line}</span>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {/* CLI hint */}
      <div className="mt-8 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 mb-2">Fix all critical & high findings with AI:</p>
        <code className="text-sm text-violet-300 font-mono">brain fix --critical --high --ai</code>
      </div>
    </div>
  );
}
