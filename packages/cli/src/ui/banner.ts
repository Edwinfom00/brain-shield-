import figlet from 'figlet';
import chalk from 'chalk';
import { version } from '../version.js';

// ── Pixel-art hand-crafted "BRAINSIELD" ─────────────────────────────────────
// Used when terminal is narrow — game-style, one line per row

const PIXEL_ART = [
  '██████╗ ██████╗  █████╗ ██╗███╗  ██╗███████╗██╗  ██╗██╗███████╗██╗     ██████╗ ',
  '██╔══██╗██╔══██╗██╔══██╗██║████╗ ██║██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗',
  '██████╔╝██████╔╝███████║██║██╔██╗██║███████╗███████║██║█████╗  ██║     ██║  ██║',
  '██╔══██╗██╔══██╗██╔══██║██║██║╚████║╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║',
  '██████╔╝██║  ██║██║  ██║██║██║ ╚███║███████║██║  ██║██║███████╗███████╗██████╔╝',
  '╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚══╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝ ',
];

// ── Gradient palettes ────────────────────────────────────────────────────────

// Line-by-line gradient (top = light, bottom = dark) — violet like our brand
const VIOLET_GRADIENT = [
  '#E9D5FF', // violet-200
  '#C4B5FD', // violet-300
  '#A78BFA', // violet-400
  '#8B5CF6', // violet-500
  '#7C3AED', // violet-600
  '#6D28D9', // violet-700
];


function pad(text: string, width: number): string {
  const visible = text.replace(/\x1B\[[0-9;]*m/g, ''); // strip ANSI for length
  const padLen = Math.max(0, Math.floor((width - visible.length) / 2));
  return ' '.repeat(padLen) + text;
}

// ── Main banner function ─────────────────────────────────────────────────────

export function printBanner(): void {
  const cols = Math.min(process.stdout.columns ?? 100, 120);

  // ── Logo ──────────────────────────────────────────────────────────────────
  let logoLines: string[];

  if (cols >= 84) {
    // Wide terminal → show full BRAINSIELD in ANSI Shadow (pixel block style)
    logoLines = PIXEL_ART;
  } else {
    // Narrow terminal → use figlet "Big" font for "BRAIN" / "SHIELD" stacked
    const brain  = figlet.textSync('BRAIN',  { font: 'Big', horizontalLayout: 'default' });
    const shield = figlet.textSync('SHIELD', { font: 'Big', horizontalLayout: 'default' });
    logoLines = [...brain.split('\n'), ...shield.split('\n')];
  }

  // Center each line
  const logoWidth = Math.max(...logoLines.map((l) => l.length));
  const centeredLogo = logoLines
    .map((line) => {
      const padLen = Math.max(0, Math.floor((cols - logoWidth) / 2));
      return ' '.repeat(padLen) + line;
    });

  // Apply vertical gradient
  const coloredLogo = centeredLogo
    .map((line, i) => {
      const color = VIOLET_GRADIENT[Math.min(i, VIOLET_GRADIENT.length - 1)];
      return chalk.hex(color ?? '#7C3AED').bold(line);
    })
    .join('\n');

  // ── Divider ───────────────────────────────────────────────────────────────
  const divider = chalk.hex('#4C1D95').dim('─'.repeat(cols));

  // ── Status bar (Gemini-style bottom bar) ─────────────────────────────────
  const authorLabel  = chalk.hex('#C4B5FD').bold('by Edwin Fom');
  const versionLabel = chalk.hex('#6D28D9')(`v${version}`);
  const jsLabel      = chalk.hex('#A78BFA')('JS · TS · Next.js · Vite');

  const statusLeft  = `  ${authorLabel}   ${jsLabel}   ${versionLabel}`;
  const statusRight = chalk.hex('#4C1D95')('brain scan  brain chat  brain fix  brain --help  ');

  const statusLeftClean  = statusLeft.replace(/\x1B\[[0-9;]*m/g, '');
  const statusRightClean = statusRight.replace(/\x1B\[[0-9;]*m/g, '');
  const gap = Math.max(1, cols - statusLeftClean.length - statusRightClean.length);

  const statusBar = statusLeft + ' '.repeat(gap) + statusRight;

  // ── Tagline ───────────────────────────────────────────────────────────────
  const tagline = pad(
    chalk.hex('#DDD6FE').italic('Detect. Analyze. Protect. — Powered by Edwin Fom'),
    cols
  );

  // ── Output ────────────────────────────────────────────────────────────────
  console.log();
  console.log(coloredLogo);
  console.log();
  console.log(tagline);
  console.log();
  console.log(divider);
  console.log(statusBar);
  console.log(divider);
  console.log();
}
