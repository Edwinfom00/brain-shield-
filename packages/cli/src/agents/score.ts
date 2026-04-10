import type { Vulnerability } from './types.js';

const SEVERITY_WEIGHTS = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 7,
  LOW: 2,
  INFO: 0,
};

/**
 * Computes a security score from 0 to 100.
 * Starts at 100, subtracts points per finding weighted by severity.
 * The more findings, the more severe the penalty.
 */
export function computeScore(vulnerabilities: Vulnerability[]): number {
  if (vulnerabilities.length === 0) return 100;

  const penalty = vulnerabilities.reduce((total, vuln) => {
    return total + (SEVERITY_WEIGHTS[vuln.severity] ?? 0);
  }, 0);

  return Math.max(0, 100 - penalty);
}
