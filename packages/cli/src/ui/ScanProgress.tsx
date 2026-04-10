import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { theme, SeverityLevel } from './theme.js';

export type AgentStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentProgress {
  id: string;
  name: string;
  status: AgentStatus;
  findingsCount?: number;
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
}

function AgentRow({ agent }: { agent: AgentProgress }) {
  const statusIcon = () => {
    switch (agent.status) {
      case 'running':
        return <Spinner type="dots" />;
      case 'done':
        return <Text color={theme.success}>✓</Text>;
      case 'error':
        return <Text color={theme.danger}>✗</Text>;
      default:
        return <Text color={theme.muted}>○</Text>;
    }
  };

  return (
    <Box gap={1}>
      <Box width={2}>{statusIcon()}</Box>
      <Text
        color={
          agent.status === 'running'
            ? theme.primary
            : agent.status === 'done'
            ? theme.success
            : agent.status === 'error'
            ? theme.danger
            : theme.muted
        }
      >
        {agent.name.padEnd(22)}
      </Text>
      {agent.status === 'done' && agent.findingsCount !== undefined && (
        <Text color={agent.findingsCount > 0 ? theme.warning : theme.muted}>
          {agent.findingsCount > 0
            ? `${agent.findingsCount} finding${agent.findingsCount > 1 ? 's' : ''}`
            : 'clean'}
        </Text>
      )}
    </Box>
  );
}

function SeverityBadge({ level, count }: { level: SeverityLevel; count: number }) {
  return (
    <Box gap={1}>
      <Text color={theme.severity[level]} bold>
        {count}
      </Text>
      <Text color={theme.muted}>{level}</Text>
    </Box>
  );
}

export function ScanProgress({ agents, stats, cwd }: ScanProgressProps) {
  const totalFindings = stats.critical + stats.high + stats.medium + stats.low;

  return (
    <Box flexDirection="column" gap={0}>
      <Box marginBottom={1}>
        <Text color={theme.muted}>Scanning: </Text>
        <Text color={theme.white} bold>
          {cwd}
        </Text>
      </Box>

      <Box flexDirection="column" gap={0} marginBottom={1}>
        {agents.map((agent) => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </Box>

      {totalFindings > 0 && (
        <Box gap={3} marginTop={1}>
          <Text color={theme.muted}>Found: </Text>
          {stats.critical > 0 && <SeverityBadge level="CRITICAL" count={stats.critical} />}
          {stats.high > 0 && <SeverityBadge level="HIGH" count={stats.high} />}
          {stats.medium > 0 && <SeverityBadge level="MEDIUM" count={stats.medium} />}
          {stats.low > 0 && <SeverityBadge level="LOW" count={stats.low} />}
        </Box>
      )}
    </Box>
  );
}
