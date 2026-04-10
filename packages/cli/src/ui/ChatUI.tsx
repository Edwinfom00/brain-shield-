import { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Avatar } from './Avatar.js';
import { theme } from './theme.js';
import { version } from '../version.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatUIProps {
  onMessage: (message: string) => Promise<string>;
  initialMessage?: string;
}

export function ChatUI({ onMessage, initialMessage }: ChatUIProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ role: 'assistant', content: initialMessage }] : []
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
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setThinking(true);
    try {
      const reply = await onMessage(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const visible = messages.slice(-5);

  return (
    <Box flexDirection="column" paddingX={1}>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={1}>
          <Text color={theme.primary} bold>{'▐█▌'}</Text>
          <Text color={theme.white}  bold>BrainShield</Text>
          <Text color={theme.muted}>{'·'}</Text>
          <Text color={theme.muted} dimColor>Security Chat</Text>
        </Box>
        <Text color={theme.muted} dimColor>{`v${version}  ·  ESC to exit`}</Text>
      </Box>

      <Text color={theme.muted} dimColor>{'─'.repeat(Math.min(process.stdout.columns ?? 80, 80))}</Text>

      {/* ── Chat area ──────────────────────────────────────────── */}
      <Box flexDirection="row" gap={2} marginTop={1}>

        {/* Avatar column */}
        <Box flexDirection="column" alignItems="center" width={16}>
          <Avatar thinking={thinking} speaking={!thinking && messages.length > 0} />
          <Box marginTop={1}>
            <Text color={thinking ? theme.warning : theme.success} bold>
              {thinking ? '◉ thinking' : '◉ ready'}
            </Text>
          </Box>
        </Box>

        {/* Messages column */}
        <Box flexDirection="column" flexGrow={1} gap={1}>
          {visible.map((m, i) => (
            <Box key={i} flexDirection="column" gap={0}>
              <Box gap={1}>
                <Text color={m.role === 'user' ? theme.info : theme.primary} bold>
                  {m.role === 'user' ? '› You' : '▐ BrainShield'}
                </Text>
              </Box>
              <Box paddingLeft={2}>
                <Text color={m.role === 'user' ? theme.white : '#DDD6FE'} wrap="wrap">
                  {m.content}
                </Text>
              </Box>
            </Box>
          ))}

          {thinking && (
            <Box gap={1} paddingLeft={2}>
              <Text color={theme.warning} dimColor>{'·  ·  ·'}</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Input ─────────────────────────────────────────────── */}
      <Box marginTop={1}>
        <Text color={theme.muted} dimColor>{'─'.repeat(Math.min(process.stdout.columns ?? 80, 80))}</Text>
      </Box>
      <Box gap={1} paddingX={1} marginTop={0}>
        <Text color={theme.primary} bold>{'›'}</Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={thinking ? 'Thinking...' : 'Ask about security, paste code to review...'}
        />
      </Box>
    </Box>
  );
}
