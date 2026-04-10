import type { Metadata } from 'next';
import { ScanCard, type ScanCardData } from '@/components/dashboard/ScanCard';
import { Terminal, TrendingUp, ShieldAlert, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'Scan History' };

// Mock data — replace with real API/DB calls
const MOCK_SCANS: ScanCardData[] = [
  {
    id: 'scan-001',
    projectName: 'my-nextjs-app',
    score: 62,
    scannedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    findings: { critical: 1, high: 3, medium: 5, low: 2 },
    filesScanned: 84,
  },
  {
    id: 'scan-002',
    projectName: 'api-gateway',
    score: 88,
    scannedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    findings: { critical: 0, high: 0, medium: 2, low: 4 },
    filesScanned: 42,
  },
  {
    id: 'scan-003',
    projectName: 'admin-dashboard',
    score: 31,
    scannedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    findings: { critical: 3, high: 5, medium: 4, low: 1 },
    filesScanned: 156,
  },
  {
    id: 'scan-004',
    projectName: 'auth-service',
    score: 95,
    scannedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    findings: { critical: 0, high: 0, medium: 0, low: 2 },
    filesScanned: 28,
  },
];

const STATS = [
  { label: 'Total Scans', value: '38', icon: Terminal, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { label: 'Avg Score', value: '69', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { label: 'Critical Found', value: '4', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { label: 'Clean Scans', value: '12', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Scan History</h1>
        <p className="text-zinc-400 text-sm">All your past security scans, sorted by date.</p>
      </div>

      {/* Stats */}
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

      {/* Scan list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Recent Scans</h2>
          <div className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <Terminal className="w-3 h-3" />
            <span>Run <code className="text-violet-400 font-mono">brain scan</code> to add more</span>
          </div>
        </div>
        {MOCK_SCANS.map((scan) => (
          <ScanCard key={scan.id} scan={scan} />
        ))}
      </div>
    </div>
  );
}
