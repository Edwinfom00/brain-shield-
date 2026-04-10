import { readFileSync } from 'fs';
import { relative } from 'path';
import { nanoid } from 'nanoid';
import type { Agent, AgentResult, ScanContext, Vulnerability } from '../types.js';
import { askClaudeStructured } from '../../core/claude.js';
import { z } from 'zod';

const API_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: Vulnerability['severity'];
  cwe: string;
  owasp: string;
  fix: string;
}> = [
  // ── CORS ────────────────────────────────────────────────────────────────
  {
    name: 'CORS wildcard origin (allows any domain)',
    pattern: /(?:cors|Access-Control-Allow-Origin)\s*[:(]\s*['"`]\*['"`]/g,
    severity: 'HIGH',
    cwe: 'CWE-942',
    owasp: 'A05:2021',
    fix: 'Restrict CORS to specific trusted origins: cors({ origin: ["https://yourdomain.com"] }). Never use "*" in production with credentials.',
  },
  {
    name: 'CORS with credentials + wildcard (critical misconfiguration)',
    pattern: /credentials\s*:\s*true[^}]*origin\s*:\s*['"`]\*['"`]|origin\s*:\s*['"`]\*['"`][^}]*credentials\s*:\s*true/g,
    severity: 'CRITICAL',
    cwe: 'CWE-942',
    owasp: 'A05:2021',
    fix: 'CORS with credentials: true and origin: "*" is rejected by browsers but indicates a misconfiguration. Set a specific origin allowlist.',
  },
  {
    name: 'CORS reflecting request origin without validation',
    pattern: /(?:Access-Control-Allow-Origin|origin)\s*[:=]\s*req\.(?:headers?\.origin|get\s*\(['"`]origin['"`]\))/gi,
    severity: 'HIGH',
    cwe: 'CWE-942',
    owasp: 'A05:2021',
    fix: 'Validate the request origin against an allowlist before reflecting it: const allowed = ["https://app.com"]; if (allowed.includes(req.headers.origin)) ...',
  },

  // ── Rate Limiting ────────────────────────────────────────────────────────
  {
    name: 'No rate limiting on auth endpoint',
    pattern: /(?:router|app)\.(post|get)\s*\(\s*['"`](?:[^'"` ]*(?:login|signin|auth|token|password)[^'"` ]*)['"` ]/gi,
    severity: 'HIGH',
    cwe: 'CWE-307',
    owasp: 'A07:2021',
    fix: 'Add rate limiting to auth endpoints: import rateLimit from "express-rate-limit"; const limiter = rateLimit({ windowMs: 15*60*1000, max: 10 }); app.use("/auth", limiter)',
  },
  {
    name: 'No rate limiting on API routes',
    pattern: /(?:router|app)\.(post|put|patch|delete)\s*\(\s*['"`]\/api\//gi,
    severity: 'MEDIUM',
    cwe: 'CWE-770',
    owasp: 'A04:2021',
    fix: 'Apply rate limiting to API routes to prevent abuse and DoS attacks.',
  },

  // ── Exposed Sensitive Endpoints ──────────────────────────────────────────
  {
    name: 'Debug/admin endpoint exposed without auth check',
    pattern: /(?:router|app)\.(?:get|post|all)\s*\(\s*['"`](?:[^'"` ]*(?:debug|admin|internal|health|metrics|status)[^'"` ]*)['"` ]\s*,\s*(?:async\s*)?\((?!.*(?:auth|middleware|protect))/gi,
    severity: 'HIGH',
    cwe: 'CWE-284',
    owasp: 'A01:2021',
    fix: 'Protect debug and admin endpoints with authentication middleware. Consider moving them behind a VPN or restricting by IP.',
  },
  {
    name: 'Stack trace / error details exposed to client',
    pattern: /res\.(?:json|send)\s*\([^)]*(?:err\.stack|error\.stack|err\.message)[^)]*\)/g,
    severity: 'MEDIUM',
    cwe: 'CWE-209',
    owasp: 'A05:2021',
    fix: 'Never send stack traces or internal error details to the client. Log internally and send a generic error message: res.status(500).json({ error: "Internal server error" })',
  },

  // ── Missing Security Headers ─────────────────────────────────────────────
  {
    name: 'Missing security headers (no helmet.js)',
    pattern: /(?:express|app)\s*\(\s*\)(?![^;]*helmet)/g,
    severity: 'MEDIUM',
    cwe: 'CWE-16',
    owasp: 'A05:2021',
    fix: 'Add helmet.js to set security headers: import helmet from "helmet"; app.use(helmet());',
  },

  // ── HTTP Methods ────────────────────────────────────────────────────────
  {
    name: 'HTTP TRACE method enabled',
    pattern: /app\.trace\s*\(/g,
    severity: 'MEDIUM',
    cwe: 'CWE-16',
    owasp: 'A05:2021',
    fix: 'Disable HTTP TRACE method. It can be used in Cross-Site Tracing (XST) attacks.',
  },

  // ── Mass Assignment ──────────────────────────────────────────────────────
  {
    name: 'Mass assignment — spreading full request body into DB operation',
    pattern: /(?:create|update|save|insert)\s*\(\s*\{?\s*\.\.\.\s*req\.body\s*\}?\s*\)/g,
    severity: 'HIGH',
    cwe: 'CWE-915',
    owasp: 'A03:2021',
    fix: 'Never spread the entire req.body into database operations. Explicitly pick allowed fields: const { name, email } = req.body; create({ name, email })',
  },

  // ── Insecure Direct Object Reference ─────────────────────────────────────
  {
    name: 'IDOR risk — user ID taken from request without ownership check',
    pattern: /(?:findById|findOne|update|delete)\s*\([^)]*(?:req\.params\.id|req\.params\.userId|params\.id)[^)]*\)(?![^;]*(?:user\.id|userId|ownerId))/g,
    severity: 'HIGH',
    cwe: 'CWE-639',
    owasp: 'A01:2021',
    fix: 'Always verify resource ownership: const resource = await find(id); if (resource.userId !== req.user.id) throw new ForbiddenError()',
  },

  // ── Next.js specific ─────────────────────────────────────────────────────
  {
    name: 'Next.js API route missing method check',
    pattern: /export\s+(?:default\s+)?(?:async\s+)?function\s+handler\s*\(\s*req[^)]*\)[^{]*\{(?![^}]*req\.method)/g,
    severity: 'MEDIUM',
    cwe: 'CWE-436',
    owasp: 'A05:2021',
    fix: 'Check HTTP method in Next.js API routes: if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })',
  },
  {
    name: 'Next.js server action without CSRF protection',
    pattern: /'use server'[^;]*;\s*export\s+(?:async\s+)?function/g,
    severity: 'MEDIUM',
    cwe: 'CWE-352',
    owasp: 'A01:2021',
    fix: 'Next.js server actions have built-in CSRF protection in v14+. Ensure you are on Next.js 14+ and not disabling CSRF checks.',
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
    })
  ),
});

export class ApiScanner implements Agent {
  id = 'api-scanner';
  name = 'API Security Scanner';

  async run(context: ScanContext): Promise<AgentResult> {
    const start = Date.now();
    const raw: Vulnerability[] = [];

    // Prioritize API route files for scan
    const apiFiles = context.files.filter((f) =>
      f.includes('/api/') || f.includes('/routes/') ||
      f.includes('/pages/') || f.includes('/app/') ||
      f.includes('server') || f.includes('index')
    );

    const filesToScan = apiFiles.length > 0 ? apiFiles : context.files;

    for (const filePath of filesToScan) {
      if (SKIP_PATTERNS.some((p) => filePath.includes(p))) continue;

      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      const relPath = relative(context.cwd, filePath);

      for (const rule of API_PATTERNS) {
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
            id: `API-${nanoid(6).toUpperCase()}`,
            title: rule.name,
            description: `${rule.name} — API security issue detected.`,
            severity: rule.severity,
            category: 'API Security',
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
        `Review these API security findings in a ${context.projectType} project (${context.framework ?? 'unknown'}).
Confirm which are real vulnerabilities vs false positives. Provide specific, actionable fixes.

${summary}

Return JSON with a "findings" array. Each: title, confirmed (bool), severity, fix.`,
        'You are an expert in API security, REST security, and web application security. Be precise and practical.',
        VulnEnrichmentSchema
      );

      return vulns
        .map((v) => {
          const enrichment = result.findings.find((f) =>
            f.title.toLowerCase().includes(v.title.toLowerCase().slice(0, 20))
          );
          if (!enrichment || !enrichment.confirmed) return { ...v, severity: 'INFO' as const };
          return { ...v, severity: enrichment.severity, fix: enrichment.fix || v.fix };
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
