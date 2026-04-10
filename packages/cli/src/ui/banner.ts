import figlet from 'figlet';
import chalk from 'chalk';
import { version } from '../version.js';

// Purple gradient — light to dark (6 shades for 6 figlet lines)
const GRADIENT = [
  '#D8B4FE', // violet-300
  '#C084FC', // violet-400
  '#A855F7', // violet-500
  '#9333EA', // violet-600
  '#7C3AED', // violet-700
  '#6D28D9', // violet-800
];

function applyGradient(text: string, startShade = 0): string {
  return text
    .split('\n')
    .map((line, i) => {
      const color = GRADIENT[Math.min(startShade + i, GRADIENT.length - 1)];
      return chalk.hex(color ?? '#7C3AED')(line);
    })
    .join('\n');
}

function center(text: string, width: number): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      const pad = Math.max(0, Math.floor((width - line.length) / 2));
      return ' '.repeat(pad) + line;
    })
    .join('\n');
}

export function printBanner(): void {
  const termWidth = process.stdout.columns ?? 80;

  // Generate ASCII art for "brain" and "shield" separately
  const brainArt = figlet.textSync('brain', {
    font: 'Slant',
    horizontalLayout: 'default',
  });

  const shieldArt = figlet.textSync('shield', {
    font: 'Slant',
    horizontalLayout: 'default',
  });

  const topBar    = chalk.hex('#7C3AED')('▄'.repeat(Math.min(termWidth, 72)));
  const bottomBar = chalk.hex('#5B21B6')('▀'.repeat(Math.min(termWidth, 72)));
  const divider   = chalk.hex('#4C1D95').dim('─'.repeat(Math.min(termWidth, 72)));

  const brainColored  = applyGradient(center(brainArt, Math.min(termWidth, 72)), 0);
  const shieldColored = applyGradient(center(shieldArt, Math.min(termWidth, 72)), 2);

  // Build the badge line
  const badge = [
    chalk.hex('#A78BFA').bold('⬡'),
    chalk.hex('#C4B5FD')(`AI Security CLI`),
    chalk.hex('#6D28D9')('•'),
    chalk.hex('#A78BFA')(`v${version}`),
    chalk.hex('#6D28D9')('•'),
    chalk.hex('#C4B5FD')('JavaScript / TypeScript'),
    chalk.hex('#A78BFA').bold('⬡'),
  ].join('  ');

  const tagline = chalk.hex('#DDD6FE').italic(
    '  Detect. Analyze. Protect. — Powered by Claude AI'
  );

  const hint = chalk.hex('#7C3AED').dim(
    '  brain scan    brain chat    brain fix    brain --help'
  );

  console.log();
  console.log(topBar);
  console.log(brainColored);
  console.log(shieldColored);
  console.log(divider);
  console.log();
  console.log('  ' + badge);
  console.log(tagline);
  console.log();
  console.log(hint);
  console.log();
  console.log(bottomBar);
  console.log();
}
