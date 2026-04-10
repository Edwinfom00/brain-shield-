import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.js';

interface AvatarProps {
  thinking?: boolean;
  speaking?: boolean;
}

const AVATAR_IDLE = [
  '  ╭───────╮  ',
  '  │ ◉   ◉ │  ',
  '  │   ▲   │  ',
  '  │  ───  │  ',
  '  ╰───────╯  ',
  '    🛡  BS   ',
];

const AVATAR_THINKING = [
  '  ╭───────╮  ',
  '  │ ◉   ◉ │  ',
  '  │   ?   │  ',
  '  │  ···  │  ',
  '  ╰───────╯  ',
  '    🛡  BS   ',
];

const AVATAR_SPEAKING = [
  '  ╭───────╮  ',
  '  │ ◈   ◈ │  ',
  '  │   ▲   │  ',
  '  │  ~~~  │  ',
  '  ╰───────╯  ',
  '    🛡  BS   ',
];

export function Avatar({ thinking = false, speaking = false }: AvatarProps) {
  const lines = thinking ? AVATAR_THINKING : speaking ? AVATAR_SPEAKING : AVATAR_IDLE;

  return (
    <Box flexDirection="column" alignItems="center">
      {lines.map((line, i) => (
        <Text key={i} color={theme.primary} bold={i === 5}>
          {line}
        </Text>
      ))}
    </Box>
  );
}
