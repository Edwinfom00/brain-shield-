import { readFileSync } from 'fs';
import { relative } from 'path';
import { nanoid } from 'nanoid';
import type { Agent, AgentResult, ScanContext, Vulnerability } from '../types.js';
import { askClaudeStructured } from '../../core/claude.js';
import { z } from 'zod';

const INJECTION_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: Vulnerability['severity'];
  cwe: string;
  owasp: string;
  fix: string;
}> = [
  // ── XSS ─────────────────────────────────────────────────────────────────
  {
    name: 'Reflected XSS via dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{[^}]*__html\s*:\s*(?!`[^`]*`)[^}]+\}\s*\}/g,
    severity: 'HIGH',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    fix: 'Sanitize HTML with DOMPurify before passing to dangerouslySetInnerHTML, or better — avoid it entirely and use React state.',
  },
  {
    name: 'XSS via innerHTML assignment',
    pattern: /\.innerHTML\s*=\s*(?!['"`]\s*['"`])[^;]+/g,
    severity: 'HIGH',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    fix: 'Use textContent instead of innerHTML, or sanitize with DOMPurify first.',
  },
  {
    name: 'XSS via document.write',
    pattern: /document\.write\s*\(/g,
    severity: 'HIGH',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    fix: 'Replace document.write() with DOM manipulation (createElement, appendChild) or React state.',
  },
  {
    name: 'Unescaped user input in template literal (potential XSS)',
    pattern: /res\.(?:send|end|write)\s*\(`[^`]*\$\{(?:req\.(?:body|query|params)|params|query|body)[^}]*\}[^`]*`\)/g,
    severity: 'CRITICAL',
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    fix: 'Never embed raw user input in HTML responses. Use a templating engine with auto-escaping, or encode with he.escape().',
  },

  // ── SQL Injection ────────────────────────────────────────────────────────
  {
    name: 'SQL Injection — string concatenation in query',
    pattern: /(?:query|execute|raw)\s*\(\s*[`'"](?:[^`'"]*)\$\{?(?:req\.|params\.|body\.|query\.|\w+Id|\w+Name)[^}`'"]*[}`'"]/g,
    severity: 'CRITICAL',
    cwe: 'CWE-89',
    owasp: 'A03:2021',
    fix: 'Use parameterized queries or prepared statements. Never concatenate user input into SQL strings.',
  },
  {
    name: 'SQL Injection — direct string interpolation',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|WHERE)[^;'"]*\+\s*(?:req\.|params\.|body\.|query\.|\w+Input|\w+Id)/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-89',
    owasp: 'A03:2021',
    fix: 'Use an ORM (Prisma, TypeORM) or parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [userId])',
  },

  // ── Command Injection ────────────────────────────────────────────────────
  {
    name: 'Command Injection via exec/execSync',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\(\s*[`'"]?[^'"` )]+\$\{?(?:req\.|params\.|body\.|query\.|\w+Input)[^}`'"]*[}`'"]/g,
    severity: 'CRITICAL',
    cwe: 'CWE-78',
    owasp: 'A03:2021',
    fix: 'Never pass user input to shell commands. Use child_process.spawn() with an array of arguments instead of shell interpolation.',
  },
  {
    name: 'eval() with dynamic input',
    pattern: /eval\s*\(\s*(?!['"`][^'"` ]+['"`]\s*\))[^)]+\)/g,
    severity: 'CRITICAL',
    cwe: 'CWE-95',
    owasp: 'A03:2021',
    fix: 'Never use eval(). If dynamic code execution is needed, use safer alternatives like Function() with strict input validation, or JSON.parse() for data.',
  },
  {
    name: 'new Function() with dynamic input',
    pattern: /new\s+Function\s*\([^)]*(?:req\.|params\.|body\.|query\.|\+)[^)]*\)/g,
    severity: 'CRITICAL',
    cwe: 'CWE-95',
    owasp: 'A03:2021',
    fix: 'Avoid new Function() with user-controlled input — it is equivalent to eval() and allows arbitrary code execution.',
  },

  // ── Path Traversal ───────────────────────────────────────────────────────
  {
    name: 'Path Traversal — unvalidated file path from user input',
    pattern: /(?:readFile|readFileSync|createReadStream|writeFile)\s*\([^)]*(?:req\.|params\.|body\.|query\.)[^)]*\)/g,
    severity: 'HIGH',
    cwe: 'CWE-22',
    owasp: 'A01:2021',
    fix: 'Validate file paths with path.resolve() and check they stay within the allowed base directory: if (!resolvedPath.startsWith(baseDir)) throw new Error("Access denied")',
  },
  {
    name: 'Open Redirect — unvalidated redirect URL',
    pattern: /res\.redirect\s*\(\s*(?:req\.|params\.|body\.|query\.)[^)]+\)/g,
    severity: 'MEDIUM',
    cwe: 'CWE-601',
    owasp: 'A01:2021',
    fix: 'Validate redirect URLs against an allowlist of trusted domains before redirecting.',
  },

  // ── Prototype Pollution ──────────────────────────────────────────────────
  {
    name: 'Prototype Pollution risk — merge/extend with user input',
    pattern: /Object\.assign\s*\(\s*(?:\{\}|target|\w+)\s*,\s*(?:req\.|body\.|query\.|params\.)[^)]+\)/g,
    severity: 'HIGH',
    cwe: 'CWE-1321',
    owasp: 'A08:2021',
    fix: 'Never merge untrusted data directly into objects. Use a safe merge library or validate/sanitize input first. Consider using structuredClone().',
  },

  // ── ReDoS ────────────────────────────────────────────────────────────────
  {
    name: 'Potentially catastrophic regex (ReDoS risk)',
    pattern: /new\s+RegExp\s*\(\s*(?:req\.|body\.|query\.|params\.)[^)]+\)/g,
    severity: 'MEDIUM',
    cwe: 'CWE-1333',
    owasp: 'A06:2021',
    fix: 'Never construct RegExp from user input without strict validation. Use a safe-regex library to check patterns.',
  },
];

const SKIP_PATTERNS = ['.test.', '.spec.', '.mock.', '__mocks__', 'fixtures'];

const VulnEnrichmentSchema = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      confirmed: z.boolean(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
      fix: z.string(),
      cwe: z.string().optional(),
    })
  ),
});

export class InjectionScanner implements Agent {
  id = 'injection-scanner';
  name = 'XSS & Injection Scanner';

  async run(context: ScanContext): Promise<AgentResult> {
    const start = Date.now();
    const raw: Vulnerability[] = [];

    for (const filePath of context.files) {
      if (SKIP_PATTERNS.some((p) => filePath.includes(p))) continue;

      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      const relPath = relative(context.cwd, filePath);

      for (const rule of INJECTION_PATTERNS) {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lines = content.split('\n');
          const sliceStart = Math.max(0, lineNumber - 2);
          const snippet = lines
            .slice(sliceStart, lineNumber + 1)
            .map((l, i) => `${sliceStart + i + 1} | ${l}`)
            .join('\n');

          raw.push({
            id: `INJ-${nanoid(6).toUpperCase()}`,
            title: rule.name,
            description: `${rule.name} — potential injection vulnerability detected.`,
            severity: rule.severity,
            category: 'Injection',
            file: relPath,
            line: lineNumber,
            snippet,
            fix: rule.fix,
            cwe: rule.cwe,
            owasp: rule.owasp,
            autoFixable: false,
          });

          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      }
    }

    const deduped = dedup(raw);
    const enriched =
      deduped.length > 0 && deduped.length <= 15
        ? await this.enrich(deduped, context)
        : deduped;

    return {
      agentId: this.id,
      agentName: this.name,
      vulnerabilities: enriched,
      duration: Date.now() - start,
    };
  }

  private async enrich(vulns: Vulnerability[], context: ScanContext): Promise<Vulnerability[]> {
    try {
      const summary = vulns
        .map((v) => `title: "${v.title}"\nfile: ${v.file}:${v.line}\nsnippet:\n${v.snippet}`)
        .join('\n\n---\n\n');

      const result = await askClaudeStructured(
        `Review these injection/XSS vulnerability findings in a ${context.projectType} project (${context.framework ?? 'unknown'}).
Confirm which are real vulnerabilities vs false positives, and provide specific fixes.

${summary}

Return JSON with a "findings" array. Each item: title, confirmed (bool), severity, fix, cwe (optional).`,
        'You are an expert in web application injection vulnerabilities (OWASP Top 10). Be precise.',
        VulnEnrichmentSchema
      );

      return vulns
        .map((v) => {
          const enrichment = result.findings.find((f) =>
            f.title.toLowerCase().includes(v.title.toLowerCase().slice(0, 20))
          );
          if (!enrichment || !enrichment.confirmed) return { ...v, severity: 'INFO' as const };
          return {
            ...v,
            severity: enrichment.severity,
            fix: enrichment.fix || v.fix,
            cwe: enrichment.cwe || v.cwe,
          };
        })
        .filter((v) => v.severity !== 'INFO');
    } catch {
      return vulns;
    }
  }
}

function dedup(vulns: Vulnerability[]): Vulnerability[] {
  const seen = new Set<string>();
  return vulns.filter((v) => {
    const key = `${v.file}:${v.line}:${v.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
