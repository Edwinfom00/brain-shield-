import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { theme, sevColor } from './theme.js';

export type AgentStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentProgress {
  id: string;
  name: string;
  status: AgentStatus;
  findingsCount?: number;
  duration?: number;
}

export interface ScanStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ScanProgressProps {
  agents: AgentProgress[];
  stats: ScanStats;
  cwd: string;
  filesCount?: number;
}

// ─── Agent row ────────────────────────────────────────────────────────────────

function AgentRow({ agent, index }: { agent: AgentProgress; index: number }) {
  const isPending = agent.status === 'pending';
  const isRunning = agent.status === 'running';
  const isDone    = agent.status === 'done';
  const isError   = agent.status === 'error';

  // Status icon
  const icon = isRunning
    ? <><Spinner type="dots" /><Text> </Text></>
    : isDone
      ? <Text color={theme.success}>{'✓ '}</Text>
      : isError
        ? <Text color={theme.danger}>{'✗ '}</Text>
        : <Text color={theme.border}>{'○ '}</Text>;

  // Name color
  const nameColor = isRunning ? theme.primary2
    : isDone    ? theme.dim
    : isError   ? theme.danger
    : theme.border;

  // Findings badge
  let badge: React.ReactNode = null;
  if (isDone && agent.findingsCount !== undefined) {
    if (agent.findingsCount === 0) {
      badge = <Text color={theme.success} dimColor>{'  clean'}</Text>;
    } else {
      const c = agent.findingsCount;
      badge = <Text color={theme.warning} bold>{`  ${c} finding${c > 1 ? 's' : ''}`}</Text>;
    }
  }

  // Duration
  const dur = isDone && agent.duration
    ? <Text color={theme.border} dimColor>{`  ${agent.duration}ms`}</Text>
    : null;

  return (
    <Box>
      <Text color={theme.border} dimColor>{`  ${String(index + 1).padStart(2, ' ')}  `}</Text>
      {icon}
      <Text color={nameColor}>{agent.name.padEnd(28)}</Text>
      {badge}
      {dur}
    </Box>
  );
}

// ─── Severity pill ────────────────────────────────────────────────────────────

function SevPill({ label, count, sev }: { label: string; count: number; sev: string }) {
  if (count === 0) return null;
  const color = sevColor(sev);
  return (
    <Box gap={1}>
      <Text color={color} bold>{count}</Text>
      <Text color={theme.muted}>{label}</Text>
    </Box>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const width  = 20;
  const filled = total > 0 ? Math.round((done / total) * width) : 0;
  const empty  = width - filled;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

  const barColor = pct === 100 ? theme.success : theme.primary;

  return (
    <Box gap={2} alignItems="center">
      <Text color={barColor} bold>{'█'.repeat(filled)}</Text>
      <Text color={theme.border} dimColor>{'░'.repeat(empty)}</Text>
      <Text color={theme.muted} dimColor>{`${done}/${total}`}</Text>
      <Text color={pct === 100 ? theme.success : theme.muted} dimColor>{`${pct}%`}</Text>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScanProgress({ agents, stats, cwd, filesCount }: ScanProgressProps) {
  const total   = stats.critical + stats.high + stats.medium + stats.low;
  const running = agents.filter((a) => a.status === 'running').length;
  const done    = agents.filter((a) => a.status === 'done').length;
  const cols    = Math.min(process.stdout.columns ?? 80, 120);

  return (
    <Box flexDirection="column" gap={0}>

      {/* Target path */}
      <Box gap={1} marginBottom={1} paddingX={1}>
        <Text color={theme.primary} bold>{'▸'}</Text>
        <Text color={theme.muted}>Scanning</Text>
        <Text color={theme.white} bold>{cwd}</Text>
        {filesCount !== undefined && (
          <Text color={theme.border} dimColor>{` · ${filesCount} files`}</Text>
        )}
      </Box>

      {/* Agent list */}
      <Box flexDirection="column" gap={0}>
        {agents.map((a, i) => <AgentRow key={a.id} agent={a} index={i} />)}
      </Box>

      {/* Progress bar */}
      <Box marginTop={1} paddingX={1} gap={2} alignItems="center">
        <Text color={theme.muted} dimColor>
          {running > 0
            ? <Text color={theme.primary}>{`${running} running`}</Text>
            : null}
        </Text>
        <ProgressBar done={done} total={agents.length} />
      </Box>

      {/* Live severity counters */}
      {total > 0 && (
        <Box marginTop={0} paddingX={1} gap={3}>
          <Text color={theme.border} dimColor>{'  findings  '}</Text>
          <SevPill label="CRIT" count={stats.critical} sev="CRITICAL" />
          <SevPill label="HIGH" count={stats.high}     sev="HIGH"     />
          <SevPill label="MED"  count={stats.medium}   sev="MEDIUM"   />
          <SevPill label="LOW"  count={stats.low}      sev="LOW"      />
        </Box>
      )}

      {/* Bottom rule */}
      <Box marginTop={1}>
        <Text color={theme.border} dimColor>{'─'.repeat(Math.min(cols, 64))}</Text>
      </Box>
    </Box>
  );
}
