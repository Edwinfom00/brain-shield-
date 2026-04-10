import Link from 'next/link';
import { Shield, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn, formatDate, scoreColor, scoreLabel } from '@/lib/utils';

export interface ScanCardData {
  id: string;
  projectName: string;
  score: number;
  scannedAt: string;
  findings: { critical: number; high: number; medium: number; low: number };
  filesScanned: number;
}

export function ScanCard({ scan }: { scan: ScanCardData }) {
  const total = scan.findings.critical + scan.findings.high + scan.findings.medium + scan.findings.low;
  const label = scoreLabel(scan.score);
  const color = scoreColor(scan.score);

  return (
    <Link
      href={`/dashboard/scan/${scan.id}`}
      className="group flex items-center gap-5 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl px-5 py-4 transition-all"
    >
      {/* Score ring */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-zinc-700 flex flex-col items-center justify-center">
        <span className={cn('text-sm font-bold leading-none', color)}>{scan.score}</span>
        <span className="text-zinc-600 text-[9px] uppercase tracking-wide">{label}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-white truncate">{scan.projectName}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(scan.scannedAt)}
          </span>
          <span>{scan.filesScanned} files</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {scan.findings.critical > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            {scan.findings.critical}C
          </span>
        )}
        {scan.findings.high > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            {scan.findings.high}H
          </span>
        )}
        {total === 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            Clean
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors ml-1" />
      </div>
    </Link>
  );
}
