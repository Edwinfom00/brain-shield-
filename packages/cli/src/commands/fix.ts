import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { createInterface } from 'readline';
import { loadLatestReport } from '../core/reports.js';
import { askClaude } from '../core/claude.js';
import type { Vulnerability } from '../agents/types.js';

// ── Diff helpers ────────────────────────────────────────────────────────────

function showDiff(original: string, fixed: string, file: string): void {
  const origLines = original.split('\n');
  const fixedLines = fixed.split('\n');
  const maxLines = Math.max(origLines.length, fixedLines.length);

  console.log(chalk.hex('#6B7280')(`  File: ${file}`));
  console.log(chalk.hex('#6B7280')('  ' + '─'.repeat(60)));

  for (let i = 0; i < maxLines; i++) {
    const orig = origLines[i];
    const fixed = fixedLines[i];
    if (orig === fixed || orig === undefined) {
      if (fixed !== undefined) {
        console.log(chalk.green(`  + ${fixed}`));
      }
    } else if (fixed === undefined) {
      console.log(chalk.red(`  - ${orig}`));
    } else if (orig !== fixed) {
      console.log(chalk.red(`  - ${orig}`));
      console.log(chalk.green(`  + ${fixed}`));
    }
  }

  console.log(chalk.hex('#6B7280')('  ' + '─'.repeat(60)));
}

function askConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim() === '');
    });
  });
}

// ── Claude-assisted fix generation ─────────────────────────────────────────

async function generateFix(
  vuln: Vulnerability,
  fileContent: string
): Promise<string | null> {
  if (!vuln.snippet) return null;

  const lines = fileContent.split('\n');
  const lineIdx = (vuln.line ?? 1) - 1;
  const contextStart = Math.max(0, lineIdx - 3);
  const contextEnd = Math.min(lines.length, lineIdx + 4);
  const contextCode = lines.slice(contextStart, contextEnd).join('\n');

  const prompt = `You are a security expert. Fix this specific security vulnerability in JavaScript/TypeScript code.

Vulnerability: ${vuln.title}
Severity: ${vuln.severity}
CWE: ${vuln.cwe ?? 'N/A'}
Description: ${vuln.description}

Code context (lines ${contextStart + 1}–${contextEnd}):
\`\`\`
${contextCode}
\`\`\`

Fix guidance: ${vuln.fix}

Return ONLY the fixed version of the exact lines shown above — no explanation, no markdown fences, no extra text.
The output must be a drop-in replacement for those exact lines.`;

  try {
    const fixed = await askClaude(
      prompt,
      'You are a security code fixer. Return only the fixed code, nothing else.'
    );

    // Strip any accidental markdown fences
    return fixed
      .replace(/^```(?:typescript|javascript|ts|js)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim();
  } catch {
    return null;
  }
}

function applyLineFix(
  content: string,
  vuln: Vulnerability,
  fixedContext: string
): string | null {
  const lines = content.split('\n');
  const lineIdx = (vuln.line ?? 1) - 1;
  const contextStart = Math.max(0, lineIdx - 3);
  const contextEnd = Math.min(lines.length, lineIdx + 4);

  const originalContext = lines.slice(contextStart, contextEnd).join('\n');

  if (!content.includes(originalContext)) return null;

  return content.replace(originalContext, fixedContext);
}

// ── Command ─────────────────────────────────────────────────────────────────

export const fixCommand = new Command('fix')
  .description('Apply security fixes from the last scan')
  .argument('[id]', 'Vulnerability ID to fix (e.g. SEC-ABC123)')
  .option('--all', 'Apply all auto-fixable vulnerabilities')
  .option('--critical', 'Apply all CRITICAL severity vulnerabilities')
  .option('--ai', 'Use Claude AI to generate fixes for non-auto-fixable issues')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--dry-run', 'Preview fixes without writing to disk')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (id: string | undefined, opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    const report = await loadLatestReport(cwd);
    if (!report) {
      console.error(chalk.red('\nNo scan report found. Run `brain scan` first.\n'));
      process.exit(1);
    }

    let targets: Vulnerability[] = [];

    if (id) {
      const vuln = report.vulnerabilities.find((v) => v.id === id);
      if (!vuln) {
        console.error(chalk.red(`\nVulnerability ${id} not found in last scan.`));
        console.log(chalk.gray('Run `brain scan` to see current vulnerability IDs.\n'));
        process.exit(1);
      }
      targets = [vuln];
    } else if (opts.all) {
      targets = report.vulnerabilities;
    } else if (opts.critical) {
      targets = report.vulnerabilities.filter((v) => v.severity === 'CRITICAL');
    } else {
      // Interactive: show list and let user pick
      console.log(chalk.hex('#7C3AED').bold('\n🛡 BrainShield Fix\n'));
      console.log(chalk.white(`Last scan: ${new Date(report.timestamp).toLocaleString()}`));
      console.log(chalk.gray(`${report.vulnerabilities.length} vulnerabilities · Score ${report.score}/100\n`));

      if (report.vulnerabilities.length === 0) {
        console.log(chalk.green('✓ No vulnerabilities to fix.\n'));
        return;
      }

      console.log(chalk.white('Available fixes:\n'));
      report.vulnerabilities.slice(0, 20).forEach((v, i) => {
        const sev = v.severity === 'CRITICAL' ? chalk.red(v.severity)
          : v.severity === 'HIGH' ? chalk.hex('#F97316')(v.severity)
          : v.severity === 'MEDIUM' ? chalk.yellow(v.severity)
          : chalk.blue(v.severity);
        const auto = v.autoFixable ? chalk.green(' [auto]') : opts.ai ? chalk.cyan(' [AI]') : '';
        console.log(`  ${chalk.gray(`${i + 1}.`)} ${sev} ${chalk.white(v.id)} — ${v.title}${auto}`);
        console.log(chalk.gray(`     ${v.file}${v.line ? `:${v.line}` : ''}`));
      });

      console.log(chalk.gray('\n  Usage examples:'));
      console.log(chalk.hex('#7C3AED')('    brain fix <ID>          ') + chalk.gray('fix a specific vulnerability'));
      console.log(chalk.hex('#7C3AED')('    brain fix --critical     ') + chalk.gray('fix all CRITICAL issues'));
      console.log(chalk.hex('#7C3AED')('    brain fix --all --ai     ') + chalk.gray('AI-powered fix for everything'));
      console.log(chalk.hex('#7C3AED')('    brain fix --all --dry-run') + chalk.gray(' preview without applying\n'));
      return;
    }

    if (targets.length === 0) {
      console.log(chalk.yellow('\nNo matching vulnerabilities for the given filter.\n'));
      return;
    }

    console.log(chalk.hex('#7C3AED').bold(`\n🛡 BrainShield Fix — ${targets.length} issue${targets.length > 1 ? 's' : ''} to process\n`));

    const separator = chalk.hex('#4C1D95')('─'.repeat(64));
    let fixed = 0;
    let skipped = 0;

    for (const vuln of targets) {
      const filePath = join(cwd, vuln.file);

      console.log(separator);
      console.log(
        chalk.bold(`  [${vuln.severity === 'CRITICAL' ? chalk.red(vuln.severity) : chalk.hex('#F97316')(vuln.severity)}] `) +
        chalk.white(vuln.id) + ' — ' + chalk.white(vuln.title)
      );
      console.log(chalk.gray(`  ${vuln.file}${vuln.line ? `:${vuln.line}` : ''}\n`));

      // Dependency fixes (npm audit fix)
      if (vuln.category === 'Dependencies') {
        console.log(chalk.yellow('  ⚠ Dependency fix required:'));
        console.log(chalk.white(`  ${vuln.fix}`));
        if (!opts.dryRun) {
          console.log(chalk.gray('  Run the command above manually to apply this fix.'));
        }
        skipped++;
        console.log();
        continue;
      }

      if (!existsSync(filePath)) {
        console.log(chalk.yellow(`  ⚠ File not found: ${vuln.file}`));
        skipped++;
        console.log();
        continue;
      }

      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        console.log(chalk.red(`  ✗ Cannot read file: ${vuln.file}`));
        skipped++;
        console.log();
        continue;
      }

      // Try to generate a fix
      let fixedContent: string | null = null;

      if (vuln.autoFixable && vuln.snippet && vuln.fixCode) {
        // Direct replacement
        fixedContent = content.includes(vuln.snippet)
          ? content.replace(vuln.snippet, vuln.fixCode)
          : null;
      } else if (opts.ai) {
        // Claude AI fix
        console.log(chalk.hex('#A78BFA')('  🤖 Generating AI fix...'));
        const aiFixedContext = await generateFix(vuln, content);
        if (aiFixedContext) {
          fixedContent = applyLineFix(content, vuln, aiFixedContext);
        }
      }

      if (!fixedContent) {
        // Manual fix guidance
        console.log(chalk.yellow('  ⚠ Manual fix required:'));
        console.log(chalk.white('  ' + (vuln.fix ?? 'See vulnerability description.')));
        if (vuln.owasp) console.log(chalk.gray(`  Reference: ${vuln.owasp} — ${vuln.cwe ?? ''}`));
        skipped++;
        console.log();
        continue;
      }

      // Show diff
      const origLines = content.split('\n');
      const fixedLines = fixedContent.split('\n');
      const lineIdx = (vuln.line ?? 1) - 1;
      const ctxStart = Math.max(0, lineIdx - 2);
      const ctxEnd = Math.min(origLines.length, lineIdx + 3);

      console.log(chalk.gray('  Diff:\n'));
      origLines.slice(ctxStart, ctxEnd).forEach((line, i) => {
        const fixedLine = fixedLines[ctxStart + i];
        if (line !== fixedLine) {
          console.log(chalk.red(`  - ${line.trimEnd()}`));
          if (fixedLine !== undefined) console.log(chalk.green(`  + ${fixedLine.trimEnd()}`));
        } else {
          console.log(chalk.gray(`    ${line.trimEnd()}`));
        }
      });
      console.log();

      if (opts.dryRun) {
        console.log(chalk.yellow('  [dry-run] Not applied.\n'));
        continue;
      }

      const confirmed = opts.yes
        ? true
        : await askConfirm(chalk.hex('#7C3AED')('  Apply this fix? [Y/n] '));

      if (confirmed) {
        try {
          writeFileSync(filePath, fixedContent, 'utf-8');
          console.log(chalk.green('  ✓ Applied.\n'));
          fixed++;
        } catch (err) {
          console.log(chalk.red(`  ✗ Write failed: ${err instanceof Error ? err.message : String(err)}\n`));
          skipped++;
        }
      } else {
        console.log(chalk.gray('  Skipped.\n'));
        skipped++;
      }
    }

    console.log(separator);
    console.log(
      chalk.hex('#7C3AED').bold('\n  Summary: ') +
      chalk.green(`${fixed} fixed`) + '  ' +
      chalk.gray(`${skipped} skipped`)
    );

    if (fixed > 0) {
      console.log(chalk.gray('\n  Run `brain scan` to verify fixes and get an updated score.\n'));
    } else {
      console.log();
    }
  });
