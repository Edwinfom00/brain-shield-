import { Box, Text } from 'ink';
import { theme } from './theme.js';
import { version } from '../version.js';

export function Header() {
  return (
    <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
      <Box gap={1} alignItems="center">
        <Text color={theme.primary} bold>{'▐█▌'}</Text>
        <Text color={theme.white} bold>BrainShield</Text>
        <Text color={theme.muted}>{'·'}</Text>
        <Text color={theme.muted} dimColor>AI Security CLI</Text>
      </Box>
      <Box gap={2} alignItems="center">
        <Text color={theme.muted} dimColor>JS · TS · Next.js · Vite</Text>
        <Text color={theme.primary} dimColor>{`v${version}`}</Text>
      </Box>
    </Box>
  );
}
