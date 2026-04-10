import { readFileSync } from 'fs';
import { relative } from 'path';
import { nanoid } from 'nanoid';
import type { Agent, AgentResult, ScanContext, Vulnerability } from '../types.js';
import { askClaudeStructured } from '../../core/claude.js';
import { z } from 'zod';

const AUTH_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: Vulnerability['severity'];
  cwe: string;
  owasp: string;
  fix: string;
}> = [
  {
    name: 'JWT verified without algorithm check',
    pattern: /jwt\.verify\s*\([^,]+,\s*[^,]+\s*\)/g,
    severity: 'HIGH',
    cwe: 'CWE-347',
    owasp: 'A02:2021',
    fix: 'Always specify allowed algorithms: jwt.verify(token, secret, { algorithms: ["HS256"] })',
  },
  {
    name: 'JWT signed with weak algorithm (none/HS256 hardcoded)',
    pattern: /jwt\.sign\s*\([^)]+algorithm\s*:\s*['"`](?:none|HS1)['"` ]/gi,
    severity: 'CRITICAL',
    cwe: 'CWE-327',
    owasp: 'A02:2021',
    fix: 'Use RS256 or HS256 with a strong secret (>= 256 bits). Never use "none".',
  },
  {
    name: 'Missing authentication middleware on route',
    pattern: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`][^'"` ]+['"`]\s*,\s*(?:async\s*)?\([^)]*req[^)]*\)/gi,
    severity: 'MEDIUM',
    cwe: 'CWE-306',
    owasp: 'A01:2021',
    fix: 'Add authentication middleware before the route handler: router.get("/path", authMiddleware, handler)',
  },
  {
    name: 'Password compared without constant-time check',
    pattern: /(?:password|passwd)\s*===?\s*|===?\s*(?:password|passwd)/gi,
    severity: 'HIGH',
    cwe: 'CWE-208',
    owasp: 'A02:2021',
    fix: 'Use crypto.timingSafeEqual() or bcrypt.compare() for password comparison to prevent timing attacks.',
  },
  {
    name: 'bcrypt with weak cost factor',
    pattern: /bcrypt\.(?:hash|genSalt)\s*\([^,]+,\s*([1-9])\s*[,)]/g,
    severity: 'MEDIUM',
    cwe: 'CWE-916',
    owasp: 'A02:2021',
    fix: 'Use a bcrypt cost factor of at least 12: bcrypt.hash(password, 12)',
  },
  {
    name: 'Cookie without HttpOnly or Secure flag',
    pattern: /(?:res\.cookie|setCookie)\s*\([^)]+\)/g,
    severity: 'MEDIUM',
    cwe: 'CWE-1004',
    owasp: 'A05:2021',
    fix: 'Set HttpOnly and Secure flags on cookies: res.cookie("token", value, { httpOnly: true, secure: true, sameSite: "strict" })',
  },
  {
    name: 'Session secret hardcoded or too short',
    pattern: /session\s*\([^)]*secret\s*:\s*['"`](?:[^'"` ]{0,15})['"` ]/gi,
    severity: 'HIGH',
    cwe: 'CWE-798',
    owasp: 'A07:2021',
    fix: 'Use a strong random secret from environment: secret: process.env.SESSION_SECRET',
  },
  {
    name: 'Missing CSRF protection',
    pattern: /(?:app|router)\.(post|put|patch|delete)\s*\(\s*['"`][^'"` ]+['"`]/gi,
    severity: 'MEDIUM',
    cwe: 'CWE-352',
    owasp: 'A01:2021',
    fix: 'Add CSRF protection middleware (e.g. csurf or implement SameSite cookie policy).',
  },
  {
    name: 'Auth bypass via type coercion',
    pattern: /if\s*\(\s*(?:req\.user|user|isAuth|authenticated)\s*==\s*(?:true|1|'true')\s*\)/gi,
    severity: 'HIGH',
    cwe: 'CWE-284',
    owasp: 'A01:2021',
    fix: 'Use strict equality (===) for authentication checks to prevent type coercion bypass.',
  },
  {
    name: 'Token stored in localStorage (XSS-vulnerable)',
    pattern: /localStorage\.setItem\s*\([^)]*(?:token|jwt|auth)[^)]*\)/gi,
    severity: 'HIGH',
    cwe: 'CWE-922',
    owasp: 'A02:2021',
    fix: 'Store tokens in HttpOnly cookies instead of localStorage — localStorage is accessible via XSS.',
  },
];

const SKIP_PATTERNS = ['.test.', '.spec.', '.mock.', '__mocks__', 'fixtures', '.stories.'];

const VulnEnrichmentSchema = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      confirmed: z.boolean(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
      fix: z.string(),
    })
  ),
});

export class AuthScanner implements Agent {
  id = 'auth-scanner';
  name = 'Auth & Session Scanner';

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

      for (const rule of AUTH_PATTERNS) {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lines = content.split('\n');
          const start = Math.max(0, lineNumber - 2);
          const snippet = lines.slice(start, lineNumber + 1).map((l, i) => `${start + i + 1} | ${l}`).join('\n');

          raw.push({
            id: `AUTH-${nanoid(6).toUpperCase()}`,
            title: rule.name,
            description: `${rule.name} detected in source code.`,
            severity: rule.severity,
            category: 'Authentication',
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
    const enriched = deduped.length > 0 && deduped.length <= 15
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
        .map((v) => `title: "${v.title}"\nsnippet:\n${v.snippet}`)
        .join('\n\n---\n\n');

      const result = await askClaudeStructured(
        `Review these authentication security findings in a ${context.projectType} project (${context.framework ?? 'unknown framework'}).
For each finding, confirm if it's a real vulnerability or a false positive, adjust severity if needed, and provide a specific actionable fix.

Findings:
${summary}

Return a JSON object with a "findings" array. Each item must have:
- title (string matching original)
- confirmed (boolean)
- severity ("CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"INFO")
- fix (string — specific actionable fix for this code)`,
        'You are an expert in web application authentication security. Be precise and concise.',
        VulnEnrichmentSchema
      );

      return vulns.map((v) => {
        const enrichment = result.findings.find(
          (f) => f.title.toLowerCase().includes(v.title.toLowerCase().slice(0, 20))
        );
        if (!enrichment || !enrichment.confirmed) return { ...v, severity: 'INFO' as const };
        return {
          ...v,
          severity: enrichment.severity,
          fix: enrichment.fix || v.fix,
        };
      }).filter((v) => v.severity !== 'INFO');
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
