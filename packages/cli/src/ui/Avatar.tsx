import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.js';

export interface AvatarProps {
  thinking?: boolean;
  speaking?: boolean;
  error?: boolean;
  size?: 'sm' | 'md';
}

// ─── Shield mascot — clean rounded style ─────────────────────────────────────
//
//  IDLE          THINKING       SPEAKING       ERROR
//  ╭──────╮      ╭──────╮       ╭──────╮       ╭──────╮
//  │ ◈  ◈ │      │ ◉  ◉ │       │ ◈  ◈ │       │ ✕  ✕ │
//  │  ──  │      │  ??  │       │  ▲▲  │       │  !!  │
//  │▄████▄│      │ ···· │       │ ~~~~ │       │ ████ │
//  ╰──╥──╯       ╰──╥──╯        ╰──╥──╯        ╰──╥──╯
//     ╨              ╨              ╨              ╨
//    [BS]           [BS]           [BS]           [BS]

type State = 'idle' | 'thinking' | 'speaking' | 'error';

interface StateConfig {
  border:  string;
  eyes:    string;
  mouth:   string;
  body:    string;
  label:   string;
  eyeChar: string;
  mouthChar: string;
  bodyChar:  string;
}

function getState(thinking: boolean, speaking: boolean, error: boolean): State {
  if (error)    return 'error';
  if (thinking) return 'thinking';
  if (speaking) return 'speaking';
  return 'idle';
}

function getConfig(state: State): StateConfig {
  switch (state) {
    case 'thinking': return {
      border:    theme.warning,
      eyes:      theme.warning,
      mouth:     theme.muted,
      body:      theme.warning,
      label:     theme.warning,
      eyeChar:   '◉  ◉',
      mouthChar: ' ?? ',
      bodyChar:  '····',
    };
    case 'speaking': return {
      border:    theme.primary,
      eyes:      theme.success2,
      mouth:     theme.primary2,
      body:      theme.primary,
      label:     theme.success,
      eyeChar:   '◈  ◈',
      mouthChar: ' ▲▲ ',
      bodyChar:  '~~~~',
    };
    case 'error': return {
      border:    theme.danger,
      eyes:      theme.danger,
      mouth:     theme.danger,
      body:      theme.danger,
      label:     theme.danger,
      eyeChar:   '✕  ✕',
      mouthChar: ' !! ',
      bodyChar:  '████',
    };
    default: return {
      border:    theme.primary,
      eyes:      theme.primary2,
      mouth:     theme.muted,
      body:      theme.muted,
      label:     theme.primary,
      eyeChar:   '◈  ◈',
      mouthChar: ' ── ',
      bodyChar:  '████',
    };
  }
}

export function Avatar({ thinking = false, speaking = false, error = false, size = 'md' }: AvatarProps) {
  const state  = getState(thinking, speaking, error);
  const cfg    = getConfig(state);

  if (size === 'sm') {
    return (
      <Box flexDirection="column" width={10}>
        <Text color={cfg.border}>{'╭──────╮'}</Text>
        <Text color={cfg.border}>{'│'}<Text color={cfg.eyes}>{` ${cfg.eyeChar} `}</Text><Text color={cfg.border}>{'│'}</Text></Text>
        <Text color={cfg.border}>{'│'}<Text color={cfg.mouth}>{cfg.mouthChar}</Text><Text color={cfg.border}>{'│'}</Text></Text>
        <Text color={cfg.border}>{'╰──╥───╯'}</Text>
        <Text color={cfg.label} dimColor>{'   ╨   '}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={14}>
      {/* Top border */}
      <Text color={cfg.border} bold>{'  ╭────────╮'}</Text>

      {/* Eyes */}
      <Text color={cfg.border} bold>
        {'  │ '}<Text color={cfg.eyes} bold>{cfg.eyeChar}</Text>{' │'}
      </Text>

      {/* Mouth */}
      <Text color={cfg.border} bold>
        {'  │'}<Text color={cfg.mouth}>{` ${cfg.mouthChar} `}</Text>{'│'}
      </Text>

      {/* Body */}
      <Text color={cfg.border} bold>
        {'  │'}<Text color={cfg.body} bold>{` ${cfg.bodyChar} `}</Text>{'│'}
      </Text>

      {/* Bottom */}
      <Text color={cfg.border} bold>{'  ╰──╥───╯'}</Text>
      <Text color={cfg.border} dimColor>{'     ╨    '}</Text>

      {/* Label */}
      <Text color={cfg.label} bold dimColor>{'   ▄ BS ▄  '}</Text>
    </Box>
  );
}
