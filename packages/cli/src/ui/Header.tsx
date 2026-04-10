import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.js';
import { version } from '../version.js';

export function Header() {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.primary}
      paddingX={2}
      paddingY={0}
      marginBottom={1}
    >
      <Box justifyContent="space-between">
        <Text color={theme.primary} bold>
          🛡  BrainShield
        </Text>
        <Text color={theme.muted}>v{version}</Text>
      </Box>
      <Text color={theme.muted}>AI-powered security analysis</Text>
    </Box>
  );
}
