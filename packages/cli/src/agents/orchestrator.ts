import type { Agent, AgentResult, ScanContext, ScanReport, Vulnerability } from './types.js';
import { SecretsScanner } from './scanners/secrets.js';
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
 */
export class Orchestrator {
  private agents: Agent[];

  constructor() {
    // V1: Secrets scanner only. More agents added in Phase 2.
    this.agents = [new SecretsScanner()];
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

    const results = await Promise.allSettled(promises);

    const agentResults: AgentResult[] = results.map((r, i) => {
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
    const score = computeScore(deduped);

    return {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      cwd: context.cwd,
      projectType: context.projectType,
      score,
      vulnerabilities: deduped,
      agents: agentResults,
      duration: Date.now() - start,
      filesScanned: context.files.length,
    };
  }
}

/**
 * Remove duplicate findings — same file + line + title.
 */
function deduplicateVulns(vulns: Vulnerability[]): Vulnerability[] {
  const seen = new Set<string>();
  return vulns.filter((v) => {
    const key = `${v.file}:${v.line}:${v.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
