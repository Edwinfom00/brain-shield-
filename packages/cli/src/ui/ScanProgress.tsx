import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { theme } from './theme.js';

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
  const icon = () => {
    switch (agent.status) {
      case 'running': return <><Spinner type="dots" /><Text> </Text></>;
      case 'done':    return <Text color={theme.success}>{'✓ '}</Text>;
      case 'error':   return <Text color={theme.danger}>{'✗ '}</Text>;
      default:        return <Text color={theme.muted}>{'○ '}</Text>;
    }
  };

  const nameColor =
    agent.status === 'running' ? theme.primary :
    agent.status === 'done'    ? theme.success :
    agent.status === 'error'   ? theme.danger  : theme.muted;

  const badge = agent.status === 'done' && agent.findingsCount !== undefined
    ? agent.findingsCount > 0
      ? <Text color={theme.warning} bold>{` ${agent.findingsCount} finding${agent.findingsCount > 1 ? 's' : ''}`}</Text>
      : <Text color={theme.muted} dimColor>{' clean'}</Text>
    : null;

  return (
    <Box gap={0}>
      {icon()}
      <Text color={nameColor}>{agent.name.padEnd(26)}</Text>
      {badge}
    </Box>
  );
}

function SevBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Box gap={1}>
      <Text color={color} bold>{count}</Text>
      <Text color={theme.muted}>{label}</Text>
    </Box>
  );
}

export function ScanProgress({ agents, stats, cwd }: ScanProgressProps) {
  const total = stats.critical + stats.high + stats.medium + stats.low;
  const running = agents.filter((a) => a.status === 'running').length;
  const done    = agents.filter((a) => a.status === 'done').length;

  return (
    <Box flexDirection="column" gap={0}>
      {/* Target */}
      <Box gap={1} marginBottom={1}>
        <Text color={theme.muted}>{'▸'}</Text>
        <Text color={theme.muted}>Scanning</Text>
        <Text color={theme.white} bold>{cwd}</Text>
      </Box>

      {/* Agent list */}
      <Box flexDirection="column" gap={0} paddingLeft={1}>
        {agents.map((a) => <AgentRow key={a.id} agent={a} />)}
      </Box>

      {/* Progress summary */}
      <Box marginTop={1} gap={2} paddingLeft={1}>
        <Text color={theme.muted} dimColor>
          {done}/{agents.length} agents
          {running > 0 ? ` · ${running} running` : ''}
        </Text>
        {total > 0 && (
          <>
            <Text color={theme.muted}>{'·'}</Text>
            {stats.critical > 0 && <SevBadge label="CRIT" count={stats.critical} color={theme.severity.CRITICAL} />}
            {stats.high     > 0 && <SevBadge label="HIGH" count={stats.high}     color={theme.severity.HIGH}     />}
            {stats.medium   > 0 && <SevBadge label="MED"  count={stats.medium}   color={theme.severity.MEDIUM}   />}
            {stats.low      > 0 && <SevBadge label="LOW"  count={stats.low}      color={theme.severity.LOW}      />}
          </>
        )}
      </Box>
    </Box>
  );
}
