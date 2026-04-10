import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { Avatar } from './Avatar.js';
import { theme } from './theme.js';
import { version } from '../version.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts?: number;
}

interface ChatUIProps {
  onMessage: (message: string) => Promise<string>;
  initialMessage?: string;
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const cols   = Math.min(process.stdout.columns ?? 80, 100);

  if (isUser) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box gap={1} alignItems="center">
          <Text color={theme.info} bold>{'›'}</Text>
          <Text color={theme.info} bold>You</Text>
          {msg.ts && (
            <Text color={theme.border} dimColor>
              {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </Box>
        <Box paddingLeft={3}>
          <Text color={theme.white} wrap="wrap">{msg.content}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1} alignItems="center">
        <Text color={theme.primary} bold>{'▐'}</Text>
        <Text color={theme.primary} bold>BrainShield</Text>
        {msg.ts && (
          <Text color={theme.border} dimColor>
            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </Box>
      <Box paddingLeft={3}>
        <Text color={theme.primary3} wrap="wrap">{msg.content}</Text>
      </Box>
    </Box>
  );
}

// ─── Thinking indicator ───────────────────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <Box gap={2} paddingLeft={3} marginBottom={1} alignItems="center">
      <Spinner type="dots" />
      <Text color={theme.warning} dimColor>Analyzing...</Text>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatUI({ onMessage, initialMessage }: ChatUIProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>(
    initialMessage
      ? [{ role: 'assistant', content: initialMessage, ts: Date.now() }]
      : []
  );
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);

  useInput((char, key) => {
    if (key.escape || (key.ctrl && char === 'c')) exit();
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim() || thinking) return;
    const msg = value.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg, ts: Date.now() }]);
    setThinking(true);
    try {
      const reply = await onMessage(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const cols    = Math.min(process.stdout.columns ?? 80, 120);
  const hr      = '─'.repeat(cols);
  const visible = messages.slice(-6);

  return (
    <Box flexDirection="column">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Text color={theme.border}>{hr}</Text>
      <Box flexDirection="row" justifyContent="space-between" paddingX={1}>
        <Box gap={1} alignItems="center">
          <Text color={theme.primary} bold>{'▐█▌'}</Text>
          <Text color={theme.white} bold>BrainShield</Text>
          <Text color={theme.border}>{'·'}</Text>
          <Text color={theme.muted}>Security Chat</Text>
        </Box>
        <Text color={theme.border} dimColor>{`v${version}  ·  ESC to exit`}</Text>
      </Box>
      <Text color={theme.border}>{hr}</Text>

      {/* ── Chat layout ────────────────────────────────────────────────── */}
      <Box flexDirection="row" gap={2} marginTop={1} paddingX={1}>

        {/* Avatar sidebar */}
        <Box flexDirection="column" alignItems="center" width={15} gap={1}>
          <Avatar thinking={thinking} speaking={!thinking && messages.length > 0} />
          <Box>
            {thinking
              ? <Text color={theme.warning} bold dimColor>{'● thinking'}</Text>
              : <Text color={theme.success} bold dimColor>{'● ready'}</Text>
            }
          </Box>
          <Box marginTop={1}>
            <Text color={theme.border} dimColor>{`${messages.length} msg${messages.length !== 1 ? 's' : ''}`}</Text>
          </Box>
        </Box>

        {/* Messages */}
        <Box flexDirection="column" flexGrow={1} gap={0}>
          {visible.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {thinking && <ThinkingIndicator />}
        </Box>
      </Box>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <Text color={theme.border}>{hr}</Text>
      <Box gap={2} paddingX={1} paddingY={0} alignItems="center">
        <Text color={theme.primary} bold>{'›'}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={
            thinking
              ? 'Waiting for response...'
              : 'Ask about security, paste code to review...'
          }
        />
      </Box>
      <Text color={theme.border}>{hr}</Text>

    </Box>
  );
}
