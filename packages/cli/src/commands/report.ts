import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { loadLatestReport } from '../core/reports.js';
import type { ScanReport, Vulnerability } from '../agents/types.js';

export const reportCommand = new Command('report')
  .description('Export the latest scan report')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--json', 'Export as JSON (default)')
  .option('--md', 'Export as Markdown')
  .option('-o, --output <file>', 'Output file path')
  .action(async (opts) => {
    const cwd: string = opts.dir ?? process.cwd();
    const report = await loadLatestReport(cwd);

    if (!report) {
      console.error(chalk.red('No scan report found. Run `brain scan` first.'));
      process.exit(1);
      return;
    }

    const ext = opts.md ? 'md' : 'json';
    const outputPath: string =
      opts.output ?? join(cwd, '.brainsield', `report-${report.id}.${ext}`);

    if (opts.md) {
      const md = buildMarkdownReport(report);
      writeFileSync(outputPath, md, 'utf-8');
    } else {
      writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    }

    console.log(chalk.green(`✓ Report exported to: ${outputPath}`));
  });

function buildMarkdownReport(report: ScanReport): string {
  const { vulnerabilities: vulns, score } = report;

  const countBy = (sev: string) => vulns.filter((v: Vulnerability) => v.severity === sev).length;

  const lines: string[] = [
    `# BrainShield Security Report`,
    ``,
    `**Date:** ${new Date(report.timestamp).toLocaleString()}  `,
    `**Project:** ${report.cwd}  `,
    `**Type:** ${report.projectType}  `,
    `**Files Scanned:** ${report.filesScanned}  `,
    `**Duration:** ${report.duration}ms`,
    ``,
    `## Security Score: ${score}/100`,
    ``,
    `| Severity | Count |`,
    `|---|---|`,
    `| 🔴 CRITICAL | ${countBy('CRITICAL')} |`,
    `| 🟠 HIGH     | ${countBy('HIGH')} |`,
    `| 🟡 MEDIUM   | ${countBy('MEDIUM')} |`,
    `| 🔵 LOW      | ${countBy('LOW')} |`,
    ``,
    `## Vulnerabilities`,
    ``,
  ];

  for (const vuln of vulns) {
    lines.push(
      `### [${vuln.severity}] ${vuln.id} — ${vuln.title}`,
      ``,
      `- **File:** \`${vuln.file}\`${vuln.line ? `:${vuln.line}` : ''}`,
      `- **Category:** ${vuln.category}`,
      ...(vuln.cwe ? [`- **CWE:** ${vuln.cwe}`] : []),
      ...(vuln.owasp ? [`- **OWASP:** ${vuln.owasp}`] : []),
      ``,
      vuln.description,
      ``,
      ...(vuln.snippet ? [`\`\`\`\n${vuln.snippet}\n\`\`\``] : []),
      ``,
      ...(vuln.fix ? [`**Fix:** ${vuln.fix}`] : []),
      ``,
      `---`,
      ``,
    );
  }

  return lines.join('\n');
}
