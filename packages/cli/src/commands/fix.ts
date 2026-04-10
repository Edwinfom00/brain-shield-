import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { loadLatestReport } from '../core/reports.js';
import type { Vulnerability } from '../agents/types.js';

export const fixCommand = new Command('fix')
  .description('Apply security fixes from the last scan')
  .argument('[id]', 'Vulnerability ID to fix (e.g. SEC-ABC123)')
  .option('--all', 'Apply all auto-fixable vulnerabilities')
  .option('--critical', 'Apply all CRITICAL fixes')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--dry-run', 'Preview fixes without applying')
  .action(async (id: string | undefined, opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    const report = await loadLatestReport(cwd);
    if (!report) {
      console.error(chalk.red('No scan report found. Run `brain scan` first.'));
      process.exit(1);
    }

    let targets: Vulnerability[] = [];

    if (id) {
      const vuln = report.vulnerabilities.find((v) => v.id === id);
      if (!vuln) {
        console.error(chalk.red(`Vulnerability ${id} not found.`));
        process.exit(1);
      }
      targets = [vuln];
    } else if (opts.all) {
      targets = report.vulnerabilities.filter((v) => v.autoFixable);
    } else if (opts.critical) {
      targets = report.vulnerabilities.filter(
        (v) => v.severity === 'CRITICAL' && v.autoFixable
      );
    } else {
      console.error(
        chalk.yellow('Specify a vulnerability ID, --all, or --critical.\n') +
        chalk.white('Run `brain scan` to see vulnerability IDs.')
      );
      process.exit(1);
    }

    if (targets.length === 0) {
      console.log(chalk.green('No auto-fixable vulnerabilities found for the given filter.'));
      return;
    }

    console.log(chalk.cyan(`\n🛡 BrainShield Fix — ${targets.length} fix(es) to apply\n`));

    for (const vuln of targets) {
      const filePath = join(cwd, vuln.file);

      if (!existsSync(filePath)) {
        console.log(chalk.yellow(`  ⚠ Skipping ${vuln.id}: file not found (${vuln.file})`));
        continue;
      }

      if (!vuln.snippet || !vuln.fixCode) {
        console.log(
          chalk.yellow(`  ⚠ ${vuln.id} (${vuln.title}) — manual fix required:`),
          chalk.white('\n    ' + (vuln.fix ?? 'See vulnerability description.'))
        );
        continue;
      }

      console.log(chalk.bold(`\n  [${vuln.severity}] ${vuln.id} — ${vuln.title}`));
      console.log(chalk.gray(`  File: ${vuln.file}:${vuln.line}`));
      console.log(chalk.red('  Before:'));
      console.log('  ' + vuln.snippet.split('\n').join('\n  '));
      console.log(chalk.green('  After:'));
      console.log('  ' + vuln.fixCode.split('\n').join('\n  '));

      if (opts.dryRun) {
        console.log(chalk.yellow('  [dry-run] Not applied.'));
        continue;
      }

      try {
        const content = readFileSync(filePath, 'utf-8');
        // Simple replacement — Phase 2 will use AST-based patching
        const fixed = content.replace(vuln.snippet, vuln.fixCode);
        if (fixed === content) {
          console.log(chalk.yellow('  ⚠ Could not locate the exact snippet. Manual fix required.'));
          continue;
        }
        writeFileSync(filePath, fixed, 'utf-8');
        console.log(chalk.green('  ✓ Applied.'));
      } catch (err) {
        console.log(
          chalk.red(`  ✗ Failed: ${err instanceof Error ? err.message : String(err)}`)
        );
      }
    }

    console.log('\n' + chalk.cyan('Done. Run `brain scan` to verify fixes.'));
  });
