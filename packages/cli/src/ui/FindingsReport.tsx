import React from 'react';
import { Box, Text } from 'ink';
import { theme, SeverityLevel } from './theme.js';
import type { Vulnerability } from '../agents/types.js';

interface FindingsReportProps {
  vulnerabilities: Vulnerability[];
  score: number;
}

function VulnCard({ vuln }: { vuln: Vulnerability }) {
  const severityColor = theme.severity[vuln.severity as SeverityLevel] ?? theme.muted;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={severityColor}
      paddingX={1}
      marginBottom={1}
    >
      <Box justifyContent="space-between">
        <Text color={severityColor} bold>
          [{vuln.severity}] {vuln.id}
        </Text>
        <Text color={theme.muted}>{vuln.file}</Text>
      </Box>
      <Text color={theme.white} bold>
        {vuln.title}
      </Text>
      <Text color={theme.muted} wrap="wrap">
        {vuln.description}
      </Text>
      {vuln.line && (
        <Text color={theme.muted}>
          Line {vuln.line}
        </Text>
      )}
      {vuln.fix && (
        <Box marginTop={1}>
          <Text color={theme.success}>💡 Fix: </Text>
          <Text color={theme.white} wrap="wrap">
            {vuln.fix}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function ScoreBar({ score }: { score: number }) {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const color =
    score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.danger;

  return (
    <Box gap={1} alignItems="center">
      <Text color={color} bold>
        {'█'.repeat(filled)}
        {'░'.repeat(empty)}
      </Text>
      <Text color={color} bold>
        {score}/100
      </Text>
    </Box>
  );
}

export function FindingsReport({ vulnerabilities, score }: FindingsReportProps) {
  const criticals = vulnerabilities.filter((v) => v.severity === 'CRITICAL');
  const highs = vulnerabilities.filter((v) => v.severity === 'HIGH');
  const mediums = vulnerabilities.filter((v) => v.severity === 'MEDIUM');
  const lows = vulnerabilities.filter((v) => v.severity === 'LOW');

  return (
    <Box flexDirection="column">
      {/* Score */}
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.danger}
        paddingX={2}
        paddingY={0}
        marginBottom={1}
      >
        <Text color={theme.white} bold>
          Security Score
        </Text>
        <ScoreBar score={score} />
        <Text color={theme.muted}>
          {vulnerabilities.length} vulnerabilit{vulnerabilities.length !== 1 ? 'ies' : 'y'} found
          {' — '}
          {criticals.length} CRITICAL · {highs.length} HIGH · {mediums.length} MEDIUM · {lows.length} LOW
        </Text>
      </Box>

      {/* Findings grouped by severity */}
      {criticals.length > 0 && (
        <>
          <Text color={theme.danger} bold>── CRITICAL ──</Text>
          {criticals.map((v) => <VulnCard key={v.id} vuln={v} />)}
        </>
      )}
      {highs.length > 0 && (
        <>
          <Text color={theme.severity.HIGH} bold>── HIGH ──</Text>
          {highs.map((v) => <VulnCard key={v.id} vuln={v} />)}
        </>
      )}
      {mediums.length > 0 && (
        <>
          <Text color={theme.warning} bold>── MEDIUM ──</Text>
          {mediums.map((v) => <VulnCard key={v.id} vuln={v} />)}
        </>
      )}
      {lows.length > 0 && (
        <>
          <Text color={theme.info} bold>── LOW ──</Text>
          {lows.map((v) => <VulnCard key={v.id} vuln={v} />)}
        </>
      )}

      {vulnerabilities.length === 0 && (
        <Box borderStyle="round" borderColor={theme.success} paddingX={2}>
          <Text color={theme.success} bold>
            ✓ No vulnerabilities found. Codebase is clean.
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.muted}>
          Run <Text color={theme.primary} bold>brain fix --all</Text> to apply all fixes
          {'  |  '}
          Run <Text color={theme.primary} bold>brain report</Text> to export full report
        </Text>
      </Box>
    </Box>
  );
}
