import type { Vulnerability } from './types.js';

// ─── Severity weights ─────────────────────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 25,
  HIGH:     15,
  MEDIUM:    7,
  LOW:       2,
  INFO:      0,
};

// ─── Score computation ────────────────────────────────────────────────────────
//
// Problem with the naive approach (score = 100 - sum(weights)):
//   A project with 3 CRITICAL in 10 files scores the same as one with
//   3 CRITICAL in 5000 files. That's misleading — the large project is
//   proportionally much safer.
//
// Solution: density-aware scoring
//   1. Compute raw penalty from vulnerability weights
//   2. Normalize by file count using a logarithmic scale
//      (log scale because going from 10→100 files matters more than 1000→10000)
//   3. Apply a severity multiplier — CRITICAL findings always hurt more
//      regardless of project size (a hardcoded AWS key is critical at any scale)
//
// Formula:
//   densityFactor = log10(max(fileCount, 10)) / log10(1000)
//                 → ~0.5 for 10 files, ~0.67 for 100, ~1.0 for 1000+
//   normalizedPenalty = rawPenalty * densityFactor
//   score = clamp(100 - normalizedPenalty, 0, 100)
//
// Critical override: if any CRITICAL finding exists, score is capped at 59
// (never "secure" with a critical vulnerability, regardless of project size)

export function computeScore(
  vulnerabilities: Vulnerability[],
  filesScanned = 1,
): number {
  if (vulnerabilities.length === 0) return 100;

  // Raw penalty
  const rawPenalty = vulnerabilities.reduce((total, vuln) => {
    return total + (SEVERITY_WEIGHTS[vuln.severity] ?? 0);
  }, 0);

  // Density normalization — larger projects get a slight penalty reduction
  // log10(10) = 1, log10(100) = 2, log10(1000) = 3
  const base          = Math.max(filesScanned, 10);
  const densityFactor = Math.log10(base) / Math.log10(1000); // 0.33 → 1.0
  const clampedFactor = Math.min(Math.max(densityFactor, 0.33), 1.0);

  const normalizedPenalty = rawPenalty * clampedFactor;
  let score = Math.round(Math.max(0, 100 - normalizedPenalty));

  // Critical override — can never be "secure" with a CRITICAL finding
  const hasCritical = vulnerabilities.some((v) => v.severity === 'CRITICAL');
  if (hasCritical && score > 59) score = 59;

  return score;
}

// ─── Score breakdown (for display) ───────────────────────────────────────────

export interface ScoreBreakdown {
  score:            number;
  rawPenalty:       number;
  densityFactor:    number;
  criticalOverride: boolean;
  counts: {
    critical: number;
    high:     number;
    medium:   number;
    low:      number;
  };
}

export function computeScoreWithBreakdown(
  vulnerabilities: Vulnerability[],
  filesScanned = 1,
): ScoreBreakdown {
  const counts = {
    critical: vulnerabilities.filter((v) => v.severity === 'CRITICAL').length,
    high:     vulnerabilities.filter((v) => v.severity === 'HIGH').length,
    medium:   vulnerabilities.filter((v) => v.severity === 'MEDIUM').length,
    low:      vulnerabilities.filter((v) => v.severity === 'LOW').length,
  };

  const rawPenalty = vulnerabilities.reduce(
    (t, v) => t + (SEVERITY_WEIGHTS[v.severity] ?? 0), 0
  );

  const base          = Math.max(filesScanned, 10);
  const densityFactor = Math.min(Math.max(Math.log10(base) / Math.log10(1000), 0.33), 1.0);
  const score         = computeScore(vulnerabilities, filesScanned);

  return {
    score,
    rawPenalty,
    densityFactor: Math.round(densityFactor * 100) / 100,
    criticalOverride: counts.critical > 0 && score <= 59,
    counts,
  };
}
