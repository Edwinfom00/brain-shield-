// ─── BrainShield CLI Design System ──────────────────────────────────────────
// Inspired by: Claude Code, Warp, Linear CLI aesthetics
// Palette: violet-first, high contrast, semantic severity colors

export const theme = {
  // Brand
  primary:   '#7C3AED',  // violet-600
  primary2:  '#A78BFA',  // violet-400 — lighter accent
  primary3:  '#C4B5FD',  // violet-300 — subtle

  // Semantic
  success:   '#10B981',  // emerald-500
  success2:  '#34D399',  // emerald-400
  warning:   '#F59E0B',  // amber-500
  warning2:  '#FCD34D',  // amber-300
  danger:    '#EF4444',  // red-500
  danger2:   '#FCA5A5',  // red-300
  info:      '#3B82F6',  // blue-500

  // Neutrals
  white:     '#F9FAFB',
  dim:       '#D1D5DB',  // gray-300
  muted:     '#6B7280',  // gray-500
  subtle:    '#374151',  // gray-700
  border:    '#27272A',  // zinc-800

  // Severity — OWASP-aligned
  severity: {
    CRITICAL: '#EF4444',  // red
    HIGH:     '#F97316',  // orange
    MEDIUM:   '#F59E0B',  // amber
    LOW:      '#3B82F6',  // blue
    INFO:     '#6B7280',  // gray
  },

  // Severity backgrounds (for badges)
  severityBg: {
    CRITICAL: '#450A0A',
    HIGH:     '#431407',
    MEDIUM:   '#451A03',
    LOW:      '#172554',
    INFO:     '#18181B',
  },
} as const;

export type SeverityLevel = keyof typeof theme.severity;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function sevColor(sev: string): string {
  return theme.severity[sev as SeverityLevel] ?? theme.muted;
}

export function scoreColor(score: number): string {
  if (score >= 80) return theme.success;
  if (score >= 50) return theme.warning;
  return theme.danger;
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'SECURE';
  if (score >= 50) return 'AT RISK';
  return 'CRITICAL';
}

// ─── Box drawing chars ────────────────────────────────────────────────────────
export const box = {
  h:  '─', v:  '│',
  tl: '╭', tr: '╮',
  bl: '╰', br: '╯',
  lt: '├', rt: '┤',
  tt: '┬', bt: '┴',
  x:  '┼',
} as const;
