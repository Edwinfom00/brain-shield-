import { Box, Text } from 'ink';
import { theme, SeverityLevel } from './theme.js';
import type { Vulnerability } from '../agents/types.js';

interface FindingsReportProps {
  vulnerabilities: Vulnerability[];
  score: number;
}

const SEV_ICON: Record<SeverityLevel, string> = {
  CRITICAL: '▰▰▰▰',
  HIGH:     '▰▰▰░',
  MEDIUM:   '▰▰░░',
  LOW:      '▰░░░',
  INFO:     '░░░░',
};

function ScoreBar({ score }: { score: number }) {
  const filled  = Math.round(score / 5);
  const empty   = 20 - filled;
  const color   = score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.danger;
  const label   = score >= 80 ? 'SECURE' : score >= 50 ? 'AT RISK' : 'CRITICAL';

  return (
    <Box flexDirection="column" gap={0}>
      <Box gap={2} alignItems="center">
        <Text color={color} bold>{'█'.repeat(filled)}<Text color={theme.muted} dimColor>{'░'.repeat(empty)}</Text></Text>
        <Text color={color} bold>{score}<Text color={theme.muted}>/100</Text></Text>
        <Text color={color} bold>{label}</Text>
      </Box>
    </Box>
  );
}

function SevLine({ sev, count }: { sev: SeverityLevel; count: number }) {
  if (count === 0) return null;
  return (
    <Box gap={2}>
      <Text color={theme.severity[sev]}>{SEV_ICON[sev]}</Text>
      <Text color={theme.severity[sev]} bold>{sev.padEnd(8)}</Text>
      <Text color={theme.white} bold>{count}</Text>
    </Box>
  );
}

function VulnCard({ vuln, index }: { vuln: Vulnerability; index: number }) {
  const sev   = vuln.severity as SeverityLevel;
  const color = theme.severity[sev] ?? theme.muted;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Title row */}
      <Box gap={2}>
        <Text color={theme.muted} dimColor>{String(index + 1).padStart(2, '0')}</Text>
        <Text color={color} bold>{`[${vuln.severity}]`}</Text>
        <Text color={theme.white} bold>{vuln.id}</Text>
        <Text color={theme.muted}>{'·'}</Text>
        <Text color={theme.white}>{vuln.title}</Text>
      </Box>

      {/* File + refs */}
      <Box paddingLeft={5} gap={2}>
        <Text color={theme.muted} dimColor>{vuln.file}{vuln.line ? `:${vuln.line}` : ''}</Text>
        {vuln.cwe   && <Text color={theme.muted} dimColor>{vuln.cwe}</Text>}
        {vuln.owasp && <Text color={theme.muted} dimColor>{vuln.owasp}</Text>}
      </Box>

      {/* Fix */}
      {vuln.fix && (
        <Box paddingLeft={5} gap={1}>
          <Text color={theme.success}>{'↳'}</Text>
          <Text color={theme.muted} wrap="wrap">{vuln.fix.split('\n')[0]}</Text>
        </Box>
      )}
    </Box>
  );
}

export function FindingsReport({ vulnerabilities, score }: FindingsReportProps) {
  const byDev = (sev: string) => vulnerabilities.filter((v) => v.severity === sev);
  const crits  = byDev('CRITICAL');
  const highs  = byDev('HIGH');
  const meds   = byDev('MEDIUM');
  const lows   = byDev('LOW');

  const divider = <Text color={theme.muted} dimColor>{'─'.repeat(64)}</Text>;

  return (
    <Box flexDirection="column" gap={1}>

      {/* Score card */}
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Text color={theme.primary} bold>Security Score</Text>
        <ScoreBar score={score} />
        <Box gap={3} marginTop={0}>
          <SevLine sev="CRITICAL" count={crits.length} />
          <SevLine sev="HIGH"     count={highs.length} />
          <SevLine sev="MEDIUM"   count={meds.length}  />
          <SevLine sev="LOW"      count={lows.length}  />
        </Box>
      </Box>

      {divider}

      {/* Findings list */}
      {vulnerabilities.length === 0 ? (
        <Box paddingX={1} gap={2}>
          <Text color={theme.success} bold>{'✓'}</Text>
          <Text color={theme.success}>No vulnerabilities found. Codebase is clean.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" paddingX={1}>
          {vulnerabilities.map((v, i) => <VulnCard key={v.id} vuln={v} index={i} />)}
        </Box>
      )}

      {divider}

      {/* Actions hint */}
      <Box paddingX={1} gap={3}>
        <Text color={theme.muted} dimColor>
          <Text color={theme.primary}>brain fix --critical</Text>
          {'  '}
          <Text color={theme.primary}>brain fix --ai</Text>
          {'  '}
          <Text color={theme.primary}>brain report --md</Text>
        </Text>
      </Box>
    </Box>
  );
}
