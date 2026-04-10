import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';
import type { Agent, AgentResult, ScanContext, Vulnerability } from '../types.js';
import { askClaudeStructured } from '../../core/claude.js';
import { z } from 'zod';

// ── npm audit output types ──────────────────────────────────────────────────

interface NpmAuditVuln {
  name: string;
  severity: string;
  via: Array<string | { title?: string; url?: string; cwe?: string[] }>;
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: boolean | { name: string; version: string; isSemVerMajor: boolean };
}

interface NpmAuditOutput {
  auditReportVersion: number;
  vulnerabilities: Record<string, NpmAuditVuln>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

// ── Claude enrichment schema ────────────────────────────────────────────────

const DepEnrichmentSchema = z.object({
  packages: z.array(
    z.object({
      name: z.string(),
      realWorldImpact: z.string(),
      exploitLikelihood: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      fix: z.string(),
      urgency: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    })
  ),
});

// ── Severity mapping ────────────────────────────────────────────────────────

function mapSeverity(npmSeverity: string): Vulnerability['severity'] {
  switch (npmSeverity.toLowerCase()) {
    case 'critical': return 'CRITICAL';
    case 'high':     return 'HIGH';
    case 'moderate': return 'MEDIUM';
    case 'low':      return 'LOW';
    default:         return 'INFO';
  }
}

// ── Agent ───────────────────────────────────────────────────────────────────

export class DependencyScanner implements Agent {
  id = 'deps-scanner';
  name = 'Dependency CVE Scanner';

  async run(context: ScanContext): Promise<AgentResult> {
    const start = Date.now();

    // Only run if package.json exists
    const pkgPath = join(context.cwd, 'package.json');
    if (!existsSync(pkgPath)) {
      return { agentId: this.id, agentName: this.name, vulnerabilities: [], duration: 0 };
    }

    // Run npm audit
    let auditOutput: NpmAuditOutput | null = null;
    try {
      const raw = execSync('npm audit --json --audit-level=info', {
        cwd: context.cwd,
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).toString();
      auditOutput = JSON.parse(raw) as NpmAuditOutput;
    } catch (err) {
      // npm audit exits with non-zero if vulnerabilities found — output is still valid JSON
      const output = (err as { stdout?: Buffer }).stdout?.toString();
      if (output) {
        try {
          auditOutput = JSON.parse(output) as NpmAuditOutput;
        } catch {
          return {
            agentId: this.id,
            agentName: this.name,
            vulnerabilities: [],
            duration: Date.now() - start,
            error: 'npm audit failed or no package-lock.json found. Run `npm install` first.',
          };
        }
      }
    }

    if (!auditOutput || !auditOutput.vulnerabilities) {
      return { agentId: this.id, agentName: this.name, vulnerabilities: [], duration: Date.now() - start };
    }

    // Convert audit findings to Vulnerability objects
    const raw: Vulnerability[] = [];
    for (const [pkgName, vuln] of Object.entries(auditOutput.vulnerabilities)) {
      const severity = mapSeverity(vuln.severity);
      if (severity === 'INFO') continue; // Skip info-level

      const cveRefs = vuln.via
        .filter((v): v is { title?: string; url?: string; cwe?: string[] } => typeof v === 'object')
        .map((v) => v.title ?? '')
        .filter(Boolean)
        .join(', ');

      const cweList = vuln.via
        .filter((v): v is { cwe?: string[] } => typeof v === 'object' && Array.isArray(v.cwe))
        .flatMap((v) => v.cwe ?? [])
        .join(', ');

      const fixInfo = vuln.fixAvailable;
      const fixText = fixInfo === true
        ? `Run: npm audit fix`
        : typeof fixInfo === 'object'
        ? `Run: npm install ${fixInfo.name}@${fixInfo.version}${fixInfo.isSemVerMajor ? ' (breaking change — test thoroughly)' : ''}`
        : 'No automatic fix available — check for alternative packages or manual patches.';

      raw.push({
        id: `DEP-${nanoid(6).toUpperCase()}`,
        title: `Vulnerable dependency: ${pkgName}`,
        description: cveRefs
          ? `${pkgName} (${vuln.range}) has known vulnerabilities: ${cveRefs}`
          : `${pkgName} (${vuln.range}) has ${vuln.severity} severity vulnerabilities.`,
        severity,
        category: 'Dependencies',
        file: 'package.json',
        snippet: `${pkgName}@${vuln.range}`,
        fix: fixText,
        cwe: cweList || undefined,
        owasp: 'A06:2021',
        autoFixable: fixInfo === true,
      });
    }

    // Enrich critical/high findings with Claude
    const toEnrich = raw.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH');
    const enriched = toEnrich.length > 0 && toEnrich.length <= 10
      ? await this.enrich(raw, toEnrich, context)
      : raw;

    return {
      agentId: this.id,
      agentName: this.name,
      vulnerabilities: enriched,
      duration: Date.now() - start,
    };
  }

  private async enrich(
    all: Vulnerability[],
    critical: Vulnerability[],
    context: ScanContext
  ): Promise<Vulnerability[]> {
    try {
      const pkgJson = context.packageJson ?? {};
      const deps = Object.keys({
        ...(pkgJson.dependencies as Record<string, string> ?? {}),
        ...(pkgJson.devDependencies as Record<string, string> ?? {}),
      });

      const summary = critical
        .map((v) => `Package: ${v.title.replace('Vulnerable dependency: ', '')}\nSeverity: ${v.severity}\nDescription: ${v.description}`)
        .join('\n\n');

      const result = await askClaudeStructured(
        `These npm packages have known security vulnerabilities in a ${context.projectType} project.

${summary}

Project dependencies include: ${deps.slice(0, 20).join(', ')}

For each package, explain:
1. The real-world impact if exploited in this type of project
2. How likely it is to be actively exploited
3. The specific fix action
4. Urgency level

Return JSON with a "packages" array.`,
        'You are an expert in npm ecosystem security and CVE analysis. Be concise and practical.',
        DepEnrichmentSchema
      );

      // Merge Claude insights into findings
      return all.map((v) => {
        const pkgName = v.title.replace('Vulnerable dependency: ', '').split('@')[0];
        const insight = result.packages.find((p) =>
          p.name.toLowerCase().includes(pkgName.toLowerCase())
        );

        if (!insight) return v;

        return {
          ...v,
          severity: insight.urgency,
          description: `${v.description}\n\nImpact: ${insight.realWorldImpact}\nExploit likelihood: ${insight.exploitLikelihood}`,
          fix: insight.fix || v.fix,
        };
      });
    } catch {
      return all;
    }
  }
}
