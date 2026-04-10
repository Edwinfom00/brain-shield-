export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  category: string;
  file: string;
  line?: number;
  column?: number;
  snippet?: string;
  fix?: string;
  fixCode?: string;        // Actual code to replace snippet with
  cwe?: string;            // CWE reference e.g. "CWE-89"
  owasp?: string;          // OWASP reference e.g. "A03:2021"
  autoFixable: boolean;
}

export interface ScanContext {
  cwd: string;
  files: string[];
  projectType: ProjectType;
  packageJson?: Record<string, unknown>;
  framework?: string;
}

export type ProjectType = 'nextjs' | 'vite' | 'express' | 'node' | 'typescript' | 'javascript' | 'unknown';

export interface AgentResult {
  agentId: string;
  agentName: string;
  vulnerabilities: Vulnerability[];
  duration: number;
  error?: string;
}

export interface ScanReport {
  id: string;
  timestamp: string;
  cwd: string;
  projectType: ProjectType;
  score: number;
  vulnerabilities: Vulnerability[];
  agents: AgentResult[];
  duration: number;
  filesScanned: number;
}

export interface Agent {
  id: string;
  name: string;
  run(context: ScanContext): Promise<AgentResult>;
}
