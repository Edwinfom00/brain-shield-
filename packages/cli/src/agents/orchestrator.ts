import type { Agent, AgentResult, ScanContext, ScanReport, Vulnerability } from './types.js';
import { SecretsScanner } from './scanners/secrets.js';
import { AuthScanner } from './scanners/auth.js';
import { InjectionScanner } from './scanners/injection.js';
import { ApiScanner } from './scanners/api.js';
import { computeScore } from './score.js';
import { nanoid } from 'nanoid';

export type OnAgentStart = (agentId: string) => void;
export type OnAgentDone = (result: AgentResult) => void;

interface OrchestratorOptions {
  onAgentStart?: OnAgentStart;
  onAgentDone?: OnAgentDone;
}

/**
 * The Orchestrator spawns all scanner agents in parallel,
 * collects their results, deduplicates findings, and computes the final report.
 *
 * V1: Secrets scanner
 * V2: + Auth, Injection, API Security scanners
 */
export class Orchestrator {
  private agents: Agent[];

  constructor() {
    this.agents = [
      new SecretsScanner(),
      new AuthScanner(),
      new InjectionScanner(),
      new ApiScanner(),
    ];
  }

  getAgentIds(): Array<{ id: string; name: string }> {
    return this.agents.map((a) => ({ id: a.id, name: a.name }));
  }

  async run(
    context: ScanContext,
    options: OrchestratorOptions = {}
  ): Promise<ScanReport> {
    const start = Date.now();

    // Launch all agents in parallel
    const promises = this.agents.map(async (agent) => {
      options.onAgentStart?.(agent.id);
      const result = await agent.run(context);
      options.onAgentDone?.(result);
      return result;
    });

    const settled = await Promise.allSettled(promises);

    const agentResults: AgentResult[] = settled.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        agentId: this.agents[i].id,
        agentName: this.agents[i].name,
        vulnerabilities: [],
        duration: 0,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    });

    const allVulns: Vulnerability[] = agentResults.flatMap((r) => r.vulnerabilities);
    const deduped = deduplicateVulns(allVulns);
    const sorted = sortBySeverity(deduped);
    const score = computeScore(sorted);

    return {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      cwd: context.cwd,
      projectType: context.projectType,
      score,
      vulnerabilities: sorted,
      agents: agentResults,
      duration: Date.now() - start,
      filesScanned: context.files.length,
    };
  }
}

function deduplicateVulns(vulns: Vulnerability[]): Vulnerability[] {
  const seen = new Set<string>();
  return vulns.filter((v) => {
    const key = `${v.file}:${v.line}:${v.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

function sortBySeverity(vulns: Vulnerability[]): Vulnerability[] {
  return [...vulns].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );
}
