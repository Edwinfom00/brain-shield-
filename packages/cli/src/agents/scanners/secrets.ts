import { readFileSync } from 'fs';
import { relative } from 'path';
import { nanoid } from 'nanoid';
import type { Agent, AgentResult, ScanContext, Vulnerability } from '../types.js';
import { askClaude } from '../../core/claude.js';

/**
 * Static regex patterns for common secrets.
 * These run locally without any API call for speed and privacy.
 */
const SECRET_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: Vulnerability['severity'];
  cwe: string;
  owasp: string;
}> = [
  {
    name: 'Hardcoded API Key (generic)',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"`]([A-Za-z0-9_\-]{16,})['"` ]/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-[A-Za-z0-9\-_]{40,}/g,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'OpenAI API Key',
    pattern: /sk-[A-Za-z0-9]{32,}/g,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[A-Za-z0-9]{36}/g,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[A-Za-z0-9]{24,}/g,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'Stripe Test Key (exposed in prod code)',
    pattern: /sk_test_[A-Za-z0-9]{24,}/g,
    severity: 'HIGH',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
  },
  {
    name: 'JWT Secret hardcoded',
    pattern: /(?:jwt[_-]?secret|jwt[_-]?key)\s*[:=]\s*['"`]([^'"` ]{8,})['"` ]/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    owasp: 'A02:2021',
  },
  {
    name: 'Database connection string',
    pattern: /(?:mongodb|postgresql|mysql|redis):\/\/[^\s'"` ]+/gi,
    severity: 'HIGH',
    cwe: 'CWE-312',
    owasp: 'A07:2021',
  },
  {
    name: 'Password hardcoded',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`]([^'"` ]{6,})['"` ]/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-259',
    owasp: 'A07:2021',
  },
  {
    name: 'Private key block',
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    cwe: 'CWE-321',
    owasp: 'A02:2021',
  },
  {
    name: 'process.env missing (direct string fallback)',
    pattern: /process\.env\.\w+\s*\|\|\s*['"`][A-Za-z0-9_\-]{8,}['"` ]/g,
    severity: 'MEDIUM',
    cwe: 'CWE-547',
    owasp: 'A05:2021',
  },
];

/** Skip files that legitimately contain these patterns */
const SKIP_PATTERNS = ['.test.', '.spec.', '.mock.', '__mocks__', 'fixtures'];

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((p) => filePath.includes(p));
}

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

function getSnippet(content: string, lineNumber: number): string {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - 2);
  const end = Math.min(lines.length, lineNumber + 1);
  return lines
    .slice(start, end)
    .map((l, i) => `${start + i + 1} | ${l}`)
    .join('\n');
}

export class SecretsScanner implements Agent {
  id = 'secrets-scanner';
  name = 'Secrets & Keys Scanner';

  async run(context: ScanContext): Promise<AgentResult> {
    const start = Date.now();
    const vulnerabilities: Vulnerability[] = [];

    for (const filePath of context.files) {
      if (shouldSkipFile(filePath)) continue;

      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      const relPath = relative(context.cwd, filePath);

      for (const rule of SECRET_PATTERNS) {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          const lineNumber = getLineNumber(content, match.index);
          const snippet = getSnippet(content, lineNumber);

          vulnerabilities.push({
            id: `SEC-${nanoid(6).toUpperCase()}`,
            title: rule.name,
            description: `A ${rule.name.toLowerCase()} was found hardcoded in source code. Secrets should never be committed to version control.`,
            severity: rule.severity,
            category: 'Secrets',
            file: relPath,
            line: lineNumber,
            snippet,
            fix: 'Move this value to an environment variable and access it via process.env. Add this key to .gitignore via a .env file.',
            cwe: rule.cwe,
            owasp: rule.owasp,
            autoFixable: false,
          });

          // Avoid looping on zero-width matches
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      }
    }

    // If static analysis found findings, ask Claude to validate and enrich them
    let enrichedVulns = vulnerabilities;
    if (vulnerabilities.length > 0 && vulnerabilities.length <= 20) {
      try {
        enrichedVulns = await this.enrichWithClaude(vulnerabilities, context);
      } catch {
        // Claude enrichment is best-effort — static results are still valid
      }
    }

    return {
      agentId: this.id,
      agentName: this.name,
      vulnerabilities: enrichedVulns,
      duration: Date.now() - start,
    };
  }

  private async enrichWithClaude(
    vulns: Vulnerability[],
    context: ScanContext
  ): Promise<Vulnerability[]> {
    const summary = vulns
      .map((v) => `[${v.severity}] ${v.title} in ${v.file}:${v.line}\nSnippet:\n${v.snippet}`)
      .join('\n\n');

    const prompt = `You are a security expert reviewing findings from a static analysis scan.
Review these potential secret/credential leaks and for each one:
1. Confirm if it's a real finding or a false positive
2. Provide a specific, actionable fix suggestion if real

Findings:
${summary}

Project type: ${context.projectType}
Framework: ${context.framework ?? 'unknown'}

For each finding, respond with whether it's valid and improve the fix suggestion if needed.
Keep your response concise and focused on actionable fixes.`;

    const systemPrompt =
      'You are a security expert specializing in secret management and credential security for JavaScript/TypeScript projects. Be concise and practical.';

    const response = await askClaude(prompt, systemPrompt);

    // Append Claude's analysis to the fix field of the first vuln as a summary
    // (Full structured enrichment comes in Phase 2)
    if (vulns.length > 0) {
      return vulns.map((v, i) =>
        i === 0
          ? { ...v, fix: `${v.fix}\n\nAI Analysis:\n${response.slice(0, 400)}` }
          : v
      );
    }

    return vulns;
  }
}
