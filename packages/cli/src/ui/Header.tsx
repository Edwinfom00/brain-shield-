import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.js';
import { version } from '../version.js';

interface HeaderProps {
  subtitle?: string;
}

export function Header({ subtitle = 'AI Security CLI' }: HeaderProps) {
  const cols = Math.min(process.stdout.columns ?? 80, 120);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Top rule */}
      <Text color={theme.border}>{'─'.repeat(cols)}</Text>

      {/* Brand bar */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1} paddingY={0}>
        <Box gap={1} alignItems="center">
          <Text color={theme.primary} bold>{'▐█▌'}</Text>
          <Text color={theme.white} bold>BrainShield</Text>
          <Text color={theme.border}>{'·'}</Text>
          <Text color={theme.muted}>{subtitle}</Text>
        </Box>
        <Box gap={2} alignItems="center">
          <Text color={theme.muted} dimColor>JS · TS · Next.js · Vite</Text>
          <Text color={theme.border}>{'·'}</Text>
          <Text color={theme.primary} dimColor>{`v${version}`}</Text>
        </Box>
      </Box>

      {/* Bottom rule */}
      <Text color={theme.border}>{'─'.repeat(cols)}</Text>
    </Box>
  );
}
