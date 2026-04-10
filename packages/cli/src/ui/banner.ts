import chalk from 'chalk';
import { version } from '../version.js';

// ─── Compact wordmark — works at any terminal width ──────────────────────────
// Uses block chars for a sharp, modern look (no figlet dependency needed)

const WORDMARK_WIDE = [
  ' ██████╗ ██████╗  █████╗ ██╗███╗  ██╗███████╗██╗  ██╗██╗███████╗██╗     ██████╗',
  ' ██╔══██╗██╔══██╗██╔══██╗██║████╗ ██║██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗',
  ' ██████╔╝██████╔╝███████║██║██╔██╗██║███████╗███████║██║█████╗  ██║     ██║  ██║',
  ' ██╔══██╗██╔══██╗██╔══██║██║██║╚████║╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║',
  ' ██████╔╝██║  ██║██║  ██║██║██║ ╚███║███████║██║  ██║██║███████╗███████╗██████╔╝',
  ' ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚══╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝',
];

// Compact single-line for narrow terminals
const WORDMARK_NARROW = '  ▐█▌  BrainShield';

// Gradient: violet-200 → violet-700 top to bottom
const GRADIENT = ['#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9'];

function stripAnsi(s: string): number {
  return s.replace(/\x1B\[[0-9;]*m/g, '').length;
}

function center(text: string, width: number): string {
  const len = stripAnsi(text);
  const pad = Math.max(0, Math.floor((width - len) / 2));
  return ' '.repeat(pad) + text;
}

export function printBanner(): void {
  const cols = Math.min(process.stdout.columns ?? 100, 120);
  const hr = chalk.hex('#3F3F46')('─'.repeat(cols));

  console.log();

  if (cols >= 86) {
    // ── Wide: full pixel wordmark with gradient ──────────────────────────
    for (let i = 0; i < WORDMARK_WIDE.length; i++) {
      const color = GRADIENT[Math.min(i, GRADIENT.length - 1)] ?? '#7C3AED';
      console.log(chalk.hex(color).bold(WORDMARK_WIDE[i]));
    }
  } else {
    // ── Narrow: compact brand line ───────────────────────────────────────
    console.log(chalk.hex('#A78BFA').bold(WORDMARK_NARROW));
  }

  console.log();

  // ── Tagline ──────────────────────────────────────────────────────────────
  const tagline = center(
    chalk.hex('#6B7280')('AI-powered security analysis for JS & TS codebases'),
    cols
  );
  console.log(tagline);
  console.log();

  // ── Divider ──────────────────────────────────────────────────────────────
  console.log(hr);

  // ── Info bar ─────────────────────────────────────────────────────────────
  const left = [
    chalk.hex('#7C3AED').bold('▐█▌'),
    chalk.white.bold('BrainShield'),
    chalk.hex('#3F3F46')('·'),
    chalk.hex('#6B7280')(`v${version}`),
    chalk.hex('#3F3F46')('·'),
    chalk.hex('#6B7280')('JS · TS · Next.js · Vite'),
  ].join(' ');

  const cmds = [
    chalk.hex('#7C3AED')('scan'),
    chalk.hex('#6B7280')('chat'),
    chalk.hex('#6B7280')('fix'),
    chalk.hex('#6B7280')('report'),
    chalk.hex('#6B7280')('config'),
  ].join(chalk.hex('#3F3F46')('  '));

  const right = cmds + '  ';

  const leftLen  = stripAnsi(left);
  const rightLen = stripAnsi(right);
  const gap = Math.max(2, cols - leftLen - rightLen);

  console.log(left + ' '.repeat(gap) + right);
  console.log(hr);
  console.log();
}
