import { Command } from 'commander';
import chalk, { type ChalkInstance } from 'chalk';
import { createInterface } from 'readline';
import { loadLatestReport } from '../core/reports.js';
import { loadSession, buildProjectContext } from '../core/session.js';
import { fixVulnerability, type FileDiff } from '../core/fixer.js';
import type { Vulnerability } from '../agents/types.js';

// ─── UI helpers ───────────────────────────────────────────────────────────────

const SEP  = chalk.hex('#27272A')('─'.repeat(64));
const SEP2 = chalk.hex('#3F3F46')('─'.repeat(64));

function sevChalk(sev: string): ChalkInstance {
  switch (sev) {
    case 'CRITICAL': return chalk.hex('#EF4444').bold;
    case 'HIGH':     return chalk.hex('#F97316').bold;
    case 'MEDIUM':   return chalk.hex('#F59E0B');
    case 'LOW':      return chalk.hex('#3B82F6');
    default:         return chalk.gray;
  }
}

function printDiff(diff: FileDiff): void {
  if (diff.hunks.length === 0) {
    console.log(chalk.hex('#6B7280')('  (no visible changes)'));
    return;
  }

  for (const hunk of diff.hunks) {
    console.log(chalk.hex('#3F3F46')('  ┌─'));
    for (const line of hunk) {
      const lineNo = String(line.lineNo).padStart(4, ' ');
      if (line.type === 'removed') {
        console.log(chalk.red(`  │ ${lineNo} - ${line.content.trimEnd()}`));
      } else if (line.type === 'added') {
        console.log(chalk.green(`  │ ${lineNo} + ${line.content.trimEnd()}`));
      } else {
        console.log(chalk.hex('#4B5563')(`  │ ${lineNo}   ${line.content.trimEnd()}`));
      }
    }
    console.log(chalk.hex('#3F3F46')('  └─'));
  }

  console.log(
    chalk.hex('#6B7280')(
      `  ${diff.linesAdded} added · ${diff.linesRemoved} removed`
    )
  );
}

function printVulnHeader(vuln: Vulnerability, i: number, total: number): void {
  console.log(SEP);
  const sevFn = sevChalk(vuln.severity);
  console.log(
    chalk.hex('#6B7280')(`  [${i}/${total}]  `) +
    sevFn(`[${vuln.severity}]`) + '  ' +
    chalk.hex('#A78BFA').bold(vuln.id) + '  ' +
    chalk.white(vuln.title)
  );
  console.log(chalk.hex('#6B7280')(`         ${vuln.file}${vuln.line ? `:${vuln.line}` : ''}`));
  console.log();
}

function askConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() !== 'n');
    });
  });
}

// ─── Command ──────────────────────────────────────────────────────────────────

export const fixCommand = new Command('fix')
  .description('Apply AI-powered security fixes from the last scan')
  .argument('[id]', 'Vulnerability ID to fix (e.g. SEC-ABC123)')
  .option('--all',            'Fix all vulnerabilities')
  .option('--critical',       'Fix all CRITICAL severity issues')
  .option('--high',           'Fix CRITICAL + HIGH severity issues')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--dry-run',        'Preview fixes without writing to disk')
  .option('-y, --yes',        'Skip confirmation prompts')
  .action(async (id: string | undefined, opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    // ── Load report + session ──────────────────────────────────────────────
    const report = await loadLatestReport(cwd);
    if (!report) {
      console.log();
      console.log(chalk.red('  ✗  No scan report found.'));
      console.log(chalk.hex('#6B7280')('     Run ') + chalk.hex('#7C3AED')('brain scan') + chalk.hex('#6B7280')(' first.\n'));
      process.exit(1);
    }

    const session        = loadSession(cwd);
    const projectContext = session ? buildProjectContext(session) : '';

    // ── Resolve targets ────────────────────────────────────────────────────
    let targets: Vulnerability[] = [];

    if (id) {
      const vuln = report.vulnerabilities.find((v) => v.id === id);
      if (!vuln) {
        console.log(chalk.red(`\n  ✗  Vulnerability ${id} not found.\n`));
        process.exit(1);
      }
      targets = [vuln];
    } else if (opts.all) {
      targets = report.vulnerabilities;
    } else if (opts.critical) {
      targets = report.vulnerabilities.filter((v) => v.severity === 'CRITICAL');
    } else if (opts.high) {
      targets = report.vulnerabilities.filter(
        (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH'
      );
    } else {
      // ── Interactive list ─────────────────────────────────────────────────
      printInteractiveList(report.vulnerabilities, report);
      return;
    }

    if (targets.length === 0) {
      console.log(chalk.yellow('\n  No matching vulnerabilities.\n'));
      return;
    }

    // ── Header ─────────────────────────────────────────────────────────────
    console.log();
    console.log(SEP2);
    console.log(
      '  ' + chalk.hex('#7C3AED').bold('▐█▌  BrainShield Fix') +
      chalk.hex('#3F3F46')('  ·  ') +
      chalk.hex('#6B7280')(`${targets.length} issue${targets.length > 1 ? 's' : ''} to process`) +
      (opts.dryRun ? chalk.yellow('  [dry-run]') : '') +
      (session ? chalk.hex('#A78BFA')('  [session context]') : '')
    );
    console.log(SEP2);

    let fixed   = 0;
    let skipped = 0;
    let manual  = 0;

    for (let i = 0; i < targets.length; i++) {
      const vuln = targets[i]!;

      printVulnHeader(vuln, i + 1, targets.length);

      // ── Dependency fix — always manual ───────────────────────────────────
      if (vuln.category === 'Dependencies') {
        console.log(chalk.yellow('  ⚠  Dependency fix — run manually:'));
        console.log(chalk.white(`     ${vuln.fix}`));
        console.log();
        manual++;
        continue;
      }

      // ── Generate fix via FixEngine ────────────────────────────────────────
      process.stdout.write(chalk.hex('#A78BFA')('  ◉  Analyzing and generating fix...'));

      const result = await fixVulnerability(vuln, cwd, projectContext, opts.dryRun);

      process.stdout.write('\r' + ' '.repeat(50) + '\r');

      // ── Skipped / no fix ─────────────────────────────────────────────────
      if (result.skipped) {
        console.log(chalk.yellow(`  ⚠  ${result.skipReason}`));
        if (result.explanation) {
          console.log(chalk.hex('#6B7280')(`     ${result.explanation}`));
        }
        if (result.warnings?.length) {
          for (const w of result.warnings) {
            console.log(chalk.hex('#6B7280')(`     ⚠ ${w}`));
          }
        }
        console.log();
        manual++;
        continue;
      }

      // ── Error ─────────────────────────────────────────────────────────────
      if (!result.success || !result.diff) {
        console.log(chalk.red(`  ✗  ${result.error ?? 'Fix generation failed'}`));
        console.log(chalk.hex('#6B7280')('     Manual fix guidance:'));
        console.log(chalk.hex('#D1D5DB')(`     ${vuln.fix ?? 'See vulnerability description.'}`));
        if (vuln.cwe)   console.log(chalk.hex('#6B7280')(`     ${vuln.cwe}`));
        if (vuln.owasp) console.log(chalk.hex('#6B7280')(`     ${vuln.owasp}`));
        console.log();
        manual++;
        continue;
      }

      // ── Show explanation + confidence ─────────────────────────────────────
      if (result.explanation) {
        const confColor = result.confidence === 'high'
          ? chalk.green
          : result.confidence === 'medium'
            ? chalk.yellow
            : chalk.red;
        console.log(
          chalk.hex('#6B7280')('  Fix: ') +
          chalk.white(result.explanation) +
          '  ' + confColor(`[${result.confidence ?? 'unknown'} confidence]`)
        );
      }

      // ── Warnings ──────────────────────────────────────────────────────────
      if (result.warnings?.length) {
        for (const w of result.warnings) {
          console.log(chalk.yellow(`  ⚠  ${w}`));
        }
      }

      console.log();

      // ── Show diff ─────────────────────────────────────────────────────────
      printDiff(result.diff);
      console.log();

      if (opts.dryRun) {
        console.log(chalk.yellow('  [dry-run] Not applied.\n'));
        continue;
      }

      // ── Confirm ───────────────────────────────────────────────────────────
      const confirmed = opts.yes
        ? true
        : await askConfirm(chalk.hex('#7C3AED')('  Apply this fix? [Y/n] '));

      if (confirmed) {
        // File was already written by fixVulnerability (not dry-run)
        console.log(chalk.green('  ✓  Applied.\n'));
        fixed++;
      } else {
        console.log(chalk.hex('#6B7280')('  Skipped.\n'));
        skipped++;
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log(SEP2);
    console.log(
      '  ' +
      chalk.green(`${fixed} fixed`) + '   ' +
      chalk.yellow(`${manual} manual`) + '   ' +
      chalk.hex('#6B7280')(`${skipped} skipped`)
    );

    if (fixed > 0) {
      console.log(
        chalk.hex('#6B7280')('\n  Run ') +
        chalk.hex('#7C3AED')('brain scan') +
        chalk.hex('#6B7280')(' to verify fixes and get an updated score.\n')
      );
    } else {
      console.log();
    }
  });

// ─── Interactive list ─────────────────────────────────────────────────────────

function printInteractiveList(
  vulns: Vulnerability[],
  report: { timestamp: string; score: number },
): void {
  console.log();
  console.log(SEP2);
  console.log(
    '  ' + chalk.hex('#7C3AED').bold('▐█▌  BrainShield Fix') +
    chalk.hex('#3F3F46')('  ·  ') +
    chalk.hex('#6B7280')(`Last scan: ${new Date(report.timestamp).toLocaleString()}`)
  );
  console.log(
    chalk.hex('#6B7280')(
      `       ${vulns.length} vulnerabilities  ·  Score ${report.score}/100`
    )
  );
  console.log(SEP2);
  console.log();

  if (vulns.length === 0) {
    console.log(chalk.green('  ✓  No vulnerabilities to fix.\n'));
    return;
  }

  vulns.slice(0, 25).forEach((v, i) => {
    const sevFn = sevChalk(v.severity);
    console.log(
      chalk.hex('#3F3F46')(`  ${String(i + 1).padStart(2, ' ')}.  `) +
      sevFn(`[${v.severity}]`.padEnd(11)) +
      chalk.hex('#A78BFA')(v.id) + '  ' +
      chalk.white(v.title)
    );
    console.log(chalk.hex('#3F3F46')(`        ${v.file}${v.line ? `:${v.line}` : ''}`));
  });

  console.log();
  console.log(SEP2);
  console.log(chalk.hex('#6B7280')('  Usage:'));
  console.log('  ' + chalk.hex('#7C3AED')('brain fix <ID>         ') + chalk.hex('#6B7280')('fix a specific vulnerability'));
  console.log('  ' + chalk.hex('#7C3AED')('brain fix --critical   ') + chalk.hex('#6B7280')('fix all CRITICAL issues'));
  console.log('  ' + chalk.hex('#7C3AED')('brain fix --high       ') + chalk.hex('#6B7280')('fix CRITICAL + HIGH issues'));
  console.log('  ' + chalk.hex('#7C3AED')('brain fix --all        ') + chalk.hex('#6B7280')('fix everything'));
  console.log('  ' + chalk.hex('#7C3AED')('brain fix --dry-run    ') + chalk.hex('#6B7280')('preview without applying'));
  console.log();
}
