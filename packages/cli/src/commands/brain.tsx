import { Command } from 'commander';
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import { Header } from '../ui/Header.js';
import { Avatar } from '../ui/Avatar.js';
import { ScanProgress, type AgentProgress, type ScanStats } from '../ui/ScanProgress.js';
import { FindingsReport } from '../ui/FindingsReport.js';
import { theme } from '../ui/theme.js';
import { discoverProject } from '../agents/discovery.js';
import { Orchestrator } from '../agents/orchestrator.js';
import type { ScanReport, AgentResult } from '../agents/types.js';
import { saveReport } from '../core/reports.js';

// ─── React App Component ────────────────────────────────────────────────────

interface ScanAppProps {
  cwd: string;
  onDone: (report: ScanReport) => void;
  onError: (err: Error) => void;
}

type Phase = 'discovering' | 'scanning' | 'done' | 'error';

function ScanApp({ cwd, onDone, onError }: ScanAppProps) {
  const [phase, setPhase] = useState<Phase>('discovering');
  const [agentList, setAgentList] = useState<AgentProgress[]>([]);
  const [stats, setStats] = useState<ScanStats>({ critical: 0, high: 0, medium: 0, low: 0 });
  const [report, setReport] = useState<ScanReport | null>(null);
  const [filesCount, setFilesCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        const context = await discoverProject(cwd);
        setFilesCount(context.files.length);

        const orchestrator = new Orchestrator();
        const agentDefs = orchestrator.getAgentIds();
        setAgentList(agentDefs.map((a) => ({ ...a, status: 'pending' as const })));
        setPhase('scanning');

        const scanReport = await orchestrator.run(context, {
          onAgentStart: (agentId) => {
            setAgentList((prev) =>
              prev.map((a) => (a.id === agentId ? { ...a, status: 'running' as const } : a))
            );
          },
          onAgentDone: (result: AgentResult) => {
            const c = result.vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
            const h = result.vulnerabilities.filter((v) => v.severity === 'HIGH').length;
            const m = result.vulnerabilities.filter((v) => v.severity === 'MEDIUM').length;
            const l = result.vulnerabilities.filter((v) => v.severity === 'LOW').length;

            setStats((prev) => ({
              critical: prev.critical + c,
              high: prev.high + h,
              medium: prev.medium + m,
              low: prev.low + l,
            }));

            setAgentList((prev) =>
              prev.map((a) =>
                a.id === result.agentId
                  ? {
                      ...a,
                      status: result.error ? ('error' as const) : ('done' as const),
                      findingsCount: result.vulnerabilities.length,
                    }
                  : a
              )
            );
          },
        });

        setReport(scanReport);
        setPhase('done');
        onDone(scanReport);
      } catch (err) {
        setPhase('error');
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    run();
  }, []);

  if (phase === 'discovering') {
    return (
      <Box flexDirection="column">
        <Header />
        <Box gap={2} alignItems="center">
          <Avatar thinking />
          <Box flexDirection="column">
            <Text color={theme.primary} bold>Discovering project...</Text>
            <Text color={theme.muted}>{cwd}</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (phase === 'scanning') {
    return (
      <Box flexDirection="column">
        <Header />
        <Box gap={2}>
          <Avatar thinking />
          <Box flexDirection="column" flexGrow={1}>
            <Text color={theme.muted} dimColor>
              {filesCount} files · {agentList.length} agent{agentList.length !== 1 ? 's' : ''}
            </Text>
            <ScanProgress agents={agentList} stats={stats} cwd={cwd} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (phase === 'done' && report) {
    return (
      <Box flexDirection="column">
        <Header />
        <Box gap={2} marginBottom={1}>
          <Avatar speaking />
          <Box flexDirection="column">
            <Text color={theme.success} bold>Scan complete</Text>
            <Text color={theme.muted}>
              {filesCount} files scanned · {report.duration}ms
            </Text>
          </Box>
        </Box>
        <FindingsReport vulnerabilities={report.vulnerabilities} score={report.score} />
      </Box>
    );
  }

  return (
    <Box>
      <Text color={theme.danger}>An error occurred. Run again with --verbose for details.</Text>
    </Box>
  );
}

// ─── Command ────────────────────────────────────────────────────────────────

export const brainCommand = new Command('scan')
  .aliases(['s'])
  .description('Scan the current codebase for security vulnerabilities')
  .option('-d, --dir <path>', 'Directory to scan', process.cwd())
  .option('--json', 'Output raw JSON report')
  .option('--save', 'Save report to .brainsield/reports/')
  .action(async (opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    let resolveApp!: (report: ScanReport) => void;
    let rejectApp!: (err: Error) => void;

    const done = new Promise<ScanReport>((res, rej) => {
      resolveApp = res;
      rejectApp = rej;
    });

    const { unmount } = render(
      <ScanApp
        cwd={cwd}
        onDone={resolveApp}
        onError={rejectApp}
      />
    );

    try {
      const report = await done;
      unmount();

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      }

      if (opts.save) {
        const path = await saveReport(report, cwd);
        console.log(`\nReport saved to: ${path}`);
      }
    } catch (err) {
      unmount();
      console.error('\nScan failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });
