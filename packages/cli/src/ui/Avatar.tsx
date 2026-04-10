import { Box, Text } from 'ink';
import { theme } from './theme.js';

export interface AvatarProps {
  thinking?: boolean;
  speaking?: boolean;
  size?: 'sm' | 'md';
}

// ── Pixel-art shield mascot — 3 states ──────────────────────────────────────
//
//  IDLE      THINKING     SPEAKING
//  ╔══════╗  ╔══════╗    ╔══════╗
//  ║ ◈  ◈ ║  ║ ◉  ◉ ║    ║ ◈  ◈ ║
//  ║  ──  ║  ║  ??  ║    ║  ▲▲  ║
//  ║▄████▄║  ║ ···· ║    ║ ~~~~ ║
//  ╚══╗╔══╝  ╚══╗╔══╝    ╚══╗╔══╝
//     ║║         ║║           ║║
//     ▀▀         ▀▀           ▀▀
//    [BS]       [BS]         [BS]

const FRAMES = {
  idle: [
    '  ╔════════╗  ',
    '  ║ ◈    ◈ ║  ',
    '  ║   ──   ║  ',
    '  ║ ██████ ║  ',
    '  ╚══╗  ╔══╝  ',
    '     ╚══╝     ',
    '  ▄▄ BSLD ▄▄  ',
  ],
  thinking: [
    '  ╔════════╗  ',
    '  ║ ◉    ◉ ║  ',
    '  ║   ??   ║  ',
    '  ║  ····  ║  ',
    '  ╚══╗  ╔══╝  ',
    '     ╚══╝     ',
    '  ▄▄ BSLD ▄▄  ',
  ],
  speaking: [
    '  ╔════════╗  ',
    '  ║ ◈    ◈ ║  ',
    '  ║   ▲▲   ║  ',
    '  ║  ~~~~  ║  ',
    '  ╚══╗  ╔══╝  ',
    '     ╚══╝     ',
    '  ▄▄ BSLD ▄▄  ',
  ],
};

function getColors(thinking: boolean, speaking: boolean) {
  if (thinking) return { border: theme.warning, eyes: theme.warning, accent: theme.muted,   label: theme.warning };
  if (speaking) return { border: theme.primary, eyes: theme.success,  accent: theme.primary, label: theme.success  };
  return         { border: theme.primary, eyes: theme.primary, accent: theme.muted,   label: theme.primary };
}

export function Avatar({ thinking = false, speaking = false, size = 'md' }: AvatarProps) {
  const state  = thinking ? 'thinking' : speaking ? 'speaking' : 'idle';
  const frames = FRAMES[state];
  const colors = getColors(thinking, speaking);

  if (size === 'sm') {
    // Compact 3-line version for tight layouts
    const eye = thinking ? '◉' : '◈';
    const mouth = thinking ? '···' : speaking ? '~~~' : '───';
    return (
      <Box flexDirection="column" width={9}>
        <Text color={colors.border}>{'╔═════╗'}</Text>
        <Text color={colors.border}>{'║'}<Text color={colors.eyes}>{` ${eye} ${eye} `}</Text><Text color={colors.border}>{'║'}</Text></Text>
        <Text color={colors.border}>{'║'}<Text color={colors.accent}>{` ${mouth} `}</Text><Text color={colors.border}>{'║'}</Text></Text>
        <Text color={colors.border}>{'╚══╗╔══╝'}</Text>
        <Text color={colors.label} bold dimColor>{'  BS  '}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={15}>
      {frames.map((line, i) => {
        // Color different parts
        if (i === 0 || i === 4 || i === 5) {
          return <Text key={i} color={colors.border} bold>{line}</Text>;
        }
        if (i === 1) {
          // Eyes line
          return (
            <Text key={i} color={colors.border} bold>
              {'  ║ '}<Text color={colors.eyes} bold>{thinking ? '◉    ◉' : '◈    ◈'}</Text>{' ║  '}
            </Text>
          );
        }
        if (i === 2) {
          return (
            <Text key={i} color={colors.border} bold>
              {'  ║ '}<Text color={colors.accent}>{thinking ? '  ??  ' : speaking ? '  ▲▲  ' : '  ──  '}</Text>{' ║  '}
            </Text>
          );
        }
        if (i === 3) {
          return (
            <Text key={i} color={colors.border} bold>
              {'  ║ '}<Text color={thinking ? theme.warning : speaking ? theme.primary : theme.muted}>
                {thinking ? ' ···· ' : speaking ? ' ~~~~ ' : ' ████ '}
              </Text>{' ║  '}
            </Text>
          );
        }
        if (i === 6) {
          // Label
          return (
            <Text key={i} color={colors.label} bold>
              {line}
            </Text>
          );
        }
        return <Text key={i} color={colors.border} bold>{line}</Text>;
      })}
    </Box>
  );
}
