import { Command } from 'commander';
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Header } from '../ui/Header.js';
import { Avatar } from '../ui/Avatar.js';
import { ScanProgress, type AgentProgress, type ScanStats } from '../ui/ScanProgress.js';
import { FindingsReport } from '../ui/FindingsReport.js';
import { theme } from '../ui/theme.js';
import { discoverProject } from '../agents/discovery.js';
import { Orchestrator } from '../agents/orchestrator.js';
import type { ScanReport, AgentResult } from '../agents/types.js';
import { saveReport } from '../core/reports.js';
import { getOrInitSession, saveSession, loadSession } from '../core/session.js';
import { pushReport, type PushResult } from '../core/push.js';

// ─── Phases ───────────────────────────────────────────────────────────────────

type Phase = 'discovering' | 'scanning' | 'done' | 'error';

interface ScanAppProps {
  cwd: string;
  onDone:  (report: ScanReport) => void;
  onError: (err: Error) => void;
}

// ─── Discovering phase ────────────────────────────────────────────────────────

function DiscoveringView({ cwd }: { cwd: string }) {
  return (
    <Box flexDirection="column">
      <Header />
      <Box gap={2} alignItems="center" paddingX={1}>
        <Avatar thinking />
        <Box flexDirection="column" gap={0}>
          <Box gap={2} alignItems="center">
            <Spinner type="dots" />
            <Text color={theme.primary} bold>Discovering project</Text>
          </Box>
          <Text color={theme.muted} dimColor>{cwd}</Text>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Scanning phase ───────────────────────────────────────────────────────────

function ScanningView({
  cwd, filesCount, agents, stats,
}: {
  cwd: string;
  filesCount: number;
  agents: AgentProgress[];
  stats: ScanStats;
}) {
  return (
    <Box flexDirection="column">
      <Header />
      <Box gap={2} paddingX={1}>
        <Avatar thinking />
        <Box flexDirection="column" flexGrow={1}>
          <ScanProgress agents={agents} stats={stats} cwd={cwd} filesCount={filesCount} />
        </Box>
      </Box>
    </Box>
  );
}

// ─── Done phase ───────────────────────────────────────────────────────────────

function DoneView({
  report, filesCount,
}: {
  report: ScanReport;
  filesCount: number;
}) {
  return (
    <Box flexDirection="column">
      <Header />
      <Box gap={2} paddingX={1} marginBottom={1} alignItems="center">
        <Avatar speaking />
        <Box flexDirection="column" gap={0}>
          <Text color={theme.success} bold>Scan complete</Text>
          <Text color={theme.muted} dimColor>
            {`${filesCount} files · ${report.vulnerabilities.length} findings · ${report.duration}ms`}
          </Text>
        </Box>
      </Box>
      <FindingsReport
        vulnerabilities={report.vulnerabilities}
        score={report.score}
        duration={report.duration}
        filesScanned={filesCount}
      />
    </Box>
  );
}

// ─── Error phase ──────────────────────────────────────────────────────────────

function ErrorView({ message }: { message: string }) {
  return (
    <Box flexDirection="column">
      <Header />
      <Box gap={2} paddingX={1} alignItems="center">
        <Avatar error />
        <Box flexDirection="column" gap={0}>
          <Text color={theme.danger} bold>Scan failed</Text>
          <Text color={theme.muted} dimColor>{message}</Text>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Root app ─────────────────────────────────────────────────────────────────

function ScanApp({ cwd, onDone, onError }: ScanAppProps) {
  const [phase,      setPhase]      = useState<Phase>('discovering');
  const [agentList,  setAgentList]  = useState<AgentProgress[]>([]);
  const [stats,      setStats]      = useState<ScanStats>({ critical: 0, high: 0, medium: 0, low: 0 });
  const [report,     setReport]     = useState<ScanReport | null>(null);
  const [filesCount, setFilesCount] = useState(0);
  const [errMsg,     setErrMsg]     = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        // ── Discover ──────────────────────────────────────────────────────
        const context = await discoverProject(cwd);
        setFilesCount(context.files.length);

        // ── Init / refresh session (fast, no AI) ──────────────────────────
        await getOrInitSession(
          cwd,
          context.files,
          context.packageJson,
          context.projectType,
          context.framework,
        );

        const orchestrator = new Orchestrator();
        const agentDefs    = orchestrator.getAgentIds();

        setAgentList(agentDefs.map((a) => ({ ...a, status: 'pending' as const })));
        setPhase('scanning');

        // ── Scan ──────────────────────────────────────────────────────────
        const scanReport = await orchestrator.run(context, {
          onAgentStart: (agentId) => {
            setAgentList((prev) =>
              prev.map((a) => a.id === agentId ? { ...a, status: 'running' as const } : a)
            );
          },
          onAgentDone: (result: AgentResult) => {
            const c = result.vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
            const h = result.vulnerabilities.filter((v) => v.severity === 'HIGH').length;
            const m = result.vulnerabilities.filter((v) => v.severity === 'MEDIUM').length;
            const l = result.vulnerabilities.filter((v) => v.severity === 'LOW').length;

            setStats((prev) => ({
              critical: prev.critical + c,
              high:     prev.high + h,
              medium:   prev.medium + m,
              low:      prev.low + l,
            }));

            setAgentList((prev) =>
              prev.map((a) =>
                a.id === result.agentId
                  ? {
                      ...a,
                      status:        result.error ? ('error' as const) : ('done' as const),
                      findingsCount: result.vulnerabilities.length,
                      duration:      result.duration,
                    }
                  : a
              )
            );
          },
        });

        setReport(scanReport);
        setPhase('done');
        onDone(scanReport);
      } catch (err) {        const msg = err instanceof Error ? err.message : String(err);
        setErrMsg(msg);
        setPhase('error');
        onError(err instanceof Error ? err : new Error(msg));
      }
    };

    run();
  }, []);

  if (phase === 'discovering') return <DiscoveringView cwd={cwd} />;
  if (phase === 'scanning')    return <ScanningView cwd={cwd} filesCount={filesCount} agents={agentList} stats={stats} />;
  if (phase === 'done' && report) return <DoneView report={report} filesCount={filesCount} />;
  return <ErrorView message={errMsg || 'Unknown error'} />;
}

// ─── Command ──────────────────────────────────────────────────────────────────

export const brainCommand = new Command('scan')
  .aliases(['s'])
  .description('Scan the current codebase for security vulnerabilities')
  .option('-d, --dir <path>', 'Directory to scan', process.cwd())
  .option('--json',  'Output raw JSON report (suppresses UI)')
  .option('--save',  'Print the saved report path after scan')
  .option('--push',  'Push report to BrainShield dashboard')
  .action(async (opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    let resolveApp!: (report: ScanReport) => void;
    let rejectApp!:  (err: Error) => void;

    const done = new Promise<ScanReport>((res, rej) => {
      resolveApp = res;
      rejectApp  = rej;
    });

    const { unmount } = render(
      <ScanApp cwd={cwd} onDone={resolveApp} onError={rejectApp} />
    );

    try {
      const report = await done;
      unmount();

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      // ── Always save report + update session ──────────────────────────────
      // Report is always persisted — no --save flag needed for fix/report to work
      await saveReport(report, cwd);

      // Update session with latest scan ID
      const session = loadSession(cwd);
      if (session) {
        saveSession({ ...session, lastScanId: report.id }, cwd);
      }

      if (opts.save) {
        console.log(`\nReport saved → .brainsield/reports/scan-${report.id}.json`);
      }

      // ── Push to dashboard ────────────────────────────────────────────────
      if (opts.push) {
        process.stdout.write('\nPushing to dashboard...');
        const push: PushResult = await pushReport(report);
        if (push.ok) {
          console.log(`\r✓ Dashboard updated → scan ${push.scanId}\n`);
        } else {
          console.log(`\r⚠ Push failed: ${push.error}\n`);
        }
      }
    } catch (err) {
      unmount();
      console.error('\nScan failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });
