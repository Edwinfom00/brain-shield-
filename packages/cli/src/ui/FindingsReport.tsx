import React from 'react';
import { Box, Text } from 'ink';
import { theme, sevColor, scoreColor, scoreLabel, type SeverityLevel } from './theme.js';
import type { Vulnerability } from '../agents/types.js';

interface FindingsReportProps {
  vulnerabilities: Vulnerability[];
  score: number;
  duration?: number;
  filesScanned?: number;
}

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({ score, duration, filesScanned }: { score: number; duration?: number; filesScanned?: number }) {
  const color = scoreColor(score);
  const label = scoreLabel(score);
  const filled = Math.round(score / 5);   // 0–20 blocks
  const empty  = 20 - filled;

  return (
    <Box flexDirection="column" gap={0} paddingX={1}>
      {/* Score row */}
      <Box gap={3} alignItems="center" marginBottom={0}>
        <Box gap={1} alignItems="center">
          <Text color={color} bold>{'█'.repeat(filled)}</Text>
          <Text color={theme.border} dimColor>{'░'.repeat(empty)}</Text>
        </Box>
        <Box gap={1} alignItems="center">
          <Text color={color} bold>{score}</Text>
          <Text color={theme.muted}>{'/100'}</Text>
          <Text color={theme.border}>{'·'}</Text>
          <Text color={color} bold>{label}</Text>
        </Box>
      </Box>

      {/* Meta */}
      {(duration !== undefined || filesScanned !== undefined) && (
        <Box gap={2} marginTop={0}>
          {filesScanned !== undefined && (
            <Text color={theme.muted} dimColor>{`${filesScanned} files scanned`}</Text>
          )}
          {duration !== undefined && (
            <Text color={theme.muted} dimColor>{`${duration}ms`}</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Severity summary row ─────────────────────────────────────────────────────

const SEV_BAR: Record<SeverityLevel, string> = {
  CRITICAL: '████',
  HIGH:     '███░',
  MEDIUM:   '██░░',
  LOW:      '█░░░',
  INFO:     '░░░░',
};

function SevSummary({ vulns }: { vulns: Vulnerability[] }) {
  const counts: Record<string, number> = {};
  for (const v of vulns) counts[v.severity] = (counts[v.severity] ?? 0) + 1;

  const sevs: SeverityLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const active = sevs.filter((s) => (counts[s] ?? 0) > 0);
  if (active.length === 0) return null;

  return (
    <Box gap={4} paddingX={1} marginTop={1}>
      {active.map((sev) => (
        <Box key={sev} gap={1} alignItems="center">
          <Text color={sevColor(sev)}>{SEV_BAR[sev]}</Text>
          <Text color={sevColor(sev)} bold>{counts[sev]}</Text>
          <Text color={theme.muted} dimColor>{sev}</Text>
        </Box>
      ))}
    </Box>
  );
}

// ─── Vuln card ────────────────────────────────────────────────────────────────

function VulnCard({ vuln, index }: { vuln: Vulnerability; index: number }) {
  const color = sevColor(vuln.severity);
  const cols  = Math.min(process.stdout.columns ?? 80, 120);

  return (
    <Box flexDirection="column" marginBottom={1}>

      {/* ── Title row ── */}
      <Box gap={1} alignItems="center">
        {/* Index */}
        <Text color={theme.border} dimColor>{String(index + 1).padStart(2, '0')}</Text>

        {/* Severity badge */}
        <Box>
          <Text color={color} bold>{`[${vuln.severity}]`}</Text>
        </Box>

        {/* ID */}
        <Text color={theme.primary2} bold>{vuln.id}</Text>

        <Text color={theme.border}>{'·'}</Text>

        {/* Title */}
        <Text color={theme.white} bold>{vuln.title}</Text>
      </Box>

      {/* ── File + refs ── */}
      <Box paddingLeft={5} gap={2} marginTop={0}>
        <Text color={theme.muted} dimColor>
          {vuln.file}{vuln.line ? `:${vuln.line}` : ''}
        </Text>
        {vuln.cwe   && <Text color={theme.border} dimColor>{vuln.cwe}</Text>}
        {vuln.owasp && <Text color={theme.border} dimColor>{vuln.owasp}</Text>}
        {vuln.autoFixable && (
          <Text color={theme.success} dimColor>{'[auto-fixable]'}</Text>
        )}
      </Box>

      {/* ── Code snippet ── */}
      {vuln.snippet && (
        <Box paddingLeft={5} marginTop={0} flexDirection="column">
          <Text color={theme.border} dimColor>{'  ┌─ snippet'}</Text>
          {vuln.snippet.split('\n').slice(0, 4).map((line, i) => (
            <Text key={i} color={theme.muted} dimColor>{`  │ ${line}`}</Text>
          ))}
          <Text color={theme.border} dimColor>{'  └─'}</Text>
        </Box>
      )}

      {/* ── Fix ── */}
      {vuln.fix && (
        <Box paddingLeft={5} gap={1} marginTop={0}>
          <Text color={theme.success}>{'↳'}</Text>
          <Text color={theme.dim} wrap="wrap">
            {vuln.fix.split('\n')[0]?.slice(0, cols - 10) ?? ''}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// ─── Clean state ──────────────────────────────────────────────────────────────

function CleanState() {
  return (
    <Box flexDirection="column" gap={1} paddingX={1} paddingY={1}>
      <Box gap={2} alignItems="center">
        <Text color={theme.success} bold>{'✓'}</Text>
        <Text color={theme.success} bold>No vulnerabilities found</Text>
      </Box>
      <Box paddingLeft={4}>
        <Text color={theme.muted} dimColor>Your codebase is clean. Keep it that way.</Text>
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FindingsReport({ vulnerabilities, score, duration, filesScanned }: FindingsReportProps) {
  const cols = Math.min(process.stdout.columns ?? 80, 120);
  const hr   = <Text color={theme.border} dimColor>{'─'.repeat(Math.min(cols, 64))}</Text>;

  return (
    <Box flexDirection="column" gap={0}>

      {/* Score */}
      <ScoreCard score={score} duration={duration} filesScanned={filesScanned} />

      {/* Severity summary */}
      <SevSummary vulns={vulnerabilities} />

      <Box marginTop={1}>{hr}</Box>

      {/* Findings or clean */}
      {vulnerabilities.length === 0
        ? <CleanState />
        : (
          <Box flexDirection="column" paddingX={1} marginTop={1}>
            <Box marginBottom={1}>
              <Text color={theme.muted} dimColor>
                {`${vulnerabilities.length} vulnerabilit${vulnerabilities.length > 1 ? 'ies' : 'y'} found`}
              </Text>
            </Box>
            {vulnerabilities.map((v, i) => (
              <VulnCard key={v.id} vuln={v} index={i} />
            ))}
          </Box>
        )
      }

      <Box>{hr}</Box>

      {/* Actions hint */}
      <Box paddingX={1} paddingY={0} gap={2}>
        <Text color={theme.primary} bold>{'brain fix --critical'}</Text>
        <Text color={theme.border}>{'·'}</Text>
        <Text color={theme.muted}>{'brain fix --ai'}</Text>
        <Text color={theme.border}>{'·'}</Text>
        <Text color={theme.muted}>{'brain report --md'}</Text>
        <Text color={theme.border}>{'·'}</Text>
        <Text color={theme.muted}>{'brain chat'}</Text>
      </Box>

    </Box>
  );
}
